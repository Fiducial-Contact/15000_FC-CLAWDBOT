## 1. Gateway message model
- [x] 1.1 Extend gateway types to represent content blocks and attachments
- [x] 1.2 Update useGateway to preserve message blocks from events and history

## 2. Composer attachments
- [x] 2.1 Add file picker + paste image handling + preview/removal to ChatInput
- [x] 2.2 Add attachment state wiring from ChatClient/useGateway to sendMessage
- [x] 2.3 Send image attachments via chat.send (base64 payload)

## 3. Storage uploads for non-image files
- [x] 3.1 Add Supabase Storage helper to upload files and create signed URLs
- [x] 3.2 Send signed URLs in user messages and render file cards
- [x] 3.3 Update .env.example with storage bucket name and limits

## 4. Message rendering
- [x] 4.1 Render content blocks (text, image, image_url) in ChatMessage
- [x] 4.2 Add click-to-view for images (modal or new tab)

## 5. Verification
- [x] 5.1 pnpm tsc --noEmit
- [x] 5.2 pnpm build
- [ ] 5.3 Manual smoke test: image upload/paste, PDF/audio upload, history rendering
