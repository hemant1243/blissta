'use strict';
/*
 Chases creative delivery so Neil does not have to.

 Assignments come from three places, each with its own shape:
   briefs   Hemant posts a brief file, then @mentions the editor in the thread.
            The concept is the file name.
   neil     "@Suhan pick tab 9" in youssef-editors-2-0. Concept is "tab 9".
   schalk   "@Ibad Got concept 1 ready for you" in schalk-ed. Concept is "concept 1".

 A concept counts as delivered when the assignee posts a Drive link that names
 it, anywhere we can see: the finish-line channel, the brief thread, or the
 room it was assigned in. If it landed anywhere but the finish line we say so,
 because Jenn only looks in one place.

 Chasing happens only inside the editor's local working hours, and never for
 someone whose time zone we do not know. A 3am ping is worse than no ping.
*/
const fs = require('fs');
const path = require('path');

const CH = {
  briefs: 'C0B1LJ0342H',
  neil: 'C0BGT8M8VB7',
  schalk: 'C0BTMKDN10X',
  approved: 'C0B1Q0Q53RQ',
};
const OWNER = 'U0963M61T8V';
const LOOKBACK_DAYS = 21;
const NUDGE_AFTER_H = 48;
const ESCALATE_AFTER_H = 96;
const UNASSIGNED_AFTER_H = 24;
const RENUDGE_EVERY_H = 24;
const WORK_START = 10, WORK_END = 18; /* local hours, inclusive of start, exclusive of end */

const ROSTER = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'roster.json'), 'utf8'));
const byId = Object.fromEntries(ROSTER.map((p) => [p.id, p]));
const person = (id) => byId[id] || { id, name: id, tz: null, role: 'unknown', chase: false };

const STATE_FILE = path.join(__dirname, '..', 'data', 'chase-state.json');
function loadState() { try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return { nudged: {} }; } }
function saveState(s) { try { fs.writeFileSync(STATE_FILE, JSON.stringify(s)); } catch (e) { console.error('[chase] could not save state:', e.message); } }

/* ---------- text helpers ---------- */
const MENTION = /<@([A-Z0-9]+)(?:\|[^>]*)?>/g;
const DRIVE = /https?:\/\/(?:drive|docs)\.google\.com\/[^\s|>]+/i;
const mentions = (t) => [...(t || '').matchAll(MENTION)].map((m) => m[1]);
const hasDrive = (t) => DRIVE.test(t || '');
const NOISE = new Set(['CORVAEL', 'CORBEL', 'CORVEAL', 'MBG', 'MB', 'PEA', 'BLISSTA', 'EDITOR', 'BRIEF', 'COPY', 'THE', 'AND', 'FOR', 'DONE', 'APPROVED', 'FINAL', 'FULL', 'PACKAGE', 'SCRIPT', 'VIDEO', 'PRODUCTION', 'TAB', 'CONCEPT']);
function tokens(s) {
  return (s || '').toUpperCase().replace(/<[^>]+>/g, ' ').replace(/[^A-Z0-9]+/g, ' ').split(' ').filter((w) => w.length >= 3 && !NOISE.has(w));
}
/* Does delivery text name this concept? All of the concept's real words, or nearly. */
function names(conceptTokens, text) {
  if (!conceptTokens.length) return false;
  const t = new Set(tokens(text));
  const hit = conceptTokens.filter((w) => t.has(w)).length;
  return hit === conceptTokens.length || (conceptTokens.length >= 4 && hit >= conceptTokens.length - 1);
}
const sec = (ts) => Number(String(ts).split('.')[0]);
const hoursAgo = (ts) => (Date.now() / 1000 - sec(ts)) / 3600;

/* ---------- slack reads ---------- */
async function history(client, channel, oldest) {
  const out = []; let cursor;
  do {
    const r = await client.conversations.history({ channel, oldest: String(oldest), limit: 200, cursor });
    out.push(...(r.messages || []));
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  return out;
}
async function replies(client, channel, ts) {
  const r = await client.conversations.replies({ channel, ts, limit: 100 });
  return (r.messages || []).slice(1); /* drop the parent */
}

/* ---------- assignments ---------- */
async function fromBriefs(client, oldest) {
  const out = [];
  const msgs = await history(client, CH.briefs, oldest);
  for (const m of msgs) {
    const files = (m.files || []).filter((f) => f.name);
    if (!files.length) continue;
    const concept = files[0].name.replace(/\.[^.]+$/, '');
    const a = { key: 'briefs:' + concept, concept, conceptTokens: tokens(concept), source: 'briefs', channel: CH.briefs, ts: m.ts, assignedAt: null, assignee: null, assigner: m.user, delivered: null };
    let thread = [];
    try { thread = m.reply_count ? await replies(client, CH.briefs, m.ts) : []; } catch { /* no access, treat as no replies */ }
    for (const r of thread) {
      if (!a.assignee && r.user !== undefined && person(r.user).role !== 'Video Editor' && person(r.user).role !== 'Video Editor (trial)') {
        const who = mentions(r.text).find((u) => person(u).chase || person(u).role.startsWith('Video Editor'));
        if (who) { a.assignee = who; a.assignedAt = r.ts; a.assigner = r.user; }
      }
      if (a.assignee && r.user === a.assignee && hasDrive(r.text)) a.delivered = { where: 'thread', ts: r.ts };
    }
    if (!a.assignedAt) a.assignedAt = m.ts;
    out.push(a);
  }
  return out;
}

async function fromNeil(client, oldest) {
  const out = [];
  for (const m of await history(client, CH.neil, oldest)) {
    const who = mentions(m.text);
    if (!who.length || !/\bpick\b/i.test(m.text || '')) continue;
    const tabs = [...(m.text.match(/\btabs?\s+([\d,\s]+(?:and\s+\d+)?)/i) || ['', ''])[1].matchAll(/\d+/g)].map((x) => x[0]);
    for (const n of tabs) out.push({ key: 'neil:tab:' + n, concept: 'tab ' + n, conceptTokens: [], tab: n, source: 'neil', channel: CH.neil, ts: m.ts, assignedAt: m.ts, assignee: who[0], assigner: m.user, delivered: null });
  }
  return out;
}

async function fromSchalk(client, oldest) {
  const out = [];
  for (const m of await history(client, CH.schalk, oldest)) {
    const who = mentions(m.text);
    const n = (m.text || '').match(/\bconcept\s*(\d+)/i);
    if (!who.length || !n) continue;
    out.push({ key: 'schalk:concept:' + n[1], concept: 'concept ' + n[1], conceptTokens: [], tab: n[1], source: 'schalk', channel: CH.schalk, ts: m.ts, assignedAt: m.ts, assignee: who[0], assigner: m.user, delivered: null });
  }
  return out;
}

/* ---------- deliveries ---------- */
async function deliveries(client, oldest) {
  const out = [];
  for (const [where, ch] of [['approved', CH.approved], ['neil', CH.neil], ['schalk', CH.schalk]]) {
    for (const m of await history(client, ch, oldest)) {
      if (!hasDrive(m.text) || !m.user) continue;
      out.push({ where, user: m.user, text: m.text, ts: m.ts });
    }
  }
  return out;
}

function matchDelivery(a, dels) {
  const after = dels.filter((d) => sec(d.ts) >= sec(a.assignedAt) - 3600);
  const mine = after.filter((d) => d.user === a.assignee);
  const pick = (list) => {
    if (a.tab) return list.find((d) => new RegExp('\\b' + (a.source === 'neil' ? 'tab' : 'concept') + '\\s*' + a.tab + '\\b', 'i').test(d.text));
    return list.find((d) => names(a.conceptTokens, d.text));
  };
  return pick(mine) || (a.conceptTokens.length ? pick(after) : null);
}

/* ---------- the report ---------- */
async function collect(client) {
  const oldest = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 86400;
  const [b, n, s, dels] = await Promise.all([fromBriefs(client, oldest), fromNeil(client, oldest), fromSchalk(client, oldest), deliveries(client, oldest)]);
  const all = [...b, ...n, ...s];
  for (const a of all) {
    if (a.delivered) continue;
    const d = matchDelivery(a, dels);
    if (d) a.delivered = { where: d.where, ts: d.ts };
  }
  /* If it was delivered anywhere, was it also posted to the finish line? */
  for (const a of all) {
    if (!a.delivered) continue;
    a.inApproved = a.delivered.where === 'approved' || !!dels.find((d) => d.where === 'approved' && d.user === a.assignee && (a.tab ? matchDelivery(Object.assign({}, a, { delivered: null }), [d]) : names(a.conceptTokens, d.text)));
  }
  return {
    open: all.filter((a) => a.assignee && !a.delivered && person(a.assignee).chase),
    unassigned: all.filter((a) => !a.assignee),
    notInApproved: all.filter((a) => a.delivered && !a.inApproved),
    delivered: all.filter((a) => a.delivered),
    skipped: all.filter((a) => a.assignee && !a.delivered && !person(a.assignee).chase),
  };
}

const label = (a) => (a.source === 'briefs' ? a.concept.replace(/_/g, ' ') : a.concept + (a.source === 'neil' ? " (Neil's doc)" : " (Schalk's doc)"));
const ageStr = (ts) => { const h = hoursAgo(ts); return h < 48 ? Math.round(h) + 'h' : Math.round(h / 24) + 'd'; };
const link = (a) => `https://slack.com/archives/${a.channel}/p${String(a.ts).replace('.', '')}`;

function renderOpenList(r) {
  const lines = [];
  const open = r.open.slice().sort((x, y) => sec(x.assignedAt) - sec(y.assignedAt));
  lines.push(`*Open — ${open.length}*`);
  for (const a of open) lines.push(`• ${person(a.assignee).name} — ${label(a)} — ${ageStr(a.assignedAt)} <${link(a)}|↗>`);
  if (r.notInApproved.length) {
    lines.push('', `*Done but not in #blissta-ad-approved-2-0 — ${r.notInApproved.length}*`);
    for (const a of r.notInApproved) lines.push(`• ${person(a.assignee).name} — ${label(a)} — posted in ${a.delivered.where === 'thread' ? 'the brief thread' : 'the ' + a.delivered.where + ' room'}`);
  }
  if (r.unassigned.length) {
    lines.push('', `*Briefs with nobody tagged — ${r.unassigned.length}*`);
    for (const a of r.unassigned) lines.push(`• ${label(a)} — ${ageStr(a.assignedAt)} <${link(a)}|↗>`);
  }
  if (r.skipped.length) lines.push('', `_${r.skipped.length} open item${r.skipped.length === 1 ? '' : 's'} not chased (assignee not on the chase list)._`);
  return lines.join('\n');
}

/* ---------- chasing ---------- */
function localHour(tz) {
  try { return Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(new Date())); } catch { return null; }
}
const inWorkHours = (p) => { if (!p.tz) return false; const h = localHour(p.tz); return h !== null && h >= WORK_START && h < WORK_END; };

async function dm(client, user, text) {
  const r = await client.conversations.open({ users: user });
  return client.chat.postMessage({ channel: r.channel.id, text });
}

/* One pass. Returns what it did so the caller can log it. */
async function tick(client, { dryRun = false } = {}) {
  const r = await collect(client);
  const state = loadState();
  const now = Date.now() / 1000;
  const due = (key) => !state.nudged[key] || (now - state.nudged[key]) / 3600 >= RENUDGE_EVERY_H;
  const did = [];

  for (const a of r.open) {
    const p = person(a.assignee);
    const age = hoursAgo(a.assignedAt);
    if (age < NUDGE_AFTER_H || !inWorkHours(p) || !due(a.key)) continue;
    const msg = age >= ESCALATE_AFTER_H
      ? `Hey ${p.name.split(' ')[0]}, *${label(a)}* has been open ${ageStr(a.assignedAt)}. When it is done, post the Drive link in #blissta-ad-approved-2-0 and tag Jenn. If you are stuck, say so in the thread: ${link(a)}`
      : `Hey ${p.name.split(' ')[0]}, quick check on *${label(a)}* — assigned ${ageStr(a.assignedAt)} ago. When it is done, post the Drive link in #blissta-ad-approved-2-0 and tag Jenn. ${link(a)}`;
    if (!dryRun) await dm(client, a.assignee, msg);
    state.nudged[a.key] = now;
    did.push({ kind: age >= ESCALATE_AFTER_H ? 'escalate' : 'nudge', who: p.name, what: label(a) });
    if (age >= ESCALATE_AFTER_H && a.assigner && due(a.key + ':assigner')) {
      if (!dryRun) await client.chat.postMessage({ channel: a.channel, thread_ts: a.ts, text: `<@${a.assigner}> ${label(a)} is ${ageStr(a.assignedAt)} old with no delivery from <@${a.assignee}>.` });
      state.nudged[a.key + ':assigner'] = now;
    }
  }

  for (const a of r.notInApproved) {
    const p = person(a.assignee);
    if (!p.chase || !inWorkHours(p) || !due(a.key + ':approved')) continue;
    if (!dryRun) await dm(client, a.assignee, `Nice one on *${label(a)}*. One more step: post that same Drive link in #blissta-ad-approved-2-0 and tag Jenn, otherwise she does not see it.`);
    state.nudged[a.key + ':approved'] = now;
    did.push({ kind: 'post-to-approved', who: p.name, what: label(a) });
  }

  for (const a of r.unassigned) {
    if (hoursAgo(a.assignedAt) < UNASSIGNED_AFTER_H || !due(a.key + ':unassigned')) continue;
    if (!dryRun) await dm(client, OWNER, `*${label(a)}* has been sitting in #blissta-ad-working-briefs-2-0 for ${ageStr(a.assignedAt)} with nobody tagged. ${link(a)}`);
    state.nudged[a.key + ':unassigned'] = now;
    did.push({ kind: 'unassigned', who: 'Hemant', what: label(a) });
  }

  if (!dryRun) saveState(state);
  return { report: r, did };
}

module.exports = { collect, renderOpenList, tick, CH, person, tokens, names };
