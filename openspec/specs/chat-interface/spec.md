# chat-interface Specification

## Purpose
TBD - created by archiving change add-capability-showcase-empty-state. Update Purpose after archive.
## Requirements
### Requirement: Capability Showcase Empty State

The chat interface SHALL display a comprehensive capability showcase when no messages exist, enabling users to understand all available AI features within 3 seconds of opening the app.

#### Scenario: Empty chat shows capability cards

- **WHEN** user opens the chat with no message history
- **THEN** the system displays:
  - AI persona introduction text
  - Grid of 8 capability category cards
  - Section of quick action suggestion buttons
  - A "Surprise Me" random prompt button

#### Scenario: Capability card displays category info

- **WHEN** the empty state renders
- **THEN** each capability card SHALL show:
  - Category icon with brand-colored background
  - Category title (e.g., "Image Creation")
  - Brief description (e.g., "Generate/edit images")

#### Scenario: Quick action triggers prompt

- **WHEN** user clicks a quick action button
- **THEN** the system SHALL send the button text as a chat message

#### Scenario: Surprise Me generates random prompt

- **WHEN** user clicks the "Surprise Me" button
- **THEN** the system SHALL randomly select one prompt from all available suggestions and send it as a chat message

### Requirement: Capability Categories Data

The system SHALL define exactly 8 capability categories covering all Clawdbot skills:

| Category | Icon | Skills Covered |
|----------|------|----------------|
| Image Creation | Palette | nano-banana-pro |
| Video Post | Video | ae-premiere-helper |
| Video Tools | Film | video-frames, video-subtitles, video-transcript-downloader |
| Marketing | Megaphone | marketing-mode (23 sub-skills) |
| Reminders | Bell | fc-reminders |
| Summarize | FileText | summarize, youtube-watcher |
| Voice | Mic | openai-whisper-api |
| More Tools | MoreHorizontal | weather, bird, slack, notion, github |

#### Scenario: All 8 categories render

- **WHEN** the empty state loads
- **THEN** exactly 8 capability cards SHALL be visible
- **AND** each card SHALL have unique icon, title, description, and color

### Requirement: Responsive Layout

The capability cards grid SHALL adapt to screen size:
- Desktop (>1024px): 4 columns
- Tablet (640px-1024px): 2 columns  
- Mobile (<640px): 2 columns with smaller cards

#### Scenario: Desktop layout

- **WHEN** viewport width is greater than 1024px
- **THEN** capability cards SHALL display in 4 columns

#### Scenario: Mobile layout

- **WHEN** viewport width is less than 640px
- **THEN** capability cards SHALL display in 2 columns with reduced padding

### Requirement: Quick Suggestions Expansion

The quick action section SHALL display at least 6 diverse suggestion buttons covering multiple capability categories, plus a "Surprise Me" button.

#### Scenario: Diverse suggestions displayed

- **WHEN** empty state renders
- **THEN** quick action buttons SHALL include prompts from at least 4 different capability categories

#### Scenario: Suggestions wrap responsively

- **WHEN** screen width changes
- **THEN** suggestion buttons SHALL wrap to multiple rows as needed

### Requirement: Image Attachments in Composer
The chat interface SHALL allow users to attach image files (image/*) via file picker or paste, preview them, and remove before sending. Images larger than 5MB SHALL be rejected client-side with an error message.

#### Scenario: Attach image and preview
- **WHEN** the user selects or pastes an image up to 5MB
- **THEN** the UI shows an image thumbnail preview with a remove control

#### Scenario: Reject oversized image
- **WHEN** the user selects an image larger than 5MB
- **THEN** the UI rejects the file and shows a size limit error

### Requirement: Send Images via Gateway Attachments
When a message includes image attachments, the client SHALL send them using chat.send attachments with base64-encoded content and preserve any message text.

#### Scenario: Send message with images
- **WHEN** the user sends a message with one or more image attachments
- **THEN** the system sends the message and image attachments to the gateway

### Requirement: Non-Image File Upload via Signed URL
The chat interface SHALL allow users to attach non-image files up to 50MB, upload them to the configured storage bucket, and include a short-lived signed URL in the outgoing user message.

#### Scenario: Upload non-image file
- **WHEN** the user attaches a non-image file up to 50MB
- **THEN** the system uploads it, shows a file card (name, size), and includes a signed URL in the message sent to the agent

### Requirement: Attachment Display in Chat
The chat interface SHALL display user message attachments as inline image thumbnails or file cards alongside the user message content.

#### Scenario: User message shows attachments
- **WHEN** the user sends a message with attachments
- **THEN** the message bubble displays the attached images or file cards

### Requirement: Content Block Rendering
The chat interface SHALL render message content blocks from the gateway, including text, image, and image_url blocks. Unsupported block types SHALL be ignored.

#### Scenario: Render image content block
- **WHEN** a message includes image or image_url blocks
- **THEN** the UI displays the image inline and allows full-size viewing on click

