#!/usr/bin/env node
/* Usage: node report.js <dataDir> [costs.json] [asOfDate]
   dataDir holds sales_daily.json, customers_daily.json, products_30d.json, channels_30d.json (ShopifyQL results).
   Prints the morning report to stdout and writes <dataDir>/computed.json for the dashboard db. */
const fs = require('fs');
const path = require('path');
const PNL = require('./lib/pnl.js');

const dir = process.argv[2] || './data';
const costsFile = process.argv[3];
const asOf = process.argv[4] || new Date().toISOString().slice(0, 10);
const read = f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

const costs = costsFile && fs.existsSync(costsFile) ? JSON.parse(fs.readFileSync(costsFile, 'utf8')) : {};
const days = PNL.normalizeShopify(read('sales_daily.json'), read('customers_daily.json'));
const products = PNL.normalizeProducts(read('products_30d.json'));
const channels = PNL.normalizeChannels(read('channels_30d.json'));
const daily = PNL.computeDaily(days, costs);
const report = PNL.buildReport({ daily, asOf, products, costs });

fs.writeFileSync(path.join(dir, 'computed.json'), JSON.stringify({
  asOf, refreshedAt: new Date().toISOString(),
  shopify: { days, products, channels },
  report: { date: report.yesterday.date, title: report.title, text: report.text, flags: report.anomalies.flags,
    yesterday: report.yesterday, mtd: report.mtd, l7: report.l7 }
}, null, 1));
process.stdout.write(report.text + '\n');
