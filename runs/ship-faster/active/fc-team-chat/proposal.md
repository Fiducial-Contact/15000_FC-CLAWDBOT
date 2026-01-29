# Fiducial Team AI Chat

## Goal

Build a branded web chat interface for Fiducial Communications team to interact with their AI assistant (Clawdbot work agent).

## Success Criteria

1. Team members can send messages and receive AI responses
2. UI follows Fiducial brand guidelines (colors, fonts, logo)
3. Connects to remote Gateway (work agent on VPS)
4. Streaming response display
5. Supabase Auth for team member login

## Non-Goals (Phase 1)

- Public access (internal tool only)
- Mobile app
- File upload/download
- Voice input

## Technical Decisions

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + Fiducial brand tokens
- **Auth**: Supabase Auth
- **Backend**: Clawdbot Gateway WebSocket (VPS 46.224.225.164:18789)
- **Agent**: work (claude-sonnet-4-5)
- **Deploy**: Vercel

## Brand Assets

Source: `fiducial-brand-guideline` skill
- Logo: `assets/logos/Fiducial-logo-2021_RGB.svg`
- Primary: #be1e2c (Fiducial Red)
- Action: #e20613 (CTA Red)
- Fonts: Manrope (headings), Inter (body)
- Background: #f7f7fa (off-white)

## Gateway Connection

```
WebSocket: wss://clawdbot.tail297e45.ts.net/ws (or direct IP with SSH tunnel)
Auth: gateway.auth.token
Methods: chat.send, chat.history, connect
```

## Timeline

- Phase 1 (MVP): UI + Auth + Gateway connection
- Phase 2: Conversation history persistence
- Phase 3: Team analytics
