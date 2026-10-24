'use strict';
/*
 Shopify numbers for the owner. Reads orders straight from the Admin GraphQL API.

 Env:
   SHOPIFY_SHOP          872ff5-d5.myshopify.com
   SHOPIFY_ADMIN_TOKEN   shpat_... from a legacy custom app, or instead:
   SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET   from a Dev Dashboard app installed on the store
   SHOPIFY_API_VERSION   optional

 Everything is in the store's time zone, America/New_York, same as Shopify reports.
*/
const TZ = 'America/New_York';
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-07';

const shop = () => { const s = process.env.SHOPIFY_SHOP; if (!s) throw new Error('SHOPIFY_SHOP is not set'); return s; };

/*
 Two ways in. A legacy custom app gives a permanent shpat_ token in SHOPIFY_ADMIN_TOKEN.
 A Dev Dashboard app gives a client id and secret, and we swap them for a short lived token
 (client credentials grant, about 24h) and cache it until it is close to expiring.
*/
let cached = { token: null, until: 0 };
async function token() {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  if (cached.token && Date.now() < cached.until) return cached.token;
  const id = process.env.SHOPIFY_CLIENT_ID, secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error('set SHOPIFY_ADMIN_TOKEN, or SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET');
  const res = await fetch(`https://${shop()}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: id, client_secret: secret, grant_type: 'client_credentials' }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error('Shopify would not issue a token: HTTP ' + res.status + ' ' + (json.error_description || json.error || '').slice(0, 200));
  const ttl = Number(json.expires_in || 86400) * 1000;
  cached = { token: json.access_token, until: Date.now() + ttl - 5 * 60 * 1000 };
  return cached.token;
}

async function gql(query, variables, retry = true) {
  const res = await fetch(`https://${shop()}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await token() },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  const msg = json.errors ? json.errors.map((e) => e.message).join('; ') : '';
  /* A cached token can predate a scope change. Drop it and try once more with a fresh one. */
  if (retry && (res.status === 401 || /access denied/i.test(msg))) { cached = { token: null, until: 0 }; return gql(query, variables, false); }
  if (!res.ok) throw new Error('Shopify HTTP ' + res.status + (msg ? ' ' + msg.slice(0, 200) : ''));
  if (json.errors) throw new Error('Shopify: ' + msg.slice(0, 300) + (/access denied/i.test(msg) ? '. The app on the store is missing the read_orders scope, approve the app again in Shopify admin.' : ''));
  return json.data;
}

/* ---------- dates in the store's zone ---------- */

/* YYYY-MM-DD of a moment in ET */
function etDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
/* Offset string like -04:00 for a given ET date. */
function etOffset(ymd) {
  const probe = new Date(ymd + 'T12:00:00Z');
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' }).formatToParts(probe);
  const tz = (parts.find((p) => p.type === 'timeZoneName') || {}).value || 'GMT-05:00';
  const m = tz.match(/GMT([+-]\d{2}:\d{2})/);
  return m ? m[1] : '-05:00';
}
const shiftDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const startOf = (ymd) => `${ymd}T00:00:00${etOffset(ymd)}`;

/* ---------- orders ---------- */

const ORDERS = `
query($q: String!, $cursor: String) {
  orders(first: 250, query: $q, after: $cursor, sortKey: CREATED_AT) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id createdAt cancelledAt test
      customer { numberOfOrders }
      currentTotalPriceSet { shopMoney { amount } }
      totalRefundedSet { shopMoney { amount } }
    }
  }
}`;

async function ordersSince(fromYmd, toYmdExclusive) {
  const q = `created_at:>='${startOf(fromYmd)}' AND created_at:<'${startOf(toYmdExclusive)}'`;
  const out = [];
  let cursor = null;
  for (let i = 0; i < 60; i++) {
    const d = await gql(ORDERS, { q, cursor });
    out.push(...d.orders.nodes);
    if (!d.orders.pageInfo.hasNextPage) break;
    cursor = d.orders.pageInfo.endCursor;
  }
  return out;
}

/* Per ET day: orders, sales (current total after discounts), refunds, new customers. */
function bucket(orders) {
  const days = {};
  for (const o of orders) {
    if (o.test || o.cancelledAt) continue;
    const day = etDate(new Date(o.createdAt));
    const b = days[day] || (days[day] = { day, orders: 0, sales: 0, refunds: 0, newCustomers: 0 });
    b.orders++;
    b.sales += Number(o.currentTotalPriceSet.shopMoney.amount) || 0;
    b.refunds += Number(o.totalRefundedSet.shopMoney.amount) || 0;
    if (o.customer && Number(o.customer.numberOfOrders) === 1) b.newCustomers++;
  }
  return days;
}

const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : 0);
const sign = (n) => (n > 0 ? '+' : '') + n + '%';

/*
 The owner's quick read: today so far, yesterday, last 7 days vs the 7 before, month to date.
 Returns Slack mrkdwn.
*/
async function summary() {
  const today = etDate();
  const from = shiftDays(today, -14);
  const monthStart = today.slice(0, 8) + '01';
  const earliest = from < monthStart ? from : monthStart;
  const orders = await ordersSince(earliest, shiftDays(today, 1));
  const days = bucket(orders);
  const get = (ymd) => days[ymd] || { orders: 0, sales: 0, refunds: 0, newCustomers: 0 };
  const sum = (list) => list.reduce((a, d) => ({ orders: a.orders + d.orders, sales: a.sales + d.sales, refunds: a.refunds + d.refunds, newCustomers: a.newCustomers + d.newCustomers }), { orders: 0, sales: 0, refunds: 0, newCustomers: 0 });

  const yday = get(shiftDays(today, -1));
  const tday = get(today);
  const last7 = sum([...Array(7)].map((_, i) => get(shiftDays(today, -1 - i))));
  const prev7 = sum([...Array(7)].map((_, i) => get(shiftDays(today, -8 - i))));
  const mtdDays = [];
  for (let d = monthStart; d <= today; d = shiftDays(d, 1)) mtdDays.push(get(d));
  const mtd = sum(mtdDays);
  const aov = (b) => (b.orders ? b.sales / b.orders : 0);

  const nowEt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date());
  const lines = [];
  lines.push(`*Shopify, store time (ET), as of ${nowEt}*`);
  lines.push(`*Today so far*  ${money(tday.sales)} · ${tday.orders} orders · AOV ${money(aov(tday))} · ${tday.newCustomers} new customers`);
  lines.push(`*Yesterday*  ${money(yday.sales)} · ${yday.orders} orders · AOV ${money(aov(yday))} · refunds ${money(yday.refunds)} · ${yday.newCustomers} new`);
  lines.push(`*Last 7 days*  ${money(last7.sales)} (${sign(pct(last7.sales, prev7.sales))} vs the 7 before) · ${last7.orders} orders · AOV ${money(aov(last7))} · refunds ${money(last7.refunds)}`);
  lines.push(`*Month to date*  ${money(mtd.sales)} · ${mtd.orders} orders · AOV ${money(aov(mtd))} · refunds ${money(mtd.refunds)} · ${mtd.newCustomers} new customers`);
  lines.push('_Sales = order totals after discounts, before refunds. Cancelled and test orders excluded. Ad spend and costs are not in here, the dashboard has the P&L._');
  return lines.join('\n');
}

/* One day, any date. */
async function day(ymd) {
  const orders = await ordersSince(ymd, shiftDays(ymd, 1));
  const b = bucket(orders)[ymd] || { orders: 0, sales: 0, refunds: 0, newCustomers: 0 };
  const aov = b.orders ? b.sales / b.orders : 0;
  return `*${ymd} (ET)*  ${money(b.sales)} · ${b.orders} orders · AOV ${money(aov)} · refunds ${money(b.refunds)} · ${b.newCustomers} new customers`;
}

module.exports = { summary, day, etDate, ordersSince, bucket };
