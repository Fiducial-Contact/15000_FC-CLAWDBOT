## Why
Proposal `add-pixel-room-component` delivers a decorative pixel room with a randomly walking agent. This follow-up connects the agent's behavior to real data — learning events, user signals, and gateway connection status — so the character visually reflects the AI assistant's actual state. The character thinks when new learning arrives, sleeps when disconnected, and moves more actively when there's recent signal activity.

## What Changes
- Extend `PixelRoom` props to accept data from InsightsClient (learningEvents, signalSummary, isConnected)
- Add new agent states: `think` (learning event with high confidence), `eureka` (new insight just arrived), `sleep` (gateway disconnected)
- Map data signals to behavior parameters: activity level controls walk speed and idle duration
- Add visual indicators: thought bubble with dimension icon, eureka lightbulb, sleep Zz animation

## Impact
- Affected specs: `pixel-room-scene` (MODIFIED to add data-driven states)
- Affected code: `src/components/PixelRoom/PixelRoom.tsx` (extend props + state machine), `src/components/PixelRoom/pixelroom.css` (new animation states)
- Depends on: `add-pixel-room-component` (MUST be implemented first)
- Reads from existing data: `observer-learning` (LearningEvent[]), `signal-capture` (UserSignal[]), `chat-interface` (isConnected)
- No backend changes
