## ADDED Requirements

### Requirement: Skills Status Retrieval

The system SHALL provide a method to retrieve the status of all available Clawdbot skills via Gateway RPC.

#### Scenario: Fetch skills status successfully
- **GIVEN** the user is authenticated and WebSocket is connected
- **WHEN** the client calls `skillsStatus()`
- **THEN** the system returns a list of skills with their availability status

#### Scenario: Handle disconnected state
- **GIVEN** the WebSocket is not connected
- **WHEN** the client calls `skillsStatus()`
- **THEN** the system returns an error indicating connection required

### Requirement: Skills Registry Storage

The system SHALL store skill metadata in Supabase `skills_registry` table with creator attribution.

#### Scenario: Store skill with creator
- **GIVEN** a new skill is registered
- **WHEN** the skill metadata is saved
- **THEN** the creator_id and creator_email are persisted

#### Scenario: Read skills registry
- **GIVEN** an authenticated user
- **WHEN** querying the skills_registry table
- **THEN** all skill metadata is returned (RLS allows read for authenticated)

#### Scenario: Prevent non-creator writes
- **GIVEN** an authenticated user who is not the creator
- **WHEN** they attempt to update a skills_registry record
- **THEN** the update is denied by RLS

### Requirement: Skills Dashboard Page

The system SHALL provide a `/skills` page displaying all available skills in a card grid layout.

#### Scenario: Display skill cards
- **GIVEN** the user navigates to `/skills`
- **WHEN** the page loads
- **THEN** skill cards are displayed showing name, description, status, and creator

#### Scenario: Show skill status indicator
- **GIVEN** a skill has status 'ready', 'missing', or 'disabled'
- **WHEN** the skill card renders
- **THEN** the appropriate status indicator is displayed

#### Scenario: Show creator attribution
- **GIVEN** a skill has creator metadata in registry
- **WHEN** the skill card renders
- **THEN** "By: [creator_email]" is displayed

#### Scenario: Show default attribution for unknown creator
- **GIVEN** a skill has no creator metadata in registry
- **WHEN** the skill card renders
- **THEN** "By: Team" is displayed

#### Scenario: Show connection-required state
- **GIVEN** the Gateway WebSocket is not connected
- **WHEN** the user navigates to `/skills`
- **THEN** the page displays a connection-required message

### Requirement: Skills Navigation

The system SHALL provide navigation to the Skills Dashboard from the main header.

#### Scenario: Navigate to skills page
- **GIVEN** the user is on any authenticated page
- **WHEN** the user clicks "Skills" in the header
- **THEN** the user is navigated to `/skills`

### Requirement: Skills Data Merging

The system SHALL merge Gateway runtime status with Supabase metadata to produce a unified skill view.

#### Scenario: Merge skill data sources
- **GIVEN** Gateway returns skill status and Supabase returns metadata
- **WHEN** skills data is processed for display
- **THEN** each skill combines runtime status from Gateway with metadata from Supabase matched by skill_name
