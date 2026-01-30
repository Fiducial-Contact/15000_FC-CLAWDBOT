## ADDED Requirements

### Requirement: Login Form Uses Standard Form Metadata

The login form SHALL provide correct HTML form metadata for compatibility and accessibility:
- Inputs MUST have a `name` attribute.
- Email input MUST use `type="email"` and `autocomplete="email"`.
- Password input MUST use `type="password"` and `autocomplete="current-password"`.

#### Scenario: Browser and password manager recognize fields correctly
- **GIVEN** the user opens the login page
- **WHEN** the user focuses the email and password fields
- **THEN** the browser can autofill using standard autocomplete semantics
- **AND** the fields remain usable with keyboard navigation

