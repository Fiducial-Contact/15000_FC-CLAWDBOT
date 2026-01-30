## MODIFIED Requirements

### Requirement: Content Block Rendering
The chat interface SHALL render message content blocks from the gateway, including text, image, and image_url blocks. Unsupported block types SHALL be ignored. Assistant message groups SHALL display hover-visible feedback buttons (thumbs up / thumbs down) for user quality signals.

#### Scenario: Render image content block

- **WHEN** a message includes image or image_url blocks
- **THEN** the UI displays the image inline and allows full-size viewing on click

#### Scenario: Feedback buttons on assistant messages

- **WHEN** the user hovers over an assistant message group
- **THEN** thumbs-up and thumbs-down icon buttons SHALL appear
- **AND** clicking a button SHALL capture a feedback signal without requiring text input
- **AND** the clicked button SHALL show a brief color confirmation (1.5s)
- **AND** buttons SHALL be disabled for 2 seconds after click to prevent double-click
