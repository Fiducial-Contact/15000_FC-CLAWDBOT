## MODIFIED Requirements

### Requirement: Attachment Uploads Run Concurrently When Independent

When a user sends a message containing both image and non-image file attachments, the client SHALL start uploads for independent attachment sets concurrently and only send the final message after all required uploads succeed.

#### Scenario: Message with mixed attachments uploads concurrently
- **GIVEN** the user attached at least one image and at least one non-image file
- **WHEN** the user sends the message
- **THEN** the system starts image and file uploads concurrently
- **AND** the system sends the message only after upload results are available

