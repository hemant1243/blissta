// Weekly rebill report: does the first rebill stick, by first-order month and product.
//
//   Paid Nth rebill  = of the subs whose Nth rebill was due (first order + N x interval
//                      + 3 days grace), how many paid it. Cancelled or failed = not paid.
//   Card failed      = due for the 1st rebill, did not pay, has a declined renewal, not cancelled.
//   Refunded         = 1st rebills paid 8-37 days ago (so refunds have had a week to land) that were refunded.
//   Cancelled <7d    = cancelled within 7 days after paying the 1st rebill, last 30 days.
//   Above first price= live subs whose rebill price is higher than what they paid the first time.
//
// Writes out/rebill-<date>.csv (raw rows, git-ignored), out/overpriced-<date>.csv (live subs
// rebilling above first price, with email, git-ignored), history/rebill-<date>.json (totals only,
// committed, so next week can show "was X") and prints the Slack message.
//
// Run: NODE_USE_ENV_PROXY=1 node retention/rebill_report.js
const fs = require('fs');
const path = require('path');
const { queryAll } = require('./cc');

const CAMPAIGN = 3;
const OUT = path.join(__dirname, 'out');
const HIST = path.join(__dirname, 'history');
const day = 864e5;
const GRACE = 3 * day;
const MIN_DUE = 30; // fewer due than this and the % means nothing, show --
const LIVE = new Set(['ACTIVE', 'RECYCLE_BILLING', 'TRIAL', 'PAUSED']);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ok = (t) => t.responseType === 'SUCCESS' && Number(t.totalAmount) > 0;
const when = (s) => new Date(String(s).replace(' ', 'T') + 'Z');
const iso = (d) => d.toISOString().slice(0, 10);
const pct = (a, b) => (b >= MIN_DUE ? Math.round((100 * a) / b) + '%' : '--');
const short = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;

function product(name) {
  if (/gumm/i.test(name)) return 'Gummies';
  if (/nattokinase|corbel|corvel|corvael/i.test(name)) return 'Corbel';
  if (/painbloc|PEA/i.test(name)) return 'PainBloc';
  if (/methylene/i.test(name)) return 'MB';
  return 'Other';
}

function row(r, today) {
  const paid = r.transactions.filter(ok).sort((a, b) => (a.txnDate < b.txnDate ? -1 : 1));
  const first = paid[0] ? when(paid[0].txnDate) : when(r.dateCreated);
  const every = Number(r.billingIntervalDays) * day;
  const rebills = paid.length - 1;
  // A live subscription is due for its next rebill once its own charge date has passed or it is in card retries (intervals were
  // shortened on Oct 18 without moving dates earlier). Ended ones kept their old interval, so time decides.
  const ended = ['CANCELLED', 'RECYCLE_FAILED'].includes(r.status);
  const nextPassed = r.nextBillDate && new Date(r.nextBillDate + 'T00:00:00Z').getTime() + GRACE <= today.getTime();
  const due = (n) => rebills >= n
    || (ended ? first.getTime() + n * every + GRACE <= today.getTime() : n === rebills + 1 && (r.status === 'RECYCLE_BILLING' || !!nextPassed));
  const r1 = paid[1] || null;
  const declinedAfterFirst = r.transactions.some((t) => /DECLINE/.test(t.responseType) && when(t.txnDate) > first);
  const cancelledAt = r.status === 'CANCELLED' ? when(r.lastCancellationDate || r.dateUpdated) : null;
  return {
    purchaseId: r.purchaseId,
    cohort: iso(first).slice(0, 7),
    product: product(r.productName),
    status: r.status,
    bottles: Number(r.productQty) || 1,
    everyDays: Number(r.billingIntervalDays),
    firstAmount: paid[0] ? Number(paid[0].totalAmount) : 0,
    rebillPrice: Number(r.price),
    rebillsPaid: Math.max(0, rebills),
    due1: due(1), due2: due(2), due3: due(3),
    r1Date: r1 ? when(r1.txnDate) : null,
    r1Refunded: r1 ? Number(r1.amountRefunded) > 0 || Number(r1.isChargedback) > 0 : false,
    cardFailed: due(1) && rebills < 1 && declinedAfterFirst && r.status !== 'CANCELLED',
    cancelledAt,
    live: LIVE.has(r.status) && !Number(r.cancellationScheduled),
    nextBillDate: r.nextBillDate,
    email: r.emailAddress,
    plan: r.displayName,
  };
}

function cohortLine(rows) {
  const n = (k) => rows.filter((x) => x['due' + k]).length;
  const p = (k) => rows.filter((x) => x['due' + k] && x.rebillsPaid >= k).length;
  return { subs: rows.length, due: [n(1), n(2), n(3)], paid: [p(1), p(2), p(3)] };
}

function build(rows, today) {
  const cohorts = [...new Set(rows.map((x) => x.cohort))].sort();
  const table = cohorts.map((c) => ({ cohort: c, ...cohortLine(rows.filter((x) => x.cohort === c)) }));
  const products = ['Corbel', 'PainBloc', 'MB', 'Gummies'].map((p) => ({ product: p, ...cohortLine(rows.filter((x) => x.product === p)) }));
  const due1 = rows.filter((x) => x.due1);
  const refundFrom = new Date(today.getTime() - 37 * day), refundTo = new Date(today.getTime() - 7 * day);
  const r1Window = rows.filter((x) => x.r1Date && x.r1Date >= refundFrom && x.r1Date < refundTo);
  const since30 = new Date(today.getTime() - 30 * day);
  const quickCancel = rows.filter((x) => x.r1Date && x.cancelledAt && x.cancelledAt >= since30 && x.cancelledAt - x.r1Date <= 7 * day && x.cancelledAt >= x.r1Date);
  const above = rows.filter((x) => x.live && x.firstAmount > 0 && x.rebillPrice > x.firstAmount + 0.01);
  const wayAbove = above.filter((x) => x.rebillPrice / x.bottles > 40);
  return {
    date: iso(today),
    table, products,
    cardFailed: { n: due1.filter((x) => x.cardFailed).length, of: due1.length },
    refunded: { n: r1Window.filter((x) => x.r1Refunded).length, of: r1Window.length, from: iso(refundFrom), to: iso(refundTo) },
    quickCancel30: quickCancel.length,
    above: above.length,
    wayAbove: { n: wayAbove.length, dollars: Math.round(wayAbove.reduce((s, x) => s + x.rebillPrice, 0)) },
    aboveRows: above,
  };
}

function lastReport(today) {
  if (!fs.existsSync(HIST)) return null;
  const f = fs.readdirSync(HIST).filter((x) => /^rebill-\d{4}-\d{2}-\d{2}\.json$/.test(x) && x < `rebill-${iso(today)}.json`).sort().pop();
  return f ? JSON.parse(fs.readFileSync(path.join(HIST, f), 'utf8')) : null;
}

function message(R, prev) {
  const was = (now, then, fmt = (v) => v) => (then == null ? '' : ` (was ${fmt(then)})`);
  const rate = (o) => (o && o.of ? Math.round((100 * o.n) / o.of) + '%' : null);
  const label = (c) => MONTHS[Number(c.slice(5, 7)) - 1];
  const lines = R.table.filter((t) => t.subs >= MIN_DUE).map((t) => [label(t.cohort), t.subs.toLocaleString(), pct(t.paid[0], t.due[0]), pct(t.paid[1], t.due[1]), pct(t.paid[2], t.due[2])]);
  const head = ['Cohort (first order month)', 'Subs', 'Paid 1st rebill', 'Paid 2nd', 'Paid 3rd'];
  const w = head.map((h, i) => Math.max(h.length, ...lines.map((l) => l[i].length)));
  const fmt = (l) => l.map((v, i) => v.padEnd(w[i])).join(' | ').trimEnd();
  const d = new Date(R.date + 'T00:00:00Z');
  return [
    `*Rebill report, ${short(d)}*`,
    '```',
    fmt(head),
    ...lines.map(fmt),
    '',
    'By product, 1st rebill: ' + R.products.map((p) => `${p.product} ${pct(p.paid[0], p.due[0])}`).join(', '),
    `Card failed (not cancelled): ${rate(R.cardFailed)}${was(0, rate(prev && prev.cardFailed))}`,
    `Refunded after 1st rebill: ${rate(R.refunded) || '--'}${was(0, rate(prev && prev.refunded))}   (1st rebills ${short(new Date(R.refunded.from))}-${short(new Date(R.refunded.to))})`,
    `Cancelled within 7 days of 1st rebill, last 30 days: ${R.quickCancel30}${was(0, prev && prev.quickCancel30)}`,
    '',
    `Plans rebilling above first order price: ${R.above.toLocaleString()}${was(0, prev && prev.above)}`,
    `  of those over $40/bottle: ${R.wayAbove.n} ($${R.wayAbove.dollars.toLocaleString()} next charges)${was(0, prev && prev.wayAbove && prev.wayAbove.n)}`,
    '```',
  ].join('\n');
}

const csv = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => { const v = r[c] instanceof Date ? iso(r[c]) : r[c] == null ? '' : String(r[c]); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(','))].join('\n') + '\n';

async function main() {
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const all = await queryAll('purchase/query', { start: new Date('2026-05-01'), end: today, campaignId: CAMPAIGN, windowDays: 5 });
  const rows = all.filter((r) => r.transactions && r.transactions.some(ok)).map((r) => row(r, today));
  const R = build(rows, today);
  const prev = lastReport(today);

  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(HIST, { recursive: true });
  fs.writeFileSync(path.join(OUT, `rebill-${R.date}.csv`), csv(rows, ['purchaseId', 'cohort', 'product', 'status', 'bottles', 'everyDays', 'firstAmount', 'rebillPrice', 'rebillsPaid', 'due1', 'due2', 'due3', 'r1Date', 'r1Refunded', 'cardFailed', 'cancelledAt', 'live', 'nextBillDate']));
  const over = R.aboveRows.sort((a, b) => b.rebillPrice / b.bottles - a.rebillPrice / a.bottles);
  fs.writeFileSync(path.join(OUT, `overpriced-${R.date}.csv`), csv(over, ['email', 'purchaseId', 'product', 'plan', 'bottles', 'everyDays', 'firstAmount', 'rebillPrice', 'nextBillDate']));
  const { aboveRows, ...totals } = R;
  fs.writeFileSync(path.join(HIST, `rebill-${R.date}.json`), JSON.stringify(totals, null, 2) + '\n');
  console.log(message(R, prev));
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { row, build, message, product };
