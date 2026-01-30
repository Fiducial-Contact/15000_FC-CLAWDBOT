# Proposal: Supabase-Backed Session Titles (Show Titles)

## Why
Session titles in WebChat are currently derived from gateway session keys / ids and a local browser cache. This causes repeated, low-signal titles (e.g., many sessions rendered as the same "Chat <prefix>") and inconsistent titles across devices. Gateway `sessions.patch` label updates can also fail due to uniqueness or permissions, which degrades UX.

## What Changes
- Store per-user session display titles in Supabase as UI metadata (keyed by `sessionKey`).
- Use Supabase titles as the primary source for WebChat session display names; gateway labels/origin remain fallbacks.
- Auto-generate a title from the first *meaningful* user message (ignoring internal/noise payloads like profile sync).
- Keep titles non-unique (duplicate titles allowed) to avoid UX-breaking conflicts.
- Ensure profile writes do not overwrite unrelated preferences keys (session titles live under `user_profiles.preferences`).

## Scope / Non-Goals
- No changes to Clawdbot Gateway session store or transcripts.
- No LLM-based title generation in this change (a follow-up can add optional semantic titling).
- No new database tables/migrations (uses existing `user_profiles.preferences` JSONB).

## Impact
- Affected specs:
  - `openspec/specs/chat-interface/spec.md`
- Affected code:
  - `src/lib/gateway/useGateway.ts`
  - `src/components/ChatSidebar.tsx`
  - `src/app/api/profile/route.ts`
  - `src/lib/profile.ts`

## Risks
- Preference JSON growth if session titles are unbounded; mitigate by pruning to only active sessions returned by the gateway.
- Potential write races between profile updates and title updates; mitigate by server-side merging of preference keys in the profile API.

