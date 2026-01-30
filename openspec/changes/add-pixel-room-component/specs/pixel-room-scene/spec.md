## ADDED Requirements

### Requirement: Pixel Room Rendering
The system SHALL render a pixel art office room scene as a React component (`PixelRoom`) using a pre-rendered background image scaled with `image-rendering: pixelated`. The room SHALL display at a native resolution of 320×192 pixels, scaled 2x on desktop (640×384 CSS pixels) and fitting container width on mobile. The component SHALL use CSS variables from the Fiducial design system for its outer container styling.

#### Scenario: Room renders on memory page
- **WHEN** an authenticated user visits `/memory`
- **THEN** a pixel art office room SHALL be visible above the Agent Learning / Activity cards
- **AND** the room SHALL render with crisp pixel edges (no anti-aliasing blur)

#### Scenario: Responsive scaling
- **WHEN** the viewport width is less than 640px
- **THEN** the room SHALL scale to fit the container width while maintaining aspect ratio
- **AND** `image-rendering: pixelated` SHALL be preserved

#### Scenario: Reduced motion preference
- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** all sprite animations and character movement SHALL be paused
- **AND** the character SHALL display in a static idle pose

### Requirement: Agent Character Sprite
The system SHALL render an animated agent character inside the pixel room using CSS sprite sheet animation. The character SHALL use a 32×32 pixel sprite sheet with at least 4 walk frames per direction (down, left, right, up) and at least 2 idle frames. Animation SHALL use CSS `@keyframes` with `steps()` timing function to cycle through sprite frames.

#### Scenario: Character visible in room
- **WHEN** the pixel room renders
- **THEN** exactly one agent character SHALL be visible inside the room bounds

#### Scenario: Walk animation plays
- **WHEN** the character is in the "walk" state
- **THEN** the sprite SHALL cycle through 4 walk frames at ~8 FPS using CSS `steps(4)`
- **AND** the sprite row SHALL correspond to the movement direction (down/left/right/up)

#### Scenario: Idle animation plays
- **WHEN** the character is in the "idle" state
- **THEN** the sprite SHALL display the idle frame(s)
- **AND** the character position SHALL not change

### Requirement: Autonomous Movement
The system SHALL implement a basic behavior loop that autonomously moves the agent character between random waypoints within the room bounds. The loop SHALL cycle: idle (2-4 seconds) → pick random waypoint → walk toward it (CSS transition) → arrive → idle (repeat). Movement SHALL be constrained to a walkable area within the room (excluding walls and furniture).

#### Scenario: Character walks to random position
- **WHEN** the idle timer expires
- **THEN** a random walkable position SHALL be selected within the room bounds
- **AND** the character SHALL move toward it using CSS `transition: transform` over 1-3 seconds
- **AND** the walk sprite animation SHALL play during movement

#### Scenario: Character stays within bounds
- **WHEN** a new waypoint is selected
- **THEN** the waypoint SHALL be within the defined walkable area (not overlapping walls or furniture sprites)

#### Scenario: Behavior loop repeats
- **WHEN** the character arrives at a waypoint
- **THEN** the character SHALL enter idle state for 2-4 seconds (random)
- **AND** the loop SHALL repeat indefinitely

### Requirement: Status Bubble
The system SHALL display a small status bubble above the agent character's head to indicate the current state. The bubble SHALL use CSS animation for appear/disappear transitions.

#### Scenario: Idle state bubble
- **WHEN** the character is idle
- **THEN** a `...` (ellipsis) bubble SHALL be visible above the character

#### Scenario: Walk state bubble
- **WHEN** the character is walking
- **THEN** no status bubble SHALL be displayed

#### Scenario: Bubble transitions
- **WHEN** the character state changes
- **THEN** the bubble SHALL fade in/out over 300ms
