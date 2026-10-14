// Merge separate show_generations results (e.g. type=image and type=video) into one list for watch5.js.
// The unfiltered feed silently leaves items out, so the watch reads each type on its own.
// Items older than the newest of the per-file horizons are dropped, so one short feed can't fake deletes.
// Usage: node merge.js <out.json> <gens1.txt> <gens2.txt> ...
const fs = require('fs');
const [out, ...files] = process.argv.slice(2);
const lists = files.map(f => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return j.items || j; });
const horizon = Math.max(...lists.map(l => Math.min(...l.map(g => g.createdAt))));
const byId = new Map();
for (const l of lists) for (const g of l) if (g.createdAt >= horizon) byId.set(g.id, g);
fs.writeFileSync(out, JSON.stringify({ items: [...byId.values()] }));
console.error(`merged ${byId.size} items since ${new Date(horizon * 1000).toISOString()}`);
