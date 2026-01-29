## ADDED Requirements

### Requirement: Video URL Preview in Chat

The chat interface SHALL detect common video URLs in message content (including markdown links) and render them as inline video preview cards.

Supported video formats SHALL include: `mp4`, `mov`, `webm`.

#### Scenario: Assistant message contains a video URL

- **WHEN** an assistant message includes a URL pointing to a supported video
- **THEN** the UI SHALL render an inline video preview card in the message bubble
- **AND** the UI SHALL provide a way to expand the video for playback

### Requirement: Video Attachments Preview in Chat

The chat interface SHALL render video file attachments (mimeType starts with `video/`) as inline video preview cards rather than generic file cards.

#### Scenario: Message contains a video file attachment

- **WHEN** a message contains an attachment with mimeType `video/*` and a resolvable URL
- **THEN** the UI SHALL render an inline video preview card
- **AND** clicking the card SHALL open an expanded player

### Requirement: Video Expand Modal

The chat interface SHALL provide an expanded video player modal for video previews.

#### Scenario: User expands and closes video preview

- **WHEN** the user clicks a video preview card
- **THEN** the UI SHALL open an expanded modal containing a video player with controls
- **AND** the user SHALL be able to close the modal by pressing Escape or clicking the overlay

