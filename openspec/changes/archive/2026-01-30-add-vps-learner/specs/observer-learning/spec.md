## ADDED Requirements

### Requirement: Learning Event Storage

The system SHALL provide a `learning_events` table in Supabase that stores structured learning insights produced by the VPS observer. Each event SHALL include: `id` (UUID), `user_id`, `dimension` (one of: skill-level, interaction-style, topic-interests, frustration-signals), `insight` (text), `confidence` (0.0-1.0), `evidence` (JSONB array), `source` (heartbeat | self-review | manual), and `created_at`. RLS SHALL allow users to read their own events; VPS agent writes via service-role.

#### Scenario: Learning event created by heartbeat

- **WHEN** the VPS heartbeat learner produces an insight for a user
- **THEN** the system SHALL insert a row with the appropriate dimension, insight text, confidence score, and evidence references

#### Scenario: User reads own learning events

- **WHEN** an authenticated user requests their profile
- **THEN** the response SHALL include the 20 most recent learning events alongside the profile data

### Requirement: Agent Learning Writeback API

The system SHALL provide `POST /api/profile/learn` authenticated via `AGENT_LEARN_API_KEY` (Bearer token). The endpoint SHALL accept `{ userId, insights: [{ dimension, insight, confidence, evidence }] }`, insert rows into `learning_events`, and update `user_profiles.learned_context[]` for insights with confidence >= 0.5. The endpoint SHALL be rate-limited to 10 requests per minute.

#### Scenario: High-confidence insight written to profile

- **WHEN** the agent POSTs an insight with confidence 0.8
- **THEN** the insight text SHALL be appended to `user_profiles.learned_context[]`
- **AND** the insight SHALL be stored in `learning_events`

#### Scenario: Low-confidence insight stored but not surfaced

- **WHEN** the agent POSTs an insight with confidence 0.3
- **THEN** the insight SHALL be stored in `learning_events`
- **AND** the insight SHALL NOT be appended to `user_profiles.learned_context[]`

#### Scenario: Learned context pruning

- **WHEN** `learned_context[]` reaches 50 items and a new high-confidence insight is added
- **THEN** the item with the lowest confidence SHALL be removed to maintain the 50-item limit

#### Scenario: User-filled fields preserved

- **WHEN** the agent writes to `learned_context[]`
- **THEN** user-filled profile fields (name, role, software, preferences) SHALL NOT be modified

#### Scenario: Rate limit enforced

- **WHEN** more than 10 requests are received within 1 minute
- **THEN** the 11th request SHALL receive HTTP 429

### Requirement: Dimension Rotation Learning

The VPS Gateway agent SHALL run a learning cycle during heartbeat that rotates through 4 dimensions (skill-level → interaction-style → topic-interests → frustration-signals), processing 1 dimension per heartbeat for up to 5 users. The learner SHALL read `TEAM-LEARNER.md` for protocol, track rotation state in `memory/team-learning-state.json`, and respect the data allowlist in `memory/team-data-allowlist.md`.

#### Scenario: Dimension rotation advances

- **WHEN** a heartbeat learning cycle completes for dimension 1 (skill-level)
- **THEN** `team-learning-state.json` SHALL update `nextDimension` to 2

#### Scenario: Silent execution

- **WHEN** the heartbeat learning cycle runs
- **THEN** no messages SHALL be sent to any team member (target: "none" + HEARTBEAT_OK suppression)

#### Scenario: Session scanning

- **WHEN** the learner analyzes a user
- **THEN** it SHALL use `sessions_list` to find the user's active sessions
- **AND** use `sessions_history(limit=50)` to retrieve recent messages as evidence

#### Scenario: Self-healing on missing signals

- **WHEN** the learner finds no signals in `user_signals` for a user who has recent `sessions_history`
- **THEN** it SHALL log a `health_event` insight with dimension `frustration-signals` noting the signal capture gap

#### Scenario: Infra root cause attribution

- **WHEN** user frustration signals (rapid_messages, repeated questions) coincide with gateway_disconnect signals
- **THEN** the learner SHALL attribute the frustration to infrastructure issues, not agent quality
- **AND** the learning event evidence SHALL include the gateway health signal references

### Requirement: Data Privacy Boundary

The learner SHALL only observe and store work-related data as defined in the data allowlist. Personal life details, salary, health information, political/religious views, credentials, and private conversations SHALL NOT be learned or stored.

#### Scenario: Personal topic excluded

- **WHEN** the learner encounters personal life content in a user session
- **THEN** it SHALL skip that content and not record any insight from it

#### Scenario: Work topic included

- **WHEN** the learner encounters software usage, workflow questions, or project references
- **THEN** it SHALL analyze and potentially record an insight for the appropriate dimension
