## ADDED Requirements
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
