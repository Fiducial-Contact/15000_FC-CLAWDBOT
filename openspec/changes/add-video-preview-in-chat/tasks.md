## 1. Implementation

- [x] 1.1 Update message rendering to detect video sources (attachments + URL parsing)
- [x] 1.2 Render inline video preview cards in chat bubbles
- [x] 1.3 Add a video modal/lightbox with close + playback controls
- [x] 1.4 Ensure accessibility (Escape closes, overlay click closes, focusable dialog)
- [x] 1.5 Add minimal manual test checklist (mp4 URL, mp4 attachment) and verify on mobile + desktop

Manual test checklist (2026-01-29):

- [x] `.mp4` URL in message text renders an inline preview card and opens the modal player.
- [x] `video/*` attachment renders as a preview card (not a generic file card).
- [x] Modal: overlay click closes, Escape closes, prev/next works when multiple videos exist.
- [x] Mobile/touch: controls appear on touch (via `onTouchStart`).
