## Context
Moltbook is an AI agent social network. Haiwei's agent VoxAgent posts, comments, and replies on Moltbook. A Python logger on the VPS records all activity to a Notion database. The web app needs to display this activity data. Rather than proxying Notion API at runtime, we store data in Supabase (already used for auth, profiles, signals, learning events).

Stakeholders: Haiwei (admin/operator), Fiducial team (viewers via web app).

## Goals / Non-Goals
- Goals:
  - Two Supabase tables capturing all Moltbook activity and daily snapshots
  - TypeScript types shared between data layer and UI
  - Multi-agent support from day one (AGENTS registry array)
  - RLS policies: read for authenticated users, write restricted to service role
  - Query helpers matching the 5 dashboard views: feed, wins, daily, network, submolt

- Non-Goals:
  - No Notion-to-Supabase migration script (data will be dual-written going forward)
  - No realtime subscriptions yet (polling first, realtime in future iteration)
  - No VPS logger changes (separate scope)

## Decisions

### Decision: Supabase over Notion for runtime reads
- **Why**: Supabase is already the project's database. Notion API has 3 req/s rate limit, 200-500ms latency, limited query capabilities. Supabase offers <50ms queries, full SQL, no rate limits, existing auth integration.
- **Alternatives**: Notion REST API proxy (rejected: fragile runtime dependency)

### Decision: Two tables instead of one
- **Why**: Activity entries (posts/comments/replies) and daily snapshots have different schemas, update frequencies, and query patterns. Keeping them separate avoids null columns and simplifies queries.
- **Alternatives**: Single table with `type` discriminator (rejected: daily snapshots have 6+ fields that don't apply to activity entries)

### Decision: `agent_id` text field instead of FK
- **Why**: Agents are defined in code (`AGENTS` array), not in a database table. Using a simple text field (`'voxagent'`, `'finserveagent'`) avoids an unnecessary join table for 2-3 agents.
- **Alternatives**: `agents` table with FK (over-engineering for current scale)

### Decision: `result` as nullable text with check constraint
- **Why**: Result (`viral`, `engaged`, `moderate`, `flat`) is backfilled 6 hours after posting. Null means "not yet evaluated". Check constraint ensures only valid values.
- **Alternatives**: Enum type (harder to migrate), status field (Supabase doesn't have built-in status)

## Risks / Trade-offs
- **Dual-write lag**: Until VPS logger is updated, new data only goes to Notion. Mitigation: update VPS logger promptly after tables exist.
- **Schema evolution**: Adding fields later requires migration. Mitigation: use `jsonb` `metadata` column for ad-hoc fields.
- **RLS complexity**: Service role writes bypass RLS. Mitigation: VPS uses Supabase service key, web app uses anon key (read-only for these tables).

## Migration Plan
1. Run SQL migration to create tables, indexes, RLS policies
2. Verify with test insert via Supabase dashboard or SQL editor
3. Update VPS logger to dual-write (separate change, outside this codebase)

## Open Questions
- None blocking. AGENTS registry hardcodes agent IDs; future admin UI for agent management is out of scope.
