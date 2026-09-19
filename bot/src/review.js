'use strict';
/*
 Finds every place an editor tagged a reviewer and nobody reviewed.

 Hemant's ask, 19 Sep 2026: "wherever our editor has tagged me (or Jenn) for a new concept, a
 video, a revision, and I haven't looked at it, DM me: tag me over there." Look back 30 days.
 Only DM Hemant, never anyone else. Each place is mentioned to him once.

 A tag counts as reviewed when Hemant or Jenn wrote anything in that thread after the tag, or
 reacted to the message that tagged them. Donnaa's own messages never count as a tag, and bots
 never count as reviewers.

 What was already sent is read back from the DM with Hemant, so a redeploy does not repeat it.
*/
const fs = require('fs');
const path = require('path');

const OWNER = 'U0963M61T8V';
const REVIEWERS = new Set([OWNER, 'U0960GV0ZDH' /* Jenn */]);
const LOOKBACK_DAYS = 30;
const MIN_AGE_H = 12;          /* give people half a day to look before it counts as missed */
const SKIP = new Set(['C0C0QN1G3PT' /* #donna, Donnaa talking to Hemant */]);
const ACTIVE_HOURS = [9, 22];  /* Bangkok, when a DM to Hemant is welcome */

const ROSTER = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'roster.json'), 'utf8'));
const byId = Object.fromEntries(ROSTER.map((p) => [p.id, p]));
const nameOf = (id) => (byId[id] && byId[id].name) || id;

const MENTION = /<@([A-Z0-9]+)(?:\|[^>]*)?>/g;
const mentions = (t) => [...(t || '').matchAll(MENTION)].map((m) => m[1]);
const sec = (ts) => Number(String(ts).split('.')[0]);
const hoursAgo = (ts) => (Date.now() / 1000 - sec(ts)) / 3600;
const ageStr = (ts) => { const h = hoursAgo(ts); return h < 24 ? Math.max(1, Math.round(h)) + 'h ago' : Math.round(h / 24) + ' days ago'; };
const link = (channel, ts) => `https://slack.com/archives/${channel}/p${String(ts).replace('.', '')}`;
const isHuman = (m) => !!m.user && !m.bot_id && m.subtype !== 'bot_message';

let selfId = null;
async function self(client) { if (!selfId) selfId = (await client.auth.test()).user_id; return selfId; }

async function myChannels(client) {
  const out = []; let cursor;
  do {
    const r = await client.users.conversations({ types: 'public_channel,private_channel', exclude_archived: true, limit: 200, cursor });
    out.push(...(r.channels || []));
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  return out.filter((c) => !SKIP.has(c.id));
}
async function history(client, channel, oldest) {
  const out = []; let cursor;
  do {
    const r = await client.conversations.history({ channel, oldest: String(oldest), limit: 200, cursor });
    out.push(...(r.messages || []));
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  return out;
}
const reactedBy = (m, who) => (m.reactions || []).some((r) => (r.users || []).some((u) => who.has(u)));
const snippet = (t) => (t || '').replace(/<@[A-Z0-9]+(?:\|[^>]*)?>/g, '').replace(/<(https?:[^|>]+)(?:\|[^>]*)?>/g, 'link').replace(/\s+/g, ' ').trim().slice(0, 70);

/* Every unanswered tag in the last `days` days. */
async function scan(client, days = LOOKBACK_DAYS) {
  const me = await self(client);
  const oldest = Math.floor(Date.now() / 1000) - days * 86400;
  const items = [];
  for (const ch of await myChannels(client)) {
    let msgs = [];
    try { msgs = await history(client, ch.id, oldest); } catch (e) { console.error('[review] cannot read', ch.name, e.data && e.data.error || e.message); continue; }
    for (const root of msgs) {
      let th = [root];
      if (root.reply_count) { try { th = (await client.conversations.replies({ channel: ch.id, ts: root.ts, limit: 200 })).messages || [root]; } catch { th = [root]; } }
      for (const m of th) {
        if (!isHuman(m) || REVIEWERS.has(m.user) || m.user === me) continue;
        const asked = [...new Set(mentions(m.text))].filter((u) => REVIEWERS.has(u));
        if (!asked.length || sec(m.ts) < oldest) continue;
        const reviewed = reactedBy(m, REVIEWERS) || th.some((x) => REVIEWERS.has(x.user) && sec(x.ts) > sec(m.ts));
        if (reviewed) continue;
        items.push({ channel: ch.id, channelName: ch.name, ts: m.ts, root: root.ts, by: m.user, asked, text: snippet(m.text), link: link(ch.id, m.ts) });
      }
    }
  }
  return items.sort((a, b) => sec(a.ts) - sec(b.ts));
}

function renderList(items, days = LOOKBACK_DAYS) {
  if (!items.length) return `Nothing waiting on you. Every tag in the last ${days} days got an answer.`;
  const lines = [`*Tagged and not answered yet, last ${days} days — ${items.length}*`];
  for (const it of items) lines.push(`• ${nameOf(it.by)} · ${ageStr(it.ts)} · <#${it.channel}> · ${it.text || 'a file'} <${it.link}|↗>`);
  return lines.join('\n');
}

/* ---------- the quiet daily nudge ---------- */
let dmId = null;
async function dm(client) { if (!dmId) dmId = (await client.conversations.open({ users: OWNER })).channel.id; return dmId; }
async function alreadySent(client) {
  const me = await self(client);
  const oldest = Math.floor(Date.now() / 1000) - (LOOKBACK_DAYS + 7) * 86400;
  const seen = new Set();
  for (const m of await history(client, await dm(client), oldest)) {
    if (m.user !== me && !m.bot_id) continue;
    for (const l of (m.text || '').matchAll(/https:\/\/slack\.com\/archives\/[A-Z0-9]+\/p\d+/g)) seen.add(l[0]);
  }
  return seen;
}
function bangkokHour() { return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', hour: 'numeric', hour12: false }).format(new Date())); }

/* One pass: DM Hemant the tags he has not been told about yet. Returns how many. */
async function tick(client) {
  const h = bangkokHour();
  if (h < ACTIVE_HOURS[0] || h >= ACTIVE_HOURS[1]) return { skipped: 'night', sent: 0 };
  const items = (await scan(client)).filter((it) => hoursAgo(it.ts) >= MIN_AGE_H);
  const seen = await alreadySent(client);
  const fresh = items.filter((it) => !seen.has(it.link));
  if (!fresh.length) return { open: items.length, sent: 0 };
  const lines = [fresh.length === 1 ? 'You were tagged here and have not answered yet:' : `You were tagged in these and have not answered yet (${fresh.length}):`];
  for (const it of fresh.slice(0, 15)) lines.push(`• ${nameOf(it.by)} · ${ageStr(it.ts)} · <#${it.channel}> · ${it.text || 'a file'} <${it.link}|↗>`);
  if (fresh.length > 15) lines.push(`and ${fresh.length - 15} more. Say *reviews* for the full list.`);
  await client.chat.postMessage({ channel: await dm(client), text: lines.join('\n') });
  return { open: items.length, sent: fresh.length };
}

module.exports = { scan, renderList, tick, LOOKBACK_DAYS };
