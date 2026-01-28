# Fiducial Team Chat - Design System

**Brand Source**: `fiducial-brand-guideline` skill  
**Last Updated**: 2026-01-27

---

## Colors

### Brand Palette

| Token | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Fiducial Red | `#be1e2c` | `--fc-red` | Primary brand, logos |
| Action Red | `#e20613` | `--fc-action-red` | CTAs, buttons, links |
| Dark Red | `#cd2e26` | `--fc-dark-red` | Hover states |
| Black | `#1a1b1f` | `--fc-black` | Headings, primary text |
| Body Gray | `#5a5a5a` | `--fc-body-gray` | Body text, descriptions |
| Light Gray | `#868686` | `--fc-light-gray` | Secondary text, timestamps |
| Border Gray | `#e4e4e4` | `--fc-border-gray` | Borders, dividers |
| Off White | `#f7f7fa` | `--fc-off-white` | Page background |
| White | `#ffffff` | `--fc-white` | Cards, inputs, modals |

### Semantic Mapping

```css
:root {
  --background: var(--fc-off-white);
  --foreground: var(--fc-black);
  --accent: var(--fc-action-red);
  --accent-hover: var(--fc-dark-red);
  --muted: var(--fc-body-gray);
  --border: var(--fc-border-gray);
  --card: var(--fc-white);
}
```

---

## Typography

### Font Stack

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headings | Manrope | 700 | H1-H5, titles |
| Body | Inter | 400, 500 | Paragraphs, messages |
| UI | Montserrat | 500, 600 | Buttons, labels, nav |

### Scale

| Element | Size | Line Height | Letter Spacing |
|---------|------|-------------|----------------|
| H1 | 3rem (48px) | 140% | -0.022rem |
| H2 | 2.5rem (40px) | 140% | -0.022rem |
| H3 | 2rem (32px) | 140% | -0.022rem |
| H4 | 1.8rem (28px) | 140% | -0.022rem |
| H5 | 1.5rem (24px) | 140% | -0.022rem |
| Body | 1rem (16px) | 1.75 | normal |
| Small | 0.875rem (14px) | 1.5 | normal |
| XS | 0.75rem (12px) | 1.5 | normal |

---

## Components

### Buttons

**Primary (CTA)**
```
Background: var(--fc-action-red)
Text: white
Hover: var(--fc-dark-red)
Border-radius: 8px
Padding: 12px 24px
Font: Montserrat 600
```

**Secondary**
```
Background: transparent
Border: 1px solid var(--fc-border-gray)
Text: var(--fc-body-gray)
Hover: var(--fc-off-white)
```

**Text Link**
```
Color: var(--fc-action-red)
Hover: var(--fc-dark-red)
Underline: on hover
```

### Cards

```
Background: var(--fc-white)
Border: 1px solid var(--fc-border-gray)
Border-radius: 12px
Shadow: 0 1px 3px rgba(0,0,0,0.08)
Padding: 16px-24px
```

### Inputs

```
Background: var(--fc-white)
Border: 1px solid var(--fc-border-gray)
Border-radius: 8px
Padding: 12px 16px
Focus: 2px solid var(--fc-action-red)
```

---

## Chat-Specific

### User Message Bubble
```
Background: var(--fc-action-red)
Text: white
Border-radius: 16px 16px 4px 16px
Max-width: 80%
Alignment: right
```

### Assistant Message Bubble
```
Background: var(--fc-white)
Border: 1px solid var(--fc-border-gray)
Text: var(--fc-black)
Border-radius: 16px 16px 16px 4px
Max-width: 80%
Alignment: left
Shadow: 0 1px 2px rgba(0,0,0,0.05)
```

### AI Avatar
```
Size: 24px
Background: var(--fc-red)
Shape: circle
Text: "AI" (white, 12px, semibold)
```

---

## Layout

### Spacing Scale

| Token | Size |
|-------|------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

### Container

- Max-width: 1200px (pages), 800px (chat)
- Padding: 16px (mobile), 24px (tablet), 32px (desktop)

### Breakpoints

| Name | Width |
|------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |

---

## Assets

### Logo
- Light bg: `/public/brand/Fiducial-logo-2021_RGB.svg`
- Dark bg: `/public/brand/Fiducial-logo-2021_White_RGB.svg`

### Favicon
- `/public/brand/favicon.png` (32x32)
- `/public/brand/webclip.png` (180x180)

---

## Accessibility

- Focus ring: 2px solid var(--fc-action-red), offset 2px
- Minimum contrast: 4.5:1 for text
- Interactive targets: minimum 44x44px touch target
- Color not sole indicator: always pair with text/icon

---

## Animation (Subtle)

- Transitions: 150ms ease-out (default)
- Hover states: 100ms
- Page transitions: 200ms
- No excessive motion; respect `prefers-reduced-motion`
