## 1. Page Shell
- [x] 1.1 Create `src/app/social/page.tsx` — server component: Supabase auth check, redirect if no user, render `<SocialClient>`
- [x] 1.2 Create `src/app/social/SocialClient.tsx` — client component skeleton: state for activeTab, activeAgent, entries, metrics, loading, error
- [x] 1.3 Implement data fetching in SocialClient: call query helpers from `moltbook.ts` on mount and tab/agent change
- [x] 1.4 Implement 2-minute auto-refresh with `setInterval` + manual refresh button
- [x] 1.5 Implement agent selector dropdown (hidden when AGENTS.length === 1, shown when >1)

## 2. Core Components
- [x] 2.1 Create `src/app/social/components/MetricsBar.tsx` — karma, rank, delta, posts count, win rate in a horizontal strip
- [x] 2.2 Create `src/app/social/components/TabBar.tsx` — Feed / Wins / Daily / Network / Submolt tabs with active state animation
- [x] 2.3 Create `src/app/social/components/FeedView.tsx` — chronological activity list with ActivityCard (type badge, title, content preview, karma, comment count, timestamp)
- [x] 2.4 Create `src/app/social/components/WinsView.tsx` — gallery grid of viral entries with karma highlight
- [x] 2.5 Create `src/app/social/components/DailyView.tsx` — daily snapshot cards with metric deltas

## 3. Integration
- [x] 3.1 Modify `src/components/Header.tsx` — add "Social" nav link with `Users` icon from Lucide, positioned after "Memory" link
- [x] 3.2 Modify `src/lib/supabase/middleware.ts` — expand protected route check to include `/social` path

## 4. Polish
- [x] 4.1 Add empty states for each view (no data yet, no wins yet, no daily snapshots)
- [x] 4.2 Add error state with retry button
- [x] 4.3 Add loading skeleton states
- [x] 4.4 Add AnimatePresence tab transitions (motion/react)
- [x] 4.5 Mobile responsive: horizontal tab scroll, stacked cards, adjusted metrics bar

## 5. Verification
- [x] 5.1 `pnpm build` — no type errors
- [x] 5.2 Navigate to `/social` while logged in — page loads
- [x] 5.3 Navigate to `/social` while logged out — redirects to `/`
- [x] 5.4 Switch tabs — data re-fetches with correct filters
- [x] 5.5 Verify Header shows "Social" link on all pages
- [x] 5.6 Test on mobile viewport — tabs scroll, cards stack
