// Scheduled rebill revenue by month: every live subscription's next charge, then every
// charge after it at its interval, up to the end month. Read-only.
//
// Run: NODE_USE_ENV_PROXY=1 node retention/forecast.js [2027-01]
const { queryAll } = require('./cc');

const CAMPAIGN = 3;
const day = 864e5;
const LIVE = new Set(['ACTIVE', 'RECYCLE_BILLING']);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function main() {
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const [y, m] = (process.argv[2] || '2027-01').split('-').map(Number);
  const end = new Date(Date.UTC(y, m, 1)); // first day after the end month
  const all = await queryAll('purchase/query', { start: new Date('2026-05-01'), end: today, campaignId: CAMPAIGN, windowDays: 5 });
  const live = all.filter((r) => LIVE.has(r.status) && !Number(r.cancellationScheduled) && r.nextBillDate);
  const by = new Map();
  let overdue = 0, overdueDollars = 0;
  for (const r of live) {
    const every = Number(r.billingIntervalDays) * day;
    let d = new Date(r.nextBillDate + 'T00:00:00Z');
    if (d < today) { overdue++; overdueDollars += Number(r.price); continue; } // past date: CC is retrying or stuck, not counted
    for (; d < end; d = new Date(d.getTime() + every)) {
      const k = d.toISOString().slice(0, 7);
      const v = by.get(k) || { charges: 0, dollars: 0, subs: new Set() };
      v.charges++; v.dollars += Number(r.price); v.subs.add(r.purchaseId);
      by.set(k, v);
    }
  }
  console.log(`Live subscriptions: ${live.length.toLocaleString()} (from ${today.toISOString().slice(0, 10)})`);
  for (const [k, v] of [...by].sort()) console.log(`${MONTHS[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}: $${Math.round(v.dollars).toLocaleString()} scheduled, ${v.charges.toLocaleString()} charges`);
  console.log(`Not counted: ${overdue} with a charge date already past ($${Math.round(overdueDollars).toLocaleString()})`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
