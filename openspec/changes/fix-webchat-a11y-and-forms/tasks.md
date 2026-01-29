# Tasks

## 1. Apply accessibility fixes (no behavior changes)
- [x] 1.1 `ChatInput`:
  - [x] Add `aria-label` to the composer textarea.
  - [x] Add `focus-visible:ring-2` treatment to textarea and all buttons.
  - [x] Add `aria-label` to icon-only buttons (attach, mic, stop, send).
- [x] 1.2 `ChatMessage`:
  - [x] Non-decorative images already have alt text (verified existing).
- [x] 1.3 `LoginForm`:
  - [x] Add `name` + `autocomplete` to email input.
  - [x] Add `name` + `autocomplete` to password input.
  - [x] Replace `Signing in...` with `Signing in…` (proper ellipsis).
  - [x] Fixed deprecated `React.FormEvent` to `React.FormEvent<HTMLFormElement>`.

## 2. Verification
- [x] 2.1 `pnpm build` passes.
- [x] 2.2 All icon buttons now have aria-labels.
- [x] 2.3 Form inputs have proper name and autocomplete attributes.
