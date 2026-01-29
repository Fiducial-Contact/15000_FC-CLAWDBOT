## ADDED Requirements

### Requirement: Abort Running Response

The chat interface SHALL allow users to stop an in-progress AI response.

#### Scenario: Stop button appears during response

- **WHEN** AI is generating a response (streaming)
- **THEN** a Stop button SHALL appear in the input area
- **AND** the Send button SHALL be replaced by the Stop button

#### Scenario: Stop button aborts response

- **WHEN** user clicks the Stop button
- **THEN** the system SHALL call `chat.abort` API
- **AND** the streaming response SHALL stop
- **AND** the Stop button SHALL revert to Send button

#### Scenario: Partial response is preserved

- **WHEN** response is aborted mid-stream
- **THEN** the partial response received so far SHALL remain visible
- **AND** no "incomplete" indicator is required

### Requirement: Main Session Pinned Display

The chat sidebar SHALL visually distinguish and pin the main session at the top.

#### Scenario: Main session displays first

- **WHEN** user has multiple chat sessions
- **THEN** the main session SHALL always appear first in the sidebar list
- **AND** other sessions SHALL appear below in chronological order

#### Scenario: Main session has visual indicator

- **WHEN** main session is displayed in sidebar
- **THEN** it SHALL have a "Main" label/badge
- **AND** it SHALL NOT have a delete button

#### Scenario: Main session cannot be deleted

- **WHEN** user attempts to delete the main session
- **THEN** the system SHALL display an error message
- **AND** the session SHALL NOT be deleted

## MODIFIED Requirements

### Requirement: Session List Filtering

The session list SHALL only display sessions from the webchat channel, filtering out sessions from other channels (WhatsApp, Teams, etc.).

#### Scenario: Only webchat sessions shown

- **WHEN** user opens the chat sidebar
- **THEN** only sessions matching `agent:work:webchat:dm:{userId}*` pattern SHALL be displayed
- **AND** sessions from other channels (e.g., `whatsapp:*`, `msteams:*`) SHALL NOT appear

#### Scenario: Session count reflects filtered list

- **WHEN** the system displays "No conversations yet"
- **THEN** it SHALL only consider webchat sessions
- **AND** other channel sessions SHALL NOT affect this message
