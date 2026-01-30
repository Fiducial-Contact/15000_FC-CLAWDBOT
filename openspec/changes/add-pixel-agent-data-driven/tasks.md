## Prerequisites
- [x] 0.1 `add-pixel-room-component` MUST be implemented and merged first

## 1. Extend PixelRoom Props
- [x] 1.1 Add optional data props to `PixelRoom` interface:
  - `learningEvents?: LearningEvent[]`
  - `signalCount24h?: number`
  - `isConnected?: boolean`
- [x] 1.2 Update InsightsClient to pass real data to PixelRoom:
  - `learningEvents={recentLearning}`
  - `signalCount24h={signalSummary.counts24h.messages}`
  - `isConnected={isConnected}`

## 2. Add New Agent States
- [x] 2.1 Extend behavior state machine with: `think`, `eureka`, `sleep` states
- [x] 2.2 Add think state: triggered by recent learning event (confidence >= 0.5), longer idle (3-5s), thought bubble
- [x] 2.3 Add eureka state: triggered by high-confidence event (>= 0.8, last hour), lightbulb + glow
- [x] 2.4 Add sleep state: triggered by `isConnected === false`, stop movement, Zz bubble, dim overlay
- [x] 2.5 Add wake transition: `isConnected` false→true resumes behavior after 1s

## 3. Activity-Based Tempo
- [x] 3.1 Map `signalCount24h` to behavior tempo:
  - High activity (>20): idle 1-2s, walk 0.8-1.5s
  - Low activity (0): idle 4-6s, walk 2-4s
  - Default (1-20): idle 2-4s, walk 1-3s

## 4. Visual Enhancements
- [x] 4.1 Add CSS for think bubble (💭) with dimension-colored border
- [x] 4.2 Add CSS for eureka bubble (💡) with glow animation
- [x] 4.3 Add CSS for sleep bubble (💤) with slow float animation
- [x] 4.4 Add dim overlay for disconnected state (10% opacity dark)
- [x] 4.5 Map dimension → border color: skill-level=blue, interaction-style=purple, topic-interests=emerald, frustration-signals=red

## 5. Verification
- [x] 5.1 `pnpm dev` — confirm agent shows think/eureka bubbles when learning events exist
- [x] 5.2 Simulate gateway disconnect — confirm sleep state activates
- [x] 5.3 Confirm fallback behavior works when no data props provided
- [x] 5.4 `pnpm build` — confirm no build errors
