## Context
The Memory page (`/memory`) renders `InsightsClient` which shows agent learning, activity signals, and session history in a 12-column grid. We want to add a decorative pixel art room at the top where an agent character autonomously walks around a miniature office, giving users a "virtual pet" / "nurturing game" impression.

Stakeholders: Fiducial Communications team (end users), brand consistency required.

## Goals / Non-Goals
- Goals:
  - Pixel art office room visible on `/memory` page
  - Animated agent character with walk + idle sprite frames
  - Autonomous behavior loop (idle → walk → idle) with no user input
  - Pixel-crisp rendering at 2-3x scale
  - Responsive: works on desktop and mobile
  - Zero new npm dependencies

- Non-Goals:
  - No game logic (no health, food, XP, leveling)
  - No user interaction with the character (no click/drag)
  - No data-driven behavior yet (that's proposal `add-pixel-agent-data-driven`)
  - No canvas element — pure CSS + DOM

## Decisions

### Decision: Pure CSS sprite animation (not PixiJS/Canvas)
- **Why**: The room is decorative, not interactive. CSS `steps()` + `background-position` is zero-dependency, performant, and trivial to maintain. PixiJS adds ~500KB bundle for no real benefit here.
- **Alternatives considered**:
  - PixiJS/Canvas: More powerful but overkill for a non-interactive decoration
  - react-sprite-animator (npm): Adds dependency for something achievable in ~20 lines of CSS
  - Lottie: Wrong tool for pixel art sprite sheets

### Decision: Single pre-rendered room PNG (not runtime tilemap)
- **Why**: A single 320×192 pixel background image is simpler to create, load, and render than a tilemap engine. No tile collision needed since the character just walks within bounds.
- **Alternatives considered**:
  - Runtime tilemap (2D array → drawImage): More flexible but unnecessary complexity
  - CSS grid of tile divs: DOM-heavy, worse performance

### Decision: CSS transition for movement (not requestAnimationFrame)
- **Why**: The character moves to random waypoints every 2-4 seconds. CSS `transition: transform 1.5s linear` handles smooth movement with zero JS per frame. Only JS needed is the interval to pick new waypoints.
- **Alternatives considered**:
  - requestAnimationFrame loop: More control, but overkill for simple A→B movement

### Decision: Character sprite from free asset pack
- **Why**: Lexlom 32 Characters Pack (itch.io) provides 32x32 pixel characters with 4-direction walk + idle animations, CC-licensed for commercial use.
- **Alternatives considered**:
  - Custom-drawn sprites: Time-consuming, low priority
  - AI-generated: Quality inconsistent for sprite sheets

## Risks / Trade-offs
- **Asset licensing**: Verify Lexlom pack allows commercial use → Mitigation: Check license on download page
- **Room image creation**: Need to composite a simple office room from tileset → Mitigation: Can use a placeholder colored rectangle initially, replace with real art later
- **Performance on low-end mobile**: CSS transitions are GPU-accelerated, should be fine → Mitigation: Add `prefers-reduced-motion` media query to disable animation

## Open Questions
- Exact room dimensions (320×192 at 2x = 640×384 display, or smaller?)
- How many agent characters visible? (1 per user seems right for MVP)
