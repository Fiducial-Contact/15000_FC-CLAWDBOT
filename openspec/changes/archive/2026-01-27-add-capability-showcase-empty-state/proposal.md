## Why

Users opening the chat interface don't immediately understand what the AI assistant can do. The current empty state shows only 4 video-related suggestions, missing 17+ other capabilities (image generation, reminders, marketing, content summarization, etc.). This leads to underutilization and poor first impressions.

## What Changes

- **Add Capability Cards Grid**: Display 8 category cards showing all AI capabilities (Image Creation, Video Post, Video Tools, Marketing, Reminders, Summarize, Voice, More Tools)
- **Expand Quick Actions**: Increase from 4 to 8+ suggestion buttons covering diverse use cases
- **Add "Surprise Me" Button**: Random prompt generator to encourage exploration
- **Update AI Persona Display**: Show the "Unpaid Intern" personality in empty state intro text
- **Create CapabilityCard Component**: Reusable card component for capability display

## Impact

- Affected specs: `chat-interface` (new capability)
- Affected code:
  - `src/app/chat/ChatClient.tsx` - Restructure empty state
  - `src/components/CapabilityCard.tsx` - New component
  - Minor updates to imports and constants
