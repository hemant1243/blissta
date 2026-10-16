// Join several pages of Higgsfield `transactions` results into one list (newest first, no duplicates).
// Usage: node txmerge.js <out.json> <page1.json> <page2.json> ...
const fs = require('fs');
const [out, ...files] = process.argv.slice(2);
const seen = new Set(), items = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const t of j.items || j) {
    const k = t.created_at + '|' + t.credits + '|' + t.action;
    if (!seen.has(k)) { seen.add(k); items.push(t); }
  }
}
items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
fs.writeFileSync(out, JSON.stringify({ items }));
console.error(`${items.length} transactions, oldest ${items.length ? items[items.length - 1].created_at : '-'}`);
