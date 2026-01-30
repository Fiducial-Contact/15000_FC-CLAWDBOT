## 1. Database

- [x] 1.1 Create Supabase migration `20250130000000_create_user_signals.sql` with schema, indexes `(user_id, created_at)` and `(signal_type, created_at)`, and RLS policies
- [x] 1.2 Run migration locally and verify table exists with correct columns and policies

## 2. API Route

- [x] 2.1 Create `src/app/api/signals/route.ts` with POST (batch insert, max 50, auth check `user_id = auth.uid()`) and GET (paginated, optional `signal_type` filter)
- [x] 2.2 Implement session key hashing: receive raw `sessionKey`, store `session_key_hash` (SHA-256, first 16 hex chars)

## 3. Client Hook

- [x] 3.1 Create `src/hooks/useSignalCapture.ts` with buffer, 30s interval flush, and `beforeunload` flush
- [x] 3.2 Implement signal detectors: `message_sent` (word count, has attachments), `topic_mentioned` (keyword match), `rapid_messages` (3+ in 60s), `follow_up` (<30s after agent reply), `session_duration` (on session end/switch)
- [x] 3.3 Implement system signal detectors: `gateway_disconnect`, `gateway_reconnect`, `first_token_delay`, `stream_aborted`
- [x] 3.4 Wire hook into `ChatClient.tsx`: call `captureMessage()` after sendMessage, pass gateway connection state for health signals

## 4. Retention Cleanup

- [x] 4.1 Write VPS cron cleanup script: `DELETE FROM user_signals WHERE created_at < NOW() - INTERVAL '30 days'` (uses Supabase service-role key)
- [ ] 4.2 Deploy script to VPS crontab (daily 03:00 UTC) — requires SSH access to VPS

## 5. Validation

- [x] 5.1 Send messages in webchat → verify `user_signals` table has rows with correct signal types
- [x] 5.2 Verify session_key_hash is stored (not raw sessionKey)
- [x] 5.3 Verify no raw message content in any signal payload
- [x] 5.4 Verify 30s batch flush: send 5 messages rapidly → only 1 API call within 30s
- [x] 5.5 Verify `beforeunload`: close tab → check signals were flushed
- [x] 5.6 Verify GET /api/signals returns paginated results with optional type filter
- [x] 5.7 TypeScript build passes (`npm run build`)

## Dependencies
- None (standalone pipeline)
- Task 4.1-4.2 (VPS cron) can be done in parallel with tasks 1-3

## Parallelizable
- Tasks 1.x (DB) and 3.x (hook) can be developed in parallel
- Task 2.x (API) depends on 1.x for table existence
- Task 4.x (cleanup) is independent, parallelizable with everything
