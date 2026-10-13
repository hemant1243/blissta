// Higgsfield credit watch: match credit spends to generations that still exist.
// Spends with no matching generation = made then deleted.
// Usage: node watch.js <transactions.json> <generations.json>[,more.json] [fromISO] [toISO]
const fs = require('fs');
const [txFile, genFiles, fromArg, toArg] = process.argv.slice(2);
const now = Date.now();
const from = fromArg ? Date.parse(fromArg) : now - 2 * 3600e3;
const to = toArg ? Date.parse(toArg) : now - 20 * 60e3;
const TOL = 150e3; // spend and generation within 2.5 min

const load = f => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return j.items || j; };
const fam = s => (s || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ')[0];

const tx = load(txFile).map(t => ({ ...t, ts: Date.parse(t.created_at), fam: fam(t.display_name) }));
const gens = genFiles.split(',').flatMap(load).map(g => ({
  id: g.id, model: g.model, status: g.status, fam: fam(g.model),
  ts: g.createdAt * 1000, // a batch of 2 shows as 2 items, one spend each
  prompt: (g.params?.prompt || g.params?.multi_prompt?.map?.(p => p.prompt || p).join(' | ') || '').toString(),
  url: g.results?.rawUrl || null,
}));

const inWin = t => t.ts >= from && t.ts <= to;
let spends = tx.filter(t => t.action === 'spend' && inWin(t));
// a refund cancels the nearest earlier same-family spend of the same size
for (const r of tx.filter(t => t.action === 'refund' && inWin(t))) {
  const i = spends.findIndex(s => s.fam === r.fam && Math.abs(s.credits) === Math.abs(r.credits) && s.ts <= r.ts);
  if (i >= 0) spends.splice(i, 1);
}
// match tight first (spend and job are usually <1s apart), then loosen, so one miss can't cascade
const pool = gens.map(g => ({ ...g, used: false }));
let left = spends.sort((a, b) => a.ts - b.ts);
for (const tol of [5e3, 30e3, TOL]) {
  left = left.filter(s => {
    let best = null;
    for (const g of pool) {
      if (g.used || g.fam !== s.fam) continue;
      const d = Math.abs(g.ts - s.ts);
      if (d <= tol && (!best || d < Math.abs(best.ts - s.ts))) best = g;
    }
    if (best) { best.used = true; return false; }
    return true;
  });
}
const unmatched = left;
const VIDEO = /kling|seedance|veo|sora|wan|hailuo|minimax|marketing|higgsfield|lipsync|dop/i;
const windowGens = gens.filter(g => g.ts >= from - TOL && g.ts <= to + TOL);
const et = ms => new Date(ms).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const pk = ms => new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit' });
const sum = a => a.reduce((n, s) => n + Math.abs(s.credits), 0);
const oldestGen = Math.min(...gens.map(g => g.ts));
console.log(JSON.stringify({
  window: { from: new Date(from).toISOString(), to: new Date(to).toISOString(), et: `${et(from)} - ${et(to)}` },
  coverage_ok: oldestGen <= from - TOL,
  spent: sum(spends), deleted_credits: sum(unmatched), spends: spends.length,
  unmatched: unmatched.map(s => ({ utc: s.created_at, et: et(s.ts), pkt: pk(s.ts), model: s.display_name, credits: Math.abs(s.credits) })),
  biggest_unmatched: Math.max(0, ...unmatched.map(s => Math.abs(s.credits))),
  deleted_video_credits: sum(unmatched.filter(s => VIDEO.test(s.display_name))),
  prompts: [...new Map(windowGens.filter(g => g.prompt).map(g => [g.prompt.slice(0, 200), { et: et(g.ts), model: g.model, prompt: g.prompt.slice(0, 200), url: g.url }])).values()],
}, null, 1));
