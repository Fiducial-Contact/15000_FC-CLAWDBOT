# Proposal: User Signal Capture Pipeline

## Why
The personal AI assistant tracks interaction metadata (message frequency, topic patterns, gateway health events) to enable an "observer" that learns user behavior over time. The WebChat team version currently has no data pipeline for capturing these signals. Without durable signal data, the VPS-side learner (see `add-vps-learner`) has nothing to analyze.

This proposal creates the minimum viable data pipeline: an append-only Supabase table, a client-side capture hook, and a batch API route — no processing, no analysis, just reliable signal collection.

## What Changes
- Create `user_signals` Supabase table (append-only, metadata only — no raw message content).
- Create `useSignalCapture` client hook that buffers signals and batch-flushes to the API every 30s and on page unload.
- Create `POST /api/signals` route for authenticated batch insert.
- Create `GET /api/signals` route for paginated read (used by insights page and VPS agent).
- Capture both user-side signals (message_sent, topic_mentioned, rapid_messages, follow_up, session_duration, feedback) and system-side signals (gateway_disconnect, gateway_reconnect, first_token_delay, stream_aborted).
- Implement 30-day retention via Clawdbot cron (service-role cleanup script on VPS).

## Scope / Non-Goals
- **No signal processing or analysis** — that belongs in `add-vps-learner`.
- **No UI changes** — signal capture is invisible to users.
- **No raw message content** stored — signals contain only metadata, counts, hashes, and tags.
- **System-side signals are client-perspective** — they reflect what the WebChat client observes (e.g., WebSocket disconnect), not Gateway-internal health. A future Phase 2.5 could add Gateway-side hooks for authoritative health data.

## Impact
- Affected specs:
  - New capability: `signal-capture`
- Affected code:
  - `supabase/migrations/YYYYMMDD_create_user_signals.sql` (new)
  - `src/hooks/useSignalCapture.ts` (new)
  - `src/app/api/signals/route.ts` (new)
  - `src/app/chat/ChatClient.tsx` (wire hook, ~10 lines)

## Constraints (must be locked before implementation)

| Constraint | Rule |
|-----------|------|
| **Privacy** | No raw message content; only metadata (word count, topic tags, timestamps, signal type) |
| **Session key storage** | Store `session_key_hash` (SHA-256 truncated to 16 chars), never raw sessionKey (may contain E164/external IDs) |
| **Retention** | Signals older than 30 days auto-deleted via VPS cron (Clawdbot service-role script, runs daily) |
| **Batch limit** | Max 50 signals per POST request |
| **Indexes** | `(user_id, created_at)` and `(signal_type, created_at)` required |

## Risks
- Signal table growth if retention cleanup fails; mitigated by cron monitoring + alert if table exceeds 100K rows.
- Client-side gateway health signals may not match true Gateway state; acknowledged as "client perspective" and documented. Future Gateway hooks can supplement.
- `beforeunload` flush may be unreliable on mobile browsers; accepted — some signal loss on mobile tab close is tolerable.

## Relations
- **Depends on**: Nothing (standalone pipeline).
- **Feeds into**: `add-vps-learner` reads signals for analysis; `add-learning-ui` reads signals for insights page.
