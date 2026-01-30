## MODIFIED Requirements

### Requirement: Accessible Composer Input

The chat interface SHALL provide an accessible message composer input:
- The text input MUST have an associated label (visible label or `aria-label`).
- Keyboard focus MUST be visibly indicated (avoid `outline: none` without replacement).
- Icon-only controls MUST include `aria-label`.

#### Scenario: Keyboard user can identify and focus the composer
- **GIVEN** the user is using keyboard navigation
- **WHEN** the user tabs into the chat composer area
- **THEN** the focus indicator is visible
- **AND** assistive technology announces the composer control meaningfully

