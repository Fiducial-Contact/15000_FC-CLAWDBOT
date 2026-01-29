# Examples

## User asks

"Remind me in 2 hours to export the final cut"

## Expected behavior

1. Resolve provider + senderId (Teams: AAD id; WhatsApp: E.164).
2. Create an isolated cron job:

```bash
clawdbot cron add \
  --name "Reminder" \
  --at "2h" \
  --session isolated \
  --message "Send exactly this reminder (no extra text): Export the final cut" \
  --thinking off \
  --deliver \
  --channel msteams \
  --to "user:<aad-object-id>" \
  --delete-after-run \
  --best-effort-deliver
```

3. Persist the mapping in `memory/users/msteams/<aad-object-id>.tasks.json`.

## Cancel

"Cancel reminder A1B2"

Run:

```bash
clawdbot cron rm <jobId>
```

Then mark the task as cancelled.
