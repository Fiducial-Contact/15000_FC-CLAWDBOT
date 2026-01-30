## Why
Team members need a fast, personal way to reuse “learned” preferences without managing full agent skills. Moving learned items into the Skills panel as Personal shortcuts improves adoption while keeping architecture simple.

## What Changes
- Add a Personal section to the Skills panel for per-user shortcuts.
- Read/write personal shortcuts from the existing user profile storage.
- Allow click-to-prefill (and optional send) from Personal shortcuts.

## Impact
- Affected specs: chat-interface
- Affected code: Skills UI, profile API/client wiring, profile model
