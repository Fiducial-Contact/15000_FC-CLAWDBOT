## Why
The team needs visibility into Moltbook agent activity (VoxAgent, future FinServeAgent) from the web app. Currently, activity data is only viewable in Notion. A dedicated `/social` page in the web app provides a branded, fast, multi-agent dashboard with tabbed views (Feed/Wins/Daily/Network/Submolt) and a metrics bar — matching the existing UI patterns of `/memory`, `/skills`, and `/chat`.

## What Changes
- New `/social` route: server component with Supabase auth gate → `SocialClient` client component
- `SocialClient.tsx`: client orchestrator managing state, data fetching, tab switching, auto-refresh (2-min polling)
- 5 co-located view components in `src/app/social/components/`: MetricsBar, TabBar, FeedView, WinsView, DailyView
- `MetricsBar`: karma, rank, delta, posts count, win rate strip
- `TabBar`: Feed / Wins / Daily / Network / Submolt tabs with animation
- `FeedView`: chronological activity list with ActivityCard sub-component
- `WinsView`: gallery grid of viral entries
- `DailyView`: daily metric snapshot cards
- Header navigation: add "Social" link with `Users` icon after "Memory"
- Middleware: expand auth protection to include `/social`

## Impact
- Affected specs: none (new capability `social-dashboard`)
- Affected code:
  - `src/app/social/page.tsx` (new)
  - `src/app/social/SocialClient.tsx` (new)
  - `src/app/social/components/MetricsBar.tsx` (new)
  - `src/app/social/components/TabBar.tsx` (new)
  - `src/app/social/components/FeedView.tsx` (new)
  - `src/app/social/components/WinsView.tsx` (new)
  - `src/app/social/components/DailyView.tsx` (new)
  - `src/components/Header.tsx` (modified — add Social nav link)
  - `src/lib/supabase/middleware.ts` (modified — expand protected routes)
- No new npm dependencies
- Depends on: `add-moltbook-data-layer` (tables and query helpers must exist)
