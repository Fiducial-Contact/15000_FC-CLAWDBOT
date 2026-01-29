## ADDED Requirements
### Requirement: Personal Shortcuts in Skills Panel
The chat interface SHALL display a per-user Personal section in the Skills panel for learned shortcuts.

#### Scenario: Personal section shows user shortcuts
- **GIVEN** an authenticated user has learned shortcuts
- **WHEN** the user opens the Skills panel
- **THEN** the Personal section lists those shortcuts

#### Scenario: Empty state for Personal shortcuts
- **GIVEN** an authenticated user has no learned shortcuts
- **WHEN** the user opens the Skills panel
- **THEN** the Personal section shows an empty state with guidance

#### Scenario: Shortcut click prefills input
- **GIVEN** a user opens the Skills panel
- **WHEN** the user clicks a Personal shortcut
- **THEN** the chat input is prefilled with that shortcut text
