'use strict';
/*
 Tracker to Slack accountability bridge.

 Hemant's ask, 24 Sep 2026. The Creative Operations tracker (a Google Sheet behind
 blisstacreativestracker.netlify.app) is the source of truth. A small Apps Script attached to that
 sheet POSTs here whenever a row changes. Donnaa never writes to the tracker; she only reports into
 one accountability channel and tags whoever owns the next move.

 One Slack thread per concept (the tracker's Video ID, e.g. BRF-20260922-97FB30). The first handoff
 opens the thread, every later update replies inside it. The thread is found by reading the channel,
 so a redeploy forgets nothing.

 Who gets tagged:
   Brief Assigned            brief needs approval           Hemant
   Ready for Editing         brief ready for editing        the editor
   brief note by the editor  editor asks for a brief change the strategist
   brief note by strategist  strategist updated the brief   the editor
   Awaiting Review (rev 0)   video submitted                the strategist, plus Hemant and Bruce when it is Hemant's concept
   For Revision              strategist wants changes       the editor
   Awaiting Review (rev >0)  editor resubmitted             the strategist
   Approved                  final approval                 Jenn, with the parent Drive link
   Blocked                   not in the ask, but useful     the strategist and Hemant
 "Editing" is logged and not posted: nothing changes hands there.
*/
const fs = require('fs');
const path = require('path');

const OWNER = 'U0963M61T8V';
const BRUCE = 'U0C1G0L4F1T';
const JENN = 'U0960GV0ZDH';
const CHANNEL_NAME = (process.env.TRACKER_CHANNEL || 'creative-accountability').replace(/^#/, '');
const SECRET = process.env.TRACKER_SECRET || '';

const PEOPLE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'people.json'), 'utf8'));
const byEmail = {}; const byName = {};
for (const [email, p] of Object.entries(PEOPLE)) {
  if (email.startsWith('_')) continue;
  byEmail[email.toLowerCase()] = p;
  for (const n of [p.name, ...(p.aka || [])]) byName[n.toLowerCase()] = p;
}
/* Slack id for a tracker person, by email first, then name, then first name. Empty when unknown. */
function slackId(name, email) {
  const p = (email && byEmail[email.toLowerCase()]) || (name && byName[name.trim().toLowerCase()]) || (name && byName[name.trim().split(/\s+/)[0].toLowerCase()]);
  return (p && p.slack) || '';
}
const who = (name, email) => { const id = slackId(name, email); return id ? `<@${id}>` : (name ? `*${name}*` : 'nobody assigned'); };
const isHemant = (name, email) => /^hemant/i.test(name || '') || /^blisstainc@/i.test(email || '');
const link = (url, label) => (/^https?:\/\/\S+$/i.test(String(url || '').trim()) ? `<${String(url).trim()}|${label}>` : '');

/* The tracker stores per-hook review feedback as "HOOK_REVIEWS::[{status, comment, reviewerName, ...}, ...]".
   Turn that into the distinct human comments, in order. Anything else comes back as plain text. */
function reviewFeedback(raw) {
  const text = String(raw || '').trim();
  if (!text) return { comments: [], reviewer: '' };
  const m = text.match(/^HOOK_REVIEWS::\s*([\s\S]*)$/);
  if (!m) return { comments: [text], reviewer: '' };
  let items;
  try { items = JSON.parse(m[1]); } catch { return { comments: [m[1].trim()].filter(Boolean), reviewer: '' }; }
  if (!Array.isArray(items)) items = [items];
  const seen = new Set(); const comments = []; let reviewer = '';
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const c = String(it.comment || it.feedback || '').trim();
    if (!reviewer && it.reviewerName) reviewer = String(it.reviewerName);
    const key = c.toLowerCase().replace(/\s+/g, ' ');
    if (!c || seen.has(key)) continue;
    seen.add(key); comments.push(c);
  }
  return { comments, reviewer };
}
const quote = (t) => '> ' + String(t).trim().replace(/\n/g, '\n> ');

/* ---------- which trigger fired ---------- */
/* Returns { kind, tag: [slack ids], line, extra } or null when nothing changes hands. */
function decide(ev) {
  const s = (ev.status || '').trim();
  const prev = (ev.prevStatus || '').trim();
  const strategistName = ev.strategist || ev.briefWrittenBy || ev.reviewer || '';
  const strategistEmail = ev.strategistEmail || '';
  const strategist = slackId(strategistName, strategistEmail) || OWNER;
  const editor = slackId(ev.editor, ev.editorEmail);
  const hemants = isHemant(ev.strategist, ev.strategistEmail) || isHemant(ev.briefWrittenBy, '') || (!ev.strategist && !ev.briefWrittenBy);
  const rev = Number(ev.revisionVersion || 0);
  const resubmitted = /^true$/i.test(String(ev.resubmitted || '')) || rev > 0;

  if (ev.sheet === 'Revisions') {
    if ((ev.stage || '').toUpperCase() !== 'BRIEF') return null; /* video comments ride along with the status change */
    const byEditor = editor && slackId(ev.author, ev.authorEmail) === editor;
    if (byEditor) return { kind: 'brief-revision-requested', tag: [strategist], line: `${who(ev.author, ev.authorEmail)} asked for a change to the brief.`, extra: ev.comment };
    return { kind: 'brief-updated', tag: editor ? [editor] : [], line: `${who(ev.author, ev.authorEmail)} updated the brief.`, extra: ev.comment };
  }
  if (ev.sheet === 'Briefs') {
    return { kind: 'brief-updated', tag: editor ? [editor] : [], line: `The brief was updated.`, extra: '' };
  }
  if (s === prev && !ev.force) return null;
  switch (s) {
    case 'Brief Assigned': return { kind: 'brief-needs-approval', tag: [OWNER], line: 'Brief needs your approval.' };
    case 'Ready for Editing': return { kind: 'brief-ready', tag: editor ? [editor] : [], line: editor ? 'Brief is approved and ready. It is yours.' : 'Brief is approved and ready, no editor assigned yet.' };
    case 'Editing': return null;
    case 'Awaiting Review': {
      const tag = hemants ? [OWNER, BRUCE] : [strategist];
      /* Bruce's ask, 26 Sep 2026: the parent Drive folder goes right under the message so the reviewer can open the cuts from Slack. */
      const links = [link(ev.firstCut || ev.finalLink, 'Watch the cut'), ev.parentDrive ? (link(ev.parentDrive, 'Parent Drive') ? 'Parent Drive: ' + link(ev.parentDrive, 'open folder') : '') : ''].filter(Boolean).join('\n');
      return resubmitted
        ? { kind: 'video-resubmitted', tag, line: `\n${who(ev.editor, ev.editorEmail)} resubmitted after revisions (v${rev}). Please review.`, extra: links }
        : { kind: 'video-submitted', tag, line: `\n${who(ev.editor, ev.editorEmail)} submitted the first cut. Please review.`, extra: links };
    }
    case 'For Revision': {
      /* Bruce's ask, 26 Sep 2026: the tracker's HOOK_REVIEWS:: blob becomes the distinct comments, not raw JSON. */
      const fb = reviewFeedback(ev.reviewComment);
      const reviewer = ev.reviewer || fb.reviewer;
      return { kind: 'video-revisions', tag: editor ? [editor] : [], line: `\n${who(reviewer, '')} wants changes.`, extra: fb.comments.length ? '\n*Revision feedback:*\n' + fb.comments.map(quote).join('\n') : '' };
    }
    case 'Approved': return { kind: 'final-approval', tag: [JENN], line: 'Final approval. Ready to go live.', extra: [link(ev.parentDrive, 'Drive folder'), link(ev.finalLink, 'Final cut')].filter(Boolean).join(' · ') };
    case 'Blocked': return { kind: 'blocked', tag: [strategist, OWNER], line: `Blocked${ev.blockedBy ? ' by ' + ev.blockedBy : ''}.`, extra: ev.blockerReason ? `> ${ev.blockerReason}` : '' };
    default: return null;
  }
}

/* ---------- slack ---------- */
let channelId = null;
async function channel(client) {
  if (channelId) return channelId;
  let cursor;
  do {
    const r = await client.conversations.list({ types: 'public_channel,private_channel', exclude_archived: true, limit: 200, cursor });
    const hit = (r.channels || []).find((c) => c.name === CHANNEL_NAME);
    if (hit) { channelId = hit.id; if (!hit.is_member) await client.conversations.join({ channel: hit.id }).catch(() => {}); return channelId; }
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  const made = await client.conversations.create({ name: CHANNEL_NAME, is_private: false });
  channelId = made.channel.id;
  await client.conversations.invite({ channel: channelId, users: [OWNER, JENN, BRUCE].join(',') }).catch(() => {});
  console.log('[tracker] created #' + CHANNEL_NAME, channelId);
  return channelId;
}
async function ensureMembers(client, ch, ids) {
  for (const u of ids) await client.conversations.invite({ channel: ch, users: u }).catch(() => {});
}

const threads = new Map(); /* concept id -> root ts, warmed from the channel */
const idTag = (id) => '`' + id + '`';
async function findThread(client, ch, id) {
  if (threads.has(id)) return threads.get(id);
  let cursor; let pages = 0;
  do {
    const r = await client.conversations.history({ channel: ch, limit: 200, cursor });
    for (const m of r.messages || []) { const mm = (m.text || '').match(/`(BRF-[A-Z0-9-]+|[A-Z0-9-]{8,})`/); if (mm && !m.thread_ts) threads.set(mm[1], m.ts); }
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor && ++pages < 10);
  return threads.get(id) || null;
}
async function alreadyPosted(client, ch, rootTs, marker) {
  const r = await client.conversations.replies({ channel: ch, ts: rootTs, limit: 200 });
  return (r.messages || []).some((m) => (m.text || '').includes(marker));
}

function header(ev) {
  const people = [ev.strategist ? `Strategist ${ev.strategist}` : '', ev.editor ? `Editor ${ev.editor}` : ''].filter(Boolean).join(' · ');
  const links = [link(ev.briefLink, 'Brief'), link(ev.parentDrive, 'Drive')].filter(Boolean).join(' · ');
  return `*${ev.product || ''} · ${ev.name || ev.id}*  ${idTag(ev.id)}\n${people}${links ? '\n' + links : ''}`;
}

/* Handle one tracker event. Returns what was done. */
async function handle(client, ev, { dryRun = false } = {}) {
  if (!ev || !ev.id) return { skipped: 'no id' };
  const d = decide(ev);
  if (!d) return { skipped: 'no handoff', status: ev.status };
  const marker = `_${d.kind} · ${ev.status || ev.stage || ''}${ev.revisionVersion ? ' · v' + ev.revisionVersion : ''}${ev.revisionId ? ' · ' + ev.revisionId : ''}_`;
  const tags = d.tag.filter(Boolean).map((u) => `<@${u}>`).join(' ');
  const label = ev.sheet === 'Videos' ? (ev.status || 'Update') : 'Brief note';
  const body = [`*${label}* → ${tags} ${d.line}`.trim(), d.extra || '', marker].filter(Boolean).join('\n');
  if (dryRun) return { would: { root: header(ev), body, tag: d.tag, kind: d.kind } };
  const ch = await channel(client);
  await ensureMembers(client, ch, d.tag.filter(Boolean));
  let root = await findThread(client, ch, ev.id);
  if (root && await alreadyPosted(client, ch, root, marker)) return { skipped: 'already posted', kind: d.kind };
  if (!root) {
    const r = await client.chat.postMessage({ channel: ch, text: header(ev), unfurl_links: false });
    root = r.ts; threads.set(ev.id, root);
  }
  await client.chat.postMessage({ channel: ch, thread_ts: root, text: body, unfurl_links: false });
  return { posted: d.kind, thread: root, tag: d.tag };
}

/* ---------- http ---------- */
function verify(req) {
  if (!SECRET) return true;
  return (req.headers['x-tracker-secret'] || '') === SECRET;
}

module.exports = { handle, decide, verify, channel, CHANNEL_NAME };
