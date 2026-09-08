/* Blissta P&L engine. Runs in Node and in the browser (UMD-style). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PNL = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_COSTS = {
    cogsPct: 0.30,              // placeholder: 30% of net product sales
    shippingCostPerOrder: 6.50, // what you pay the carrier / 3PL per order
    feePct: 0.029,              // payment processing
    feeFixed: 0.30,
    adDaily: { meta: 4000, google: 800, tiktok: 500, other: 0 }, // placeholder daily spend
    adOverrides: {},            // { 'YYYY-MM-DD': { meta: 1234, ... } }
    fixedMonthly: [
      { name: 'Payroll & contractors', amount: 25000 },
      { name: 'Software & tools', amount: 2500 },
      { name: 'Rent / warehouse', amount: 3000 }
    ],
    amazon: []                  // [{ date, revenue, refunds, fees, adSpend, cogs }]
  };

  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function daysInMonth(dateStr) {
    var y = +dateStr.slice(0, 4), m = +dateStr.slice(5, 7);
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  }
  function round2(n) { return Math.round(n * 100) / 100; }

  /* rows: [{day, orders, gross_sales, discounts, sales_reversals, net_sales, shipping_charges, total_sales, new_customers, returning_customers, average_order_value}] */
  function normalizeShopify(sales, customers) {
    var cmap = {};
    (customers && customers.rows || []).forEach(function (r) {
      cmap[r[0]] = { newC: num(r[1]), retC: num(r[2]), aov: num(r[3]) };
    });
    var idx = {};
    sales.columns.forEach(function (c, i) { idx[c] = i; });
    return sales.rows.map(function (r) {
      var c = cmap[r[idx.day]] || { newC: 0, retC: 0, aov: 0 };
      return {
        date: r[idx.day],
        orders: num(r[idx.orders]),
        gross: num(r[idx.gross_sales]),
        discounts: -num(r[idx.discounts]),
        refunds: -num(r[idx.sales_reversals]),
        net: num(r[idx.net_sales]),
        shipping: num(r[idx.shipping_charges]),
        revenue: num(r[idx.total_sales]),
        newCustomers: c.newC,
        returningCustomers: c.retC,
        aov: c.aov
      };
    });
  }

  function adSpendFor(date, costs) {
    var o = costs.adOverrides && costs.adOverrides[date];
    var base = costs.adDaily || {};
    var out = {}, total = 0;
    ['meta', 'google', 'tiktok', 'other'].forEach(function (ch) {
      var v = (o && o[ch] != null) ? num(o[ch]) : num(base[ch]);
      out[ch] = v; total += v;
    });
    out.total = total;
    return out;
  }

  function amazonFor(date, costs) {
    var rows = (costs.amazon || []).filter(function (a) { return a.date === date; });
    var out = { revenue: 0, refunds: 0, fees: 0, adSpend: 0, cogs: 0 };
    rows.forEach(function (a) {
      out.revenue += num(a.revenue); out.refunds += num(a.refunds);
      out.fees += num(a.fees); out.adSpend += num(a.adSpend); out.cogs += num(a.cogs);
    });
    return out;
  }

  function computeDaily(days, costs) {
    costs = Object.assign({}, DEFAULT_COSTS, costs || {});
    var fixedMonthly = (costs.fixedMonthly || []).reduce(function (s, f) { return s + num(f.amount); }, 0);
    return days.map(function (d) {
      var ads = adSpendFor(d.date, costs);
      var amz = amazonFor(d.date, costs);
      var cogs = d.net * num(costs.cogsPct) + amz.cogs;
      var shipCost = d.orders * num(costs.shippingCostPerOrder);
      var fees = d.revenue * num(costs.feePct) + d.orders * num(costs.feeFixed) + amz.fees;
      var fixed = fixedMonthly / daysInMonth(d.date);
      var revenue = d.revenue + amz.revenue - amz.refunds;
      var adSpend = ads.total + amz.adSpend;
      var contribution = revenue - cogs - shipCost - fees - adSpend;
      var netProfit = contribution - fixed;
      return {
        date: d.date, orders: d.orders, gross: d.gross, discounts: d.discounts, refunds: d.refunds,
        shopifyRevenue: d.revenue, amazonRevenue: amz.revenue - amz.refunds, revenue: revenue,
        cogs: cogs, shippingCost: shipCost, fees: fees, adSpend: adSpend, ads: ads, fixed: fixed,
        contribution: contribution, netProfit: netProfit,
        margin: revenue > 0 ? netProfit / revenue : 0,
        roas: adSpend > 0 ? revenue / adSpend : 0,
        cac: d.newCustomers > 0 ? adSpend / d.newCustomers : 0,
        refundRate: d.gross > 0 ? d.refunds / d.gross : 0,
        newCustomers: d.newCustomers, returningCustomers: d.returningCustomers, aov: d.aov
      };
    });
  }

  var SUM_KEYS = ['orders', 'gross', 'discounts', 'refunds', 'shopifyRevenue', 'amazonRevenue', 'revenue', 'cogs', 'shippingCost', 'fees', 'adSpend', 'fixed', 'contribution', 'netProfit', 'newCustomers', 'returningCustomers'];

  function sumRows(rows, label) {
    var out = { label: label, days: rows.length };
    SUM_KEYS.forEach(function (k) { out[k] = rows.reduce(function (s, r) { return s + r[k]; }, 0); });
    out.margin = out.revenue > 0 ? out.netProfit / out.revenue : 0;
    out.roas = out.adSpend > 0 ? out.revenue / out.adSpend : 0;
    out.cac = out.newCustomers > 0 ? out.adSpend / out.newCustomers : 0;
    out.refundRate = out.gross > 0 ? out.refunds / out.gross : 0;
    out.aov = out.orders > 0 ? out.revenue / out.orders : 0;
    return out;
  }

  function computeMonthly(daily) {
    var groups = {};
    daily.forEach(function (r) { var m = r.date.slice(0, 7); (groups[m] = groups[m] || []).push(r); });
    return Object.keys(groups).sort().map(function (m) { return sumRows(groups[m], m); });
  }

  function pctChange(cur, base) { return base ? (cur - base) / Math.abs(base) : 0; }

  /* Compare the last complete day against the trailing 7 complete days before it. */
  function detectAnomalies(daily, asOfDate) {
    var complete = daily.filter(function (r) { return r.date < asOfDate; });
    if (complete.length < 8) return { yesterday: null, trailing: null, flags: [] };
    var y = complete[complete.length - 1];
    var trailing = sumRows(complete.slice(-8, -1), 'trailing7');
    var avg = {};
    SUM_KEYS.forEach(function (k) { avg[k] = trailing[k] / 7; });
    avg.margin = trailing.margin; avg.refundRate = trailing.refundRate; avg.aov = trailing.aov; avg.roas = trailing.roas;
    var checks = [
      { key: 'revenue', label: 'Revenue', thresh: 0.25, money: true },
      { key: 'orders', label: 'Orders', thresh: 0.25 },
      { key: 'netProfit', label: 'Net profit', thresh: 0.30, money: true },
      { key: 'newCustomers', label: 'New customers', thresh: 0.30 },
      { key: 'aov', label: 'Average order value', thresh: 0.15, money: true },
      { key: 'refundRate', label: 'Refund rate', thresh: 0.50, pct: true, badWhenUp: true },
      { key: 'roas', label: 'ROAS', thresh: 0.25 }
    ];
    var flags = [];
    checks.forEach(function (c) {
      var change = pctChange(y[c.key], avg[c.key]);
      if (Math.abs(change) >= c.thresh) {
        var up = change > 0;
        var bad = c.badWhenUp ? up : !up;
        flags.push({ key: c.key, label: c.label, value: y[c.key], baseline: avg[c.key], change: change, severity: bad ? (Math.abs(change) >= c.thresh * 2 ? 'critical' : 'warning') : 'good', money: !!c.money, pct: !!c.pct });
      }
    });
    flags.sort(function (a, b) { return Math.abs(b.change) - Math.abs(a.change); });
    return { yesterday: y, trailing: avg, flags: flags };
  }

  function fmtMoney(n) {
    var neg = n < 0; n = Math.abs(n);
    var s = n >= 1000 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2);
    return (neg ? '-$' : '$') + s;
  }
  function fmtPct(n, digits) { return (n * 100).toFixed(digits == null ? 1 : digits) + '%'; }
  function fmtChange(n) { return (n >= 0 ? '+' : '') + (n * 100).toFixed(0) + '%'; }

  function buildReport(opts) {
    var daily = opts.daily, asOf = opts.asOf, products = opts.products || [], costs = opts.costs || {};
    var an = detectAnomalies(daily, asOf);
    var y = an.yesterday; if (!y) return { title: 'Not enough data', text: 'Need at least 8 complete days.' };
    var mtdRows = daily.filter(function (r) { return r.date.slice(0, 7) === y.date.slice(0, 7) && r.date <= y.date; });
    var mtd = sumRows(mtdRows, 'MTD');
    var l7 = sumRows(daily.filter(function (r) { return r.date <= y.date; }).slice(-7), 'L7');
    var prev7 = sumRows(daily.filter(function (r) { return r.date <= y.date; }).slice(-14, -7), 'P7');
    var lines = [];
    lines.push('*Blissta morning report — ' + y.date + '*');
    lines.push('');
    lines.push('*Yesterday*');
    lines.push('Revenue ' + fmtMoney(y.revenue) + ' (' + fmtChange(pctChange(y.revenue, an.trailing.revenue)) + ' vs 7-day avg) · ' + y.orders + ' orders · AOV ' + fmtMoney(y.aov));
    lines.push('Net profit ' + fmtMoney(y.netProfit) + ' · margin ' + fmtPct(y.margin) + ' · ad spend ' + fmtMoney(y.adSpend) + ' · ROAS ' + y.roas.toFixed(2) + 'x');
    lines.push('Refunds ' + fmtMoney(y.refunds) + ' (' + fmtPct(y.refundRate) + ' of gross) · new customers ' + y.newCustomers + ' · returning ' + y.returningCustomers);
    lines.push('');
    lines.push('*Last 7 days vs previous 7*');
    lines.push('Revenue ' + fmtMoney(l7.revenue) + ' (' + fmtChange(pctChange(l7.revenue, prev7.revenue)) + ') · net profit ' + fmtMoney(l7.netProfit) + ' (' + fmtChange(pctChange(l7.netProfit, prev7.netProfit)) + ') · margin ' + fmtPct(l7.margin));
    lines.push('');
    lines.push('*Month to date (' + mtd.days + ' days)*');
    lines.push('Revenue ' + fmtMoney(mtd.revenue) + ' · COGS ' + fmtMoney(mtd.cogs) + ' · shipping ' + fmtMoney(mtd.shippingCost) + ' · fees ' + fmtMoney(mtd.fees) + ' · ads ' + fmtMoney(mtd.adSpend) + ' · fixed ' + fmtMoney(mtd.fixed));
    lines.push('Net profit ' + fmtMoney(mtd.netProfit) + ' · margin ' + fmtPct(mtd.margin) + ' · refund rate ' + fmtPct(mtd.refundRate));
    lines.push('');
    if (an.flags.length) {
      lines.push('*Needs attention*');
      an.flags.forEach(function (f) {
        var icon = f.severity === 'critical' ? ':red_circle:' : f.severity === 'warning' ? ':large_orange_circle:' : ':large_green_circle:';
        var val = f.money ? fmtMoney(f.value) : f.pct ? fmtPct(f.value) : f.key === 'roas' ? f.value.toFixed(2) + 'x' : Math.round(f.value);
        var base = f.money ? fmtMoney(f.baseline) : f.pct ? fmtPct(f.baseline) : f.key === 'roas' ? f.baseline.toFixed(2) + 'x' : Math.round(f.baseline);
        lines.push(icon + ' ' + f.label + ' ' + val + ' vs 7-day avg ' + base + ' (' + fmtChange(f.change) + ')');
      });
      lines.push('');
    } else {
      lines.push(':large_green_circle: Nothing outside normal range yesterday.');
      lines.push('');
    }
    var top = products.filter(function (p) { return p.title && p.title !== 'Untitled / bundle lines'; }).sort(function (a, b) { return b.net - a.net; }).slice(0, 5);
    if (top.length) {
      lines.push('*Top products, last 30 days*');
      top.forEach(function (p, i) { lines.push((i + 1) + '. ' + p.title + ' — ' + fmtMoney(p.net) + ' net'); });
      lines.push('');
    }
    var placeholder = !costs.confirmed;
    if (placeholder) lines.push('_COGS, ad spend and fixed costs are placeholders until you set them in the Costs tab._');
    return { title: 'Blissta morning report ' + y.date, text: lines.join('\n'), anomalies: an, yesterday: y, mtd: mtd, l7: l7, prev7: prev7 };
  }

  function normalizeProducts(p) {
    return (p.rows || []).map(function (r) {
      return { title: r[0] || 'Untitled / bundle lines', gross: num(r[1]), net: num(r[2]), orders: num(r[3]) };
    });
  }
  function normalizeChannels(c) {
    return (c.rows || []).map(function (r) { return { source: r[0] || 'direct / untracked', orders: num(r[1]), sales: num(r[2]) }; });
  }

  return {
    DEFAULT_COSTS: DEFAULT_COSTS, normalizeShopify: normalizeShopify, normalizeProducts: normalizeProducts, normalizeChannels: normalizeChannels,
    computeDaily: computeDaily, computeMonthly: computeMonthly, sumRows: sumRows, detectAnomalies: detectAnomalies,
    buildReport: buildReport, fmtMoney: fmtMoney, fmtPct: fmtPct, fmtChange: fmtChange, pctChange: pctChange, round2: round2
  };
});
