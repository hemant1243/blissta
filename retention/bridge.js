// Daily bridge: reads Checkout Champ and builds Klaviyo events, because
// Checkout Champ itself sends no subscription events to Klaviyo.
//
//   Upcoming Rebill        - next bill date is 5 days away
//   Rebill Failed          - a renewal charge was declined (last 2 days)
//   Subscription Cancelled - a subscription was cancelled (last 2 days)
//   Subscription Started   - a new subscriber (last 2 days)
//   Rebill Paid            - a renewal charge went through (last 2 days)
//
// Each event has a unique_id, so running twice never double-sends.
// With KLAVIYO_API_KEY set it posts the events itself; otherwise it writes
// them to out/events.json for the daily Claude run to send through Klaviyo.
// It also writes out/health.json with problems worth a Slack line.
//
// Run: NODE_USE_ENV_PROXY=1 node retention/bridge.js [--dry]
const fs = require('fs');
const path = require('path');
const { queryAll } = require('./cc');

const CAMPAIGN = 3;
const LEAD_DAYS = 5;
const SUPPORT = 'hello@blissta.co';
const OUT = path.join(__dirname, 'out');
const day = 864e5;
const iso = (d) => d.toISOString().slice(0, 10);
const money = (n) => Math.round(Number(n) * 100) / 100;
const niceDate = (s) => new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
// Declines where retrying the same card is pointless: the customer needs a new card.
const HARD_DECLINE = /closed|pick ?up|lost|stolen|invalid card|expired|not activated|no such|restricted/i;
const LIVE = new Set(['ACTIVE', 'RECYCLE_BILLING', 'TRIAL']);

function profile(r) {
  return {
    email: r.emailAddress,
    first_name: r.firstName || undefined,
    last_name: r.lastName || undefined,
    phone_number: r.phoneNumber ? '+1' + String(r.phoneNumber).replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '') : undefined,
    external_id: `cc-${r.customerId}`,
  };
}

function subProps(r) {
  const qty = Number(r.productQty) || 1;
  return {
    PurchaseId: r.purchaseId,
    Product: r.productName,
    Plan: r.displayName,
    Bottles: qty,
    Amount: money(r.price),
    BillingEveryDays: Number(r.billingIntervalDays),
    NextBillDate: r.nextBillDate,
    NextBillDateText: r.nextBillDate ? niceDate(r.nextBillDate) : null,
    CardLast4: r.cardLast4,
    ChargeNumber: Number(r.billingCycleNumber) + 1,
    SupportEmail: SUPPORT,
  };
}

async function main() {
  const dry = process.argv.includes('--dry');
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const target = iso(new Date(today.getTime() + LEAD_DAYS * day));
  const since = new Date(today.getTime() - 2 * day);

  // Every subscription ever sold in this campaign (~15k rows, ~40s).
  const all = await queryAll('purchase/query', { start: new Date('2026-05-01'), end: today, campaignId: CAMPAIGN, windowDays: 5 });
  const byId = new Map(all.map((r) => [r.purchaseId, r]));
  const events = [];

  for (const r of all) {
    if (!r.emailAddress) continue;
    if (LIVE.has(r.status) && r.nextBillDate === target && !Number(r.cancellationScheduled) && !Number(r.pauseScheduled)) {
      events.push({ metric: 'Upcoming Rebill', unique_id: `upcoming-${r.purchaseId}-${r.nextBillDate}`, value: money(r.price), profile: profile(r), properties: subProps(r) });
    }
    if (LIVE.has(r.status) && Number(r.billingCycleNumber) === 1 && new Date(r.dateCreated.replace(' ', 'T') + 'Z') >= since) {
      events.push({ metric: 'Subscription Started', unique_id: `started-${r.purchaseId}`, value: money(r.totalBilled), profile: profile(r), properties: subProps(r) });
    }
    const cancelled = r.lastCancellationDate || (r.status === 'CANCELLED' ? r.dateUpdated : null);
    if (r.status === 'CANCELLED' && cancelled && new Date(cancelled.replace(' ', 'T') + 'Z') >= since) {
      events.push({
        metric: 'Subscription Cancelled', unique_id: `cancelled-${r.purchaseId}-${cancelled.slice(0, 10)}`, value: money(r.price), profile: profile(r),
        properties: { ...subProps(r), CancelReason: r.cancelReason || null, ChargesPaid: r.transactions.filter((t) => t.responseType === 'SUCCESS' && Number(t.totalAmount) > 0).length },
      });
    }
  }

  // Declined renewal charges (cycle 2+) in the last 2 days.
  const txns = await queryAll('transactions/query', { start: since, end: today, campaignId: CAMPAIGN, windowDays: 3 });
  const paid = txns.filter((t) => t.txnType === 'SALE' && Number(t.billingCycleNumber) >= 2 && t.responseType === 'SUCCESS');
  for (const t of paid) {
    const item = (t.items || [])[0] || {};
    const sub = byId.get(item.purchaseId);
    if (!sub || !sub.emailAddress) continue;
    events.push({
      metric: 'Rebill Paid', unique_id: `paid-${t.orderId}-${t.billingCycleNumber}`, value: money(t.totalAmount), profile: profile(sub),
      properties: { ...subProps(sub), Amount: money(t.totalAmount), PaidChargeNumber: Number(t.billingCycleNumber) },
    });
  }

  const declines = txns.filter((t) => t.txnType === 'SALE' && Number(t.billingCycleNumber) >= 2 && t.responseType !== 'SUCCESS');
  for (const t of declines) {
    if (!t.emailAddress) continue;
    const item = (t.items || [])[0] || {};
    const sub = byId.get(item.purchaseId) || all.find((r) => r.customerId === t.customerId && LIVE.has(r.status));
    events.push({
      metric: 'Rebill Failed', unique_id: `failed-${t.orderId}-${t.billingCycleNumber}`, value: money(t.totalAmount),
      profile: sub ? profile(sub) : { email: t.emailAddress, first_name: t.firstName, external_id: `cc-${t.customerId}` },
      properties: { ...(sub ? subProps(sub) : {}), Amount: money(t.totalAmount), DeclineReason: t.responseText, DeclineType: HARD_DECLINE.test(t.responseText || '') ? 'card dead' : 'try again', RetryNumber: Number(t.recycleNumber) || 0, CardLast4: t.cardLast4 },
    });
  }

  const health = checkHealth(all, txns, today);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(events));
  fs.writeFileSync(path.join(OUT, 'health.json'), JSON.stringify(health, null, 2));

  const counts = events.reduce((m, e) => ((m[e.metric] = (m[e.metric] || 0) + 1), m), {});
  console.log('events', JSON.stringify(counts));
  console.log('alerts', health.alerts.length ? health.alerts.join(' | ') : 'none');

  if (!dry && process.env.KLAVIYO_API_KEY) await sendToKlaviyo(events);
}

const expectedDays = (qty) => (qty >= 5 ? 84 : qty >= 3 ? 56 : 28 * qty);

// Things that should make someone look. Each alert is one plain sentence.
function checkHealth(all, txns, today) {
  const live = all.filter((r) => LIVE.has(r.status) && r.nextBillDate && !Number(r.cancellationScheduled));
  const in7 = live.filter((r) => { const d = new Date(r.nextBillDate + 'T00:00:00Z'); return d >= today && d < new Date(today.getTime() + 7 * day); });
  const alerts = [];

  const pricey = in7.filter((r) => Number(r.price) / (Number(r.productQty) || 1) > 40);
  if (pricey.length) alerts.push(`${pricey.length} customers will be charged over $40/bottle in the next 7 days ($${Math.round(pricey.reduce((s, r) => s + Number(r.price), 0)).toLocaleString()} total, up to $${Math.max(...pricey.map((r) => Number(r.price)))}).`);

  // Hemant's rule: renew when the PAID bottles run out (3-pack = buy 2 get 1 -> 56 days,
  // 5-pack = buy 3 get 2 -> 84 days). Only flag charges earlier than that.
  const early = in7.filter((r) => Number(r.billingIntervalDays) < expectedDays(Number(r.productQty) || 1));
  if (early.length) alerts.push(`${early.length} customers get charged in the next 7 days earlier than our 28/56/84-day rule.`);

  const rebills = txns.filter((t) => t.txnType === 'SALE' && Number(t.billingCycleNumber) >= 2);
  const ok = rebills.filter((t) => t.responseType === 'SUCCESS').length;
  // Judge cards on the first try only; retries of dead cards would drag the number down.
  const first = rebills.filter((t) => !Number(t.recycleNumber));
  const firstOk = first.filter((t) => t.responseType === 'SUCCESS').length;
  if (first.length >= 20 && firstOk / first.length < 0.75) alerts.push(`Only ${Math.round((100 * firstOk) / first.length)}% of renewal cards went through on the first try in the last 2 days (${firstOk}/${first.length}).`);

  const cvv = rebills.filter((t) => /cvv is required/i.test(t.responseText || '')).length;
  if (cvv) alerts.push(`${cvv} renewal charges failed with "CVV is required" (payment gateway setting, not the customer).`);

  return {
    date: iso(today),
    liveSubs: live.length,
    next7: { count: in7.length, dollars: Math.round(in7.reduce((s, r) => s + Number(r.price), 0)) },
    renewals2d: { tried: rebills.length, paid: ok },
    alerts,
  };
}

async function sendToKlaviyo(events) {
  const headers = { Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`, revision: '2024-10-15', 'content-type': 'application/json' };
  for (const e of events) {
    const body = {
      data: {
        type: 'event',
        attributes: {
          properties: e.properties, value: e.value, value_currency: 'USD', unique_id: e.unique_id,
          metric: { data: { type: 'metric', attributes: { name: e.metric } } },
          profile: { data: { type: 'profile', attributes: e.profile } },
        },
      },
    };
    const r = await fetch('https://a.klaviyo.com/api/events', { method: 'POST', headers, body: JSON.stringify(body) });
    if (r.status >= 300) console.error('klaviyo', e.metric, r.status, (await r.text()).slice(0, 200));
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
