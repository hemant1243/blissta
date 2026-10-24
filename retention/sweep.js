// Subscription sweep, Hemant's rules (18 Oct 2026):
//   Interval   1 bottle = 28 days, 2-3 bottles = 56, 4+ bottles = 84. Never above 84.
//   Price      rebill = first-order price per bottle x bottles. Only ever goes down.
//   Next date  last payment + new interval, but never earlier than the date already on the
//              subscription. Computed date in the past and no current date: today + 14 days.
//
//   node retention/sweep.js                 plan only: out/sweep-plan-<date>.csv, changes nothing
//   node retention/sweep.js --no-shorter    same, but never shortens an interval
//   node retention/sweep.js --apply 5       change the next 5 from the newest plan, re-read each
//   node retention/sweep.js --apply all     change the rest
//   ... --apply all --plan <file>           apply a different plan file (same checks)
//   node retention/sweep.js --export        everyone changed: email, product, new price, new date
//
// Before each change the subscription is re-read; if it no longer matches the plan it is skipped.
// Every change is appended to out/sweep-applied.jsonl (before, sent, after).
// Run with NODE_USE_ENV_PROXY=1 (Checkout Champ only accepts the whitelisted IPs).
const fs = require('fs');
const path = require('path');
const { call, queryAll } = require('./cc');

const CAMPAIGN = 3;
const OUT = path.join(__dirname, 'out');
const LOG = path.join(OUT, 'sweep-applied.jsonl');
const day = 864e5;
const ACTIVE = new Set(['ACTIVE', 'RECYCLE_BILLING']);
// A first order under this per bottle was a trial or a giveaway, not a price to copy.
const LOW_FIRST = 15;
const NO_SHORTER = process.argv.includes('--no-shorter');

const ok = (t) => t.responseType === 'SUCCESS' && Number(t.totalAmount) > 0;
const iso = (d) => d.toISOString().slice(0, 10);
const cents = (n) => Math.round(Number(n) * 100);
const money = (c) => (c / 100).toFixed(2);
const mdY = (s) => { const [y, m, d] = s.split('-'); return `${m}/${d}/${y}`; };
const intervalFor = (bottles) => (bottles >= 4 ? 84 : bottles >= 2 ? 56 : 28);

function plan(r, today) {
  const bottles = Number(r.productQty) || 1;
  const paid = r.transactions.filter(ok).sort((a, b) => (a.txnDate < b.txnDate ? -1 : 1));
  if (!paid.length) return null;
  const firstPerBottle = Math.floor(cents(paid[0].totalAmount) / bottles); // round down: never above what they paid
  const curPrice = cents(r.price);
  const curEvery = Number(r.billingIntervalDays);
  const curNext = r.nextBillDate || null;

  // --no-shorter: never charge more often than the plan they bought, even if it is above 84 days.
  const newEvery = NO_SHORTER ? Math.max(intervalFor(bottles), curEvery) : intervalFor(bottles);
  // A $1 trial first order is not a price; those keep their current price.
  const lowFirst = firstPerBottle < LOW_FIRST * 100;
  const newPrice = lowFirst ? curPrice : Math.min(curPrice, firstPerBottle * bottles);
  const last = new Date(paid[paid.length - 1].txnDate.slice(0, 10) + 'T00:00:00Z');
  let newNext = iso(new Date(last.getTime() + newEvery * day));
  let note = [];
  if (curNext && newNext < curNext) newNext = curNext; // never move a charge earlier
  if (newNext < iso(today)) {
    if (!curNext) newNext = iso(new Date(today.getTime() + 14 * day));
    else note.push('current date already in the past');
  }
  if (lowFirst) note.push(`first order only $${money(firstPerBottle)}/bottle, price kept`);
  if (newEvery < curEvery) note.push('charged more often than now');

  const changes = [];
  if (newEvery !== curEvery) changes.push('interval');
  if (newPrice !== curPrice) changes.push('price');
  if (newNext !== curNext) changes.push('date');
  if (!changes.length) return null;
  return {
    purchaseId: r.purchaseId, email: r.emailAddress, product: r.productName, plan: r.displayName, bottles,
    current_interval: curEvery, current_price: money(curPrice), current_next: curNext || '',
    new_interval: newEvery, new_price: money(newPrice), new_next: newNext,
    changes: changes.join('+'), first_order: paid[0].totalAmount, note: note.join('; '),
  };
}

const COLS = ['purchaseId', 'email', 'product', 'bottles', 'current_interval', 'current_price', 'current_next', 'new_interval', 'new_price', 'new_next', 'changes', 'first_order', 'note', 'plan'];
const toCsv = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => { const v = r[c] == null ? '' : String(r[c]); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(','))].join('\n') + '\n';
function fromCsv(text) {
  const [head, ...lines] = text.trim().split('\n');
  const cols = head.split(',');
  return lines.map((l) => {
    const vals = []; let cur = '', q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { vals.push(cur); cur = ''; } else cur += ch;
    }
    vals.push(cur);
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
}

const newestPlan = () => {
  const f = fs.readdirSync(OUT).filter((x) => /^sweep-plan-\d{4}-\d{2}-\d{2}\.csv$/.test(x)).sort().pop();
  if (!f) throw new Error('no plan yet: run without flags first');
  return path.join(OUT, f);
};
const done = () => (fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

async function makePlan() {
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const all = await queryAll('purchase/query', { start: new Date('2026-05-01'), end: today, campaignId: CAMPAIGN, windowDays: 5 });
  const active = all.filter((r) => ACTIVE.has(r.status) && !Number(r.cancellationScheduled));
  const rows = active.map((r) => plan(r, today)).filter(Boolean);
  // Biggest price drops first, so the first batch is the most obvious.
  rows.sort((a, b) => (Number(b.current_price) - Number(b.new_price)) - (Number(a.current_price) - Number(a.new_price)));
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `sweep-plan-${iso(today)}.csv`);
  fs.writeFileSync(file, toCsv(rows, COLS));
  const count = (f) => rows.filter(f).length;
  console.log(JSON.stringify({
    file, active: active.length, breaking: rows.length,
    priceDown: count((r) => r.changes.includes('price')),
    intervalShorter: count((r) => r.new_interval < r.current_interval),
    intervalLonger: count((r) => r.new_interval > r.current_interval),
    dateLater: count((r) => r.changes.includes('date')),
    lowFirstOrder: count((r) => /first order only/.test(r.note)),
    pastDate: count((r) => /past/.test(r.note)),
    priceDownDollarsPerCycle: Math.round(rows.reduce((s, r) => s + Number(r.current_price) - Number(r.new_price), 0)),
  }, null, 1));
}

async function apply(limit) {
  const j = process.argv.indexOf('--plan');
  const rows = fromCsv(fs.readFileSync(j > 0 ? path.resolve(process.argv[j + 1]) : newestPlan(), 'utf8'));
  const already = new Set(done().map((d) => d.purchaseId));
  const todo = rows.filter((r) => !already.has(r.purchaseId)).slice(0, limit === 'all' ? Infinity : Number(limit));
  let changed = 0, skipped = 0;
  for (const p of todo) {
    const now = (await call('purchase/query', { purchaseId: p.purchaseId })).data[0];
    const same = now && ACTIVE.has(now.status) && !Number(now.cancellationScheduled) && money(cents(now.price)) === p.current_price && String(now.billingIntervalDays) === p.current_interval && (now.nextBillDate || '') === p.current_next;
    if (!same) { skipped++; console.log(p.purchaseId, 'skip: changed since the plan', now && `${now.status} $${now.price} ${now.billingIntervalDays}d ${now.nextBillDate}`); continue; }
    // Hard guards, whatever the plan says.
    if (cents(p.new_price) > cents(now.price)) throw new Error(p.purchaseId + ': price would go up');
    if (now.nextBillDate && p.new_next < now.nextBillDate) throw new Error(p.purchaseId + ': date would move earlier');
    if (Number(p.new_interval) > 84) throw new Error(p.purchaseId + ': interval above 84');
    const sent = { purchaseId: p.purchaseId, price: p.new_price, billingIntervalDays: p.new_interval };
    // CC only accepts future dates; a date of today or earlier is the current one, so leave it out.
    if (p.new_next > iso(new Date())) sent.nextBillDate = mdY(p.new_next);
    await call('purchase/update', sent);
    const after = (await call('purchase/query', { purchaseId: p.purchaseId })).data[0];
    const good = money(cents(after.price)) === p.new_price && String(after.billingIntervalDays) === p.new_interval && after.nextBillDate === (sent.nextBillDate ? p.new_next : now.nextBillDate);
    fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), purchaseId: p.purchaseId, email: p.email, product: p.product, bottles: p.bottles, before: { price: now.price, every: now.billingIntervalDays, next: now.nextBillDate }, sent, after: { price: after.price, every: after.billingIntervalDays, next: after.nextBillDate }, good }) + '\n');
    console.log(p.purchaseId, `$${now.price} ${now.billingIntervalDays}d ${now.nextBillDate}  ->  $${after.price} ${after.billingIntervalDays}d ${after.nextBillDate}`, good ? 'OK' : 'MISMATCH');
    if (!good) throw new Error(p.purchaseId + ': CC did not save what was sent, stopping');
    changed++;
  }
  console.log(JSON.stringify({ changed, skipped, left: rows.length - already.size - changed - skipped }));
}

function exportChanged() {
  const rows = done().filter((d) => d.good || (money(cents(d.after.price)) === d.sent.price && String(d.after.every) === String(d.sent.billingIntervalDays) && !d.sent.nextBillDate && d.after.next === d.before.next)).map((d) => ({ email: d.email, product: d.product, bottles: d.bottles, new_price: d.after.price, new_next_charge: d.after.next }));
  const file = path.join(OUT, `sweep-changed-${iso(new Date())}.csv`);
  fs.writeFileSync(file, toCsv(rows, ['email', 'product', 'bottles', 'new_price', 'new_next_charge']));
  console.log(file, rows.length, 'customers');
}

const a = process.argv;
const i = a.indexOf('--apply');
(i > 0 ? apply(a[i + 1] || '5') : a.includes('--export') ? Promise.resolve(exportChanged()) : makePlan())
  .catch((e) => { console.error(e.message); process.exit(1); });
