## ADDED Requirements

### Requirement: No Unauthenticated Remote Command Execution

The system SHALL NOT expose any unauthenticated HTTP endpoint that can execute remote commands (directly or indirectly) in production builds.

#### Scenario: Accidental exposure is prevented
- **GIVEN** the app is deployed with default configuration
- **WHEN** an unauthenticated caller sends a request to any internal/proxy endpoint (e.g. `/api/chat`)
- **THEN** the request is rejected (404/401/403)
- **AND** no remote command is executed as a result of the request

### Requirement: Debug Proxy (If Kept) Is Explicitly Gated

If a debug-only chat proxy endpoint exists, it SHALL be disabled by default and only enabled with explicit configuration intended for internal debugging.

#### Scenario: Debug proxy remains disabled by default
- **GIVEN** the app is deployed without enabling the debug proxy feature flag
- **WHEN** a request is sent to the debug proxy endpoint
- **THEN** the request is rejected (404)

#### Scenario: Debug proxy enforces authentication and allowlist
- **GIVEN** the debug proxy feature flag is enabled intentionally
- **AND** the user is authenticated via Supabase
- **WHEN** the user requests a proxy call with an agent id
- **THEN** the system only allows the request if the agent id is in an explicit allowlist
- **AND** the remote command runs under a least-privileged remote user (not `root`)

