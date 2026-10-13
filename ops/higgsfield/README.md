# Higgsfield credit watch

Editors share one Higgsfield login. Every hour the watch compares credit spends with the clips that
still exist in the account. A spend with no clip = made then deleted. It also reads every prompt to
catch work that isn't for a Blissta product.

- `watch.js <transactions.json> <generations.json> [fromISO] [toISO]`: prints the window summary
  (spent, deleted credits, unmatched spends with PKT/ET times, prompts with clip links).
- `lastresult.js <transcript.jsonl> <toolName>`: saves the newest Higgsfield `transactions` result
  from the session transcript to a file, so nothing is retyped.

Alerts go to #blissta-ops. Higgsfield does not record which login made a clip, so alerts give the
exact time; match it on higgsfield.ai/me/settings/sessions.
