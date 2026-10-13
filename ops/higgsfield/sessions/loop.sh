#!/usr/bin/env bash
# Every 5 min: snapshot -> log.jsonl + latest.json, alerts -> $STATE/alerts.jsonl.
# Every 10 min: commit + push log.jsonl/latest.json if they changed.
# Logged out: one password re-login; if that fails, writes a logged_out alert and keeps trying read-only.
set -u
DIR=$(cd "$(dirname "$0")" && pwd); REPO=$(git -C "$DIR" rev-parse --show-toplevel)
BRANCH=${BRANCH:-claude/yo-m920ap}
STATE=${STATE:?set STATE to a directory outside the repo}; mkdir -p "$STATE"
last_push=0; relogin_used=0
while true; do
  args=(); [ "$relogin_used" = 0 ] && args=(--relogin)
  out=$(node "$DIR/snapshot.cjs" "${args[@]}" 2>"$STATE/snapshot.err"); rc=$?
  if [ -n "$out" ]; then
    echo "$out" >> "$DIR/log.jsonl"
    echo "$out" > "$STATE/snap.json"
    if [ $rc = 0 ]; then
      relogin_used=0
      node -e 'const s=JSON.parse(require("fs").readFileSync(process.argv[1]));console.log(JSON.stringify(s,null,2))' "$STATE/snap.json" > "$DIR/latest.json"
      node "$DIR/diff.cjs" "$STATE/prev.json" "$STATE/snap.json" >> "$STATE/alerts.jsonl"
    elif [ $rc = 3 ]; then
      [ "$relogin_used" = 0 ] && echo "$out" | sed 's/^{/{"kind":"logged_out",/' >> "$STATE/alerts.jsonl"
      relogin_used=1
    fi
  else
    echo "{\"ts\":\"$(date -u +%FT%TZ)\",\"kind\":\"watcher_error\",\"err\":$(tail -1 "$STATE/snapshot.err" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0,"utf8").trim()))')}" >> "$STATE/alerts.jsonl"
  fi
  now=$(date +%s)
  if [ $((now - last_push)) -ge 590 ] && [ -n "$(git -C "$REPO" status --porcelain -- "$DIR/log.jsonl" "$DIR/latest.json")" ]; then
    git -C "$REPO" add -- "$DIR/log.jsonl" "$DIR/latest.json" &&
    git -C "$REPO" commit -q -m "ops(higgsfield): sessions log $(date -u +%FT%H:%MZ)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LV3zt1J1EEw61WDkWGfs7s" -- "$DIR/log.jsonl" "$DIR/latest.json" &&
    for i in 1 2 3 4; do
      git -C "$REPO" pull -q --rebase --autostash origin "$BRANCH" && git -C "$REPO" push -q origin "$BRANCH" && break
      sleep $((2 ** i))
    done
    last_push=$now
  fi
  left=$((300 - $(date +%s) + now)); [ $left -gt 0 ] && sleep $left
done
