# Tasks

## 1. Refactor scaffolding (no behavior changes)
- [ ] 1.1 Extract pure helper(s) for attachment upload orchestration (returning URLs + updated attachment state).
- [ ] 1.2 Extract session key parsing + filtering helpers into a dedicated module (no logic changes).
- [ ] 1.3 Split `useGateway.ts` into small internal helpers or colocated modules while keeping public API stable.

## 2. Parallelize independent uploads
- [ ] 2.1 Update send flow so image and file uploads begin concurrently.
- [ ] 2.2 Maintain existing error behavior: on any upload failure, do not send the message and show per-attachment error state.

## 3. Verification
- [ ] 3.1 `pnpm lint`
- [ ] 3.2 `pnpm build`
- [ ] 3.3 Manual: send message with both image + file attachments and confirm:
  - UI shows uploading state for both types
  - Both complete faster than sequential behavior
  - Message contains URLs and is delivered

