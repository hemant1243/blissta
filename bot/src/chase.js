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
  editors: 'C0B23B9HWGZ',
};
const OWNER = 'U0963M61T8V';
const JENN = 'U0960GV0ZDH';
const LOOKBACK_DAYS = 21;
const TAG_AFTER_H = 48;        /* day 2: one tag in the thread */
const DM_AFTER_SILENCE_H = 36; /* no reply to the tag for this long: one DM */
const REPORT_AFTER_SILENCE_H = 36; /* no reply to the DM for this long: tell Hemant once */
const RECHECK_AFTER_REPLY_H = 72; /* they answered but no link yet: ask again after this */
const UNASSIGNED_AFTER_H = 24;
const ONE_PER_PERSON_H = 24;   /* never more than one message to the same person per day */
const MAX_PER_TICK = 6;
const DONNA = 'C0C0QN1G3PT';
const WORK_START = 10, WORK_END = 18; /* local hours, inclusive of start, exclusive of end */

const ROSTER = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'roster.json'), 'utf8'));
const byId = Object.fromEntries(ROSTER.map((p) => [p.id, p]));
const person = (id) => byId[id] || { id, name: id, tz: null, role: 'unknown', chase: false };


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
    /* Briefs run by the pipeline (src/pipeline.js) get their nudges there. */
    if (thread.some((r) => /`ref BRF-/.test(r.text || ''))) continue;
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
const dmCache = {};
async function dmChannel(client, user) {
  if (!dmCache[user]) { const r = await client.conversations.open({ users: user }); dmCache[user] = r.channel.id; }
  return dmCache[user];
}
async function deliveries(client, oldest) {
  const out = [];
  for (const [where, ch] of [['approved', CH.approved], ['neil', CH.neil], ['schalk', CH.schalk]]) {
    for (const m of await history(client, ch, oldest)) {
      if (!hasDrive(m.text) || !m.user) continue;
      out.push({ where, user: m.user, text: m.text, ts: m.ts });
    }
  }
  /* links an editor sent Donnaa in a DM count too, but Jenn still needs them in the finish line */
  for (const p of ROSTER.filter((x) => x.chase)) {
    let msgs = [];
    try { msgs = await history(client, await dmChannel(client, p.id), oldest); } catch { continue; }
    for (const m of msgs) if (m.user === p.id && hasDrive(m.text)) out.push({ where: 'dm', user: m.user, text: m.text, ts: m.ts });
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
/*
 The ladder, agreed with Hemant on 16 Sep 2026:
   day 2      one tag in the thread where the work was assigned, all of that editor's items in one message
   +36h quiet one DM: "I tagged you, did not hear back, what is going on?"
   +36h quiet one line to Hemant in #donna, then Donnaa goes quiet on that item
   they reply the conversation continues in the DM; a blocker is passed to Hemant once; a promise without a
              link gets one gentle DM again after 3 days
 Never more than one message per person per day, never more than MAX_PER_TICK messages per hour.
 Railway wipes the disk on deploy, so Slack itself is the memory: every decision is made from what
 Donnaa can see she already said in the thread, the DM, or #donna.
*/
function localHour(tz) {
  try { return Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(new Date())); } catch { return null; }
}
const inWorkHours = (p) => { if (!p.tz) return false; const h = localHour(p.tz); return h !== null && h >= WORK_START && h < WORK_END; };

let selfId = null;
async function self(client) { if (!selfId) selfId = (await client.auth.test()).user_id; return selfId; }
const isMine = (m, me) => m.user === me || (!!m.bot_id && !m.user);
const BLOCKER = /\b(stuck|blocked|block|waiting|wait for|need|can'?t|cannot|delay|delayed|sick|problem|issue|no (?:footage|voice|audio|script|access))\b/i;
const join = (xs) => xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
/* "tabs 10, 11 and 12 (Neil's doc)" instead of three long labels; briefs keep their names */
function describe(as, withLink) {
  const src = as[0].source;
  if (as.length > 1 && as.every((a) => a.source === src && a.tab)) {
    const word = src === 'neil' ? 'tab' : 'concept';
    return `*${word}s ${join(as.map((a) => a.tab))}* (${src === 'neil' ? "Neil's" : "Schalk's"} doc)` + (withLink ? ` <${link(as[0])}|↗>` : '');
  }
  return join(as.map((a) => `*${label(a)}*` + (withLink ? ` <${link(a)}|↗>` : '')));
}
const list = (labels) => join(labels.map((l) => `*${l}*`));
/* Did this text talk about this item? Matches the long label and the compressed "tabs 10, 11 and 12" form. */
function mentionsItem(text, a) {
  const t = text || '';
  if (t.includes(label(a))) return true;
  if (!a.tab) return false;
  const doc = a.source === 'neil' ? "Neil's" : "Schalk's";
  const word = a.source === 'neil' ? 'tab' : 'concept';
  return t.includes(doc) && new RegExp('\\b' + word + 's?\\b[^*]*?\\b' + a.tab + '\\b', 'i').test(t);
}
const daysAgo = (ts) => { const h = hoursAgo(ts); return h < 36 ? 'yesterday' : Math.round(h / 24) + ' days ago'; };

/* The Slack-room ladder used until Oct 23 2026. Kept for reference; nothing schedules it any more (see editorTick). */
async function legacyTick(client, { dryRun = false } = {}) {
  const r = await collect(client);
  const me = await self(client);
  const now = Date.now() / 1000;
  const oldest = now - LOOKBACK_DAYS * 86400;
  const did = [];
  let sent = 0;
  const say = async (channel, text, thread_ts) => {
    if (dryRun) return;
    await client.chat.postMessage(Object.assign({ channel, text }, thread_ts ? { thread_ts } : {}));
    sent++;
  };

  /* what Donnaa already said, read back from Slack */
  const threads = {};
  const thread = async (channel, ts) => {
    const k = channel + ':' + ts;
    if (!threads[k]) { try { threads[k] = (await client.conversations.replies({ channel, ts, limit: 100 })).messages || []; } catch { threads[k] = []; } }
    return threads[k];
  };
  const dms = {};
  const dm = async (user) => {
    if (!dms[user]) { try { dms[user] = await history(client, await dmChannel(client, user), oldest); } catch { dms[user] = []; } }
    return dms[user];
  };
  let donna = null;
  const said = async (...needles) => { if (!donna) donna = await history(client, DONNA, oldest); return donna.find((m) => isMine(m, me) && needles.every((n) => typeof n === 'function' ? n(m.text || '') : (m.text || '').includes(n))); };
  const lastOf = (msgs, pred) => msgs.filter(pred).sort((a, b) => sec(b.ts) - sec(a.ts))[0] || null;

  /* one message per person per day, across threads and DMs */
  const touched = {};
  const touchedToday = async (user) => {
    if (touched[user] === undefined) {
      const inDm = lastOf(await dm(user), (m) => isMine(m, me));
      let t = inDm ? sec(inDm.ts) : 0;
      for (const a of r.open.concat(r.notInApproved)) {
        if (a.assignee !== user) continue;
        const mine = lastOf(await thread(a.channel, a.ts), (m) => isMine(m, me) && (m.text || '').includes('<@' + user + '>'));
        if (mine) t = Math.max(t, sec(mine.ts));
      }
      touched[user] = t;
    }
    return now - touched[user] < ONE_PER_PERSON_H * 3600;
  };
  const mark = (user) => { touched[user] = now; };

  /* work out where each open item is on the ladder */
  const items = [];
  for (const a of r.open) {
    const p = person(a.assignee);
    const th = await thread(a.channel, a.ts);
    const tag = lastOf(th, (m) => isMine(m, me) && mentionsItem(m.text, a));
    const replyInThread = tag ? lastOf(th, (m) => m.user === a.assignee && sec(m.ts) > sec(tag.ts)) : null;
    const d = await dm(a.assignee);
    const dmMsg = lastOf(d, (m) => isMine(m, me) && mentionsItem(m.text, a));
    const since = dmMsg ? sec(dmMsg.ts) : tag ? sec(tag.ts) : Infinity;
    const replyInDm = lastOf(d, (m) => m.user === a.assignee && sec(m.ts) > since);
    const reply = [replyInThread, replyInDm].filter(Boolean).sort((x, y) => sec(y.ts) - sec(x.ts))[0] || null;
    items.push({ a, p, tag, dmMsg, reply });
  }

  /* blockers: an editor said something that sounds stuck, pass it to Hemant once per reply */
  const blockers = {};
  for (const it of items) {
    if (!it.reply || !BLOCKER.test(it.reply.text || '')) continue;
    (blockers[it.a.assignee + ':' + it.reply.ts] = blockers[it.a.assignee + ':' + it.reply.ts] || []).push(it);
  }
  for (const g of Object.values(blockers)) {
    const { p, reply } = g[0];
    const quote = (reply.text || '').replace(/\s+/g, ' ').slice(0, 200);
    if (await said(p.name + ' on ', 'says: "' + quote.slice(0, 40))) continue;
    if (sent >= MAX_PER_TICK) break;
    const labels = g.map((x) => label(x.a));
    await say(DONNA, `<@${OWNER}> ${p.name} on ${describe(g.map((x) => x.a))} says: "${quote}" <${link(g[0].a)}|↗>`);
    did.push({ kind: 'blocker', who: p.name, what: labels.join(', ') });
  }

  /* delivered in the thread or a DM but never posted to the finish line: say it once */
  for (const a of r.notInApproved) {
    const p = person(a.assignee);
    if (!p.chase || sent >= MAX_PER_TICK) continue;
    const th = await thread(a.channel, a.ts);
    if (th.some((m) => isMine(m, me) && mentionsItem(m.text, a) && (m.text || '').includes('post the same link'))) continue;
    if (await touchedToday(a.assignee)) continue;
    await say(a.channel, `<@${JENN}> <@${a.assignee}> finished *${label(a)}*, the Drive link is ${a.delivered.where === 'thread' ? 'in this thread' : a.delivered.where === 'dm' ? 'in my DMs' : 'in the ' + a.delivered.where + ' room'}. <@${a.assignee}> please post the same link in <#${CH.approved}> so it gets approved.`, a.ts);
    mark(a.assignee);
    did.push({ kind: 'post-to-approved', who: p.name, what: label(a) });
  }

  /* step 1: day 2, one tag in the thread, grouped by thread and person */
  const groups = {};
  for (const it of items) {
    if (it.tag || hoursAgo(it.a.assignedAt) < TAG_AFTER_H || !inWorkHours(it.p)) continue;
    const k = it.a.channel + ':' + it.a.ts + ':' + it.a.assignee;
    (groups[k] = groups[k] || []).push(it);
  }
  for (const g of Object.values(groups)) {
    const { a, p } = g[0];
    if (sent >= MAX_PER_TICK || await touchedToday(a.assignee)) continue;
    const labels = g.map((x) => label(x.a));
    const age = ageStr(g.map((x) => x.a.assignedAt).sort((x, y) => sec(x) - sec(y))[0]);
    await say(a.channel, `<@${a.assignee}> quick check on ${describe(g.map((x) => x.a))}, open ${age} with no Drive link. When it is done, post the link in <#${CH.approved}> and tag <@${JENN}>. Stuck? Say so here.`, a.ts);
    mark(a.assignee);
    did.push({ kind: 'tag', who: p.name, what: labels.join(', ') });
  }

  /* step 2: tagged, silence for 36h, one DM with everything of theirs in it */
  const dmGroups = {};
  for (const it of items) {
    if (!it.tag || !inWorkHours(it.p)) continue;
    if (it.reply && !it.dmMsg) {
      /* they answered the tag but still no link: one gentle DM after 3 days */
      if (hoursAgo(it.reply.ts) < RECHECK_AFTER_REPLY_H) continue;
    } else if (it.reply && it.dmMsg) {
      if (sec(it.reply.ts) < sec(it.dmMsg.ts) || hoursAgo(it.reply.ts) < RECHECK_AFTER_REPLY_H) continue;
    } else {
      if (it.dmMsg || hoursAgo(it.tag.ts) < DM_AFTER_SILENCE_H) continue;
    }
    (dmGroups[it.a.assignee] = dmGroups[it.a.assignee] || []).push(it);
  }
  for (const [user, g] of Object.entries(dmGroups)) {
    if (sent >= MAX_PER_TICK || await touchedToday(user)) continue;
    const p = person(user);
    const first = p.name.split(' ')[0];
    const parts = describe(g.map((x) => x.a), true);
    const answered = g.every((x) => x.reply);
    const text = answered
      ? `Hi ${first}. You said you were on ${parts} but I still do not see a Drive link. Where is it at? A link, a date, or "stuck" is all I need. Reply here.`
      : `Hi ${first}. I tagged you on ${parts} ${daysAgo(g[0].tag.ts)} and did not hear back. What is going on? A Drive link, a date, or "stuck" is all I need. Reply here.`;
    await say(await dmChannel(client, user), text);
    mark(user);
    did.push({ kind: answered ? 'dm-recheck' : 'dm', who: p.name, what: g.map((x) => label(x.a)).join(', ') });
  }

  /* step 3: DMed, silence for 36h, one line to Hemant, then quiet */
  const reportGroups = {};
  for (const it of items) {
    if (!it.dmMsg || hoursAgo(it.dmMsg.ts) < REPORT_AFTER_SILENCE_H) continue;
    if (it.reply && sec(it.reply.ts) > sec(it.dmMsg.ts)) continue;
    if (await said(it.p.name + ' has not answered', (t) => mentionsItem(t, it.a))) continue;
    (reportGroups[it.a.assignee] = reportGroups[it.a.assignee] || []).push(it);
  }
  for (const [user, g] of Object.entries(reportGroups)) {
    if (sent >= MAX_PER_TICK) break;
    const p = person(user);
    const labels = g.map((x) => label(x.a));
    const oldestA = g.map((x) => x.a.assignedAt).sort((x, y) => sec(x) - sec(y))[0];
    await say(DONNA, `<@${OWNER}> ${p.name} has not answered on ${describe(g.map((x) => x.a))} (open ${ageStr(oldestA)}). Tagged in the thread ${daysAgo(g[0].tag ? g[0].tag.ts : g[0].dmMsg.ts)}, DMed ${daysAgo(g[0].dmMsg.ts)}, nothing back. Your call.`);
    did.push({ kind: 'report', who: p.name, what: labels.join(', ') });
  }

  /* briefs with nobody tagged: one line to Hemant, once */
  for (const a of r.unassigned) {
    if (hoursAgo(a.assignedAt) < UNASSIGNED_AFTER_H || sent >= MAX_PER_TICK) continue;
    if (await said('*' + label(a) + '* has nobody tagged')) continue;
    await say(DONNA, `<@${OWNER}> *${label(a)}* has nobody tagged, ${ageStr(a.assignedAt)} old <${link(a)}|↗>. Who takes it?`);
    did.push({ kind: 'unassigned', who: 'Hemant', what: label(a) });
  }

  return { report: r, did, sent };
}


/* ---------- who was tagged and never answered ---------- */
/*
 Hemant's ask, 16 Sep 2026: show every editor who was tagged in a thread (by Donnaa, a strategist,
 or anyone) and never wrote a single word back in that thread. Not about delivery, about answering.
*/
async function silent(client, days = 14) {
  const me = await self(client);
  const oldest = Math.floor(Date.now() / 1000) - days * 86400;
  const editors = new Set(ROSTER.filter((p) => p.chase || (p.role || '').startsWith('Video Editor')).map((p) => p.id));
  const tags = []; /* { user, channel, ts (thread root), at (tag ts), by, replied } */
  for (const channel of [CH.briefs, CH.neil, CH.schalk, CH.editors]) {
    let msgs = [];
    try { msgs = await history(client, channel, oldest); } catch { continue; }
    for (const m of msgs) {
      let th = [];
      try { th = m.reply_count ? (await client.conversations.replies({ channel, ts: m.ts, limit: 200 })).messages || [] : [m]; } catch { th = [m]; }
      for (const r of th) {
        const by = r.user || (r.bot_id ? me : null);
        for (const u of new Set(mentions(r.text))) {
          if (!editors.has(u) || u === by) continue;
          const replied = th.some((x) => x.user === u && sec(x.ts) > sec(r.ts));
          tags.push({ user: u, channel, ts: m.ts, at: r.ts, by, replied });
        }
      }
    }
  }
  const byUser = {};
  for (const t of tags) (byUser[t.user] = byUser[t.user] || []).push(t);
  return Object.entries(byUser).map(([user, list]) => ({
    user, name: person(user).name,
    tagged: list.length,
    answered: list.filter((t) => t.replied).length,
    silent: list.filter((t) => !t.replied).sort((a, b) => sec(a.at) - sec(b.at)),
  })).sort((a, b) => b.silent.length - a.silent.length);
}

function renderSilent(rows, days = 14) {
  const lines = [`*Tagged in a thread and never answered, last ${days} days*`];
  const who = (id) => (id === selfId ? 'Donnaa' : person(id).name);
  for (const r of rows) {
    if (!r.silent.length) { lines.push(`• ${r.name} — tagged ${r.tagged}, answered every one.`); continue; }
    const worst = r.silent[0];
    lines.push(`• *${r.name}* — tagged ${r.tagged}, answered ${r.answered}, silent on ${r.silent.length}. Oldest ${ageStr(worst.at)} (by ${who(worst.by)}) <https://slack.com/archives/${worst.channel}/p${String(worst.ts).replace('.', '')}|↗>`);
    const more = r.silent.slice(1, 4).map((t) => `${ageStr(t.at)} by ${who(t.by)} <https://slack.com/archives/${t.channel}/p${String(t.ts).replace('.', '')}|↗>`);
    if (more.length) lines.push(`    also: ${more.join(' · ')}${r.silent.length > 4 ? ` and ${r.silent.length - 4} more` : ''}`);
  }
  if (!rows.length) lines.push('Nobody on the editor list was tagged in these rooms.');
  return lines.join('\n');
}

/* ---------- editor chase from the Creative Tracker, Oct 23 2026 ---------- */
/*
 Spec from Hemant (via the cowork Claude), 23 Oct 2026. The tracker is the source of truth; Donnaa already
 logs every status change from it in #creative-accountability, one thread per concept (see tracker.js).

   When     once a day at 7am in each editor's own time zone (Slack profile). Editors only.
   Late     24h turnaround: Ready for Editing (assigned), Editing or For Revision for more than 1 day.
            Anyone on track gets nothing.
   Message  #blissta-editor-room-2-0, as Donnaa, one line per late concept: name, stage, days, ETA?
   Replies  a time ("1 hour", "30 min", "tonight") -> check again at that time + 60%; status changed ->
            nothing, else one nudge. "Almost done" with no time -> ask how much longer.
            No reply in 24h -> tag Bruce. No reply in 3 days -> Hemant in #donna, "your call".
   Summary  once a day in #blissta-ops for Bruce and Hemant: delivered today, late, stuck over 7 days.
   Rollout  CHASE_LIVE != 1 is the dry day: everything it would post goes to #donna instead.

 Railway wipes the disk on deploy, so Slack is the memory: the tracker threads, Donnaa's own messages in
 the editor room and their replies, and #donna.
*/
const TRACKER = 'C0C50D81ZUY';
const EDITOR_ROOM = process.env.CHASE_ROOM || CH.editors;
const OPS = 'C0BDMPESL5N';
const BRUCE = 'U0C1G0L4F1T';
const CHASE_HOUR = 7;
const SUMMARY_UTC_HOUR = Number(process.env.CHASE_SUMMARY_UTC_HOUR || 12);
const LATE_H = 24;
const STUCK_D = 7;
const TRACKER_DAYS = 45;
const STAGES = ['Brief Assigned', 'Ready for Editing', 'Editing', 'Awaiting Review', 'For Revision', 'Approved', 'Blocked'];
const EDITOR_STAGES = new Set(['Ready for Editing', 'Editing', 'For Revision']);
const live = () => process.env.CHASE_LIVE === '1';

const PEOPLE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'people.json'), 'utf8'));
const peopleByName = {};
for (const [k, p] of Object.entries(PEOPLE)) if (!k.startsWith('_')) for (const n of [p.name, ...(p.aka || [])]) peopleByName[n.toLowerCase()] = p.slack;

/* Tracker editor name -> Slack id: people.json first, then the Slack directory by full or display name. */
let directory = null;
async function editorId(client, name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return '';
  if (peopleByName[n]) return peopleByName[n];
  if (!directory) {
    directory = [];
    let cursor;
    do {
      const r = await client.users.list({ limit: 200, cursor });
      directory.push(...(r.members || []).filter((m) => !m.deleted && !m.is_bot));
      cursor = r.response_metadata && r.response_metadata.next_cursor;
    } while (cursor);
  }
  const hit = directory.find((m) => [m.real_name, m.profile && m.profile.real_name, m.profile && m.profile.display_name].some((x) => (x || '').trim().toLowerCase() === n));
  return hit ? hit.id : '';
}
const tzCache = {};
async function tzOf(client, user) {
  if (!(user in tzCache)) { try { tzCache[user] = (await client.users.info({ user })).user.tz || null; } catch { tzCache[user] = null; } }
  return tzCache[user];
}
function localParts(tz, at = Date.now()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(new Date(at));
  const g = (t) => f.find((x) => x.type === t).value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: Number(g('hour')) % 24 };
}

/* Every concept the tracker logged, with its stage history read back from the thread. */
async function concepts(client, now = Date.now()) {
  const oldest = Math.floor(now / 1000) - TRACKER_DAYS * 86400;
  const out = [];
  for (const root of await history(client, TRACKER, oldest)) {
    const id = ((root.text || '').match(/`(BRF-[A-Z0-9-]+)`/) || [])[1];
    if (!id || root.thread_ts && root.thread_ts !== root.ts) continue;
    const head = root.text || '';
    const c = {
      id, ts: root.ts, link: `https://slack.com/archives/${TRACKER}/p${String(root.ts).replace('.', '')}`,
      name: (((head.match(/^\*([^*]+)\*/) || [])[1] || id).split(' · ').pop()).replace(/_/g, ' ').trim(),
      editor: ((head.match(/Editor ([^·\n<]+)/) || [])[1] || '').trim(),
      events: [],
    };
    if (root.reply_count) {
      const r = await client.conversations.replies({ channel: TRACKER, ts: root.ts, limit: 200 });
      for (const m of (r.messages || []).slice(1)) {
        const st = ((m.text || '').match(/^\*([^*]+)\*/) || [])[1];
        if (STAGES.includes(st)) c.events.push({ stage: st, ts: sec(m.ts) * 1000 });
      }
    }
    const last = c.events[c.events.length - 1];
    c.stage = last ? last.stage : 'Brief Assigned';
    c.since = last ? last.ts : sec(root.ts) * 1000;
    out.push(c);
  }
  return out;
}
const days = (ms) => Math.max(1, Math.floor(ms / 86400000));
const lineFor = (c, now) => `• *${c.name}* · ${c.stage} · ${days(now - c.since)} day${days(now - c.since) === 1 ? '' : 's'} · ETA? \`${c.id}\``;

/* "30 min", "1 hour", "2h", "tonight", "eod", "tomorrow" -> when that is, else null */
function promisedAt(text, replyMs, tz) {
  const t = (text || '').toLowerCase();
  let m;
  if (/half an? hour/.test(t)) return replyMs + 30 * 60000;
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/))) return replyMs + Number(m[1]) * 60000;
  if (/\ban? (?:hour|hr)\b/.test(t)) return replyMs + 3600000;
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/))) return replyMs + Number(m[1]) * 3600000;
  const at = (h, addDay = 0) => {
    const { hour } = localParts(tz || 'UTC', replyMs);
    return replyMs + ((h - hour + 24 * addDay + 24) % 24 || (addDay ? 24 : 2)) * 3600000;
  };
  if (/\btonight\b/.test(t)) return at(21);
  if (/\b(eod|end of (?:the )?day|today)\b/.test(t)) return at(18);
  if (/\btomorrow\b/.test(t)) return at(12, 1);
  return null;
}
const ALMOST = /\b(almost|nearly|close to|finishing|wrapping up|on it|working on it|in progress)\b/i;

async function editorTick(client, { now = Date.now() } = {}) {
  const me = await self(client);
  const did = [];
  const cs = await concepts(client, now);
  for (const c of cs) c.editorId = await editorId(client, c.editor);
  const late = cs.filter((c) => EDITOR_STAGES.has(c.stage) && c.editor && now - c.since > LATE_H * 3600000);

  const oldest = Math.floor(now / 1000) - 7 * 86400;
  const room = await history(client, EDITOR_ROOM, oldest);
  const donna = await history(client, DONNA, oldest);
  const mine = (m) => isMine(m, me);
  const post = async (channel, text, thread_ts, what) => {
    if (live()) {
      try { await client.chat.postMessage(Object.assign({ channel, text, unfurl_links: false }, thread_ts ? { thread_ts } : {})); }
      catch (e) { await client.chat.postMessage({ channel: DONNA, text: `_Could not post in <#${channel}> (${e.data && e.data.error || e.message}). It said:_\n${text}`, unfurl_links: false }); }
    }
    else await client.chat.postMessage({ channel: DONNA, text: `_Dry run, would send in <#${channel}>${thread_ts ? ' (thread)' : ''}:_\n${text}`, unfurl_links: false });
    did.push(what);
  };
  const dryPosted = (needle) => donna.some((m) => mine(m) && (m.text || '').startsWith('_Dry run') && (m.text || '').includes(needle));

  /* 1. the 7am chase, once per editor per local day */
  const byEditor = {};
  for (const c of late) if (c.editorId) (byEditor[c.editorId] = byEditor[c.editorId] || []).push(c);
  for (const [user, list] of Object.entries(byEditor)) {
    const tz = await tzOf(client, user);
    if (!tz) continue;
    const { date, hour } = localParts(tz, now);
    if (hour !== CHASE_HOUR) continue;
    const marker = `<@${user}> past 24h`;
    const sameDay = (m) => localParts(tz, sec(m.ts) * 1000).date === date;
    const sentLive = room.some((m) => mine(m) && (m.text || '').startsWith(marker) && sameDay(m));
    const sentDry = donna.some((m) => mine(m) && (m.text || '').startsWith('_Dry run') && (m.text || '').includes(marker) && sameDay(m));
    if (sentLive || sentDry) continue;
    await post(EDITOR_ROOM, `${marker}:\n${list.map((c) => lineFor(c, now)).join('\n')}`, null, { kind: 'chase', user, concepts: list.map((c) => c.id) });
  }

  /* 2. follow-ups on Donnaa's chase messages from the last 3 days (live only: dry runs have no replies) */
  if (live()) {
    for (const m of room.filter((x) => mine(x) && /^<@U[A-Z0-9]+> past 24h/.test(x.text || '') && now - sec(x.ts) * 1000 < 4 * 86400000)) {
      const user = m.text.match(/^<@(U[A-Z0-9]+)>/)[1];
      const ids = [...m.text.matchAll(/`(BRF-[A-Z0-9-]+)`/g)].map((x) => x[1]);
      const mine3 = cs.filter((c) => ids.includes(c.id));
      const chasedAt = sec(m.ts) * 1000;
      const thread = m.reply_count ? ((await client.conversations.replies({ channel: EDITOR_ROOM, ts: m.ts, limit: 100 })).messages || []).slice(1) : [];
      const theirs = thread.filter((x) => x.user === user).concat(room.filter((x) => x.user === user && !x.thread_ts && sec(x.ts) * 1000 > chasedAt));
      const reply = theirs.sort((a, b) => sec(b.ts) - sec(a.ts))[0] || null;
      const already = (re) => thread.some((x) => mine(x) && re.test(x.text || ''));
      const moved = (since) => mine3.some((c) => c.since > since);
      if (reply) {
        const replyMs = sec(reply.ts) * 1000;
        const when = promisedAt(reply.text, replyMs, await tzOf(client, user));
        if (when) {
          const checkAt = replyMs + (when - replyMs) * 1.6;
          if (now >= checkAt && !moved(replyMs) && !already(/^Checking in/)) await post(EDITOR_ROOM, `Checking in <@${user}>: still showing ${mine3.map((c) => `*${c.name}* in ${c.stage}`).join(', ')}. Update?`, m.ts, { kind: 'nudge', user });
        } else if (ALMOST.test(reply.text || '') && !moved(replyMs) && !already(/How much longer/)) {
          await post(EDITOR_ROOM, `<@${user}> How much longer?`, m.ts, { kind: 'ask-time', user });
        }
        continue;
      }
      if (moved(chasedAt)) continue;
      if (now - chasedAt > 24 * 3600000 && !already(new RegExp('<@' + BRUCE + '>'))) await post(EDITOR_ROOM, `<@${BRUCE}> no reply from <@${user}> on this in 24h.`, m.ts, { kind: 'bruce', user });
      const tag = `has not answered the editor chase from ${new Date(chasedAt).toISOString().slice(0, 10)}`;
      if (now - chasedAt > 3 * 86400000 && !donna.some((x) => mine(x) && (x.text || '').includes(tag) && (x.text || '').includes(user))) {
        await post(DONNA, `<@${OWNER}> <@${user}> ${tag} (${mine3.map((c) => `*${c.name}*`).join(', ')}). Bruce was tagged after 24h. Your call. <https://slack.com/archives/${EDITOR_ROOM}/p${String(m.ts).replace('.', '')}|↗>`, null, { kind: 'report', user });
      }
    }
  }

  /* 3. daily summary for Bruce and Hemant */
  const today = new Date(now).toISOString().slice(0, 10);
  const sumMarker = `*Editor summary, ${today}*`;
  const opsToday = live() ? await history(client, OPS, Math.floor(now / 1000) - 86400) : [];
  if (new Date(now).getUTCHours() === SUMMARY_UTC_HOUR && !opsToday.some((m) => mine(m) && (m.text || '').startsWith(sumMarker)) && !dryPosted(sumMarker)) {
    const dayAgo = now - 86400000;
    const delivered = cs.filter((c) => c.events.some((e) => e.ts > dayAgo && (e.stage === 'Awaiting Review' || e.stage === 'Approved')));
    const stuck = cs.filter((c) => !['Approved'].includes(c.stage) && now - c.since > STUCK_D * 86400000);
    const who = (c) => (c.editorId ? `<@${c.editorId}>` : c.editor || 'no editor');
    const lines = [sumMarker, `<@${BRUCE}> <@${OWNER}>`,
      `*Delivered (last 24h): ${delivered.length}*`, ...delivered.map((c) => `• ${c.name} · ${who(c)} · ${c.stage}`),
      `*Late (over 24h in an editor stage): ${late.length}*`, ...late.map((c) => `• ${c.name} · ${who(c)} · ${c.stage} ${days(now - c.since)}d`),
      `*Stuck over ${STUCK_D} days: ${stuck.length}*`, ...stuck.map((c) => `• ${c.name} · ${who(c)} · ${c.stage} ${days(now - c.since)}d <${c.link}|↗>`)];
    const noId = [...new Set(late.filter((c) => !c.editorId).map((c) => c.editor))];
    if (noId.length) lines.push(`_Not chased, no Slack match for: ${noId.join(', ')}. Add them to bot/data/people.json._`);
    await post(OPS, lines.join('\n'), null, { kind: 'summary', delivered: delivered.length, late: late.length, stuck: stuck.length });
  }
  return { did, late: late.length, concepts: cs.length };
}

module.exports = { collect, renderOpenList, tick: editorTick, editorTick, legacyTick, silent, renderSilent, CH, person, tokens, names, _t: { promisedAt, localParts, concepts, lineFor } };
