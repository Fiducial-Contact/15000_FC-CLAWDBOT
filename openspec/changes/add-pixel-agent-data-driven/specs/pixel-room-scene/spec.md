## MODIFIED Requirements

### Requirement: Autonomous Movement
The system SHALL implement a behavior loop that autonomously moves the agent character between random waypoints within the room bounds. The loop SHALL cycle: idle (2-4 seconds) → pick random waypoint → walk toward it (CSS transition) → arrive → idle (repeat). Movement SHALL be constrained to a walkable area within the room. **The idle duration and walk speed SHALL be influenced by the user's recent signal activity level**: higher activity (more signals in 24h) results in shorter idle pauses and faster walks; low activity results in longer idle pauses and slower walks.

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

#### Scenario: Activity level affects behavior tempo
- **WHEN** the 24h signal count exceeds 20
- **THEN** idle duration SHALL be reduced to 1-2 seconds and walk transitions SHALL be 0.8-1.5 seconds
- **WHEN** the 24h signal count is 0
- **THEN** idle duration SHALL be increased to 4-6 seconds and walk transitions SHALL be 2-4 seconds

### Requirement: Status Bubble
The system SHALL display a small status bubble above the agent character's head to indicate the current state. The bubble SHALL use CSS animation for appear/disappear transitions. **The bubble content SHALL reflect data-driven states in addition to basic idle/walk states.**

#### Scenario: Idle state bubble
- **WHEN** the character is idle and gateway is connected
- **THEN** a `...` (ellipsis) bubble SHALL be visible above the character

#### Scenario: Walk state bubble
- **WHEN** the character is walking
- **THEN** no status bubble SHALL be displayed

#### Scenario: Think state bubble
- **WHEN** the most recent learning event has confidence >= 0.5
- **THEN** a thought bubble (`💭`) SHALL appear during the next idle phase
- **AND** the character SHALL remain idle for 3-5 seconds (longer than normal)

#### Scenario: Eureka state bubble
- **WHEN** a learning event with confidence >= 0.8 exists and was created within the last hour
- **THEN** a lightbulb bubble (`💡`) SHALL appear with a brief glow animation
- **AND** the character SHALL pause for 2 seconds before resuming normal behavior

#### Scenario: Sleep state
- **WHEN** the gateway is disconnected (`isConnected === false`)
- **THEN** the character SHALL stop walking and display a `💤` (Zz) bubble
- **AND** the sprite SHALL show the idle frame with no movement
- **AND** the room SHALL apply a subtle dim overlay (10% opacity dark)

#### Scenario: Bubble transitions
- **WHEN** the character state changes
- **THEN** the bubble SHALL fade in/out over 300ms

## ADDED Requirements

### Requirement: Data-Driven Agent Props
The `PixelRoom` component SHALL accept optional data props to drive agent behavior. When props are not provided, the component SHALL fall back to basic autonomous behavior (idle/walk loop only).

#### Scenario: Full data props provided
- **WHEN** `PixelRoom` receives `learningEvents`, `signalCount24h`, and `isConnected` props
- **THEN** the agent behavior SHALL incorporate think/eureka/sleep states based on data values

#### Scenario: No data props provided (fallback)
- **WHEN** `PixelRoom` is rendered without data props
- **THEN** the agent SHALL use the basic idle → walk → idle loop
- **AND** the status bubble SHALL only show `...` during idle

#### Scenario: Data updates trigger state transitions
- **WHEN** `isConnected` changes from `true` to `false`
- **THEN** the agent SHALL immediately transition to sleep state
- **WHEN** `isConnected` changes from `false` to `true`
- **THEN** the agent SHALL wake up and resume normal behavior after 1 second

### Requirement: Dimension Visual Hints
The system SHALL visually hint at the learning dimension when the agent is in the "think" state, using a small colored indicator matching the dimension badge colors used in the Agent Learning card.

#### Scenario: Skill-level dimension thinking
- **WHEN** the agent enters think state triggered by a `skill-level` learning event
- **THEN** the thought bubble border SHALL use `blue-500` tint (matching the skill-level badge)

#### Scenario: Frustration-signals dimension thinking
- **WHEN** the agent enters think state triggered by a `frustration-signals` learning event
- **THEN** the thought bubble border SHALL use `red-500` tint (matching the frustration badge)
