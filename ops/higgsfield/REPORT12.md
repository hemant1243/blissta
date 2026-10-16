# Higgsfield 12-hour report (replaces the 5-minute watch, Oct 16 2026)

Hemant's call: one full look every 12 hours instead of every 5 minutes, to save Claude usage.
READ-ONLY on Higgsfield: never generate, buy, delete, restore or change anything. Never post passwords or tokens.

W = /tmp/hf12 (mkdir -p). J = this chat's transcript: `ls -t ~/.claude/projects/*/*.jsonl | head -1`.
FROM = the `last_to` value in ops/higgsfield/state/report12.json (if missing: now minus 12 hours). TO = now minus 20 minutes.

1. Transactions: call mcp__HIGGSFIELD__transactions size 100, then again with cursor=next_cursor, until the oldest
   item on a page is older than FROM (max 6 pages). After each call save it:
   `node lastresult.js $J mcp__HIGGSFIELD__transactions > $W/tx<N>.json`, then `node txmerge.js $W/tx.json $W/tx*.json`.
2. Generations: call mcp__HIGGSFIELD__show_generations only_completed=false size 100 type=video, then type=image
   (the results are saved to tool-results files; never read them into the chat). Merge:
   `node merge.js $W/gens.json <video file> <image file>`. If the oldest generation is newer than FROM, say in the
   report that older items were outside the feed.
3. `node watch.js $W/tx.json $W/gens.json <FROM> <TO>` gives spent, refunds, spends with no surviving clip (= deleted
   or failed) and prompts.
4. Post ONE message in Slack #blissta-ops (C0BDMPESL5N), tagging <@U0963M61T8V>, short and plain:
   "Higgsfield, last 12h (<FROM> to <TO>, Pakistan time)"
   - Spent: N credits (~$X at 20 credits per $). Seedance N · Kling N · images N · other N
   - Wasted: N credits paid with no clip left (deleted or failed), N items. List up to 10: time PKT | tool | credits | first 80 chars of prompt
   - Not our product: any prompt about other brands, beauty, fashion, crypto, games, personal or adult (ours: Corvael/Corbel nattokinase,
     Methylene Blue / Ultra Blue, PainBloc PEA, Aeon, Lucenta, Gluco Gone and health/older-adult/doctor/kitchen/UGC scenes for them)
   - Balance now: N credits (mcp__HIGGSFIELD__balance)
   End: "Who was logged in: higgsfield.ai/me/settings/sessions"
   If nothing was spent, post one line saying so.
5. Write {"last_to": TO} to ops/higgsfield/state/report12.json, commit "Higgsfield 12h report state" and push to
   claude/yo-m920ap (git pull --rebase first). Then stop. No other output needed.
