## Why

Clawdbot now generates and returns MP4 videos (e.g., Remotion renders uploaded to Supabase Storage). In the web chat UI, video outputs currently appear as plain links or generic file cards, which is hard to consume quickly.

Users want to preview videos inline and click to expand, similar to image lightbox behavior.

## What Changes

- Detect video URLs inside message content (direct URLs or markdown links) and render them as inline video preview cards.
- Detect video file attachments (mimeType starts with `video/`) and render them as inline video preview cards (instead of generic file cards).
- Add a video lightbox / modal that supports:
  - click-to-open from a preview card
  - close via overlay click or Escape key
  - controls for playback and a download/open action
- Keep existing behavior as fallback (plain link / file card) when video metadata cannot be inferred.

## Impact

- Affected specs: `chat-interface`
- Affected code:
  - `src/components/ChatMessage.tsx` (primary)
  - Potentially small supporting UI helpers (if needed)
- Non-breaking: Existing message rendering stays compatible; this is an additive UI feature.

