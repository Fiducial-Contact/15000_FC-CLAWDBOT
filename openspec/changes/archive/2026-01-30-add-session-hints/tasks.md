## 1. Implementation

- [x] 1.1 Create `src/hooks/useSessionHints.ts` with 4 signal detectors (rapid-fire, follow-up, topic-tag, long-input), debounce (2s), and cooldown (10s)
- [x] 1.2 Define topic keyword map for domain-specific detection (After Effects, Premiere, render, expressions, workflow, subtitles)
- [x] 1.3 Modify `buildProfileSyncMessage()` in `ChatClient.tsx` to append `sessionHints: [...]` when hints are present and changed
- [x] 1.4 Wire `useSessionHints` into `ChatClient.tsx` — pass messages array + session key, receive hints
- [x] 1.5 Verify hints reset on session switch (new session = empty hints)

## 2. Validation

- [x] 2.1 Manual test: send 3+ messages in <60s → verify `"user-frustrated"` hint appears in profile sync payload (check via browser DevTools network tab)
- [x] 2.2 Manual test: type "After Effects" in message → verify `"topic:after-effects"` hint appears
- [x] 2.3 Manual test: switch sessions → verify hints reset to empty
- [x] 2.4 Verify debounce: rapid hint changes within 2s produce only 1 sync
- [x] 2.5 Verify cooldown: after a hint sync, no re-sync for 10s even if hints change
- [x] 2.6 Verify existing suppress logic: profile sync with hints still triggers `PROFILE_SYNC_PREFIX` detection → agent does not reply to it
- [x] 2.7 TypeScript build passes (`npm run build`)

## Dependencies
- None (standalone, no DB or VPS changes)

## Parallelizable
- Task 1.1 and 1.2 can be done in parallel
- Task 1.3 depends on 1.1 (needs the hook interface)
