# Tasks

## 1. Apply accessibility fixes (no behavior changes)
- [ ] 1.1 `ChatInput`:
  - [ ] Add `aria-label` (or visible `<label>`) to the composer textarea.
  - [ ] Replace `outline-none` with a focus-visible treatment (ring or outline replacement).
  - [ ] Add `aria-label` to icon-only buttons (e.g., attach).
- [ ] 1.2 `ChatMessage`:
  - [ ] Ensure non-decorative images have alt text (already mostly true).
  - [ ] Add explicit dimensions to non-Next `<img>` tags where feasible (CLS mitigation).
- [ ] 1.3 `LoginForm`:
  - [ ] Add `name` + `autocomplete` to email/password inputs.
  - [ ] Replace `Signing in...` with `Signing in…`.

## 2. Verification
- [ ] 2.1 `pnpm lint`
- [ ] 2.2 `pnpm build`
- [ ] 2.3 Manual keyboard pass:
  - Tab through login form and chat composer
  - Confirm focus is visible
  - Confirm icon buttons announce names via screen reader tooling

