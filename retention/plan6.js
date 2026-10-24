// Six-month cash plan: rebills from the subscribers we already have, plus new customers each
// month at a cost cap, under a few retention / order-value scenarios. Read-only.
//
//   Rebill pay rates are per rebill (1st, 2nd, 3rd and later), by bottles per box.
//   "today" comes from Corvael's measured rates on Oct 18; the others are targets.
//   Profit = revenue x (1 - COGS_SHARE) - ad spend. Before fees, team and fixed costs.
//
// Run: NODE_USE_ENV_PROXY=1 node retention/plan6.js
const { queryAll } = require('./cc');

const CAMPAIGN = 3;
const COGS_SHARE = 0.15;
const NEW_PER_MONTH = 3000;
const CAC = 85;
const SUBSCRIBE = 0.94; // share of new customers who take the subscription
const MIX = { 1: 0.17, 3: 0.37, 5: 0.46 }; // bottles per box, recent first orders
const EVERY = { 1: 28, 3: 56, 5: 84 };
const PRICE = { 1: 28, 3: 65, 5: 95 }; // average net rebill by box size
const MONTHS = ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04'];
// growth: ad spend each month = last month's spend x (1 + growth). cac: cost per new customer.
const TODAY = { 1: [0.76, 0.71, 0.71], 3: [0.64, 0.28, 0.7], 5: [0.74, 0.28, 0.7] };
const PLUS10 = { 1: [0.86, 0.81, 0.81], 3: [0.74, 0.38, 0.8], 5: [0.84, 0.38, 0.8] };
const FIXED = { 1: [0.86, 0.81, 0.81], 3: [0.8, 0.6, 0.8], 5: [0.84, 0.6, 0.8] };
const SCENARIOS = process.argv.includes('--grow') ? {
  'Grow 1: $85 cap, spend +20% a month, $105 order, +10 pts': { aov: 105, cac: 85, growth: 0.2, rates: PLUS10 },
  'Grow 2: $100 cap, spend +35% a month, $110 order, 2nd rebill fixed': { aov: 110, cac: 100, growth: 0.35, rates: FIXED },
} : {
  'Today': { aov: 98, rates: TODAY },
  'Plan: $105 order, +10 pts': { aov: 105, rates: PLUS10 },
  'Stretch: $115 order, 2nd rebill fixed': { aov: 115, rates: FIXED },
};

const day = 864e5;
const ok = (t) => t.responseType === 'SUCCESS' && Number(t.totalAmount) > 0;
const box = (q) => (q >= 4 ? 5 : q >= 2 ? 3 : 1);
const monthOf = (t) => new Date(t).toISOString().slice(0, 7);
const rate = (r, n) => r[Math.min(n - 1, r.length - 1)];

async function main() {
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const end = new Date(Date.UTC(2027, 4, 1));
  const all = await queryAll('purchase/query', { start: new Date('2026-05-01'), end: today, campaignId: CAMPAIGN, windowDays: 5 });
  const live = all.filter((r) => ['ACTIVE', 'RECYCLE_BILLING'].includes(r.status) && !Number(r.cancellationScheduled) && r.nextBillDate && new Date(r.nextBillDate) >= today);

  for (const [name, s] of Object.entries(SCENARIOS)) {
    const rows = Object.fromEntries(MONTHS.map((m) => [m, { fresh: 0, spend: 0, first: 0, newRebills: 0, baseRebills: 0 }]));
    // Subscribers we already have: each future rebill counts at the chance they are still paying by then.
    for (const r of live) {
      const b = box(Number(r.productQty) || 1);
      const paid = Math.max(0, r.transactions.filter(ok).length - 1);
      let alive = 1;
      for (let n = paid + 1, t = new Date(r.nextBillDate + 'T00:00:00Z').getTime(); t < end.getTime(); n++, t += Number(r.billingIntervalDays) * day) {
        alive *= rate(s.rates[b], n) * (r.status === 'RECYCLE_BILLING' && n === paid + 1 ? 0.15 : 1);
        if (rows[monthOf(t)]) rows[monthOf(t)].baseRebills += alive * Number(r.price);
      }
    }
    // New customers, signed up through each month.
    MONTHS.forEach((m, i) => {
      const cac = s.cac || CAC;
      const fresh = Math.round(((NEW_PER_MONTH * CAC) * Math.pow(1 + (s.growth || 0), i)) / cac);
      rows[m].fresh = fresh;
      rows[m].spend = fresh * cac;
      rows[m].first = fresh * s.aov;
      for (const b of [1, 3, 5]) {
        let alive = 1;
        for (let n = 1; ; n++) {
          const j = i + Math.round((n * EVERY[b]) / 30.4);
          if (j >= MONTHS.length) break;
          alive *= rate(s.rates[b], n);
          rows[MONTHS[j]].newRebills += rows[m].fresh * SUBSCRIBE * MIX[b] * alive * PRICE[b];
        }
      }
    });
    let cum = 0;
    console.log(`\n${name}`);
    for (const m of MONTHS) {
      const x = rows[m];
      const revenue = x.first + x.newRebills + x.baseRebills;
      const profit = revenue * (1 - COGS_SHARE) - x.spend;
      cum += profit;
      console.log(`${m}  new ${x.fresh}  ad spend $${Math.round(x.spend / 1000)}k  revenue $${Math.round(revenue / 1000)}k (first orders ${Math.round(x.first / 1000)}k, new rebills ${Math.round(x.newRebills / 1000)}k, existing base ${Math.round(x.baseRebills / 1000)}k)  profit $${Math.round(profit / 1000)}k  running $${Math.round(cum / 1000)}k`);
    }
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
