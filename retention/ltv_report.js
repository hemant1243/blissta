// Customer value by first-order month, and the most you can pay for a customer.
//
//   Value at day N = what a customer paid us in their first N days, net of refunds,
//   averaged over customers old enough to have reached day N.
//   Profit = value x (1 - COGS_SHARE). COGS_SHARE is product + shipping as a share of price.
//   Max CAC to break even by day N = profit at day N.
//
// Also counts new customers (first paid order) in the last 30 days and their day-1 order value,
// to divide Meta spend by. Saves the totals to history/ltv-<date>.json so a later run can compare
// the same cohorts.
//
// Run: NODE_USE_ENV_PROXY=1 node retention/ltv_report.js [cac]
const fs = require('fs');
const path = require('path');
const { queryAll } = require('./cc');

const CAMPAIGN = 3;
const COGS_SHARE = 0.15; // Hemant, 18 Oct 2026: $6-8 a bottle landed + $5-7 shipping per order
const DAYS = [0, 30, 60, 90, 120];
const MIN = 50; // fewer customers than this at a day mark: not shown
const day = 864e5;

const ok = (t) => t.responseType === 'SUCCESS' && Number(t.totalAmount) > 0;
const when = (s) => new Date(String(s).replace(' ', 'T') + 'Z');

async function main() {
  const cac = Number(process.argv[2]) || null;
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const all = await queryAll('purchase/query', { start: new Date('2026-05-01'), end: today, campaignId: CAMPAIGN, windowDays: 5 });

  const people = new Map();
  for (const r of all) for (const t of r.transactions.filter(ok)) {
    const p = people.get(r.customerId) || { first: null, pays: [] };
    const at = when(t.txnDate);
    p.pays.push([at, Number(t.totalAmount) - (Number(t.amountRefunded) || 0)]);
    if (!p.first || at < p.first) p.first = at;
    people.set(r.customerId, p);
  }

  const cohorts = {};
  for (const p of people.values()) {
    const k = p.first.toISOString().slice(0, 7);
    const c = (cohorts[k] = cohorts[k] || { customers: 0, value: DAYS.map(() => 0), reached: DAYS.map(() => 0) });
    c.customers++;
    const age = (today - p.first) / day;
    DAYS.forEach((d, i) => {
      if (age < Math.max(d, 1)) return;
      c.reached[i]++;
      c.value[i] += p.pays.filter(([at]) => (at - p.first) / day < d + 1).reduce((s, [, v]) => s + v, 0);
    });
  }
  const table = Object.entries(cohorts).sort().map(([k, c]) => ({
    cohort: k, customers: c.customers,
    value: DAYS.map((d, i) => (c.reached[i] >= MIN ? Math.round(c.value[i] / c.reached[i]) : null)),
  }));

  const since = new Date(today.getTime() - 30 * day);
  const fresh = [...people.values()].filter((p) => p.first >= since && p.first < today);
  const day1 = fresh.reduce((s, p) => s + p.pays.filter(([at]) => at - p.first < day).reduce((a, [, v]) => a + v, 0), 0);
  const out = {
    date: today.toISOString().slice(0, 10), cogsShare: COGS_SHARE, days: DAYS, table,
    newCustomers30d: { from: since.toISOString().slice(0, 10), count: fresh.length, day1Value: fresh.length ? Math.round(day1 / fresh.length) : null },
  };
  fs.mkdirSync(path.join(__dirname, 'history'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'history', `ltv-${out.date}.json`), JSON.stringify(out, null, 2) + '\n');

  const m = 1 - COGS_SHARE;
  console.log(`Value per customer, net of refunds (profit after ${COGS_SHARE * 100}% product + shipping)`);
  for (const t of table) console.log(`${t.cohort}  ${t.customers} customers  ` + t.value.map((v, i) => `day ${DAYS[i]}: ${v == null ? '--' : `$${v} ($${Math.round(v * m)})`}`).join('  '));
  console.log(`New customers last 30 days: ${fresh.length}, day-1 value $${out.newCustomers30d.day1Value}`);
  if (cac) for (const t of table) console.log(`${t.cohort} at CAC $${cac}: ` + t.value.map((v, i) => (v == null ? '' : `day ${DAYS[i]} ${((v * m) / cac).toFixed(2)}x`)).filter(Boolean).join(', '));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
