# One Higgsfield watch pass (runs every 5 min in Hemant's main session)

Quiet unless there is an alert. If nothing is found, end the turn with no text to Hemant.
Read-only on Higgsfield: never generate, buy, delete or change anything.

S = /tmp/claude-0/-home-user-blissta/b576a738-a8ed-59dc-9bcc-6c1b52cf0619/scratchpad/hf
J = /root/.claude/projects/-home-user-blissta/b576a738-a8ed-59dc-9bcc-6c1b52cf0619.jsonl

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
   clip link for deleted/off-brand clips. End: "Who was logged in at that minute: higgsfield.ai/me/settings/sessions".
   Never post passwords or tokens.
6. If Higgsfield tools fail with an auth error, post once per day in #blissta-ops that the connector needs reconnecting.
