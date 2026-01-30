## Why

The repository documentation and environment examples drifted from the current implementation (ports, env var names, and feature setup steps). This causes avoidable setup failures and operational confusion.

The drift includes (non-exhaustive):
- Gateway port mismatch (README vs config)
- Wrong/missing env var names in `.env.example` compared to code
- Push notifications and required Supabase tables are implemented but not documented
- `openspec/project.md` still references older Gateway connection details

## What Changes

- Align README, `.env.example`, and `openspec/project.md` with actual code/config.
- Document required environment variables for:
  - Web chat (Gateway WS)
  - Supabase auth + storage uploads
  - Web push (public/private keys + API token)
  - Push relay script (if used)
- Document required Supabase tables used by the app (minimum viable schema notes).
- Remove or correct stale configuration claims (e.g., ports/hosts).

## Impact

- Affected specs: new capability `webchat-configuration` (dev/prod configuration contract)
- Affected code: none expected (docs-only, unless we choose to rename env vars in code)
- Affected docs:
  - `README.md`
  - `.env.example`
  - `docs/**` (if we centralize setup)
  - `openspec/project.md`

## Decisions Needed (to finalize)

1) Canonical gateway port for WebSocket:
   - Current implementation indicates `18889` in `config/clawdbot.json` and `start.sh`
   - Docs currently mention `18789` in places

2) Canonical env var naming for gateway auth:
   - Current UI reads `NEXT_PUBLIC_GATEWAY_TOKEN`
   - `.env.example` currently lists `GATEWAY_AUTH_TOKEN`

