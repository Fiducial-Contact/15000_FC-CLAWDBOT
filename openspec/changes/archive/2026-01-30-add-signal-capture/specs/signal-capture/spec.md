## ADDED Requirements

### Requirement: Signal Storage

The system SHALL provide an append-only `user_signals` table in Supabase that stores interaction metadata without raw message content. Each signal SHALL include: `id` (UUID), `user_id`, `signal_type`, `payload` (JSONB), `session_key_hash` (SHA-256 truncated 16 chars), and `created_at`. The table SHALL have indexes on `(user_id, created_at)` and `(signal_type, created_at)`. RLS SHALL enforce users can only insert/read their own signals; VPS service-role key bypasses RLS.

#### Scenario: Signal inserted by authenticated user

- **WHEN** an authenticated user's client sends a signal batch
- **THEN** each signal SHALL be inserted with `user_id` matching `auth.uid()`
- **AND** `session_key_hash` SHALL be a SHA-256 hash (first 16 hex chars) of the raw session key

#### Scenario: Raw message content excluded

- **WHEN** a signal is stored
- **THEN** the `payload` SHALL NOT contain raw message text
- **AND** SHALL only contain metadata (word count, topic tags, timing, counts)

#### Scenario: Unauthorized insert rejected

- **WHEN** a request attempts to insert signals for a different user_id
- **THEN** the system SHALL reject the request with 401/403

### Requirement: Signal Batch API

The system SHALL provide `POST /api/signals` for batch inserting up to 50 signals per request (authenticated via Supabase session) and `GET /api/signals` for paginated retrieval with optional `signal_type` filter.

#### Scenario: Batch insert within limit

- **WHEN** a client POSTs a batch of 30 signals
- **THEN** all 30 SHALL be inserted and the response SHALL confirm the count

#### Scenario: Batch exceeds limit

- **WHEN** a client POSTs a batch of 80 signals
- **THEN** only the first 50 SHALL be inserted

#### Scenario: Paginated read with filter

- **WHEN** a client GETs signals with `?type=feedback&limit=20`
- **THEN** the response SHALL return up to 20 signals of type `feedback`, ordered by `created_at` descending

### Requirement: Client Signal Capture

The WebChat client SHALL capture interaction signals via a `useSignalCapture` hook that buffers signals in memory and batch-flushes to the API every 30 seconds and on page unload (`beforeunload`). Signal capture SHALL NOT block or delay the chat message flow.

#### Scenario: Message sent signal

- **WHEN** the user sends a chat message
- **THEN** a `message_sent` signal SHALL be buffered with payload `{ wordCount, hasAttachments, topicTags[] }`

#### Scenario: Rapid messages signal

- **WHEN** the user sends 3 or more messages within 60 seconds
- **THEN** a `rapid_messages` signal SHALL be buffered with payload `{ count, intervalAvgMs }`

#### Scenario: Gateway health signal

- **WHEN** the WebSocket connection drops and reconnects
- **THEN** `gateway_disconnect` and `gateway_reconnect` signals SHALL be buffered

#### Scenario: Batch flush timing

- **WHEN** 30 seconds have elapsed since the last flush
- **THEN** all buffered signals SHALL be sent to `POST /api/signals`
- **AND** the buffer SHALL be cleared

### Requirement: Signal Retention

Signals older than 30 days SHALL be automatically deleted by a daily VPS cron job running `DELETE FROM user_signals WHERE created_at < NOW() - INTERVAL '30 days'` using the Supabase service-role key.

#### Scenario: Old signals pruned

- **WHEN** the daily cron job runs at 03:00 UTC
- **THEN** all signals with `created_at` older than 30 days SHALL be deleted
