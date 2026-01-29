# Per-user memory (multi-user inbox)

This folder is the source of truth for **user-scoped** memory and tasks in multi-user DM channels (especially Microsoft Teams).

## Files

- `memory/users/<provider>/<senderId>.md`
  - Per-user notes and preferences.
  - Store anything that should not leak to other users.

- `memory/users/<provider>/<senderId>.tasks.json`
  - Per-user reminders/tasks.
  - Should reference scheduled cron job IDs when applicable.

Providers we care about:

- `msteams`
- `whatsapp`

## Rules (privacy)

- Never put user-specific information into shared memory files like `memory/YYYY-MM-DD.md`.
- Never read or write another user's file.
- Shared memory (`memory/YYYY-MM-DD.md`) is reserved for owner-only ops notes (deployment changes, config changes, incidents).

## Task schema (recommended)

```json
{
  "tasks": [
    {
      "id": "local-short-id",
      "createdAt": "2026-01-26T10:00:00Z",
      "dueAt": "2026-01-26T12:00:00Z",
      "text": "Remind me to export the final cut",
      "status": "scheduled",
      "cronJobId": "<gateway-cron-job-id>",
      "channel": "msteams",
      "target": "user:<aad-object-id>"
    }
  ]
}
```
