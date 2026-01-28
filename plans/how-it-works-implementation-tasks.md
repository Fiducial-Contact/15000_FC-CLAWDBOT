# How It Works - Implementation Tasks

## Phase 1: Foundation Setup

### 1.1 Create Directory Structure
```
src/
├── app/
│   └── how-it-works/
│       ├── page.tsx                    # Update existing
│       ├── NeuralNetworkContainer.tsx  # NEW
│       ├── sections/
│       │   ├── HeroSection.tsx         # NEW
│       │   ├── UserLayerSection.tsx    # NEW
│       │   ├── GatewayLayerSection.tsx # NEW
│       │   ├── AICoreSection.tsx       # NEW
│       │   ├── WorkspaceSection.tsx    # NEW
│       │   ├── DataFlowSection.tsx     # NEW
│       │   └── SecuritySection.tsx     # NEW
│       └── components/
│           ├── NeuralNode.tsx          # NEW
│           ├── SynapseConnection.tsx   # NEW
│           ├── NetworkLayer.tsx        # NEW
│           ├── ParticleField.tsx       # NEW
│           ├── ProgressIndicator.tsx   # NEW
│           ├── DetailPanel.tsx         # NEW
│           └── DataPulse.tsx           # NEW
├── components/
│   └── animations/
│       ├── ScrollReveal.tsx            # NEW
│       └── PathDraw.tsx                # NEW
└── hooks/
    ├── useScrollProgress.ts            # NEW
    ├── useNodeActivation.ts            # NEW
    └── useParallax.ts                  # NEW
```

### 1.2 Install Dependencies
Check if additional packages are needed:
- `framer-motion` - Already installed (as `motion`)
- No additional packages required

### 1.3 Update globals.css
Add neural network specific styles:
```css
/* Neural Network Animations */
@keyframes neural-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(190, 30, 44, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 20px rgba(190, 30, 44, 0);
  }
}

@keyframes data-flow {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}

@keyframes particle-drift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10px, -10px); }
}

/* Neural Node States */
.neural-node {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.neural-node.dormant {
  opacity: 0.3;
  transform: scale(0.7);
  filter: brightness(0.5);
}

.neural-node.active {
  animation: neural-pulse 3s infinite ease-in-out;
}

/* Connection Paths */
.synapse-path {
  stroke-linecap: round;
  fill: none;
}

.synapse-path.drawing {
  animation: data-flow 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .neural-node,
  .synapse-path,
  .particle {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Phase 2: Custom Hooks

### 2.1 useScrollProgress.ts
**Priority**: High
**Dependencies**: None

```typescript
'use client';

import { useScroll, useSpring, useTransform, MotionValue } from 'motion/react';

interface ScrollProgressReturn {
  raw: MotionValue<number>;
  smooth: MotionValue<number>;
  getSectionProgress: (start: number, end: number) => MotionValue<number>;
}

export function useScrollProgress(): ScrollProgressReturn {
  const { scrollYProgress } = useScroll();
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const getSectionProgress = (start: number, end: number): MotionValue<number> => {
    return useTransform(smoothProgress, [start, end], [0, 1]);
  };

  return {
    raw: scrollYProgress,
    smooth: smoothProgress,
    getSectionProgress,
  };
}
```

### 2.2 useNodeActivation.ts
**Priority**: High
**Dependencies**: useScrollProgress

```typescript
'use client';

import { useTransform, MotionValue } from 'motion/react';
import { useScrollProgress } from './useScrollProgress';

interface NodeActivationReturn {
  activationProgress: MotionValue<number>;
  isActive: MotionValue<boolean>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  glowIntensity: MotionValue<number>;
}

export function useNodeActivation(
  sectionRange: [number, number],
  delay: number = 0
): NodeActivationReturn {
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
  
  const glowIntensity = useTransform(
    activationProgress,
    [0, 1],
    [0, 1]
  );
  
  return {
    activationProgress,
    isActive,
    scale,
    opacity,
    glowIntensity,
  };
}
```

### 2.3 useParallax.ts
**Priority**: Medium
**Dependencies**: motion

```typescript
'use client';

import { useScroll, useTransform, MotionValue } from 'motion/react';

export function useParallax(speed: number = 1): MotionValue<number> {
  const { scrollY } = useScroll();
  return useTransform(scrollY, (value) => value * speed);
}
```

---

## Phase 3: Core Components

### 3.1 NeuralNode.tsx
**Priority**: High
**Dependencies**: useNodeActivation, framer-motion

**Props Interface:**
```typescript
interface NeuralNodeProps {
  id: string;
  position: { x: number; y: number };
  layer: number;
  type: 'input' | 'gateway' | 'processing' | 'memory' | 'output';
  icon: LucideIcon;
  label: string;
  description?: string;
  sectionRange: [number, number];
  delay?: number;
  connections?: string[];
  details?: React.ReactNode;
  accentColor?: string;
  onHover?: (id: string | null) => void;
}
```

**Key Features:**
- Scroll-triggered activation animation
- Hover scale and glow effects
- Ripple animation on activation
- Connected path highlighting
- Detail panel integration

### 3.2 SynapseConnection.tsx
**Priority**: High
**Dependencies**: framer-motion

**Props Interface:**
```typescript
interface SynapseConnectionProps {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: 'data' | 'signal' | 'feedback';
  status: 'hidden' | 'drawing' | 'active' | 'transmitting';
  animated?: boolean;
  color?: string;
  curvature?: number;
}
```

**Key Features:**
- Organic curved path generation
- SVG stroke-dashoffset animation
- Data pulse particle animation
- Status-based styling

### 3.3 NetworkLayer.tsx
**Priority**: Medium
**Dependencies**: ParticleField

**Props Interface:**
```typescript
interface NetworkLayerProps {
  id: string;
  index: number;
  label: string;
  accentColor: string;
  parallaxSpeed?: number;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}
```

**Key Features:**
- Layered background gradient
- Ambient particle field
- Depth shadow effects
- Parallax positioning

### 3.4 ParticleField.tsx
**Priority**: Medium
**Dependencies**: framer-motion

**Props Interface:**
```typescript
interface ParticleFieldProps {
  count?: number;
  color?: string;
  speed?: number;
  className?: string;
}
```

**Key Features:**
- Random particle generation
- Continuous drift animation
- Opacity oscillation
- Responsive count adjustment

### 3.5 ProgressIndicator.tsx
**Priority**: Medium
**Dependencies**: useScrollProgress

**Props Interface:**
```typescript
interface ScrollSection {
  id: string;
  label: string;
  startProgress: number;
  endProgress: number;
}

interface ProgressIndicatorProps {
  sections: ScrollSection[];
  onSectionClick?: (sectionId: string) => void;
}
```

**Key Features:**
- Fixed position on right edge
- Smooth progress fill
- Section marker dots
- Click-to-navigate

### 3.6 DetailPanel.tsx
**Priority**: Medium
**Dependencies**: framer-motion

**Props Interface:**
```typescript
interface DetailPanelProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose?: () => void;
  position?: 'left' | 'right';
}
```

---

## Phase 4: Section Components

### 4.1 HeroSection.tsx
**Priority**: High
**Content**: 
- Title: "System Architecture"
- Subtitle: "Explore how Fiducial AI processes your requests"
- Central initializing node
- Scroll hint animation

**Scroll Range**: 0% - 10%

### 4.2 UserLayerSection.tsx
**Priority**: High
**Nodes**:
- User (Fiducial Team)
- Web Chat (Primary interface)
- Microsoft Teams (Secondary channel)

**Scroll Range**: 10% - 25%

### 4.3 GatewayLayerSection.tsx
**Priority**: High
**Nodes**:
- Clawdbot Gateway (Central hub)
- Tailscale Funnel (Secure tunnel)

**Scroll Range**: 25% - 40%

### 4.4 AICoreSection.tsx
**Priority**: High
**Nodes**:
- Work Agent (Claude Sonnet)
- Sessions (Active conversations)
- Memory (Vector DB + FTS)

**Scroll Range**: 40% - 55%

### 4.5 WorkspaceSection.tsx
**Priority**: Medium
**Nodes**:
- AGENTS.md
- SOUL.md
- USER.md
- IDENTITY.md
- TOOLS.md

**Scroll Range**: 55% - 70%

### 4.6 DataFlowSection.tsx
**Priority**: High
**Content**: 
- Animated data flow visualization
- Complete path from User → AI → Response
- Continuous pulse animation

**Scroll Range**: 70% - 85%

### 4.7 SecuritySection.tsx
**Priority**: Medium
**Content**:
- Security features grid
- Shield/mesh overlay effect
- Trust indicators

**Scroll Range**: 85% - 95%

---

## Phase 5: Main Page Integration

### 5.1 Update page.tsx
Replace existing vertical list with:

```typescript
export default function HowItWorksPage() {
  const sections = [
    { id: 'hero', label: 'Introduction', startProgress: 0, endProgress: 0.1 },
    { id: 'user', label: 'User Layer', startProgress: 0.1, endProgress: 0.25 },
    { id: 'gateway', label: 'Gateway', startProgress: 0.25, endProgress: 0.4 },
    { id: 'ai-core', label: 'AI Core', startProgress: 0.4, endProgress: 0.55 },
    { id: 'workspace', label: 'Workspace', startProgress: 0.55, endProgress: 0.7 },
    { id: 'data-flow', label: 'Data Flow', startProgress: 0.7, endProgress: 0.85 },
    { id: 'security', label: 'Security', startProgress: 0.85, endProgress: 0.95 },
    { id: 'cta', label: 'Get Started', startProgress: 0.95, endProgress: 1 },
  ];

  return (
    <NeuralNetworkContainer sections={sections}>
      <HeroSection sectionRange={[0, 0.1]} />
      <UserLayerSection sectionRange={[0.1, 0.25]} />
      <GatewayLayerSection sectionRange={[0.25, 0.4]} />
      <AICoreSection sectionRange={[0.4, 0.55]} />
      <WorkspaceSection sectionRange={[0.55, 0.7]} />
      <DataFlowSection sectionRange={[0.7, 0.85]} />
      <SecuritySection sectionRange={[0.85, 0.95]} />
      <CTASection sectionRange={[0.95, 1]} />
      <ProgressIndicator sections={sections} />
    </NeuralNetworkContainer>
  );
}
```

---

## Phase 6: Animation Polish

### 6.1 Easing Functions
Add to globals.css or constants file:
```typescript
export const easings = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.34, 1.56, 0.64, 1],
  elastic: [0.68, -0.55, 0.265, 1.55],
  dramatic: [0.87, 0, 0.13, 1],
};

export const springs = {
  gentle: { stiffness: 100, damping: 30, mass: 1 },
  bouncy: { stiffness: 400, damping: 25, mass: 0.8 },
  stiff: { stiffness: 500, damping: 50, mass: 1 },
};
```

### 6.2 Stagger Animations
For nodes appearing in sequence:
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};
```

### 6.3 Scroll-Linked Animations
```typescript
const { scrollYProgress } = useScroll();

const backgroundColor = useTransform(
  scrollYProgress,
  [0, 0.5, 1],
  ['#fafafa', '#f0f0f5', '#fafafa']
);

const networkOpacity = useTransform(
  scrollYProgress,
  [0, 0.1, 0.9, 1],
  [0, 1, 1, 0.8]
);
```

---

## Phase 7: Responsive Implementation

### 7.1 Breakpoint Adjustments
```typescript
// hooks/useResponsive.ts
import { useEffect, useState } from 'react';

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1280);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
}
```

### 7.2 Mobile Layout
- Vertical timeline instead of network
- Reduced particle count (20 max)
- Simplified connections
- Touch-optimized node sizes (min 44px)

### 7.3 Tablet Layout
- 2-column grid for nodes
- Reduced parallax (2 layers)
- Medium particle count (30)

---

## Phase 8: Testing & Optimization

### 8.1 Performance Checklist
- [ ] 60fps animations on target devices
- [ ] Intersection Observer for visibility
- [ ] Lazy load below-fold sections
- [ ] SVG path optimization
- [ ] Particle count limiting
- [ ] Reduced motion support

### 8.2 Accessibility Checklist
- [ ] Keyboard navigation works
- [ ] Screen reader announcements
- [ ] Focus indicators visible
- [ ] Color contrast compliant
- [ ] Reduced motion respected
- [ ] Touch targets adequate

### 8.3 Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Safari (WebKit)
- [ ] Firefox (Gecko)
- [ ] Mobile Safari
- [ ] Chrome Mobile

---

## Implementation Order Recommendation

1. **Week 1**: Foundation
   - Directory structure
   - Custom hooks
   - NeuralNode component
   - SynapseConnection component

2. **Week 2**: Core Sections
   - NetworkLayer
   - HeroSection
   - UserLayerSection
   - GatewayLayerSection

3. **Week 3**: Advanced Features
   - AICoreSection
   - DataFlowSection with animations
   - ParticleField
   - ProgressIndicator

4. **Week 4**: Polish & Integration
   - Remaining sections
   - Responsive layouts
   - Performance optimization
   - Accessibility improvements

---

## Key Technical Decisions

### Why Framer Motion?
- Already in project (as `motion`)
- Excellent scroll-linked animations
- Spring physics built-in
- AnimatePresence for mount/unmount
- useInView for intersection

### Why SVG for Connections?
- Smooth path animations
- Scalable without quality loss
- stroke-dashoffset for drawing effect
- Easy to apply gradients

### Why CSS Variables for Colors?
- Consistent with existing design system
- Easy theme switching
- Runtime customization
- Better performance than JS

### Why Custom Hooks?
- Reusable scroll logic
- Clean component code
- Testable in isolation
- Easy to adjust parameters
