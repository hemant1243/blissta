'use strict';
require('dotenv').config();
const { App } = require('@slack/bolt');
const { answer, reload } = require('./answer');
const { BOT } = require('./brain');

const OWNERS = new Set((process.env.OWNER_SLACK_IDS || '').split(',').map((s) => s.trim()).filter(Boolean));
const { LogLevel } = require('@slack/bolt');
const app = new App({ token: process.env.SLACK_BOT_TOKEN, signingSecret: process.env.SLACK_SIGNING_SECRET, appToken: process.env.SLACK_APP_TOKEN, socketMode: true, logLevel: LogLevel.INFO });
app.use(async ({ body, next }) => { const t = body && (body.event ? body.event.type + (body.event.channel_type ? ':' + body.event.channel_type : '') : body.type); console.log('[event]', t, 'from', body && body.event && body.event.user); await next(); });
let botUserId = null;

const strip = (t) => (t || '').replace(/<@[A-Z0-9]+>/g, '').trim();

async function threadHistory(client, channel, ts) {
  const res = await client.conversations.replies({ channel, ts, limit: 40 });
  const msgs = (res.messages || []).filter((m) => m.text && !m.subtype);
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

async function handle({ event, client, say }) {
  const text = strip(event.text);
  if (!text) return;
  const tier = OWNERS.has(event.user) ? 'owner' : 'team';
  const thread_ts = event.thread_ts || event.ts;
  if (/^reload knowledge$/i.test(text) && tier === 'owner') { const f = reload(); await say({ text: 'Reloaded: ' + f.join(', '), thread_ts }); return; }
  let history;
  try { history = event.thread_ts ? await threadHistory(client, event.channel, event.thread_ts) : [{ role: 'user', content: text }]; }
  catch { history = [{ role: 'user', content: text }]; }
  if (!history.length || history[history.length - 1].role !== 'user') history.push({ role: 'user', content: text });
  try {
    const r = await answer({ history, tier });
    let out = r.text;
    if (r.flags.length && tier === 'owner') out += `\n\n_(guard flagged: ${r.flags.join(', ')})_`;
    await say({ text: out, thread_ts });
  } catch (e) {
    console.error(e);
    await say({ text: `${BOT} hit an error. ${e.status || ''} ${e.message || ''}`.trim(), thread_ts });
  }
}

app.event('app_mention', handle);
app.message(async (args) => { if (args.event.channel_type === 'im' && !args.event.bot_id) await handle(args); });

(async () => {
  await app.start();
  const auth = await app.client.auth.test();
  botUserId = auth.user_id;
  console.log(`${BOT} is up as ${auth.user} (${botUserId}). Owners: ${[...OWNERS].join(', ') || 'none'}`);
  try { const c = await app.client.apps.connections.open({ token: process.env.SLACK_APP_TOKEN }); console.log('[socket] app token ok, url issued:', !!c.url); } catch (e) { console.error('[socket] app token check failed:', e.data ? e.data.error : e.message); }
})();
