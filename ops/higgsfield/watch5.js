// 5-minute Higgsfield watch with memory. Every clip we see is remembered (prompt + link), so when
// someone deletes it we still have the proof. Also flags paid spends that never showed up as a clip.
// Usage: node watch5.js <state.json> <transactions.json> <generations.json>
const fs = require('fs');
const [stateFile, txFile, genFile] = process.argv.slice(2);
const load = f => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return j.items || j; };
const fam = s => (s || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ')[0];
const st = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { seen: {}, alerted: {} };
const now = Date.now();

const gens = load(genFile).map(g => ({
  id: g.id, model: g.model, status: g.status, fam: fam(g.model), ts: Math.round(g.createdAt * 1000),
  prompt: String(g.params?.prompt || (g.params?.multi_prompt || []).map(p => p.prompt || p).join(' | ') || '').slice(0, 300),
  url: g.results?.rawUrl || null,
}));
const ids = new Set(gens.map(g => g.id));
const oldest = Math.min(...gens.map(g => g.ts));

// 1. clips we saw before that are gone now = deleted (with proof)
const deleted = [];
for (const [id, g] of Object.entries(st.seen)) {
  if (g.ts >= oldest && !ids.has(id) && !g.gone) { g.gone = now; deleted.push(g); }
}
// 2. remember new clips; list the new prompts for an off-brand check
const fresh = [];
for (const g of gens) {
  const old = st.seen[g.id];
  if (!old) fresh.push(g);
  st.seen[g.id] = { ...old, ...g, url: g.url || old?.url || null };
}
// 3. spends with no clip (made and deleted before we ever saw it), older than 10 min, not yet reported
const tx = load(txFile).map(t => ({ ...t, ts: Date.parse(t.created_at), fam: fam(t.display_name) }));
const all = Object.values(st.seen);
const used = new Set();
// match tight first (spend and job are usually <1s apart), then loosen, so one miss can't cascade
let left = tx.filter(t => t.action === 'spend' && now - t.ts >= 10 * 60e3 && t.ts >= oldest && !st.alerted[t.created_at])
  .sort((a, b) => a.ts - b.ts);
for (const tol of [5e3, 30e3, 150e3]) {
  left = left.filter(s => {
    let best = null;
    for (const g of all) {
      if (used.has(g.id) || g.fam !== s.fam) continue;
      const d = Math.abs(g.ts - s.ts);
      if (d <= tol && (!best || d < Math.abs(best.ts - s.ts))) best = g;
    }
    if (best) { used.add(best.id); return false; } // a clip we caught being deleted is already in `deleted`
    return true;
  });
}
const ghost = left;
for (const s of ghost) st.alerted[s.created_at] = now;
// forget anything older than 3 days
for (const [id, g] of Object.entries(st.seen)) if (now - g.ts > 3 * 864e5) delete st.seen[id];
for (const [k, v] of Object.entries(st.alerted)) if (now - v > 3 * 864e5) delete st.alerted[k];
fs.writeFileSync(stateFile, JSON.stringify(st));

const t = ms => ({
  pkt: new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
  et: new Date(ms).toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }),
});
const credits = s => Math.abs(s.credits);
console.log(JSON.stringify({
  deleted: deleted.map(g => ({ ...t(g.ts), model: g.model, prompt: g.prompt.slice(0, 150), link: g.url })),
  paid_no_clip: ghost.map(s => ({ ...t(s.ts), model: s.display_name, credits: credits(s) })),
  paid_no_clip_credits: ghost.reduce((n, s) => n + credits(s), 0),
  new_prompts: fresh.filter(g => g.prompt).map(g => ({ ...t(g.ts), model: g.model, prompt: g.prompt.slice(0, 120), id: g.id })),
}));
