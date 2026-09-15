'use strict';
/*
 Lets Donnaa read Slack when the owner asks "what is going on in #channel" or "what happened in
 Slack today". Pulls recent messages (and thread replies) and returns a plain transcript the model
 can answer from. She must be a member of a channel to read it; public channels she joins herself.
*/
const names = new Map();
async function name(client, id) {
  if (!id) return 'someone';
  if (names.has(id)) return names.get(id);
  let n = id;
  try { const r = await client.users.info({ user: id }); n = (r.user && (r.user.real_name || r.user.name)) || id; } catch { /* keep id */ }
  names.set(id, n);
  return n;
}

const when = (ts) => new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(Number(ts) * 1000));

async function ensureMember(client, channel) {
  try { const i = await client.conversations.info({ channel }); if (i.channel && i.channel.is_member) return { ok: true, name: i.channel.name }; if (i.channel && !i.channel.is_private) { await client.conversations.join({ channel }); return { ok: true, name: i.channel.name }; } return { ok: false, name: i.channel && i.channel.name, why: 'private and I am not in it. Type: invite @Donnaa to #' + (i.channel && i.channel.name) }; }
  catch (e) { return { ok: false, why: (e.data && e.data.error) || e.message }; }
}

/* One channel, last `hours`, top level plus thread replies, oldest first. Capped. */
async function channelDigest(client, channel, hours, cap = 150) {
  const m = await ensureMember(client, channel);
  if (!m.ok) return { text: '', error: m.why, name: m.name };
  const oldest = String(Date.now() / 1000 - hours * 3600);
  const out = [];
  let cursor, n = 0;
  do {
    const r = await client.conversations.history({ channel, oldest, limit: 200, cursor });
    for (const msg of (r.messages || []).reverse()) {
      if (msg.subtype && msg.subtype !== 'thread_broadcast') continue;
      const who = msg.bot_id ? (msg.username || 'Donnaa') : await name(client, msg.user);
      out.push(`[${when(msg.ts)}] ${who}: ${(msg.text || '').replace(/\s+/g, ' ').slice(0, 800)}${msg.files ? ' (attached ' + msg.files.length + ' file)' : ''}`);
      n++;
      if (msg.reply_count) {
        try {
          const t = await client.conversations.replies({ channel, ts: msg.ts, limit: 40 });
          for (const rep of (t.messages || []).slice(1)) {
            if (rep.subtype) continue;
            const w = rep.bot_id ? 'Donnaa' : await name(client, rep.user);
            out.push(`    ↳ [${when(rep.ts)}] ${w}: ${(rep.text || '').replace(/\s+/g, ' ').slice(0, 600)}`);
            n++;
          }
        } catch { /* fine */ }
      }
      if (n >= cap) break;
    }
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor && n < cap);
  return { text: out.join('\n'), name: m.name, count: n };
}

/* Every channel she is in, last `hours`, top level only. */
async function workspaceDigest(client, hours, skip = new Set()) {
  const oldest = String(Date.now() / 1000 - hours * 3600);
  const chunks = [];
  let cursor;
  do {
    const r = await client.conversations.list({ types: 'public_channel,private_channel', exclude_archived: true, limit: 200, cursor });
    for (const c of r.channels || []) {
      if (!c.is_member || skip.has(c.id)) continue;
      let h;
      try { h = await client.conversations.history({ channel: c.id, oldest, limit: 60 }); } catch { continue; }
      const lines = [];
      for (const msg of (h.messages || []).reverse()) {
        if (msg.subtype) continue;
        const who = msg.bot_id ? 'Donnaa' : await name(client, msg.user);
        lines.push(`[${when(msg.ts)}] ${who}: ${(msg.text || '').replace(/\s+/g, ' ').slice(0, 400)}${msg.reply_count ? ' (' + msg.reply_count + ' replies)' : ''}`);
      }
      if (lines.length) chunks.push(`#${c.name}\n${lines.join('\n')}`);
    }
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  return chunks.join('\n\n');
}

/* Does this message ask to read Slack? Returns { channel|null, hours } or null. */
function wants(text) {
  const t = text.toLowerCase();
  const asks = /\b(what('s| is| was| are| were)?\s*(going on|happening|new|up|the (update|activity|activities|latest|news))|activit|summar|catch me up|recap|read|update me|what did|what have|any (update|news)|check (on|the|what))\b/.test(t);
  const ch = text.match(/<#([A-Z0-9]+)(?:\|[^>]*)?>/);
  const slacky = /\b(slack|channel|thread|team|everyone|people|editors?)\b/.test(t);
  if (!asks || (!ch && !slacky)) return null;
  let hours = 24;
  const h = t.match(/last\s+(\d+)\s*h/); const d = t.match(/last\s+(\d+)\s*day/);
  if (h) hours = Number(h[1]); else if (d) hours = Number(d[1]) * 24;
  else if (/\bweek\b/.test(t)) hours = 168; else if (/yesterday/.test(t)) hours = 48;
  return { channel: ch ? ch[1] : null, hours };
}

module.exports = { channelDigest, workspaceDigest, wants };
