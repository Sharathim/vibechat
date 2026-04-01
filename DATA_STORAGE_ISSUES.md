# Data Storage Issues Audit

Date: 2026-04-01

## Scope
This report focuses on persistence/storage risks in backend and frontend code paths (database, credentials, sessions, and client-side storage).

## High Severity

1. Committed Firebase service-account private key in repository
- Evidence: `backend/firebase-credentials.json` contains a full `private_key`.
- Risk: Full backend/admin Firebase compromise if leaked or reused.
- Recommendation:
  - Rotate/revoke the current key immediately.
  - Remove this file from git history and keep only environment-based secrets.
  - Keep only a template file (example JSON without secrets).

2. Hardcoded default secrets and DB credentials
- Evidence:
  - `backend/config.py` defaults `SECRET_KEY` to `dev-secret-key`.
  - `backend/config.py` and `docker-compose.yml` include default PostgreSQL credentials in connection strings.
- Risk: Predictable secrets increase session forgery and unauthorized DB access risk in misconfigured deployments.
- Recommendation:
  - Fail startup if production secret env vars are missing.
  - Move all credentials to environment/secrets manager.
  - Use distinct secrets per environment.

## Medium Severity

3. Split user/auth storage across SQLite + PostgreSQL
- Evidence:
  - App initializes both SQLite (`database/schema.sql`) and PostgreSQL auth DB (`database/pg_schema.sql`) at startup in `backend/app.py`.
  - Auth routes use PostgreSQL helpers, while user/profile/social/music/chat modules use SQLite.
- Risk: Data consistency and identity linkage issues (duplicate users, partial writes, cross-DB drift).
- Recommendation:
  - Consolidate identity + profile data into one primary database.
  - If dual DB is required, add explicit user-link mapping, transactional outbox/sync strategy, and reconciliation jobs.

4. Sensitive token diagnostics are returned to clients on auth failures
- Evidence: `backend/modules/auth/routes.py` returns a `debug` payload with token issuer/audience on 401.
- Risk: Leaks auth internals and can help token probing/fuzzing.
- Recommendation:
  - Return generic auth errors to clients.
  - Keep detailed diagnostics in server logs only.

5. Session cookie secure flag defaults to non-secure
- Evidence: `backend/config.py` has `SESSION_COOKIE_SECURE` default `false`.
- Risk: Session cookie can be transmitted over plain HTTP if TLS termination is misconfigured.
- Recommendation:
  - Default `SESSION_COOKIE_SECURE=true` outside local development.
  - Enforce HTTPS and HSTS at the edge.

## Low Severity

6. Frontend stores user profile in localStorage
- Evidence: `frontend/src/context/AuthContext.tsx` stores `vibechat-user` in localStorage.
- Risk: Any XSS can exfiltrate profile/session-adjacent data; stale local profile can diverge from server state.
- Recommendation:
  - Keep auth in HTTP-only cookies (already used) and minimize localStorage usage.
  - If UI cache is needed, store minimal non-sensitive fields and clear aggressively.

7. Firebase cert cache file persisted in repository workspace
- Evidence: `backend/database/firebase_certs_cache.json` stores fetched cert material + timestamps.
- Risk: Operational noise/staleness and accidental coupling between environments.
- Recommendation:
  - Treat cert cache as runtime artifact and exclude it from version control.
  - Regenerate at startup or via managed cache.

## Suggested Priority Plan
1. Revoke and rotate Firebase service-account key; remove secret from git history.
2. Enforce required production env vars (`SECRET_KEY`, DB credentials) and remove insecure defaults.
3. Decide a single source of truth for user identity storage (SQLite or PostgreSQL) and migrate.
4. Remove auth debug payloads from API responses.
5. Tighten session cookie security defaults and deployment checks.
