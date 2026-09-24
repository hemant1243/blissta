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


## The chase ladder (delivery follow-ups)

Donnaa follows up on assigned creative work that has no Drive link yet. Agreed with Hemant on 16 Sep 2026:

1. Day 2: one tag in the thread where the work was assigned. All of that editor's items in one message.
2. 36 hours of silence after the tag: one DM. "I tagged you, did not hear back, what is going on?"
3. 36 hours of silence after the DM: one line to Hemant in #donna. Then she goes quiet on that item.
4. If the editor answers, the conversation continues in the DM. A reply that sounds stuck is passed to Hemant once. A promise without a link gets one more DM after 3 days.

Hard limits: one message per person per day across every step, and at most 6 chase messages per hour. A Drive link that names the item, anywhere she can see (approved channel, brief thread, Neil's or Schalk's room, or her DMs), closes it. Links posted only in a thread or DM get a one-time "please post it in #blissta-ad-approved-2-0" in the thread.

There is no state file. Railway wipes the disk on deploy, so Donnaa reads her own past messages in Slack to know what she already said.

## Unanswered tags (reviews)

Hemant's ask, 19 Sep 2026. Editors tag Hemant or Jenn when a concept, video or revision is ready, and those tags get lost. Donnaa sweeps every channel she is in, last 30 days, and finds each message where a human (not a reviewer, not a bot) tagged Hemant or Jenn and neither of them wrote anything in that thread afterwards or reacted to the message.

- `reviews` (or `reviews 7`) lists them on demand. Hemant and Jenn only.
- Every 4 hours between 9am and 10pm Bangkok she DMs Hemant the ones she has not told him about yet, at most 15 per message. Nobody else is messaged. Each place is mentioned once; she reads her own DM history to know what she already sent, so a redeploy does not repeat it.
- A tag younger than 12 hours does not count yet.
- Set `REVIEW_ENABLED=0` to switch the automatic DMs off; the command still works.

## Creative Ops tracker bridge (tracker.js, http.js, tracker/apps-script.gs)

Hemant's ask, 24 Sep 2026. The Creative Operations tracker (Google Sheet behind blisstacreativestracker.netlify.app) is the source of truth for briefs and videos. Donnaa never writes to it. A small Apps Script on the sheet (`tracker/apps-script.gs`) fires on every change, plus a once-a-minute safety check, and POSTs changed rows to Donnaa at `/tracker` with the `X-Tracker-Secret` header. Nothing runs on a schedule inside Donnaa; she only reacts.

She posts into one channel, `#creative-accountability` (env `TRACKER_CHANNEL`, created and filled with Hemant, Jenn and Bruce automatically). One thread per concept (the tracker's Video ID, like `BRF-20260922-97FB30`): the first handoff opens the thread with product, concept name, ID, strategist, editor, brief and Drive links; every later change replies inside it. Threads are found by reading the channel, so a redeploy forgets nothing, and each update carries a marker line so the same change is never posted twice.

| Tracker change | Who gets tagged |
| --- | --- |
| Status `Brief Assigned` | Hemant (brief needs approval) |
| Status `Ready for Editing` | the editor |
| Brief note by the editor (Revisions tab, stage BRIEF) | the strategist |
| Brief note by the strategist, or the Briefs row updated | the editor |
| Status `Awaiting Review`, first cut | the strategist; Hemant and Bruce instead when it is Hemant's concept |
| Status `For Revision` | the editor, with the review comment quoted |
| Status `Awaiting Review` after revisions | the strategist |
| Status `Approved` | Jenn, with the parent Google Drive link and the final cut |
| Status `Blocked` | the strategist and Hemant |

`Editing` is not posted, nothing changes hands there. People are matched from the tracker's email, then name, through `data/people.json`; someone with no Slack account is named in bold instead of tagged. Tagged people are invited to the channel automatically.

Env: `TRACKER_SECRET` (shared with the Apps Script), `TRACKER_CHANNEL` (default `creative-accountability`), `PORT` (Railway sets it). `GET /` answers `{ok:true}`. `POST /tracker?dry=1` returns what would be posted without posting. Installing the script on the sheet: Extensions → Apps Script, paste the file with the real secret, run `setup` once and allow permissions. The first run only snapshots the sheet; old rows are never posted. `teardown` removes the triggers.
