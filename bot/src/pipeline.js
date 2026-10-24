'use strict';
/*
 Brief → video pipeline, run by Donnaa from Slack. Hemant's ask, 18 Oct 2026:
 nobody assigns, chases or updates a tracker by hand. People only write, edit, review and approve.

 Lives in the brief channel. A brief is a top-level post with a brief file or a Google Doc link.
   1. Logged. The editor is whoever the strategist tags (in the post or later in the thread).
   2. Approval: Hemant or Bruce replies "ok". A brief they post themselves is approved at once.
      Any other "change/revise/fix/no" reply from them sends it back to the strategist.
   3. The editor posts a video link (or uploads the file) in the thread → the strategist reviews.
   4. The strategist replies "approved" → Jenn is tagged in the approved channel with the link.
      Anything else the strategist writes is revision notes → back to the editor.
   5. Nothing moved for 24h → one nudge to whoever owns the next move (Manila daytime only).
      One summary DM to Hemant every morning.

 Donnaa only gets live events for DMs and mentions, so this reads the channel every few minutes.
 All state lives in the thread: every Donnaa message ends with a ref line
   `ref BRF-20261018-7K2Q · awaiting_review · ed U0ABC123 · r1`
 so a redeploy forgets nothing. Off with PIPELINE_ENABLED=0, or "pipeline off" from an owner.
*/
const crypto = require('crypto');

const CHANNEL = process.env.PIPELINE_CHANNEL || 'C0B1LJ0342H';      /* #blissta-ad-working-briefs-2-0 */
const APPROVED = process.env.PIPELINE_APPROVED_CHANNEL || 'C0B1Q0Q53RQ'; /* #blissta-ad-approved-2-0, the only place Jenn looks */
const HEMANT = 'U0963M61T8V';
const JENN = process.env.PIPELINE_JENN || 'U0960GV0ZDH';
const APPROVERS = new Set((process.env.PIPELINE_APPROVERS || 'U0963M61T8V,U0C1G0L4F1T').split(',').map((s) => s.trim()).filter(Boolean));
/* Briefs posted before launch are left to the old process. */
const SINCE = Date.parse(process.env.PIPELINE_SINCE || '2026-10-18T06:30:00Z') / 1000;
const LOOKBACK_DAYS = 21;
const NUDGE_AFTER_H = 24;
const NUDGE_START_UTC = 0, NUDGE_END_UTC = 12; /* 8am–8pm Manila */
const SUMMARY_UTC_HOUR = 4;                    /* 9am Pakistan */

let enabled = process.env.PIPELINE_ENABLED !== '0';
let botUser = null;
let lastSummaryDay = '';

const REF = /`ref (BRF-\d{8}-[A-Z0-9]{4}) · (\w+) · ed (\w*) · r(\d+)( · nudge)?`/;
const STEP = {
  needs_editor: 'needs an editor',
  awaiting_approval: 'waiting for approval',
  brief_changes: 'brief being changed',
  ready_for_editing: 'editing',
  awaiting_review: 'waiting for review',
  for_revision: 'revising',
  approved: 'approved',
};

/* ---------- reading Slack text ---------- */
const links = (t) => [...String(t || '').matchAll(/<(https?:\/\/[^>|]+)(?:\|[^>]*)?>/g)].map((m) => m[1]);
const mentions = (t) => [...String(t || '').matchAll(/<@([A-Z0-9]+)(?:\|[^>]*)?>/g)].map((m) => m[1]);
const plain = (t) => String(t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const isDoc = (u) => /docs\.google\.com\/(document|presentation)\//.test(u);
const isVideoLink = (u) => /drive\.google\.com|frame\.io|dropbox\.com|vimeo\.com|youtu\.?be|loom\.com|wetransfer\.com|f\.io/.test(u) && !isDoc(u);
const videoFile = (m) => (m.files || []).find((f) => /^video\//.test(f.mimetype || '') || /\.(mp4|mov|m4v)$/i.test(f.name || ''));
/* A cut is a video link or an uploaded video file. */
const cutOf = (m) => { const f = videoFile(m); if (f) return f.permalink || f.url_private || f.name; return links(m.text).find(isVideoLink) || null; };
const briefOf = (m) => {
  const f = (m.files || []).find((x) => x.name && !videoFile({ files: [x] }));
  const doc = links(m.text).find(isDoc);
  if (!f && !doc) return null;
  const name = (f && f.name.replace(/\.[^.]+$/, '')) || plain(String(m.text || '').split('\n')[0]).replace(/[\s:\-–—]*(\b(for|here|at|in|on|is|link)\b[\s:\-–—]*)*$/i, '').slice(0, 80) || 'Brief';
  return { name, link: doc || (f && (f.permalink || f.url_private)) || '' };
};
/* "no changes" / "no notes" are praise, not change requests. */
const asksChanges = (t) => /\b(change|changes|revise|revision|fix|redo|rewrite|update|not approved|wrong|instead)\b|^\s*no\b/i.test(plain(t).replace(/\bno (changes|notes|edits|issues)( needed)?\b/gi, ''));
/* Approval = starts with an approval word, is short, and asks for nothing. "ok but change the hook" is not approval. */
const approves = (t) => { const x = plain(t) || String(t || '').trim(); return /^\s*(ok(ay)?|approved?|go( ahead)?|yes|good to go|lgtm|looks good|perfect|great|:white_check_mark:|:heavy_check_mark:|✅|👍)/i.test(x) && x.length <= 60 && !asksChanges(x); };

function newId(ts) {
  const d = new Date(Number(ts) * 1000).toISOString().slice(0, 10).replace(/-/g, '');
  return 'BRF-' + d + '-' + crypto.createHash('sha1').update(String(ts)).digest('hex').slice(0, 4).toUpperCase();
}
const ref = (s, nudge) => '`ref ' + s.id + ' · ' + s.status + ' · ed ' + (s.editor || '') + ' · r' + (s.rev || 0) + (nudge ? ' · nudge' : '') + '`';

/* ---------- Slack calls ---------- */
async function history(client) {
  const out = []; let cursor;
  const oldest = String(Math.max(SINCE, Date.now() / 1000 - LOOKBACK_DAYS * 86400));
  do {
    const r = await client.conversations.history({ channel: CHANNEL, oldest, limit: 200, cursor });
    out.push(...(r.messages || []));
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor && out.length < 600);
  return out;
}
async function thread(client, ts) {
  const out = []; let cursor;
  do {
    const r = await client.conversations.replies({ channel: CHANNEL, ts, limit: 200, cursor });
    out.push(...(r.messages || []));
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  return out;
}
async function post(client, ts, text, s, nudge) {
  await client.chat.postMessage({ channel: CHANNEL, thread_ts: ts, text: text + '\n' + ref(s, nudge), unfurl_links: false, unfurl_media: false });
}

/* The current state is the ref line of Donnaa's latest message in the thread. */
function stateOf(msgs) {
  let s = null, changedAt = null, nudgedAt = null, lastMine = null;
  for (const m of msgs) {
    const r = m.user === botUser || m.bot_id ? REF.exec(m.text || '') : null;
    if (!r) continue;
    lastMine = m.ts;
    s = { id: r[1], status: r[2], editor: r[3] || null, rev: Number(r[4]) };
    if (r[5]) nudgedAt = m.ts; else { changedAt = m.ts; nudgedAt = null; }
  }
  return s && Object.assign(s, { changedAt, nudgedAt, lastMine });
}
const human = (m) => m.user && !m.bot_id && m.user !== botUser && (!m.subtype || m.subtype === 'file_share' || m.subtype === 'thread_broadcast');

/* ---------- the steps ---------- */
async function start(client, parent, replies) {
  const b = briefOf(parent);
  if (!b) return;
  const strategist = parent.user;
  /* The editor is tagged in the post, or in a quick follow-up reply by the strategist or an approver. */
  const pick = (t) => mentions(t).find((u) => !APPROVERS.has(u) && u !== botUser && u !== strategist);
  const early = (replies || []).filter((r) => r.ts !== parent.ts && human(r) && (r.user === strategist || APPROVERS.has(r.user)));
  const editor = pick(parent.text) || early.map((r) => pick(r.text)).find(Boolean) || null;
  const s = { id: newId(parent.ts), editor, rev: 0 };
  const head = '📋 Logged *' + b.name + '* as `' + s.id + '`. Strategist <@' + strategist + '>' + (editor ? ', editor <@' + editor + '>.' : '.');
  if (!editor) { s.status = 'needs_editor'; return post(client, parent.ts, head + '\n<@' + strategist + '>, tag the editor here so I can hand it over.', s); }
  if (APPROVERS.has(strategist)) { s.status = 'ready_for_editing'; return post(client, parent.ts, head + '\n✅ Approved (posted by <@' + strategist + '>). <@' + editor + '>, it\'s yours. Post the video link here, or upload the file, when the first cut is ready.', s); }
  s.status = 'awaiting_approval';
  return post(client, parent.ts, head + '\nWaiting for approval: ' + [...APPROVERS].map((u) => '<@' + u + '>').join(' or ') + ', reply *ok* here to approve, or write what to change.', s);
}

/* One human reply against the current state. Returns the new state if it moved, else null. */
async function step(client, parent, s, m) {
  const strategist = parent.user;
  const by = m.user;
  const t = m.text || '';
  const approver = APPROVERS.has(by);
  const tagApprovers = [...APPROVERS].map((u) => '<@' + u + '>').join(' or ');

  if (s.status === 'needs_editor') {
    const ed = mentions(t).find((u) => !APPROVERS.has(u) && u !== botUser && u !== strategist);
    if (!ed || (by !== strategist && !approver)) return null;
    const n = Object.assign({}, s, { editor: ed });
    if (APPROVERS.has(strategist)) { n.status = 'ready_for_editing'; await post(client, parent.ts, '✅ <@' + ed + '>, it\'s yours. Post the video link here, or upload the file, when the first cut is ready.', n); }
    else { n.status = 'awaiting_approval'; await post(client, parent.ts, 'Editor set: <@' + ed + '>. Waiting for approval: ' + tagApprovers + ', reply *ok* here to approve, or write what to change.', n); }
    return n;
  }
  if (s.status === 'awaiting_approval' && approver) {
    if (approves(t)) {
      const n = Object.assign({}, s, { status: 'ready_for_editing' });
      await post(client, parent.ts, '✅ Brief approved by <@' + by + '>. <@' + s.editor + '>, it\'s yours. Post the video link here, or upload the file, when the first cut is ready.', n);
      return n;
    }
    if (asksChanges(t)) {
      const n = Object.assign({}, s, { status: 'brief_changes' });
      await post(client, parent.ts, '✏️ <@' + by + '> asked for brief changes. <@' + strategist + '>, update the brief and reply here when it\'s done.', n);
      return n;
    }
    return null;
  }
  if (s.status === 'brief_changes' && by === strategist) {
    const n = Object.assign({}, s, { status: 'awaiting_approval' });
    await post(client, parent.ts, '🔁 Brief updated. ' + tagApprovers + ', reply *ok* to approve.', n);
    return n;
  }
  if ((s.status === 'ready_for_editing' || s.status === 'for_revision') && (by === s.editor || approver)) {
    const cut = cutOf(m);
    if (!cut) return null;
    const n = Object.assign({}, s, { status: 'awaiting_review', rev: s.rev + 1 });
    await post(client, parent.ts, '🎬 Cut ' + n.rev + ' is in. <@' + strategist + '>, please review: reply *approved*, or write the changes here.', n);
    return n;
  }
  if (s.status === 'awaiting_review' && (by === strategist || approver)) {
    if (approves(t)) {
      const n = Object.assign({}, s, { status: 'approved' });
      const cut = await latestCut(client, parent.ts, s.editor);
      const permalink = (await client.chat.getPermalink({ channel: CHANNEL, message_ts: parent.ts }).catch(() => ({}))).permalink || '';
      const name = (briefOf(parent) || {}).name || s.id;
      await client.chat.postMessage({ channel: APPROVED, unfurl_links: false, text: '<@' + JENN + '> ✅ Approved: *' + name + '* (`' + s.id + '`)\nEditor <@' + s.editor + '> · Strategist <@' + strategist + '>\nVideo: ' + (cut || 'see the thread') + (permalink ? '\nThread: ' + permalink : '') });
      await post(client, parent.ts, '🏁 Approved by <@' + by + '>. Sent to Jenn in <#' + APPROVED + '>.', n);
      return n;
    }
    if (plain(t).length >= 15 || asksChanges(t)) {
      const n = Object.assign({}, s, { status: 'for_revision' });
      await post(client, parent.ts, '✏️ Changes requested. <@' + s.editor + '>, over to you. Post the new link here when it\'s ready.', n);
      return n;
    }
  }
  return null;
}

async function latestCut(client, ts, editor) {
  const msgs = await thread(client, ts);
  for (let i = msgs.length - 1; i >= 0; i--) { const m = msgs[i]; if (human(m) && (!editor || m.user === editor || APPROVERS.has(m.user))) { const c = cutOf(m); if (c) return c; } }
  return null;
}

/* Who owns the next move, for nudges and the summary. */
function owner(s, strategist) {
  switch (s.status) {
    case 'needs_editor': case 'brief_changes': case 'awaiting_review': return [strategist];
    case 'awaiting_approval': return [...APPROVERS];
    case 'ready_for_editing': case 'for_revision': return [s.editor];
    default: return [];
  }
}
const NUDGE_TEXT = {
  needs_editor: (s, w) => w + ', who\'s editing this one? Tag the editor here.',
  awaiting_approval: (s, w) => w + ', this brief is still waiting for approval. Reply *ok* or what to change.',
  brief_changes: (s, w) => w + ', is the updated brief ready? Reply here when it is.',
  ready_for_editing: (s, w) => w + ', how is this one going? Post the link here when the cut is ready.',
  awaiting_review: (s, w) => w + ', cut ' + s.rev + ' is still waiting for your review. Reply *approved* or the changes.',
  for_revision: (s, w) => w + ', how are the changes going? Post the new link here when ready.',
};

/* ---------- the loop ---------- */
const cache = new Map(); /* thread ts -> { latest, s } so quiet threads cost one history read */
async function tick(client) {
  if (!enabled || !botUser) return { skipped: true };
  const now = Date.now() / 1000;
  const parents = (await history(client)).filter((m) => human(m) && (!m.thread_ts || m.thread_ts === m.ts));
  const did = []; const open = [];
  for (const p of parents) {
    if (!briefOf(p)) continue;
    const latest = p.latest_reply || p.ts;
    const c = cache.get(p.ts);
    let s = c && c.latest === latest ? c.s : null;
    if (!s) {
      let msgs = p.reply_count ? await thread(client, p.ts) : [p];
      s = stateOf(msgs);
      if (!s) {
        if (Number(p.ts) < SINCE) continue; /* briefs from before launch stay with the old process */
        await start(client, p, msgs); did.push('start ' + p.ts);
        msgs = await thread(client, p.ts); s = stateOf(msgs);
        if (!s) continue;
      }
      /* Replies after Donnaa's last message are new: handle them in order. */
      for (const m of msgs) {
        if (m.ts === p.ts || Number(m.ts) <= Number(s.lastMine) || !human(m)) continue;
        const n = await step(client, p, s, m);
        if (n) { did.push(s.status + '>' + n.status + ' ' + s.id); s = Object.assign(n, { changedAt: String(now), nudgedAt: null, lastMine: m.ts }); }
      }
      /* Our own posts moved latest_reply; re-read it next tick only if we posted. */
      cache.set(p.ts, { latest: did.length ? null : latest, s });
    }
    if (s.status === 'approved') continue;
    const who = owner(s, p.user).filter(Boolean);
    open.push({ s, ts: p.ts, who, idleH: (now - Number(s.changedAt || p.ts)) / 3600 });
    const idle = now - Number(s.nudgedAt || s.changedAt || p.ts);
    const hour = new Date().getUTCHours();
    if (who.length && idle >= NUDGE_AFTER_H * 3600 && hour >= NUDGE_START_UTC && hour < NUDGE_END_UTC) {
      await post(client, p.ts, '⏰ ' + NUDGE_TEXT[s.status](s, who.map((u) => '<@' + u + '>').join(' / ')), s, true);
      s.nudgedAt = String(now);
      cache.set(p.ts, { latest: null, s });
      did.push('nudge ' + s.id);
    }
  }
  await summary(client, open).catch((e) => console.error('[pipeline] summary failed:', e.message));
  return { did, open: open.length };
}

async function summary(client, open) {
  const d = new Date();
  const day = d.toISOString().slice(0, 10);
  if (d.getUTCHours() !== SUMMARY_UTC_HOUR || lastSummaryDay === day) return;
  lastSummaryDay = day;
  const by = {};
  for (const o of open) (by[o.s.status] = by[o.s.status] || []).push(o);
  const stuck = open.filter((o) => o.idleH >= NUDGE_AFTER_H).sort((a, b) => b.idleH - a.idleH).slice(0, 10);
  const lines = ['*Briefs pipeline, this morning*'];
  if (!open.length) lines.push('Nothing open. Every logged brief is approved.');
  for (const k of Object.keys(STEP)) if (by[k]) lines.push('• ' + STEP[k] + ': ' + by[k].length);
  if (stuck.length) {
    lines.push('', '*Stuck more than a day*');
    for (const o of stuck) {
      const link = (await client.chat.getPermalink({ channel: CHANNEL, message_ts: o.ts }).catch(() => ({}))).permalink;
      lines.push('• `' + o.s.id + '` ' + STEP[o.s.status] + ', ' + Math.round(o.idleH) + 'h, waiting on ' + o.who.map((u) => '<@' + u + '>').join(' / ') + (link ? ' <' + link + '|open>' : ''));
    }
  }
  const im = await client.conversations.open({ users: HEMANT });
  await client.chat.postMessage({ channel: im.channel.id, text: lines.join('\n'), unfurl_links: false });
}

/* "pipeline on/off/status", owners only, handled from slack.js. */
function command(text) {
  const m = /^pipeline\s+(on|off|status)\s*$/i.exec(String(text || '').trim());
  if (!m) return null;
  const v = m[1].toLowerCase();
  if (v === 'on') enabled = true;
  if (v === 'off') enabled = false;
  return 'Briefs pipeline is ' + (enabled ? 'ON' : 'OFF') + ' in <#' + CHANNEL + '>.';
}

module.exports = { tick, command, setBotUser: (u) => { botUser = u; }, _t: { briefOf, cutOf, approves, asksChanges, stateOf, REF, ref, newId, step, start } };
