## Why
The web chat currently supports text-only messages and ignores gateway image blocks, so users cannot send or view media even though the Gateway supports images. Non-image files also cannot be shared for summarization/transcription workflows. Aligning the UI with the Gateway protocol and adding storage-backed file sharing unlocks core workflows.

## What Changes
- Add image attachments in the composer (select/paste, preview/remove) and send via chat.send attachments.
- Render gateway content blocks including image and image_url in chat history and live messages, with click-to-view.
- Add non-image file upload flow to Supabase Storage and send signed URLs to the agent; show file cards in the UI.
- Enforce size limits (images 5MB, other files 50MB) and surface errors.

## Impact
- Affected specs: chat-interface
- Affected code:
  - src/components/ChatInput.tsx
  - src/components/ChatMessage.tsx
  - src/app/chat/ChatClient.tsx
  - src/lib/gateway/useGateway.ts
  - src/lib/gateway/client.ts
  - src/lib/gateway/types.ts
  - src/lib/supabase/client.ts
  - src/lib/storage/* (new helper)
  - .env.example
