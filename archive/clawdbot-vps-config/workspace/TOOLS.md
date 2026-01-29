# TOOLS.md - Environment Notes

## VPS
- **IP:** 46.224.225.164
- **SSH:** `ssh root@46.224.225.164`
- **Tailscale:** clawdbot.tail297e45.ts.net

## Channels
- **WhatsApp:** +8615258727081 (linked)
- **Teams:** Pending admin approval

## New Member Approval (Pairing)

When someone new DMs the bot, they get a pairing code. To approve:

```bash
# List pending requests
ssh root@46.224.225.164 "clawdbot pairing list msteams"

# Approve (replace CODE with actual 8-char code)
ssh root@46.224.225.164 "clawdbot pairing approve msteams <CODE> --notify"
```

Codes expire in 1 hour. After approval, the member is permanently allowed.

## Other Commands
- Check status: `clawdbot status`
- View logs: `clawdbot logs -f`
- Restart gateway: `clawdbot gateway restart`
