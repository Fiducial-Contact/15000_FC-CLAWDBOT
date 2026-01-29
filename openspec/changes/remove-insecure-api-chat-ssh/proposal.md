## Why

The repository currently contains an unauthenticated Next.js API route (`/api/chat`) that spawns `ssh` and executes a remote `clawdbot agent ...` command as `root` using user-provided input. Even if unused by the current UI, leaving this in the deployed app is an unnecessary security and operational risk.

## What Changes

- Remove or hard-disable the `/api/chat` SSH proxy route in production builds.
- If an internal chat proxy is still needed for debugging, gate it behind:
  - Supabase authentication (session required)
  - An explicit allowlist for `agent`
  - A non-root remote user (least privilege)
  - A feature flag that is **off by default**

## Impact

- Affected specs: new capability `webchat-api` (security boundary)
- Affected code:
  - `src/app/api/chat/route.ts`
- Affected docs:
  - If any docs mention `/api/chat`, remove/update them.

## Out of Scope

- Refactoring the WebSocket-based GatewayClient flow (tracked separately).
- Improving chat UI/UX (tracked separately).

