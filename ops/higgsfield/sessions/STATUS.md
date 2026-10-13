# Higgsfield sessions watcher — status

_Last updated: 2026-10-13 (UTC)_

Read-only watcher for the shared Higgsfield login's active sessions
(`higgsfield.ai/me/settings/sessions`). No credentials are stored in this repo;
the login comes from the `HF_EMAIL` / `HF_PASS` env vars of the runner.

## What works

- Headless Chromium (Playwright 1.56, persistent profile kept outside the repo)
  reaches higgsfield.ai through the egress proxy.
- Auth is Clerk (`clerk.higgsfield.ai`). Flow: `/auth/sign-in` → work-email
  field + Enter → `/auth/email/sign-in` (email + password form).

## Blocked

- `POST clerk.higgsfield.ai/v1/client/sign_ins` returns **429
  `too_many_requests`**. This happened on the first attempt and again on one retry
  5 minutes later, and again 30 minutes after that.
- The email-code fallback (`signIn.create` → email_code) gets the same `too_many_requests` before any code
  is sent. The limit is on creating sign-ins from this runner, not on the password itself.
- Login attempts have stopped for this session.
- No sessions snapshot yet, so `log.jsonl` has not been started.

## Scripts (in this folder)

- `snapshot.cjs [--relogin]`: one JSON line of active sessions. Uses the Clerk `/v1/me/sessions…` JSON the page
  loads, falling back to Clerk's `user.getSessions()`. Exit 3 = logged out.
- `login-code.cjs <codeFile>`: email-code login, the fallback when the password form gets 429. Email code is
  enabled in Higgsfield's Clerk config.
- `diff.cjs`: alert lines for a new session, or an existing one with a new IP or country.
- `loop.sh`: snapshot every 5 min into `log.jsonl` and `latest.json`, push every 10 min if changed, one
  re-login when logged out. Needs `STATE` (a directory outside the repo) and optionally `HF_PROFILE`.

Lockout policy (Clerk): 20 failed attempts → 60 min lock. The 429s above are rate limits, not failed attempts.

## Next

- After a successful login, sessions are probably read from Clerk's
  `GET /v1/me/sessions/active`. To be confirmed.
- Snapshot fields: device, browser, IP, city/country, last active (UTC).
