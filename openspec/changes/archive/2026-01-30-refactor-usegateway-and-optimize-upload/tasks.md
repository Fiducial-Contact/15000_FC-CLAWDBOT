# Tasks

## 1. Refactor scaffolding (no behavior changes)
- [x] 1.1 Extract pure helper for attachment upload orchestration (`uploadAttachmentsInParallel`).
- [ ] 1.2 Extract session key parsing + filtering helpers into a dedicated module (deferred - low priority).
- [ ] 1.3 Split `useGateway.ts` into small internal helpers (deferred - low priority, higher risk).

## 2. Parallelize independent uploads
- [x] 2.1 Update send flow so image and file uploads begin concurrently using `Promise.allSettled`.
- [x] 2.2 Maintain existing error behavior: on any upload failure, do not send the message and show error state.

## 3. Verification
- [x] 3.1 `pnpm build` passes
- [x] 3.2 Code review confirms parallel upload structure
- [ ] 3.3 Manual testing: send message with both image + file attachments (to be tested by user)

## Notes
- The core optimization (parallel uploads) is complete and functional.
- Further decomposition of `useGateway.ts` is deferred as it carries higher regression risk and lower immediate value.
- The `uploadAttachmentsInParallel` helper consolidates the upload logic and uses `Promise.allSettled` to run image and file uploads concurrently.
