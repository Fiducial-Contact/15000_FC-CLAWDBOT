---
name: fc-reminders
description: Per-user reminders and tasks for Fiducial Communications (remind me, reminder, set a reminder, follow up, in 10m, in 2 hours, tomorrow, next week, cancel reminder, list my reminders)
---

# FC Reminders (Per-user)

Schedule user-scoped reminders/tasks for a **multi-user** inbox (especially Microsoft Teams).

## Core rules (privacy)

- Reminders/tasks must be **scoped to the requesting user**.
- Never read/write another user's task or memory file.
- Never deliver reminders to "last" unless you are 100% sure it resolves to the same requesting user.

## Files (I/O contract)

**Reads:**

- `memory/users/README.md`
- `memory/users/<provider>/<senderId>.md` (optional notes)
- `memory/users/<provider>/<senderId>.tasks.json`

**Writes:**

- `memory/users/<provider>/<senderId>.tasks.json` (create if missing)

## Provider + senderId

- `provider` is the inbound channel id (e.g. `msteams`, `whatsapp`).
- `senderId` should be a stable identifier for the person:
  - WhatsApp: E.164 phone number
  - MS Teams: AAD object id (UUID)
  - If you cannot infer it safely, ask the user to send `/whoami` (alias: `/id`) once and use that id.

## Scheduling (cron-backed)

Use the Gateway cron scheduler for reminders.

- Create a **one-shot** job with `clawdbot cron add --at ... --session isolated`.
- Use `--delete-after-run` for one-shot reminders.
- Prefer explicit delivery targeting:
  - Teams DM: `--channel msteams --to "user:<aad-object-id>"`
  - WhatsApp DM: `--channel whatsapp --to "+E.164"`

Reminder job prompt must force a minimal reply:

- The cron job message should instruct: "Send exactly the reminder text. No extra commentary."
- Use `--thinking off` (or `minimal`) for reminder jobs.

## Common operations

### Create a reminder

1. Parse due time from the user's request (prefer relative like `20m`, `2h`, `tomorrow 10am`).
2. Create the cron job.
3. Store `{cronJobId, dueAt, text, status}` in the user's tasks JSON.
4. Reply with a short confirmation and the local short id.

### List reminders

- Read the user's tasks JSON and list upcoming scheduled items.

### Cancel a reminder

1. Find the task by local short id.
2. Run `clawdbot cron rm <jobId>`.
3. Mark task as `cancelled`.

## Output format

When scheduling:

- `Scheduled.`
- `When: <human time + timezone>`
- `ID: <short id>`

When listing:

- One line per task: `<ID> - <when> - <text>`
