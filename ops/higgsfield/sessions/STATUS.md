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
  5 minutes later. Retries are paused so the shared account doesn't get locked.
- No sessions snapshot yet, so `log.jsonl` has not been started.

## Next

- After a successful login, sessions are probably read from Clerk's
  `GET /v1/me/sessions/active`. To be confirmed.
- Snapshot fields: device, browser, IP, city/country, last active (UTC).
