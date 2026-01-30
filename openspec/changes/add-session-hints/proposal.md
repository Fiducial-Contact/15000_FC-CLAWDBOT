# Proposal: Session-Level Interaction Hints

## Why
The WebChat agent currently has no awareness of in-session interaction patterns (rapid-fire frustration, follow-up questions, topic focus). Every reply uses the same tone/length regardless of whether the user is calmly exploring or impatiently re-asking. The personal AI assistant solves this with an observer that detects behavioral signals; we can achieve a "quick-win" version purely client-side with zero database changes.

## What Changes
- Add a `useSessionHints` hook that detects 4 interaction signals from the current session message stream: rapid-fire, follow-up, topic tags, and long-input.
- Inject detected hints into the existing profile sync message (`buildProfileSyncMessage`) so the Gateway agent can adapt reply style.
- Hints are session-scoped (reset on session switch), never persisted, and fire-and-forget.
- Add debounce (2s) + cooldown (10s) to prevent hint changes from spamming profile sync messages.

## Scope / Non-Goals
- No database changes (no Supabase tables or migrations).
- No new API routes.
- No UI changes — hints are invisible to the user.
- Hints are advisory — the Gateway agent is not forced to act on them; they augment the existing profile sync message.
- Does not replace the existing profile sync mechanism or change its frequency.

## Impact
- Affected specs:
  - `openspec/specs/chat-interface/spec.md`
- Affected code:
  - `src/hooks/useSessionHints.ts` (new)
  - `src/app/chat/ChatClient.tsx` (wire hook + enhance `buildProfileSyncMessage`)

## Risks
- Hint detection is heuristic-based; false positives possible (e.g., user typing fast is not always frustration). Mitigated by keeping hints advisory, not prescriptive.
- Profile sync message grows slightly; mitigated by dedup fingerprint (hints are included in hash, so only changed hints trigger a new sync) and debounce/cooldown.
- Must ensure hint-bearing sync messages still trigger existing suppress/NO_REPLY/noise filtering logic (already handled by `PROFILE_SYNC_PREFIX` detection).

## Relations
- **Standalone**: No dependencies on other observer proposals.
- **Feeds into**: `add-signal-capture` can later persist these hints as durable signals; `add-vps-learner` can consume them for long-term learning.
