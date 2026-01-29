# HEARTBEAT.md - Periodic Tasks

## System Health Check (Every 6 hours)

When checking system health:
1. Run `ssh root@46.224.225.164 "clawdbot status"` to check gateway status
2. If any channel shows ERROR or DISCONNECTED, alert Haiwei
3. Check for pending pairing requests — list them if any

## Pending Pairing Reminder

Check `clawdbot pairing list msteams` and `clawdbot pairing list whatsapp`:
- If pending requests exist for >30 min, remind Haiwei to approve or reject

## User Tasks / Reminders

Do not manage per-user reminders in heartbeat. Use cron-backed reminders and per-user storage:

- Skill: `fc-reminders`
- Files: `memory/users/<provider>/<senderId>.tasks.json`

## Quiet Hours

- Don't send proactive messages between 22:00 - 08:00 UK time
- Unless it's a critical system alert (channel down, gateway offline)

## What NOT to Do

- Don't spam status updates if everything is fine
- Don't check external services (Adobe status, etc.) unless asked
- If nothing needs attention, just reply: HEARTBEAT_OK
