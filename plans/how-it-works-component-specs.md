# How It Works - Component Specifications

## Core Components

### 1. NeuralNetworkContainer
**Purpose**: Orchestrates the entire scroll-based narrative experience

```typescript
interface NeuralNetworkContainerProps {
  children: React.ReactNode;
  onSectionChange?: (section: string) => void;
}

interface ScrollSection {
  id: string;
  label: string;
  startProgress: number;
  endProgress: number;
}
```

**Responsibilities:**
- Track scroll progress via `useScroll()`
- Calculate which section is active
- Distribute scroll progress to child sections
- Manage global animation state
- Handle reduced motion preferences

**Implementation Notes:**
- Uses Framer Motion's `useScroll` and `useSpring`
- Provides context for nested components
- Throttles scroll calculations for performance

---

### 2. NeuralNode
**Purpose**: Represents a system component in the neural network

```typescript
interface NeuralNodeProps {
  id: string;
  position: { x: number; y: number };
  layer: number;
  type: 'input' | 'gateway' | 'processing' | 'memory' | 'output';
  icon: LucideIcon;
  label: string;
  description?: string;
  status: NodeStatus;
  connections: string[];
  details?: React.ReactNode;
  onActivate?: () => void;
}

type NodeStatus = 'dormant' | 'activating' | 'active' | 'pulsing';

interface NodeState {
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  glowIntensity: MotionValue<number>;
}
```

**Visual States:**

| State | Scale | Opacity | Glow | Animation |
|-------|-------|---------|------|-----------|
| Dormant | 0.7 | 0.3 | None | Static |
| Activating | 0.7 → 1.0 | 0.3 → 1.0 | Building | Spring, 600ms |
| Active | 1.0 | 1.0 | Breathing | Continuous 3s loop |
| Pulsing | 1.0 → 1.2 → 1.0 | 1.0 | Flash | Single pulse, 400ms |

**Animation Variants:**
```typescript
const nodeVariants = {
  dormant: {
    scale: 0.7,
    opacity: 0.3,
    filter: 'brightness(0.5)'
  },
  activating: {
    scale: 1,
    opacity: 1,
    filter: 'brightness(1)',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      mass: 0.8
    }
  },
  active: {
    scale: 1,
    opacity: 1,
    transition: {
      scale: {
        repeat: Infinity,
        repeatType: 'reverse',
        duration: 3,
        ease: 'easeInOut'
      }
    }
  },
  pulsing: {
    scale: [1, 1.2, 1],
    opacity: [1, 1, 1],
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
};
```

**Hover Behavior:**
- Scale: 1.0 → 1.15 (spring, stiffness: 400, damping: 25)
- Glow: Increases 50%
- Details panel: Slides in from right
- Connected paths: Brighten to full opacity

---

### 3. SynapseConnection
**Purpose**: Visualizes data flow between nodes

```typescript
interface SynapseConnectionProps {
  id: string;
  from: string; // Node ID
  to: string;   // Node ID
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  type: 'data' | 'signal' | 'feedback';
  status: ConnectionStatus;
  animated?: boolean;
  pulseDirection?: 'forward' | 'backward' | 'bidirectional';
}

type ConnectionStatus = 'hidden' | 'drawing' | 'active' | 'transmitting';
```

**Path Generation:**
```typescript
function generateCurvedPath(
  from: Point, 
  to: Point, 
  curvature: number = 0.3
): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Perpendicular offset for organic curve
  const offsetX = -dy * curvature;
  const offsetY = dx * curvature;
  
  const controlX = midX + offsetX;
  const controlY = midY + offsetY;
  
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}
```

**Animation Variants:**
```typescript
const pathVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0
  },
  drawing: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1]
      },
      opacity: {
        duration: 0.3
      }
    }
  },
  active: {
    pathLength: 1,
    opacity: 0.6,
    strokeWidth: 2
  },
  transmitting: {
    strokeWidth: [2, 4, 2],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 0.8,
      ease: 'easeInOut'
    }
  }
};
```

**Data Pulse Animation:**
```typescript
const pulseVariants = {
  initial: { offsetDistance: '0%' },
  animate: {
    offsetDistance: '100%',
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};
```

---

### 4. NetworkLayer
**Purpose**: Container for each architectural tier with depth effects

```typescript
interface NetworkLayerProps {
  id: string;
  index: number;
  label: string;
  accentColor: string;
  parallaxSpeed: number;
  children: React.ReactNode;
  isActive: boolean;
}
```

**Structure:**
```
┌─────────────────────────────────────────┐
│  NetworkLayer                           │
│  ┌─────────────────────────────────┐    │
│  │  Ambient Particles (z: -20)     │    │
│  │  ○  ·   ·    ○     ·   ○       │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Connection Layer (z: -10)      │    │
│  │  ═══════  ═══════════           │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Node Container (z: 0)          │    │
│  │  [○]      [○]      [○]          │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Content Panel (z: 10)          │    │
│  │  ┌─────────────────────────┐    │    │
│  │  │  Title & Description    │    │    │
│  │  └─────────────────────────┘    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Visual Styling:**
- Background: Gradient from accent color (5% opacity) to transparent
- Border: Subtle 1px with accent color (10% opacity)
- Shadow: Layered box-shadow for depth
- Particles: Small dots with slow drift animation

---

### 5. ParticleField
**Purpose**: Ambient background particles for atmosphere

```typescript
interface ParticleFieldProps {
  count: number;
  color: string;
  speed: number;
  drift: number;
  layerBounds: { width: number; height: number };
}

interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
}
```

**Animation:**
- Continuous drift in random directions
- Opacity oscillation for twinkling effect
- Wrap around when exiting bounds
- Reduced count on mobile (50 → 20)

---

### 6. ProgressIndicator
**Purpose**: Shows journey progress through the network

```typescript
interface ProgressIndicatorProps {
  sections: ScrollSection[];
  currentSection: string;
  progress: number; // 0-1
  onSectionClick?: (sectionId: string) => void;
}
```

**Visual Design:**
- Vertical line on right edge (fixed position)
- Filled portion indicates progress
- Section markers as dots
- Active section: Larger dot with glow
- Completed sections: Filled dot
- Future sections: Empty dot

**Animation:**
- Progress fill: Smooth spring animation
- Section transitions: Scale pulse on active change
- Hover: Section label tooltip appears

---

### 7. DetailPanel
**Purpose**: Expands to show detailed information about a node

```typescript
interface DetailPanelProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  tags?: { label: string; color: string }[];
  onClose?: () => void;
}
```

**Animation:**
```typescript
const panelVariants = {
  closed: {
    x: '100%',
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
};
```

---

## Section Components

### HeroSection
- **Purpose**: Introduction and network initialization
- **Animation**: Network fades in, central node pulses
- **Content**: Title, subtitle, scroll hint

### UserLayerSection
- **Purpose**: User interfaces and access points
- **Nodes**: Web Chat, Teams, User
- **Connections**: Branch to channel nodes

### GatewayLayerSection
- **Purpose**: Central processing hub
- **Nodes**: Clawdbot Gateway, Tailscale Funnel
- **Animation**: Hub glows, connections radiate outward

### AICoreSection
- **Purpose**: AI processing and memory
- **Nodes**: Work Agent, Sessions, Memory, Vector DB
- **Animation**: Neural pulse effect, data flow visualization

### WorkspaceSection
- **Purpose**: Configuration and knowledge
- **Nodes**: AGENTS.md, SOUL.md, TOOLS.md, etc.
- **Animation**: Nodes appear as "memory cells"

### DataFlowSection
- **Purpose**: End-to-end data flow visualization
- **Animation**: Continuous particle stream through all layers
- **Special**: Animated sequence showing message journey

### SecuritySection
- **Purpose**: Security features and protections
- **Visual**: Protective mesh or shield overlay
- **Animation**: Nodes pulse with "secure" glow

---

## Custom Hooks

### useScrollProgress
```typescript
function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  return {
    raw: scrollYProgress,
    smooth: smoothProgress,
    getSectionProgress: (start: number, end: number) => 
      useTransform(smoothProgress, [start, end], [0, 1])
  };
}
```

### useNodeActivation
```typescript
function useNodeActivation(
  sectionRange: [number, number],
  delay: number = 0
) {
  const { smooth } = useScrollProgress();
  const [start, end] = sectionRange;
  
  const activationProgress = useTransform(
    smooth,
    [start + delay, end],
    [0, 1]
  );
  
  const isActive = useTransform(
    activationProgress,
    (v) => v > 0.1
  );
  
  const scale = useTransform(
    activationProgress,
    [0, 0.5],
    [0.7, 1]
  );
  
  const opacity = useTransform(
    activationProgress,
    [0, 0.3],
    [0.3, 1]
  );
  
  return { activationProgress, isActive, scale, opacity };
}
```

### useParallax
```typescript
function useParallax(speed: number = 1) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (value) => value * speed);
  return y;
}
```

---

## Animation Timing Reference

### Durations
| Animation Type | Duration | Use Case |
|----------------|----------|----------|
| Micro (hover) | 150-200ms | Button states, small feedback |
| Standard | 300-400ms | Node activation, transitions |
| Dramatic | 600-800ms | Section reveals, path drawing |
| Ambient | 3000-5000ms | Continuous effects, breathing |

### Easing Functions
```typescript
const easings = {
  smooth: [0.4, 0, 0.2, 1],      // Standard transitions
  bounce: [0.34, 1.56, 0.64, 1], // Playful entrances
  elastic: [0.68, -0.55, 0.265, 1.55], // Overshoot effects
  dramatic: [0.87, 0, 0.13, 1],  // Emphasis moments
  linear: [0, 0, 1, 1]           // Continuous loops
};
```

### Spring Configs
```typescript
const springs = {
  gentle: { stiffness: 100, damping: 30, mass: 1 },
  bouncy: { stiffness: 400, damping: 25, mass: 0.8 },
  stiff: { stiffness: 500, damping: 50, mass: 1 },
  slow: { stiffness: 50, damping: 20, mass: 2 }
};
```

---

## Responsive Breakpoints

### Desktop (≥1280px)
- Full neural network layout
- All parallax layers active
- Side-by-side node/content arrangement
- Full particle effects

### Tablet (768px - 1279px)
- Simplified network (fewer connections)
- Reduced parallax (2 layers max)
- Stacked node/content arrangement
- Half particle count

### Mobile (<768px)
- Vertical timeline layout
- No parallax
- Sequential single-column
- Minimal particles (ambient only)
- Touch-optimized interactions

---

## Accessibility Requirements

### Reduced Motion
```typescript
const prefersReducedMotion = 
  typeof window !== 'undefined' && 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Disable complex animations
const animationConfig = prefersReducedMotion 
  ? { duration: 0 } 
  : { duration: 0.6, ease: easings.smooth };
```

### Keyboard Navigation
- Tab through nodes in logical order
- Enter/Space to activate node details
- Arrow keys for section navigation
- Escape to close detail panels

### Screen Reader Support
- Each node has descriptive aria-label
- Live region announces section changes
- Connection descriptions for data flow
- Skip link to main content

### Focus Indicators
- Visible focus ring on all interactive elements
- High contrast focus state (2px solid --fc-red)
- Focus follows scroll activation
