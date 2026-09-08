# Blissta Ledger

Daily profit & loss for Blissta. Shopify sales come in through ShopifyQL; costs are set in the dashboard's Costs tab; a routine rebuilds the numbers every morning and sends the report to Slack.

## Pieces

- `lib/pnl.js` — the P&L engine. Runs in Node and in the browser. Normalizes ShopifyQL rows, applies costs, computes daily and monthly P&L, detects anomalies against the trailing 7 days, and writes the morning report text.
- `report.js` — `node report.js <dataDir> [costs.json] [asOfDate]`. Reads the four ShopifyQL result files from `dataDir`, prints the report, writes `computed.json`.
- `src/dashboard.html` — dashboard template. `build.js` inlines the engine and an optional data snapshot into `dist/dashboard.html`, which is what gets published.
- The published dashboard reads live data from its own document store: `shopify/daily` (sales, products, channels), `config/costs` (what you enter in the Costs tab), `reports/<date>` (the archive).

## Data files expected in `dataDir`

`sales_daily.json`, `customers_daily.json`, `products_30d.json`, `channels_30d.json`, each `{ "columns": [...], "rows": [[...]] }` exactly as ShopifyQL returns them. Queries are listed in the daily routine prompt.

## Cost model

Revenue = Shopify total sales (net of discounts and refunds, plus shipping charged) + Amazon revenue − Amazon refunds.
Net profit = revenue − COGS (% of net sales) − shipping cost per order − payment fees − ad spend (daily default per channel, overridable per day) − fixed monthly costs spread per day.

Everything in `DEFAULT_COSTS` is a placeholder until saved from the Costs tab.

## Build

```
node build.js path/to/computed.json   # writes dist/dashboard.html
```
