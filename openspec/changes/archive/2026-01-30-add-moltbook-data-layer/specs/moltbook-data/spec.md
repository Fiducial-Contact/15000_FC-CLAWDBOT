## ADDED Requirements

### Requirement: Moltbook Activity Storage
The system SHALL store Moltbook agent activity entries in a `moltbook_activity` Supabase table. Each entry SHALL include agent_id, type, content, karma, result, and timestamps. The `type` field SHALL be constrained to `post`, `comment`, `reply`, `daily`, or `agent`. The `result` field SHALL be nullable and constrained to `viral`, `engaged`, `moderate`, or `flat`.

#### Scenario: Activity entry created by service role
- **WHEN** the VPS logger inserts an activity entry with service_role credentials
- **THEN** the row is persisted with all provided fields and `created_at` defaults to now

#### Scenario: Invalid result value rejected
- **WHEN** an insert provides a `result` value not in the allowed set
- **THEN** the database rejects the insert with a check constraint violation

#### Scenario: Authenticated user reads activity
- **WHEN** an authenticated user queries `moltbook_activity`
- **THEN** all rows are returned (RLS allows SELECT for authenticated role)

#### Scenario: Anonymous user blocked
- **WHEN** an unauthenticated request queries `moltbook_activity`
- **THEN** the request returns zero rows (RLS denies SELECT for anon role)

### Requirement: Moltbook Daily Snapshot Storage
The system SHALL store daily metric snapshots in a `moltbook_daily` Supabase table. Each snapshot SHALL include agent_id, date, karma, rank, karma_delta, followers, posts_today, and comments_today. A unique constraint on `(agent_id, date)` SHALL prevent duplicate snapshots per agent per day.

#### Scenario: Daily snapshot created
- **WHEN** the heartbeat process inserts a daily snapshot for agent `voxagent` on `2026-01-30`
- **THEN** the row is persisted with karma, rank, and delta values

#### Scenario: Duplicate daily snapshot rejected
- **WHEN** a second insert for `voxagent` on `2026-01-30` is attempted
- **THEN** the database rejects the insert with a unique constraint violation

### Requirement: Multi-Agent Registry
The system SHALL define an `AGENTS` registry array in `src/lib/types/social.ts` that serves as the single source of truth for all Moltbook agents. Each agent config SHALL include id, name, displayName, xHandle, and moltbookProfile. Adding a new agent SHALL require only appending to this array.

#### Scenario: VoxAgent is registered
- **WHEN** the AGENTS array is imported
- **THEN** it contains an entry with id `voxagent`, displayName `VoxAgent`, and xHandle `@Voxyz_AI`

#### Scenario: New agent added
- **WHEN** a developer adds a FinServeAgent entry to the AGENTS array
- **THEN** all views that iterate over AGENTS automatically include the new agent with no other code changes

### Requirement: Moltbook Data Query Helpers
The system SHALL provide typed query functions in `src/lib/supabase/moltbook.ts` for each dashboard view: feed, wins, daily, network, and submolt. Each function SHALL accept `agentId`, optional `cursor`, and optional `pageSize` parameters and return typed results.

#### Scenario: Feed query returns recent activity
- **WHEN** `fetchFeed('voxagent')` is called
- **THEN** it returns `ActivityEntry[]` where type is post, comment, or reply, ordered by created_at descending

#### Scenario: Wins query returns viral entries
- **WHEN** `fetchWins('voxagent')` is called
- **THEN** it returns `ActivityEntry[]` where result is `viral`, ordered by karma descending

#### Scenario: Metrics query returns latest snapshot
- **WHEN** `fetchMetrics('voxagent')` is called
- **THEN** it returns `AgentMetrics` with karma, rank, karmaelta, followers, and computed winRate from the latest daily entry
