# Tasks

## 1. Validate current usage
- [x] 1.1 Confirm `/api/chat` is not used by the Web UI (`rg -n "/api/chat" src` returns empty).
- [x] 1.2 Confirm there are no docs referencing `/api/chat` (only review-report.md and openspec files reference it).

## 2. Remove or hard-disable the endpoint
- [x] 2.1 Remove `src/app/api/chat/route.ts` (deleted the entire file and directory).
- [x] 2.2 No debug variant kept - the endpoint is completely removed.

## 3. Verification
- [x] 3.1 `pnpm lint` (passes, pre-existing warnings in other files)
- [x] 3.2 `pnpm build` (passes, `/api/chat` no longer in route list)
- [x] 3.3 Route is completely removed - no longer accessible.
