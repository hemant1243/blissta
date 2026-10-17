# START HERE: handoff for any new Claude chat (updated Oct 17 2026)

Read this first, then the files it points to. Repo hemant1243/blissta, branch claude/yo-m920ap.

## Who you work for
Hemant (DONAAA), owner of Blissta, a US supplement brand on Meta ads. The products are Corvael/Corbel nattokinase, Methylene Blue (drops, Ultra Blue gummies), PainBloc PEA, Aeon, Gluco Gone.

**How to talk to him:** plain, short, human. He is busy and stressed.
- Give one clear answer or recommendation, not a list of options.
- Act instead of describing.
- Flag only serious things.
- When he asks "what do I tell X", give the exact text to paste.

## Hard rules (never break)
- Never print or paste passwords or tokens. Credentials live only in env vars.
- **Higgsfield is read-only** for the watch: never generate, buy, delete or change anything. Generating ad images is a separate job, and only when he asks; quote the credits first.
- Never charge, refund, delete customers or bulk-change subscriptions without his OK.
- Messages to customers or editors are shown to him before sending.
- **Meta ads** are created PAUSED only. He switches them on.
- **Live funnel or site changes:** save, show him, and he clicks Publish.
- Don't work around safety-check denials. Tell him and let him decide.

## Where things are
- **Brand knowledge:**
  - `bot/knowledge/OPERATOR_HANDBOOK.md`
  - `brand/drive/*.md`: notes from his Google Drive, 155 files
  - `brand/emotion-belief-map.md`
- **Making ads:** `brand/SOP_AD_FACTORY.md`, with the mega prompt and delivery modes ("post it" / "upload it" / "keep it").
- **Static design:** `brand/STATIC_DESIGN_SYSTEM_v3.md`.
  - Free wireframe and type tool: `node design/typeset.js <spec> <out>`.
  - Research behind it: `reports/Winning static ad design system.md`.
- **Donnaa (Slack bot):** `bot/` on Railway, service powerful-insight. It auto-deploys from this branch in about 2–3 minutes.
  - Check the live version: https://powerful-insight-production-d93f.up.railway.app/health
  - `@Donnaa launch` takes image/video links and multi-paragraph copy, and creates paused ads.
- **Higgsfield:** `ops/higgsfield/`. Now a 12-hour report (`REPORT12.md`) instead of the 5-minute watch, to save Claude usage.
- **Retention / Checkout Champ:** `retention/`.

## Open items (as of Oct 17)
1. **Higgsfield 12-hour report:** Hemant must paste the switch-over text into the watcher chat; the routine prompt can only be changed there. Then confirm the 5-minute job is gone.
2. **Separate Higgsfield logins:** the permanent fix for "who deleted what". The account has only one private workspace. Bring him team-workspace pricing and steps.
3. **Seedance burn:** about 3,650 credits in 4.5 hours on Oct 15, about 90% Seedance. Suggested rule: no Seedance without his OK.
4. **Bruce's tracker:** the app runs on Netlify and Replit, and the data sits in a Google Sheet owned by Bruce's personal Gmail. Drive blocks copying it.
   - Ask Bruce to transfer ownership to blisstausa@gmail.com. The message is drafted; send only on Hemant's "send it".
   - Then build the Slack-only flow in Donnaa: brief posted → logged → Hemant "ok" → editor tagged → video → review → approved. Start with steps 1 and 2.
   - The tracker secret was pasted in a Slack DM on Sep 24 and should be rotated.
5. **Facts to confirm on real labels:**
   - Corbel: 20,000 FU in ads vs 10,000 FU on the spec-sheet label.
   - MB gummies: 14mg vs 5mg.
   - PainBloc: 1,200mg (the Project says 1,200).
   - Guarantee: 30-day money-back is live.
6. **GMP certificate** of the only supplier (Guangdong Come Health) expires Oct 31.
7. **Two passwords** were posted in plain text in #ai-staticsxmark (Oct 6 and Oct 8). Rotate them.
8. **Customer portal:** "Email & Order Id" login is saved in Checkout Champ but not published. Hemant said not to worry about it.
9. **Edjill warning message:** drafted, not sent.
10. **Railway CLI** is not logged in here, so Meta spend is missing from the P&L and editor scorecard.

## Saving Claude usage
Long chats re-read their whole history on every message. Start a fresh chat for a new topic and point it at this file. Use big multi-agent research only when he asks for it.
