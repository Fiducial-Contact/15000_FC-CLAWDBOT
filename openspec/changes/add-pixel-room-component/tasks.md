## 1. Sprite Assets
- [x] 1.1 Download Lexlom 32 Characters Pack (or similar CC-licensed 32×32 sprite sheet with 4-direction walk + idle)
- [x] 1.2 Create or source a top-down pixel office room background (320×192 native, desk + chair + monitor + bookshelf)
- [x] 1.3 Place assets in `public/sprites/` (agent-walk.png, office-room.png)

> Note: Using canvas-generated placeholder sprites (runtime data URIs). Real PNGs can be dropped into `public/sprites/` later.

## 2. CSS Sprite Engine
- [x] 2.1 Create `src/components/PixelRoom/pixelroom.css` with:
  - `image-rendering: pixelated` container styles
  - `@keyframes sprite-walk` using `steps(4)` to cycle 4 walk frames
  - Direction classes (`.dir-down`, `.dir-left`, `.dir-right`, `.dir-up`) shifting `background-position-y`
  - `.idle` and `.walking` state classes
  - `@media (prefers-reduced-motion: reduce)` override
  - Status bubble appear/fade keyframes

## 3. PixelRoom Component
- [x] 3.1 Create `src/components/PixelRoom/PixelRoom.tsx`:
  - Room container div with background-image (office-room.png)
  - Agent character div with sprite sheet background-image
  - Autonomous behavior loop via `useEffect` + `setInterval`:
    - idle (2-4s random) → pick waypoint → walk → idle
  - Direction calculation based on delta-x/delta-y to waypoint
  - CSS `transition: transform` for smooth movement
  - Status bubble element with conditional rendering
  - Walkable area bounds (exclude furniture zones)
- [x] 3.2 Export component from `src/components/PixelRoom/index.ts`

## 4. Integration
- [x] 4.1 Import `PixelRoom` in `src/app/insights/InsightsClient.tsx`
- [x] 4.2 Add PixelRoom card as `col-span-12` in the grid (above existing Agent Learning card)
- [x] 4.3 Wrap in standard card styling: `bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm`

## 5. Verification
- [x] 5.1 `pnpm dev` — confirm pixel room renders on `/memory` with crisp pixels
- [x] 5.2 Confirm agent character walks around autonomously
- [x] 5.3 Confirm responsive behavior on mobile viewport
- [x] 5.4 Confirm `prefers-reduced-motion` disables animation
- [x] 5.5 `pnpm build` — confirm no build errors
