## Context

The webchat observer system needs a durable data pipeline to store interaction metadata. This is the "log" layer — append-only signals that downstream consumers (VPS learner, insights page) read asynchronously. Design priorities: privacy-first, low latency impact on chat, simple schema.

## Goals / Non-Goals

- **Goals**: Reliable signal ingestion; privacy-safe storage; efficient querying by user + time range; automated retention cleanup.
- **Non-Goals**: Real-time processing; signal aggregation; ML feature extraction; Gateway-side instrumentation (future).

## Decisions

### Decision 1: Separate table vs. JSONB in user_profiles

**Chosen**: Separate `user_signals` table.

**Why**: Signals are append-only, high-volume, time-series data. Storing them in `user_profiles.preferences` (JSONB) would cause:
- Unbounded JSON growth (same risk flagged in `add-supabase-session-titles` for session titles)
- Write contention with profile updates
- Inefficient time-range queries

**Alternative**: JSONB array in preferences — rejected for above reasons.

### Decision 2: Session key hashing

**Chosen**: Store `session_key_hash` (SHA-256, first 16 hex chars) instead of raw `sessionKey`.

**Why**: Raw session keys may contain E164 phone numbers (WhatsApp) or external IDs. Hashing prevents PII leakage while preserving the ability to group signals by session.

**Trade-off**: Cannot reverse-lookup the original session from a hash. Acceptable — signals are consumed by user_id + time range, not by session lookup.

### Decision 3: Retention via Clawdbot cron (not pg_cron)

**Chosen**: VPS cron script using Supabase service-role key.

**Why**:
- Supabase free tier does not include pg_cron.
- Clawdbot already has cron infrastructure on the VPS (cron-vs-heartbeat.md documents this).
- Keeps all automated maintenance in one place (VPS ops scripts).

**Script**: `DELETE FROM user_signals WHERE created_at < NOW() - INTERVAL '30 days'` — runs daily at 03:00 UTC.

**Alternative A**: pg_cron — requires Supabase Pro plan.
**Alternative B**: External CI/GitHub Actions — adds unnecessary external dependency.

### Decision 4: Batch flush interval

**Chosen**: 30-second interval + `beforeunload` flush.

**Why**: Balances signal freshness (VPS learner runs every 30 min, so 30s granularity is more than sufficient) against HTTP overhead (1 request per 30s vs 1 per message).

**Trade-off**: Up to 30s of signals may be lost on unexpected tab close (not `beforeunload`). Acceptable for non-critical metadata.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Table grows beyond retention capacity | Cron cleanup + monitoring alert at 100K rows |
| Mobile `beforeunload` unreliable | Accept minor signal loss; core learning from VPS-side session scanning |
| Client health signals ≠ Gateway truth | Document as "client perspective"; add Gateway hooks in Phase 2.5 |
| RLS bypass for VPS agent | VPS uses Supabase service-role key (standard pattern for server-side access) |

## Open Questions
- Should `GET /api/signals` support filtering by `signal_type`? (Recommend yes, for insights page filtering.)
