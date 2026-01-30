## ADDED Requirements

### Requirement: Agent Learning Display

The AgentInsightPanel SHALL include an "Agent Learning" collapsible section that displays recent learning events produced by the VPS observer. The section SHALL be collapsed by default and visible only when the detail toggle (`showDetails`) is enabled. Each learning event SHALL display: dimension badge, insight text, confidence bar (0-100%), and evidence count.

#### Scenario: Learning section collapsed by default

- **WHEN** the AgentInsightPanel renders
- **THEN** the "Agent Learning" section SHALL be collapsed

#### Scenario: Learning events displayed

- **WHEN** the user expands the "Agent Learning" section and learning events exist
- **THEN** each event SHALL show dimension badge, insight text, confidence bar, and evidence count
- **AND** events SHALL be ordered by `created_at` descending

#### Scenario: Empty learning state

- **WHEN** no learning events exist for the user
- **THEN** the section SHALL display "No learning data yet"

### Requirement: Learning Context in Profile Sync

The profile sync message (`buildProfileSyncMessage`) SHALL include the top 5 learning events with confidence > 0.7 under a `recentLearning:` section, so the Gateway agent retains awareness of previously learned insights across sessions and context breaks.

#### Scenario: High-confidence learning included in sync

- **WHEN** a profile sync message is constructed and learning events exist with confidence > 0.7
- **THEN** the top 5 events (by confidence descending) SHALL be appended to the sync message

#### Scenario: No qualifying learning events

- **WHEN** no learning events have confidence > 0.7
- **THEN** the `recentLearning:` section SHALL be omitted from the sync message
