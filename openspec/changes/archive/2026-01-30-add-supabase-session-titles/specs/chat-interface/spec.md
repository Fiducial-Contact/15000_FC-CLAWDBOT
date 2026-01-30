# chat-interface Specification (Delta)

## ADDED Requirements

### Requirement: Persistent Session Titles
The system SHALL support per-user session titles for WebChat conversations that persist across browser refreshes and devices.

Notes:
- Titles are UI metadata and MUST NOT require changes to the gateway session transcript.
- Titles MAY be duplicated across sessions (no uniqueness requirement).

#### Scenario: Display stored title from Supabase
- **GIVEN** a user has a stored title for a session key in Supabase
- **WHEN** the session list renders in the WebChat sidebar
- **THEN** the session item uses the stored title as its display name

#### Scenario: Fallback to gateway label/origin when no stored title exists
- **GIVEN** a session has no stored Supabase title
- **WHEN** the session list renders
- **THEN** the UI uses gateway `label` / `displayName` / `origin.label` as a fallback

#### Scenario: Auto-title ignores internal/noise messages
- **GIVEN** the first user message in a session is an internal payload (e.g. profile sync)
- **WHEN** the system selects a title seed
- **THEN** it skips that message and chooses the next meaningful user message

## MODIFIED Requirements
None

## REMOVED Requirements
None

