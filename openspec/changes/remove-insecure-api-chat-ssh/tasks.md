# Tasks

## 1. Validate current usage
- [ ] 1.1 Confirm `/api/chat` is not used by the Web UI (`rg -n "/api/chat" src` returns empty).
- [ ] 1.2 Confirm there are no docs referencing `/api/chat` (`rg -n "/api/chat" README.md docs openspec`).

## 2. Remove or hard-disable the endpoint
- [ ] 2.1 Remove `src/app/api/chat/route.ts` **OR** replace its handler to return `404` by default.
- [ ] 2.2 If keeping a debug-only variant:
  - [ ] Require Supabase auth
  - [ ] Enforce allowlist for `agent`
  - [ ] Require a feature flag (off by default)
  - [ ] Remove `root@` usage

## 3. Verification
- [ ] 3.1 `pnpm lint`
- [ ] 3.2 `pnpm build`
- [ ] 3.3 Manual: request `/api/chat` and confirm it is not usable without the explicit debug configuration.

