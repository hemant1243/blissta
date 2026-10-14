# One Higgsfield watch pass (runs every 5 min in the "Higgsfield sessions watcher" chat)

Quiet unless there is an alert. If nothing is found, end the turn with no text to Hemant.
Read-only on Higgsfield: never generate, buy, delete or change anything.

S = /tmp/hf-watch   (this chat's working folder; if $S/state.json is missing, copy state/state.json from this folder into it first)
J = this chat's own transcript: `ls -t ~/.claude/projects/*/*.jsonl | head -1`
Every ~hour, copy $S/state.json back to ops/higgsfield/state/state.json, commit and push to claude/yo-m920ap (so a restart loses nothing).

1. Call mcp__HIGGSFIELD__transactions size 40, then mcp__HIGGSFIELD__show_generations only_completed=false size 60
   (the result is saved to a tool-results file; never read it into the chat).
2. `node lastresult.js $J mcp__HIGGSFIELD__transactions > $S/tx.json`
3. `node watch5.js $S/state.json $S/tx.json <generations file>` (mkdir -p $S first).
4. Off-brand check on new_prompts. Ours: Corbel/Corvael nattokinase, Methylene Blue / Ultra Blue gummies,
   PainBloc PEA, Aeon copper peptide, Lucenta glutathione, and generic health/anatomy/older-adult/doctor/
   kitchen/UGC scenes for them. Off-brand: other brands (e.g. NORSAN), beauty/fashion/real estate/crypto/
   games/personal/adult. If a prompt is unclear, use show_generation_by_ids on its id to see it.
5. Post in Slack #blissta-ops (C0BDMPESL5N), tag <@U0963M61T8V>, when ANY of:
   - a video was deleted (deleted[] with a kling/seedance/veo/etc. model), or deleted images in this pass >= 5
   - paid_no_clip_credits >= 15, or any single paid_no_clip video spend >= 8
   - any off-brand prompt
   Message: short and human. Title "🚨 Higgsfield: clip deleted" / "🚨 Higgsfield: not our product".
   Proof table: Pakistan time | US Eastern | tool | credits, plus prompt (first 120 chars) and the saved
   clip link for deleted/off-brand clips. Deleted clips have a saved_copy file (our own copy, the Higgsfield link dies on delete): send it to Hemant with SendUserFile in the same turn so he has the video as proof. Each deleted clip carries `brief` (matched from its spoken lines via brief_index.json): put the brief title, Video ID and editor in the alert; if `sure` is false say "probably" and list `also`. Also put the start_image link (still alive after a delete) and the clip name (e.g. "Clip 28" from the prompt) in the Slack alert. End: "Who was logged in at that minute: higgsfield.ai/me/settings/sessions".
   Never post passwords or tokens.
   PICTURE FIRST (Hemant's rule): whenever you tell Hemant about deleted items (alert or not, if he asks),
   run `node sheet.js $S/out.json shots/deleted-<YYYY-MM-DD-HHMM>.png` and send that PNG with SendUserFile
   before or with the text. One picture of all the deleted items with time, model, editor and prompt;
   links only as a backup. In Slack add the saved_copy/link list under the alert as before.
   SLACK PICTURE: the Slack tool cannot attach images, so the picture goes on the proof page
   https://claude.ai/artifact/8LiNgp2f5MaCucFnuwnFZk (source ops/higgsfield/proof/). For every Slack alert about
   deletes: copy the PNG into proof/ as deleted-<YYYY-MM-DD-HHMM>.png, add an entry to proof/manifest.json
   (when ISO UTC, label in Eastern time, count, credits, note naming brief/editor or "editor unknown", file),
   republish with Artifact (file_path ops/higgsfield/proof/index.html, root /home/user/blissta, files {manifest.json,
   the new png}), and put "📸 Picture: https://claude.ai/artifact/8LiNgp2f5MaCucFnuwnFZk" as the first line under the
   alert title. Only for real alerts (thresholds above); small deletes stay out of Slack.
6. If Higgsfield tools fail with an auth error, post once per day in #blissta-ops that the connector needs reconnecting.

The brief index (brief_index.json) maps every #creative-accountability handoff to its editor and script lines. Refresh it weekly from the Donnaa handoffs in C0C50D81ZUY.

devices.json maps sessions-page rows (device + Chrome version + city) to people. When Hemant sends a sessions screenshot after an alert, name the device(s) active at the alert minute using it.
