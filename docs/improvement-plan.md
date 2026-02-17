# Improvement Plan

## Security (Critical)

1. **Harden session secret fallback** — `src/lib/auth.ts` should throw at startup if `SESSION_SECRET` is not set, rather than falling back to a hardcoded default.
2. **Validate API request bodies** — All 22 API routes insert user-supplied data without validation. Add zod schemas to every route handler.
3. **Encrypt AI keys at rest** — `api/ai/keys/route.ts` stores API keys in plaintext SQLite. Encrypt before storing using a key derived from `SESSION_SECRET`.
4. **Strengthen widget PIN auth** — Middleware checks for a header but doesn't verify it against the stored `pinHash`. Widget requests should be HMAC-signed.

## Reliability (High)

5. **Replace silent catch blocks** — `.catch(() => {})` in widget interceptors swallows errors. Log to the pre-patch console reference.
6. **Fix O(n) array spread in event batching** — Replace `pending = [...pending, event]` with `pending.push(event)`.
7. **Handle circular references in console serializer** — `JSON.stringify` on circular objects throws. Use a safe serializer with a replacer function.

## Database (High)

8. **Add indexes on FK columns** — `bugs.projectId`, `devlog.projectId`, `widgetConfig.projectId`, `envVars.projectId` are queried constantly with no indexes.
9. **Add unique constraint on `envVars(projectId, key)`** — Prevents duplicate keys per project.
10. **Add pagination to large queries** — `api/perf/route.ts` fetches up to 1000 rows unbounded.

## Testing (Medium)

11. **Test API routes** — Only 2 test files exist for 22 routes. Add vitest route-level tests starting with auth and bug creation flows.
12. **Test widget interceptors** — Event batching, console patching, and network interception are completely untested.

## Code Quality (Low)

13. **Centralize error response format** — Create a shared `apiError(status, message)` helper used across all routes.
14. **Add rate limiting** — Per-project sliding window on the widget event endpoint.
15. **Document the schema** — Add field-level comments to `src/lib/db/schema.ts`.

## Implementation Order

| Phase | Items |
|-------|-------|
| Phase 1 — Security | #1, #2, #4 |
| Phase 2 — Storage & Reliability | #3, #5, #6, #7, #8, #9 |
| Phase 3 — Quality & Testing | #10, #11, #12, #13, #14, #15 |
