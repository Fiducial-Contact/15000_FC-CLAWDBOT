## ADDED Requirements
### Requirement: User Profile Persistence
The chat interface SHALL load and persist a per-user profile for the profile modal using authenticated backend storage.

#### Scenario: Load saved profile
- **GIVEN** an authenticated user opens the profile modal
- **WHEN** a saved profile exists
- **THEN** the modal shows the stored values for name, role, software, preferences, and learned context

#### Scenario: Initialize default profile
- **GIVEN** an authenticated user opens the profile modal
- **WHEN** no saved profile exists
- **THEN** the UI initializes a default profile and allows editing

#### Scenario: Save profile updates
- **WHEN** the user saves changes in the profile modal
- **THEN** the system persists the updated profile and refreshes the “Last updated” timestamp

#### Scenario: Save error surfaced
- **WHEN** the profile save request fails
- **THEN** the UI shows a non-blocking error message and keeps the modal open
