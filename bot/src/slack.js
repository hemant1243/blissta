'use strict';
require('dotenv').config();
const { App } = require('@slack/bolt');
const { answer, reload } = require('./answer');
const { BOT } = require('./brain');
const launch = require('./launch');

const OWNERS = new Set((process.env.OWNER_SLACK_IDS || '').split(',').map((s) => s.trim()).filter(Boolean));
const { LogLevel } = require('@slack/bolt');
const app = new App({ token: process.env.SLACK_BOT_TOKEN, signingSecret: process.env.SLACK_SIGNING_SECRET, appToken: process.env.SLACK_APP_TOKEN, socketMode: true, logLevel: LogLevel.INFO });
app.use(async ({ body, next }) => { const t = body && (body.event ? body.event.type + (body.event.channel_type ? ':' + body.event.channel_type : '') : body.type); console.log('[event]', t, 'from', body && body.event && body.event.user); await next(); });
let botUserId = null;

const strip = (t) => (t || '').replace(/<@[A-Z0-9]+>/g, '').trim();

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

async function probeModel() {
  const t0 = Date.now();
  try {
    const r = await answer({ history: [{ role: 'user', content: 'Reply with the single word: ready' }], tier: 'team' });
    console.log('[probe] model reachable in', (Date.now() - t0) + 'ms:', JSON.stringify(r.text.slice(0, 40)));
  } catch (e) { console.error('[probe] model call failed after', (Date.now() - t0) + 'ms:', e.status || '', e.message); }
}

async function handle({ event, client, say }) {
  const text = strip(event.text);
  if (!text && !event.thread_ts) return;
  const tier = OWNERS.has(event.user) ? 'owner' : 'team';
  const isDM = event.channel_type === 'im';
  /* In a DM, answer in the main conversation. Thread replies are hidden in DMs. */
  const thread_ts = event.thread_ts || (isDM ? undefined : event.ts);
  if (/^reload knowledge$/i.test(text) && tier === 'owner') { const f = reload(); await say({ text: 'Reloaded: ' + f.join(', '), thread_ts }); return; }
  if (launch.isLaunch(text)) {
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
    let out = r.text;
    if (r.flags.length && tier === 'owner') out += `\n\n_(guard flagged: ${r.flags.join(', ')})_`;
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
  if (e.bot_id || e.subtype) return;
  if (e.channel_type === 'im') return handle(args);
  if (e.thread_ts && (e.text || '').indexOf('<@' + botUserId + '>') < 0) {
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
})();
