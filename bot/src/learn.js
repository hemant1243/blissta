'use strict';
/*
 Nightly learning pass.

 Reads the threads from the last day where Donnaa answered and a person replied after her, asks the
 model whether that person corrected her or stated a Blissta fact she did not have, and posts each
 one into the memory channel as "proposed: ..." for an owner to approve with a thumbs up. Nothing
 becomes memory until an owner reacts.
*/
const { quick } = require('./answer');
const { getMemory } = require('./brain');

const WINDOW_H = Number(process.env.LEARN_WINDOW_H || 26);

async function channelsIn(client) {
  const out = [];
  let cursor;
  do {
    const r = await client.conversations.list({ types: 'public_channel,private_channel', exclude_archived: true, limit: 200, cursor });
    for (const c of r.channels || []) if (c.is_member) out.push(c);
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  return out;
}

/* Threads with a bot reply and a human reply after it, touched inside the window. */
async function threads(client, botId, skipChannel) {
  const since = Date.now() / 1000 - WINDOW_H * 3600;
  const found = [];
  for (const c of await channelsIn(client)) {
    if (c.id === skipChannel) continue;
    let r;
    try { r = await client.conversations.history({ channel: c.id, oldest: String(since - 7 * 86400), limit: 200 }); } catch { continue; }
    for (const p of r.messages || []) {
      if (!p.reply_count || Number(p.latest_reply || 0) < since) continue;
      let t;
      try { t = await client.conversations.replies({ channel: c.id, ts: p.ts, limit: 60 }); } catch { continue; }
      const msgs = (t.messages || []).filter((m) => m.text && !m.subtype);
      const firstBot = msgs.findIndex((m) => m.user === botId || m.bot_id);
      if (firstBot < 0) continue;
      const humanAfter = msgs.slice(firstBot + 1).some((m) => !m.bot_id && m.user !== botId && Number(m.ts) >= since);
      if (!humanAfter) continue;
      found.push({ channel: c.id, ts: p.ts, msgs });
    }
  }
  return found;
}

const transcript = (msgs, botId) => msgs.map((m) => ((m.user === botId || m.bot_id) ? 'Donnaa' : '<@' + m.user + '>') + ': ' + m.text.replace(/\s+/g, ' ').slice(0, 1500)).join('\n');

const SYSTEM = `You review Slack threads between Donnaa, the operator bot of Blissta (a supplement ecommerce company), and its team. Find statements made by a person, not by Donnaa, that either correct something Donnaa said or state a durable fact about Blissta that is not already in the memory list. Durable means it stays true next month: products, prices, guarantees, doses, people and roles, rules, processes, tools. Skip tasks, requests, opinions, one-off status, and anything already in memory or already proposed. Write each fact as one standalone line starting with "FACT: ", in plain words, no names of who said it. If there is nothing, write exactly NONE.`;

/* memoryChannel: where to post. known: Set of lowercased facts and pending proposals, to avoid repeats. */
async function run(client, botId, memoryChannel, known) {
  if (!memoryChannel) return { proposed: 0, threads: 0 };
  const list = await threads(client, botId, memoryChannel);
  let proposed = 0;
  const knownText = [...getMemory(), ...known].map((l) => '- ' + l).join('\n') || '- (empty)';
  for (const th of list) {
    let out;
    try { out = await quick({ system: SYSTEM, text: 'MEMORY AND PENDING PROPOSALS:\n' + knownText + '\n\nTHREAD:\n' + transcript(th.msgs, botId) }); }
    catch (e) { console.error('[learn] model failed:', e.message); continue; }
    for (const line of out.split('\n')) {
      const m = line.match(/^\s*FACT:\s*(.+)$/);
      if (!m) continue;
      const fact = m[1].trim();
      if (!fact || known.has(fact.toLowerCase())) continue;
      known.add(fact.toLowerCase());
      const link = `https://slack.com/archives/${th.channel}/p${th.ts.replace('.', '')}`;
      await client.chat.postMessage({ channel: memoryChannel, text: `proposed: ${fact}\n_from a thread in <#${th.channel}>, <${link}|open it>. React :+1: to make this memory._` });
      proposed++;
    }
  }
  return { proposed, threads: list.length };
}

module.exports = { run };
