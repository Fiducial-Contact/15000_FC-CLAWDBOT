## ADDED Requirements

### Requirement: Markdown Message Rendering

The chat interface SHALL render assistant messages as Markdown, supporting common formatting elements for technical conversations.

#### Scenario: Code blocks render with syntax highlighting

- **WHEN** assistant message contains fenced code block (```)
- **THEN** the system SHALL render it with:
  - Monospace font
  - Background color differentiation
  - Language-specific syntax highlighting (if language specified)
  - Copy button in top-right corner

#### Scenario: Inline code renders distinctly

- **WHEN** assistant message contains inline code (`code`)
- **THEN** the system SHALL render it with:
  - Monospace font
  - Subtle background color
  - No line breaks

#### Scenario: Links are clickable

- **WHEN** assistant message contains markdown links or plain URLs
- **THEN** the system SHALL render them as clickable links
- **AND** links SHALL open in new tab

#### Scenario: Lists render properly

- **WHEN** assistant message contains ordered or unordered lists
- **THEN** the system SHALL render them with proper indentation and bullet/number styling

### Requirement: Message Copy Functionality

The chat interface SHALL allow users to copy message content for reuse.

#### Scenario: Copy entire message

- **WHEN** user hovers over a message
- **THEN** a copy button SHALL appear
- **WHEN** user clicks the copy button
- **THEN** the entire message text SHALL be copied to clipboard
- **AND** visual feedback SHALL indicate success

#### Scenario: Copy code block only

- **WHEN** user hovers over a code block within a message
- **THEN** a copy button SHALL appear on the code block
- **WHEN** user clicks the code block copy button
- **THEN** only the code content SHALL be copied (without markdown fences)
