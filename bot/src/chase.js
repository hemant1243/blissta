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

/* One pass. Returns what it did so the caller can log it. */
async function tick(client, { dryRun = false } = {}) {
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

module.exports = { collect, renderOpenList, tick, CH, person, tokens, names };
