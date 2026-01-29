# Tasks

## 1. Inventory current truth (code/config)
- [ ] 1.1 List env vars referenced in code (`rg -n "process\\.env\\." src scripts -g '*.{ts,tsx,js,mjs}'`).
- [ ] 1.2 Confirm gateway port and host sources (`config/clawdbot.json`, `start.sh`, README).
- [ ] 1.3 Confirm push endpoints and required tables (`src/app/api/push/**`, `src/lib/gateway/useSkills.ts`).

## 2. Update documentation + examples (no behavior changes)
- [ ] 2.1 Update `README.md` gateway host/port + connection info.
- [ ] 2.2 Update `.env.example` to include **all required** env vars with correct names:
  - `NEXT_PUBLIC_GATEWAY_WS_URL`
  - `NEXT_PUBLIC_GATEWAY_TOKEN` (if used)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, `NEXT_PUBLIC_SUPABASE_SIGNED_URL_TTL_SECONDS`
  - `NEXT_PUBLIC_CHAT_IMAGE_MAX_MB`, `NEXT_PUBLIC_CHAT_FILE_MAX_MB`
  - `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`
  - `WEB_PUSH_API_TOKEN`, `WEB_PUSH_SUBJECT`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - Relay-only (if used): `GATEWAY_WS_URL`, `GATEWAY_TOKEN`, `WEB_PUSH_SEND_URL`
- [ ] 2.3 Update `openspec/project.md` domain context so it matches the implementation.
- [ ] 2.4 Add a minimal “Required Supabase tables” section (names + required columns) to README or `docs/SETUP.md`.

## 3. Verification
- [ ] 3.1 Run a docs consistency spot-check:
  - `rg -n "18789|18889|GATEWAY_AUTH_TOKEN|NEXT_PUBLIC_GATEWAY_TOKEN" README.md .env.example openspec/project.md docs`
- [ ] 3.2 `openspec validate update-webchat-docs-and-env --strict`

