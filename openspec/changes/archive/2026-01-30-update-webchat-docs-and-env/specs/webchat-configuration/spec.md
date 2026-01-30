## ADDED Requirements

### Requirement: Configuration Is Documented and Correct

The system SHALL document all required configuration for running the web chat application such that a developer can start the app locally without guessing environment variable names or ports.

#### Scenario: Developer can configure gateway connection from docs
- **GIVEN** the developer follows the README and `.env.example`
- **WHEN** they set environment variables for gateway connection
- **THEN** the client can connect using `NEXT_PUBLIC_GATEWAY_WS_URL`
- **AND** if the gateway requires a token, the docs specify the correct token env var name used by the UI

### Requirement: Push Notifications Setup Is Documented (If Feature Exists)

If the repository includes Web Push functionality, the system SHALL document:
- required env vars (public/private keys, API token, subject)
- required API endpoints (`/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/send`)
- required Supabase tables

#### Scenario: Developer can enable push notifications end-to-end
- **GIVEN** the developer configured the documented env vars
- **AND** the required Supabase tables exist
- **WHEN** the user enables notifications in the UI
- **THEN** the subscription is saved successfully
- **AND** the relay (if used) can send notifications through the documented send endpoint

### Requirement: Documentation Uses a Single Source of Truth for Ports

The system SHALL document a single canonical gateway port and keep it consistent across:
- `README.md`
- `.env.example`
- `openspec/project.md`
- any deployment docs under `docs/`

#### Scenario: Port values are consistent
- **WHEN** a developer searches the repo for the gateway port
- **THEN** the documented port matches the runtime configuration

