## Why

The `useGateway` hook currently concentrates many responsibilities (connection lifecycle, session list management, history loading, streaming, uploads, error handling). This makes the code hard to maintain and increases risk when changing any single part.

Additionally, sending a message with both image and file uploads currently performs uploads sequentially (images then files), causing avoidable latency.

## What Changes

- Refactor `useGateway` into smaller focused hooks/modules without changing behavior.
- Start independent uploads in parallel (images + files) and await them together.
- Consolidate duplicated upload + attachment patching logic to reduce bugs.

## Impact

- Affected specs: `chat-interface` (observable behavior: faster send when multiple attachment types)
- Affected code:
  - `src/lib/gateway/useGateway.ts`
  - `src/lib/storage/upload.ts` (if helper signatures need adjustment)
- Potential follow-up:
  - Deduplicate `formatFileSize` utilities (tracked separately if not already done)

## Non-Goals

- Introducing new product features.
- Changing gateway protocol payloads beyond timing/parallelism.
- Redesigning UI.

