## Why
The `/memory` (Agent Memory) page currently displays data in static cards. Adding a pixel art office room with an animated agent character creates a "nurturing game" feel — users see their AI assistant as a living presence that walks around, idles, and thinks in a miniature workspace. This is a visual-only component with no backend changes.

## What Changes
- New `PixelRoom` React component: top-down pixel office room with autonomous agent character
- CSS sprite animation engine: `steps()` keyframes for walk/idle frames, `image-rendering: pixelated` scaling
- Static sprite assets: office room background PNG + agent character sprite sheet (free assets from itch.io)
- Basic autonomous behavior loop: idle (stand still) → walk (random target) → idle (repeat)
- Integration into InsightsClient grid as a new full-width card above the existing 3-card layout

## Impact
- Affected specs: `chat-interface` (InsightsClient is shared by `/memory` and `/insights`)
- Affected code: `src/components/PixelRoom/PixelRoom.tsx` (new), `src/app/insights/InsightsClient.tsx` (add import + render), `public/sprites/` (new assets)
- No backend changes, no new npm dependencies
- Related proposal: `add-pixel-agent-data-driven` (builds on this to add data-driven behavior)
