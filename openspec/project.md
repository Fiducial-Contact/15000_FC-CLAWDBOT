# Project Context

## Purpose
Fiducial Team AI Chat - A branded web chat interface for Fiducial Communications team to interact with their AI assistant powered by Clawdbot Gateway.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4 + Fiducial brand tokens
- **Auth**: Supabase Auth
- **Backend**: Clawdbot Gateway WebSocket
- **Animation**: Motion (formerly Framer Motion)
- **Icons**: Lucide React
- **Deploy**: Vercel

## Project Conventions

### Code Style
- TypeScript strict mode
- Functional components with hooks
- CSS variables for brand tokens (--fc-red, --fc-action-red, etc.)
- English for all code, comments, and UI text

### Architecture Patterns
- App Router with server/client component separation
- Client components marked with 'use client'
- Custom hooks for state management (useGateway)
- Component-based architecture under src/components/

### File Structure
```
src/
├── app/
│   ├── globals.css      # Fiducial brand tokens
│   ├── layout.tsx       # Font config
│   ├── page.tsx         # Login page
│   └── chat/
│       ├── page.tsx     # Chat page (server)
│       └── ChatClient.tsx # Chat UI (client)
└── components/
    ├── Header.tsx
    ├── LoginForm.tsx
    ├── ChatMessage.tsx
    ├── ChatInput.tsx
    └── ChatSidebar.tsx
```

### Brand Colors
| Color | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Fiducial Red | #be1e2c | --fc-red | Primary accent |
| Action Red | #e20613 | --fc-action-red | Buttons, CTAs |
| Dark Red | #cd2e26 | --fc-dark-red | Hover states |
| Off White | #f7f7fa | --fc-off-white | Background |

## Domain Context

### Clawdbot Integration
- Gateway WebSocket: 46.224.225.164:18789
- Agent: "work" (claude-opus-4-5)
- Persona: "Haiwei's Unpaid Intern" - capable but self-deprecating humor

### AI Capabilities (21 Skills)
1. **Image Creation** (nano-banana-pro) - Generate/edit images
2. **Video Post-Production** (ae-premiere-helper) - AE/Premiere expertise
3. **Video Processing** (video-frames, video-subtitles) - Extract frames, generate subtitles
4. **Video Download** (video-transcript-downloader) - YouTube and other sites
5. **Content Summarization** (summarize, youtube-watcher) - URLs, PDFs, videos
6. **Voice Transcription** (openai-whisper-api) - Speech to text
7. **Reminders** (fc-reminders) - Personal task management
8. **Marketing Suite** (marketing-mode) - 23 sub-skills for copywriting, SEO, ads
9. **Integrations** - Weather, Twitter/X, Slack, Notion, GitHub

## Important Constraints
- Must maintain Fiducial brand consistency
- English UI text only
- No hardcoded secrets in frontend
- Chat history managed by Clawdbot Gateway

## External Dependencies
- Clawdbot Gateway (WebSocket API, default port 18789)
- Supabase (Authentication, Storage, Push subscriptions)
- Vercel (Deployment)
- Web Push (VAPID-based notifications)
