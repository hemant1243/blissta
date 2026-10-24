// One-off fix for the old "70-DAY" subscriptions that renew at $400-$600.
// Approved by Hemant 13 Oct 2026: renew every 84 days, at $19.99 a bottle,
// next charge = last successful charge + 84 days. List: fix_55_overpriced.csv.
//
// Dry run (default) prints what would change. --apply sends the updates.
// Run: NODE_USE_ENV_PROXY=1 node retention/fix_55.js [--apply]
const fs = require('fs');
const path = require('path');
const { call } = require('./cc');

const mdY = (iso) => { const [y, m, d] = iso.split('-'); return `${m}/${d}/${y}`; };

async function main() {
  const apply = process.argv.includes('--apply');
  const [head, ...lines] = fs.readFileSync(path.join(__dirname, 'fix_55_overpriced.csv'), 'utf8').trim().split('\n');
  const cols = head.split(',');
  const rows = lines.map((l) => {
    // product names have no commas except inside quotes
    const vals = l.match(/("[^"]*"|[^,]+)/g).map((v) => v.replace(/^"|"$/g, ''));
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });

  for (const r of rows) {
    const now = (await call('purchase/query', { purchaseId: r.purchaseId })).data[0];
    if (!now || !['ACTIVE', 'RECYCLE_BILLING'].includes(now.status)) { console.log(r.purchaseId, 'skip: status', now && now.status); continue; }
    if (Number(now.price) <= Number(r.new_price)) { console.log(r.purchaseId, 'skip: already fixed'); continue; }
    console.log(r.purchaseId, `$${now.price} every ${now.billingIntervalDays}d next ${now.nextBillDate}  ->  $${r.new_price} every ${r.new_every}d next ${r.new_next}`);
    if (!apply) continue;
    await call('purchase/update', { purchaseId: r.purchaseId, price: r.new_price, billingIntervalDays: r.new_every, nextBillDate: mdY(r.new_next) });
    const after = (await call('purchase/query', { purchaseId: r.purchaseId })).data[0];
    console.log('   now', `$${after.price} every ${after.billingIntervalDays}d next ${after.nextBillDate}`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
