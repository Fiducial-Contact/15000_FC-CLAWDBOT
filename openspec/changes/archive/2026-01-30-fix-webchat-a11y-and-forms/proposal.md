## Why

The web UI has several accessibility and form best-practice gaps (missing labels, missing autocomplete metadata, focus styling regressions, and non-compliant ellipsis). These issues reduce usability for keyboard users, assistive technologies, and can degrade perceived quality.

This change is focused on standards-level fixes that should not alter product behavior.

## What Changes

- Add missing accessible labeling for chat composer textarea and icon-only buttons.
- Ensure focus-visible styling exists anywhere `outline-none` is used.
- Add `name` + `autocomplete` attributes for auth inputs.
- Replace literal `...` with a typographic ellipsis `…` in user-facing loading copy.
- Keep scope tight: no layout redesign, no new features.

## Impact

- Affected specs:
  - `chat-interface` (composer accessibility)
  - new capability `auth-interface` (login form correctness)
- Affected code (expected):
  - `src/components/ChatInput.tsx`
  - `src/components/ChatMessage.tsx`
  - `src/components/LoginForm.tsx`

