# Design

This change is an internal refactor + performance optimization with a tight behavioral scope.

## Goals

1. Reduce cognitive load in `useGateway` by decomposing responsibilities:
   - WebSocket connection + event subscriptions
   - Session selection + persistence
   - History loading + cache/title handling
   - Streaming aggregation + tool event tracking
   - Attachment upload orchestration
2. Improve message send latency by running independent attachment uploads concurrently.

## Proposed Module Boundaries

- `useGatewayConnection()`:
  - Owns `GatewayClient` instance, connect/disconnect, `onChat` + `onTool` subscriptions.
  - Exposes stable callbacks to send/abort/list sessions/history.

- `useGatewaySessions()`:
  - Owns sessions list, current session key, localStorage persistence, title cache.
  - Owns switching/deleting/new-session behavior.

- `useGatewayStreaming()`:
  - Owns streaming buffer, frame scheduling, tool event aggregation/removal timers.

- `uploadAttachments()` helper:
  - Accepts `{ attachments, userId }`
  - Returns `{ updatedAttachments, imageUrlText, fileUrlText }`
  - Uses `Promise.all` across independent uploads

## Parallel Upload Strategy

Current behavior:
- Upload images → update UI
- Upload files → update UI
- Send message

New behavior (same outputs, less latency):
- Start image uploads and file uploads at the same time
- Await both sets
- Patch UI states based on results
- Send message including URLs

Constraints:
- If any upload fails, the message send is aborted and UI reflects the upload error state (current behavior).

## Risks / Mitigations

- Risk: refactor introduces subtle regressions in session selection or history loading.
  - Mitigation: preserve function signatures; add focused unit tests around pure helpers; manual smoke test.

- Risk: parallel uploads increase resource usage.
  - Mitigation: keep concurrency limited to the number of attached files; respect existing size limits.

