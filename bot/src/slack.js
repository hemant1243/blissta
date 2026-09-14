'use strict';
require('dotenv').config();
const { App } = require('@slack/bolt');
const { answer, reload } = require('./answer');
const { BOT, setMemory } = require('./brain');
const launch = require('./launch');
const chase = require('./chase');
const shopify = require('./shopify');
const learn = require('./learn');

const NUMBERS_PEOPLE = new Set((process.env.NUMBERS_SLACK_IDS || '').split(',').map((s) => s.trim()).filter(Boolean));
const OWNERS = new Set((process.env.OWNER_SLACK_IDS || '').split(',').map((s) => s.trim()).filter(Boolean));
/* Channels where Donnaa answers every message, no tag needed. Default: #donna. */
const LISTEN = new Set((process.env.DONNAA_CHANNELS || 'C0C0QN1G3PT').split(',').map((s) => s.trim()).filter(Boolean));
const { LogLevel } = require('@slack/bolt');
const app = new App({ token: process.env.SLACK_BOT_TOKEN, signingSecret: process.env.SLACK_SIGNING_SECRET, appToken: process.env.SLACK_APP_TOKEN, socketMode: true, logLevel: LogLevel.INFO });
app.use(async ({ body, next }) => { const t = body && (body.event ? body.event.type + (body.event.channel_type ? ':' + body.event.channel_type : '') : body.type); console.log('[event]', t, 'from', body && body.event && body.event.user); await next(); });
let botUserId = null;

/* Drop tags and the "*Sent using* Claude" footer the connector appends. */
const strip = (t) => (t || '').replace(/\s*\*Sent using\*[\s\S]*$/i, '').replace(/<@[A-Z0-9]+>/g, '').trim();

function toTurns(msgs) {
  msgs = msgs.filter((m) => m.text && !m.subtype);
  const hist = [];
  for (const m of msgs) {
    const role = m.user === botUserId || m.bot_id ? 'assistant' : 'user';
    const text = strip(m.text);
    if (!text) continue;
    if (hist.length && hist[hist.length - 1].role === role) hist[hist.length - 1].content += '\n' + text;
    else hist.push({ role, content: text });
  }
  if (hist.length && hist[0].role === 'assistant') hist.shift();
  return hist.slice(-20);
}

async function threadHistory(client, channel, ts) {
  const res = await client.conversations.replies({ channel, ts, limit: 40 });
  return toTurns(res.messages || []);
}

/* Last 20 top-level DM messages, oldest first, as alternating turns. */
async function dmHistory(client, channel) {
  const r = await client.conversations.history({ channel, limit: 20 });
  return toTurns((r.messages || []).slice().reverse());
}

const botThreads = new Set();

/* ---------- memory channel ---------- */
const MEMORY_NAME = process.env.MEMORY_CHANNEL || 'donnaa-memory';
let memoryChannel = null;

async function findOrCreateMemoryChannel(client) {
  let cursor;
  do {
    const r = await client.conversations.list({ types: 'public_channel,private_channel', exclude_archived: true, limit: 200, cursor });
    const hit = (r.channels || []).find((c) => c.name === MEMORY_NAME);
    if (hit) return hit.id;
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  const made = await client.conversations.create({ name: MEMORY_NAME, is_private: true });
  const owners = [...OWNERS].filter((u) => u !== botUserId);
  if (owners.length) { try { await client.conversations.invite({ channel: made.channel.id, users: owners.join(',') }); } catch (e) { console.error('[memory] could not invite owners:', e.data && e.data.error || e.message); } }
  console.log('[memory] created #' + MEMORY_NAME, made.channel.id);
  return made.channel.id;
}

/*
 Every plain message in the memory channel is one fact, oldest first.
 A message starting with "proposed:" (from the nightly learning pass) only counts once an owner
 has reacted with a thumbs up or a check mark. Until then it sits in `pending`.
*/
const pending = new Set();
const approved = (m) => (m.reactions || []).some((r) => /^(\+1|thumbsup|white_check_mark|heavy_check_mark)$/.test(r.name) && (r.users || []).some((u) => OWNERS.has(u)));
async function refreshMemory(client) {
  if (!memoryChannel) return 0;
  const lines = [];
  pending.clear();
  let cursor;
  do {
    const r = await client.conversations.history({ channel: memoryChannel, limit: 200, cursor });
    for (const m of r.messages || []) {
      if (m.subtype || !m.text) continue;
      const prop = m.text.match(/^\s*proposed\s*:\s*([^\n]+)/i);
      if (prop) {
        const fact = strip(prop[1]);
        if (approved(m)) lines.push(fact); else pending.add(fact.toLowerCase());
        continue;
      }
      const t = strip(m.text).replace(/^remember\s*:\s*/i, '').trim();
      if (t) lines.push(t);
    }
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  lines.reverse();
  setMemory(lines);
  console.log('[memory]', lines.length, 'facts loaded,', pending.size, 'proposals waiting');
  return lines.length;
}

/* Owner answers that carry MEMORY: lines are saved for good. Returns the reply without those lines. */
async function saveMemoryLines(client, out) {
  const facts = [];
  const text = out.replace(/^\s*MEMORY:\s*(.+)$/gim, (_, f) => { facts.push(f.trim()); return ''; }).replace(/\n{3,}/g, '\n\n').trim();
  if (!facts.length || !memoryChannel) return text;
  for (const f of facts) { try { await client.chat.postMessage({ channel: memoryChannel, text: f }); } catch (e) { console.error('[memory] could not save:', e.message); } }
  await refreshMemory(client).catch(() => {});
  return text + '\n\n_Saved to memory: ' + facts.join(' | ') + '_';
}

let lastLearnDay = null;
async function learnTick(client) {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  if (now.getUTCHours() !== Number(process.env.LEARN_HOUR_UTC || 2) || lastLearnDay === day) return;
  lastLearnDay = day;
  try {
    const known = new Set([...pending]);
    const r = await learn.run(client, botUserId, memoryChannel, known);
    console.log('[learn]', r.threads, 'threads read,', r.proposed, 'facts proposed');
  } catch (e) { console.error('[learn] failed:', e.message); }
}

async function bootMemory(client) {
  try { memoryChannel = await findOrCreateMemoryChannel(client); await refreshMemory(client); }
  catch (e) { console.error('[memory] disabled:', e.data && e.data.error || e.message); }
}


async function probeModel() {
  const t0 = Date.now();
  try {
    const r = await answer({ history: [{ role: 'user', content: 'Reply with the single word: ready' }], tier: 'team' });
    console.log('[probe] model reachable in', (Date.now() - t0) + 'ms:', JSON.stringify(r.text.slice(0, 40)));
  } catch (e) { console.error('[probe] model call failed after', (Date.now() - t0) + 'ms:', e.status || '', e.message); }
}

/* The last human message in a channel before a given ts. Used when someone posts a bare "@Donnaa". */
async function previousHuman(client, channel, ts) {
  try {
    const r = await client.conversations.history({ channel, latest: ts, inclusive: false, limit: 8 });
    const m = (r.messages || []).find((x) => x.text && !x.subtype && !x.bot_id && x.user !== botUserId && strip(x.text));
    return m || null;
  } catch { return null; }
}

async function handle({ event, client, say }) {
  let text = strip(event.text);
  let asked = null;
  if (!text && !event.thread_ts) {
    /* A bare tag with nothing else: answer the message just above it. */
    asked = await previousHuman(client, event.channel, event.ts);
    if (!asked) return;
    text = strip(asked.text);
  }
  const tier = OWNERS.has(event.user) ? 'owner' : 'team';
  const isDM = event.channel_type === 'im';
  /* Show we are on it while the model thinks. */
  client.reactions.add({ channel: event.channel, timestamp: event.ts, name: 'eyes' }).catch(() => {});
  /* In a DM, answer in the main conversation. Thread replies are hidden in DMs. */
  const thread_ts = event.thread_ts || (isDM ? undefined : event.ts);
  if (/^reload knowledge$/i.test(text) && tier === 'owner') { const f = reload(); const n = await refreshMemory(client); await say({ text: 'Reloaded: ' + f.join(', ') + ' plus ' + n + ' memory facts.', thread_ts }); return; }
  /* remember: fact      owner only. Stored in the memory channel, so it survives every deploy. */
  const remM = text.replace(/\s*\*Sent using\*[\s\S]*$/i, '').match(/^\s*remember\s*[:\-]\s*([\s\S]+)$/i);
  if (remM) {
    if (tier !== 'owner') { await say({ text: 'Only Hemant can teach me facts. Tell him and he will.', thread_ts }); return; }
    if (!memoryChannel) { await say({ text: 'My memory channel is not set up, so I cannot keep that. Check the logs.', thread_ts }); return; }
    const fact = remM[1].trim();
    await client.chat.postMessage({ channel: memoryChannel, text: fact });
    const n = await refreshMemory(client);
    await say({ text: 'Remembered. I now hold ' + n + ' facts from you. They override the documents.', thread_ts });
    return;
  }
  /* The Claude connector appends "*Sent using* Claude" to every message, sometimes on the same line. Drop it before matching commands. */
  const cmdText = text.replace(/\s*\*Sent using\*[\s\S]*$/i, '').trim();
  const firstLine = cmdText.split('\n')[0].trim();
  /*
   numbers               today, yesterday, last 7 days, month to date from Shopify
   numbers 2026-09-10    one day
   Owners plus anyone in NUMBERS_SLACK_IDS. Everyone else is told it is owner only.
  */
  const numM = firstLine.match(/^(?:numbers|sales|revenue)(?:\s+(\d{4}-\d{2}-\d{2}))?$/i);
  if (numM) {
    if (tier !== 'owner' && !NUMBERS_PEOPLE.has(event.user)) { await say({ text: 'Store numbers are owner only. Ask Hemant.', thread_ts }); return; }
    try { await say({ text: numM[1] ? await shopify.day(numM[1]) : await shopify.summary(), thread_ts }); }
    catch (e) { console.error('[numbers] failed:', e.message); await say({ text: 'Could not read Shopify: ' + e.message, thread_ts }); }
    return;
  }
  if (/^(open|what'?s open|open list|status)$/i.test(firstLine)) {
    const p = chase.person(event.user);
    if (tier !== 'owner' && !/Strategist|Approver/.test(p.role)) { await say({ text: 'The open list is for owners, strategists and Jenn.', thread_ts }); return; }
    try { const r = await chase.collect(client); await say({ text: chase.renderOpenList(r), thread_ts }); }
    catch (e) { console.error('[chase] open list failed:', e.message); await say({ text: 'Could not build the open list: ' + e.message, thread_ts }); }
    return;
  }
  /*
   send #channel: text      posts text into that channel as Donnaa
   send @person: text       DMs that person as Donnaa
   Owners only. Slack hands us <#C123|name> and <@U123> in the raw text, so parse the raw event.
  */
  const sendM = (event.text || '').match(/^\s*(?:<@[A-Z0-9]+>\s*)?(?:send|post|tell|message|dm)\s+<([#@])([A-Z0-9]+)(?:\|[^>]*)?>\s*[:,\-]?\s*([\s\S]+)$/i);
  if (sendM) {
    if (tier !== 'owner') { await say({ text: 'Only Hemant can make me send messages.', thread_ts }); return; }
    const target = sendM[2];
    const body = sendM[3].replace(/\s*\*Sent using\*[\s\S]*$/i, '').trim();
    if (!body) { await say({ text: 'Nothing to send. Put the message after the colon.', thread_ts }); return; }
    try {
      const res = await client.chat.postMessage({ channel: target, text: body });
      const where = sendM[1] === '#' ? '<#' + target + '>' : '<@' + target + '>';
      await say({ text: 'Sent to ' + where + '.' + (res && res.ts ? '' : ' (no ts came back)'), thread_ts });
      console.log('[send]', event.user, '->', target, body.length, 'chars');
    } catch (e) {
      console.error('[send] failed', e.data && e.data.error || e.message);
      const why = e.data && e.data.error === 'not_in_channel' ? 'I am not in that channel. Invite me there first, then say it again.'
        : e.data && e.data.error === 'channel_not_found' ? 'I cannot see that channel. Is it private? Invite me there first.'
        : (e.data && e.data.error) || e.message;
      await say({ text: 'Could not send: ' + why, thread_ts });
    }
    return;
  }
  /*
   invite @a @b to #channel     adds those people to the channel. Owners only.
   Needs the channels:manage / groups:write scopes and Donnaa must already be in the channel.
  */
  const invM = (event.text || '').match(/^\s*(?:<@[A-Z0-9]+>\s*)?(?:invite|add)\s+((?:<@[A-Z0-9]+(?:\|[^>]*)?>\s*)+)(?:to|into)\s+<#([A-Z0-9]+)(?:\|[^>]*)?>/i);
  if (invM) {
    if (tier !== 'owner') { await say({ text: 'Only Hemant can make me invite people.', thread_ts }); return; }
    const users = [...invM[1].matchAll(/<@([A-Z0-9]+)/g)].map((m) => m[1]).filter((u) => u !== botUserId);
    const channel = invM[2];
    if (!users.length) { await say({ text: 'Tag at least one person to invite.', thread_ts }); return; }
    try {
      await client.conversations.invite({ channel, users: users.join(',') });
      await say({ text: 'Added ' + users.map((u) => '<@' + u + '>').join(', ') + ' to <#' + channel + '>.', thread_ts });
      console.log('[invite]', event.user, users.join(','), '->', channel);
    } catch (e) {
      const code = e.data && e.data.error;
      const why = code === 'already_in_channel' ? 'They are already in that channel.'
        : code === 'not_in_channel' ? 'I am not in that channel myself. Add me there first, then say it again.'
        : code === 'missing_scope' ? 'The Slack app is missing the channels:manage or groups:write scope. Reinstall it with those.'
        : code === 'cant_invite_self' ? 'I cannot invite myself.'
        : code === 'user_is_restricted' || code === 'user_is_ultra_restricted' ? 'That person is a guest account. Slack does not let bots add guests to channels, only an admin can, from the channel\'s Add people button. Make them a full member and I can do it next time.'
        : code === 'ura_max_channels' ? 'That guest is already in the maximum number of channels Slack allows.'
        : code === 'cant_invite' ? 'Slack refused. That usually means the account is deactivated, a guest, or the channel is one I cannot add people to.'
        : code || e.message;
      console.error('[invite] failed', code || e.message);
      await say({ text: 'Could not invite: ' + why, thread_ts });
    }
    return;
  }
  if (launch.isLaunch(firstLine)) {
    if (tier !== 'owner') { await say({ text: 'Only an owner can launch ads. Ask Hemant.', thread_ts }); return; }
    const t0 = Date.now();
    console.log('[launch] start', event.user, 'files', (event.files || []).length);
    try {
      const r = await launch.run({ text, files: event.files, botToken: process.env.SLACK_BOT_TOKEN, say, thread_ts });
      console.log('[launch] done', (Date.now() - t0) + 'ms', r ? r.filter((x) => x.ok).length + '/' + r.length + ' created' : 'rejected');
    } catch (e) {
      console.error('[launch] failed', (Date.now() - t0) + 'ms', e.message);
      try { await say({ text: 'The launch broke partway: ' + e.message + '\nCheck Ads Manager before retrying, some ads may already exist.', thread_ts }); } catch { /* nothing else to do */ }
    }
    return;
  }
  let history;
  try {
    if (event.thread_ts) history = await threadHistory(client, event.channel, event.thread_ts);
    else if (isDM) history = await dmHistory(client, event.channel);
    else if (asked) history = [{ role: 'user', content: '<@' + asked.user + '> asked: ' + text }];
    else history = [{ role: 'user', content: text }];
  }
  catch { history = [{ role: 'user', content: text }]; }
  if (!history.length || history[history.length - 1].role !== 'user') history.push({ role: 'user', content: text || '(continue)' });
  const where = event.channel_type === 'im' ? 'a direct message' : 'the Slack channel <#' + event.channel + '>' + (event.thread_ts ? ', inside a thread' : '');
  history[history.length - 1].content = '[Context: this message was sent in ' + where + '. "This channel" means that Slack channel.]\n' + history[history.length - 1].content;
  const t0 = Date.now();
  console.log('[ask]', tier, event.channel, 'turns', history.length, JSON.stringify((text || '(continue)').slice(0, 80)));
  try {
    const r = await answer({ history, tier });
    if (thread_ts) botThreads.add(thread_ts);
    let out = tier === 'owner' ? await saveMemoryLines(client, r.text) : r.text.replace(/^\s*MEMORY:.*$/gim, '').trim();
    if (r.flags.length && tier === 'owner' && isDM) out += `\n\n_(guard flagged: ${r.flags.join(', ')})_`;
    const res = await say({ text: out, thread_ts });
    console.log('[reply]', (Date.now() - t0) + 'ms', 'chars', out.length, 'posted', !!(res && res.ok));
  } catch (e) {
    console.error('[error]', (Date.now() - t0) + 'ms', e.status || '', e.message || e);
    try { await say({ text: `${BOT} hit an error. ${e.status || ''} ${e.message || ''}`.trim(), thread_ts }); } catch (e2) { console.error('[error] could not post error:', e2.message); }
  }
}

app.event('app_mention', handle);
app.message(async (args) => {
  const e = args.event;
  if (memoryChannel && e.channel === memoryChannel && !e.subtype) { refreshMemory(args.client).catch((err) => console.error('[memory] refresh failed:', err.message)); return; }
  if (e.bot_id || e.subtype) return;
  if (e.channel_type === 'im') return handle(args);
  const tagged = (e.text || '').indexOf('<@' + botUserId + '>') >= 0;
  if (tagged) return; /* app_mention handles it */
  /* In her own channels she answers everything, top level and threads, no tag needed. */
  if (LISTEN.has(e.channel)) return handle(args);
  if (e.thread_ts) {
    if (!botThreads.has(e.thread_ts)) {
      try { const r = await args.client.conversations.replies({ channel: e.channel, ts: e.thread_ts, limit: 50 }); if ((r.messages || []).some((m) => m.user === botUserId)) botThreads.add(e.thread_ts); } catch { /* no history scope */ }
    }
    if (botThreads.has(e.thread_ts)) return handle(args);
  }
});

(async () => {
  await app.start();
  const auth = await app.client.auth.test();
  botUserId = auth.user_id;
  console.log(`${BOT} is up as ${auth.user} (${botUserId}). Owners: ${[...OWNERS].join(', ') || 'none'}`);
  probeModel();
  bootMemory(app.client);
  /* Approvals are reactions, and there is no reaction event, so re-read memory every 10 minutes. */
  setInterval(() => refreshMemory(app.client).catch((e) => console.error('[memory] refresh failed:', e.message)), 10 * 60000);
  setInterval(() => learnTick(app.client), 5 * 60000);
  if (process.env.CHASE_ENABLED === '1') {
    const every = Number(process.env.CHASE_EVERY_MIN || 60) * 60000;
    const run = async () => { try { const r = await chase.tick(app.client); if (r.did.length) console.log('[chase]', JSON.stringify(r.did)); else console.log('[chase] tick, nothing due,', r.report.open.length, 'open'); } catch (e) { console.error('[chase] tick failed:', e.message); } };
    setTimeout(run, 30000); setInterval(run, every);
    console.log('[chase] enabled, every', every / 60000, 'min');
  } else console.log('[chase] disabled (CHASE_ENABLED != 1)');
})();
