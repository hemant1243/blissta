# Donnaa

The Blissta team bot. Lives in Slack, thinks with Claude, knows the company from `knowledge/`.

## How it works
- `knowledge/*.md` is the brain. Drop new docs there, restart or DM the bot `reload knowledge` (owners only).
- `src/redact.js` builds the team tier: legal, payments, margins, pay terms, and the numbers section are removed. Owners (Slack IDs in `OWNER_SLACK_IDS`) get the full text.
- `src/brain.js` is the system prompt: identity, the three compliance lines, geography and "talk to your doctor" bans, answer format. The knowledge block is prompt cached for an hour.
- `src/guard.js` runs on every answer: strips em dashes, flags disease claims, medication replacement, place of manufacture, doctor phrasing.
- `src/slack.js` answers @mentions and DMs, in thread, with the thread as memory. Socket Mode, so no public URL is needed.
- `src/ask.js` is the terminal harness: `node src/ask.js "what is the corvael guarantee" --team`.

## Run locally
```
cp .env.example .env   # fill in
npm install
npm run ask -- "which product is the current creative focus"
npm start
```

## Slack app setup
api.slack.com/apps, From scratch. OAuth scopes: app_mentions:read, chat:write, channels:history, groups:history, im:history, im:write, users:read, files:read. Socket Mode on, app-level token with connections:write. Event Subscriptions on, bot events: app_mention, message.im. Install to workspace.

## Deploy
Railway, new service from this repo, root directory `bot`, variables from `.env.example`.
