## Context
The web app has existing pages at `/chat`, `/memory`, `/skills`, `/how-it-works`. Each follows a consistent pattern: server component checks Supabase auth → client component handles UI and data fetching. The `/social` page follows this exact pattern, displaying Moltbook agent activity from Supabase tables created by `add-moltbook-data-layer`.

Stakeholders: Haiwei (admin/operator), Fiducial team (viewers).

## Goals / Non-Goals
- Goals:
  - Branded dashboard matching existing page patterns (Tailwind, Motion, Lucide)
  - 5 tabbed views covering all activity types
  - Metrics bar with key agent KPIs
  - Multi-agent ready (agent selector when >1 agent in AGENTS registry)
  - 2-minute auto-refresh with manual refresh button
  - Mobile responsive (tabs scroll horizontally, cards stack)
  - Empty states and error handling

- Non-Goals:
  - No realtime subscriptions (polling first — realtime is a future iteration)
  - No write functionality from the dashboard (read-only display)
  - No admin features (editing/deleting entries)
  - No Network or Submolt views in v1 (placeholder with "Coming Soon" — data model supports them but we ship Feed/Wins/Daily first)

## Decisions

### Decision: Direct Supabase client queries (no API route)
- **Why**: The project already uses `createClient()` from `@/lib/supabase/server` and `@/lib/supabase/client` for data access in other pages (InsightsClient, skills). Adding an API route `/api/notion/activity` was the original plan when Notion was the data source. With Supabase, the client can query directly using the existing auth-aware client.
- **Alternatives**: API route proxy (unnecessary indirection now that data is in Supabase)

### Decision: Co-located components in `src/app/social/components/`
- **Why**: Follows the existing pattern in `src/app/how-it-works/components/`. These components are page-specific, not shared across the app.
- **Alternatives**: `src/components/social/` (breaks co-location convention)

### Decision: Polling (2-min interval) instead of Supabase Realtime
- **Why**: Moltbook data updates infrequently (a few posts/day). Polling is simpler and avoids WebSocket connection overhead. Auto-refresh can be upgraded to Realtime later without UI changes.
- **Alternatives**: Supabase Realtime subscriptions (over-engineering for current update frequency)

### Decision: Ship 3 views first (Feed, Wins, Daily), defer 2 (Network, Submolt)
- **Why**: Feed/Wins/Daily cover the primary use case. Network and Submolt require cross-agent data that won't exist until FinServeAgent is live. Shipping 3 views first delivers value faster.
- **Alternatives**: Ship all 5 at once (risk: empty Network/Submolt tabs with no data to show)

## Risks / Trade-offs
- **Empty data on first load**: Until VPS logger writes to Supabase, tables will be empty. Mitigation: good empty states with clear messaging.
- **Polling overhead**: 2-minute interval is acceptable for a dashboard viewed by <10 users. If usage grows, switch to Realtime.
- **Mobile tab overflow**: 5 tabs on mobile may overflow. Mitigation: horizontal scroll with overflow-x-auto.

## Open Questions
- None blocking. Agent selector dropdown will auto-appear when AGENTS.length > 1.
