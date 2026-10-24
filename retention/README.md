# retention

Checkout Champ → Klaviyo bridge. Checkout Champ sends Klaviyo "Placed Order" but no
subscription events, so the post-purchase flows never fired. `bridge.js` fills that gap.

Run daily:

    NODE_USE_ENV_PROXY=1 node retention/bridge.js        # --dry to skip sending

- Needs `CC_API_USER` / `CC_API_PASS`. Checkout Champ only accepts calls from the
  whitelisted IP range, which the cloud proxy uses — hence `NODE_USE_ENV_PROXY=1`.
- Sends to Klaviyo only if `KLAVIYO_API_KEY` (private key, Events write) is set.
- Writes `out/events.json` (customer data, git-ignored) and `out/health.json`
  (counts + plain-English alerts for Slack).

Events (each has a unique_id, so re-runs never double-send):

| Event | When | Klaviyo draft flow |
|---|---|---|
| Upcoming Rebill | next bill date is 5 days out | reminder with delay / skip / pause |
| Rebill Failed | renewal charge declined (last 2 days) | "update your card" |
| Subscription Cancelled | cancelled (last 2 days) | confirmation + slower-schedule offer |
