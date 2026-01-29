## Context
The web chat UI has a user profile modal implemented with mock data. We need persistent storage tied to the authenticated Supabase user without exposing other users' data.

## Goals / Non-Goals
- Goals: persist profile fields, load on modal open, update on save, surface errors.
- Non-Goals: editing learned context automatically from chat logs, admin override UI, bulk import.

## Decisions
- Store profiles in Supabase table `user_profiles` keyed by `user_id` (auth uid).
- Enforce per-user access with RLS (select/insert/update where `user_id = auth.uid()`).
- Provide a single REST endpoint `/api/profile` (GET/PUT) to keep client logic simple.
- Map `updated_at` to `lastUpdated` in the UI model.

## Risks / Trade-offs
- New table requires migration deployment; missing migration will break profile load/save.
- Storing preferences as JSONB trades strict DB validation for flexibility.

## Migration Plan
1) Deploy migration to create `user_profiles` + RLS policies.
2) Deploy API route + UI wiring.
3) Validate with a test user in the chat UI.

## Open Questions
- Should we also store `frequentTopics` from the UI (currently not editable)?
