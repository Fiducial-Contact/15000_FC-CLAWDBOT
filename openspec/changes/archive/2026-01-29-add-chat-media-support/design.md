## Context
- Gateway chat.send supports attachments but only for image/*, with a 5MB per-image limit; non-image attachments are dropped.
- chat.history returns message content blocks (text, thinking, toolCall, image, image_url), but the UI currently flattens to text only.

## Goals / Non-Goals
- Goals:
  - Enable image upload, preview, send, and render aligned with Gateway protocol.
  - Enable non-image file sharing via storage-backed signed URLs.
  - Preserve Fiducial UI patterns and avoid exposing secrets.
- Non-Goals:
  - Server-side file processing or storage beyond Supabase.
  - Voice recording UI or new gateway capabilities.

## Decisions
- Use Supabase Storage (existing dependency) with a private bucket named webchat-uploads.
- Generate signed URLs with a 1 hour expiry for non-image files and include the URL in the user message text.
- Enforce size limits client-side: images <= 5MB, other files <= 50MB.
- Represent messages with content blocks; render only text, image, and image_url blocks in the UI, ignoring thinking/toolCall blocks.
- For image attachments, send chat.send with attachments containing base64 content, mimeType, and fileName.

## Risks / Trade-offs
- Large uploads on slow connections: mitigate with size limits and clear error feedback.
- Signed URL expiry may block delayed agent processing: 1h TTL balances access and security.
- Private bucket requires correct Supabase Storage policies: document requirement and verify in setup.

## Migration Plan
1) Add storage helper and bucket configuration.
2) Update composer and message rendering to support attachments and content blocks.
3) Manual verification with gateway and history.

## Open Questions
- None.
