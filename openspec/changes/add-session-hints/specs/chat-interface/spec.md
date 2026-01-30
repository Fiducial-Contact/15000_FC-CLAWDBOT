## ADDED Requirements

### Requirement: Session Interaction Hints

The chat client SHALL detect real-time interaction signals from the current session message stream and inject them into the profile sync message for the Gateway agent to use as advisory context. Hints are session-scoped, never persisted, and subject to debounce (2s) and cooldown (10s) throttling.

#### Scenario: Rapid-fire detection

- **WHEN** the user sends 3 or more messages within 60 seconds
- **THEN** the hint `"user-frustrated"` SHALL be included in the next profile sync

#### Scenario: Follow-up detection

- **WHEN** the user sends a message within 30 seconds of receiving an agent response
- **THEN** the hint `"needs-clarification"` SHALL be included in the next profile sync

#### Scenario: Topic tag detection

- **WHEN** the user message contains domain keywords (e.g., "After Effects", "AE", "Premiere", "render", "expression", "workflow", "subtitles")
- **THEN** a hint `"topic:<detected-topic>"` SHALL be included in the next profile sync

#### Scenario: Long input detection

- **WHEN** the user sends a message longer than 200 characters
- **THEN** the hint `"detailed-question"` SHALL be included in the next profile sync

#### Scenario: Session reset

- **WHEN** the user switches to a different session
- **THEN** all session hints SHALL be cleared

#### Scenario: Debounce and cooldown

- **WHEN** hints change multiple times within 2 seconds
- **THEN** only one profile sync SHALL be triggered after the 2-second debounce window
- **AND** no additional hint-triggered sync SHALL occur for 10 seconds after a sync is sent

#### Scenario: Existing suppress logic preserved

- **WHEN** a profile sync message containing session hints is sent
- **THEN** the message SHALL still be detected as a `PROFILE_SYNC_PREFIX` message
- **AND** the agent response suppression logic SHALL apply normally
