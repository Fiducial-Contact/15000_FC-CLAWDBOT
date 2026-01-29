# Tasks

## 1. Inventory current truth (code/config)
- [x] 1.1 List env vars referenced in code (`rg -n "process\\.env\\." src`).
- [x] 1.2 Confirm gateway port and host sources (18789 is canonical).
- [x] 1.3 Confirm push endpoints and required tables (`web_push_subscriptions`).

## 2. Update documentation + examples (no behavior changes)
- [x] 2.1 Update `README.md` gateway host/port + connection info + required Supabase table.
- [x] 2.2 Update `.env.example` to include **all required** env vars with correct names:
  - `NEXT_PUBLIC_GATEWAY_WS_URL`
  - `NEXT_PUBLIC_GATEWAY_TOKEN` (renamed from GATEWAY_AUTH_TOKEN)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, `NEXT_PUBLIC_SUPABASE_SIGNED_URL_TTL_SECONDS`
  - `NEXT_PUBLIC_CHAT_IMAGE_MAX_MB`, `NEXT_PUBLIC_CHAT_FILE_MAX_MB`
  - `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`
  - `WEB_PUSH_API_TOKEN`, `WEB_PUSH_SUBJECT`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - Removed unused: `NEXT_PUBLIC_GATEWAY_HOST`, `NEXT_PUBLIC_GATEWAY_PORT`
- [x] 2.3 Update `openspec/project.md` external dependencies section.
- [x] 2.4 Added "Required Supabase tables" section to README with SQL schema.

## 3. Verification
- [x] 3.1 Docs consistency spot-check: all GATEWAY_AUTH_TOKEN references removed from .env.example, NEXT_PUBLIC_GATEWAY_TOKEN properly documented.
- [x] 3.2 Documentation now aligns with code.
