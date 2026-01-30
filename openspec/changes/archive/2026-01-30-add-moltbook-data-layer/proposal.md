## Why
The Moltbook activity tracking system currently writes data to a Notion database via a VPS Python script. The web app needs to read this data for a social dashboard page. Using Supabase (already the project's auth/storage layer) as the primary data store instead of querying Notion at runtime avoids rate limits (Notion: 3 req/s), high latency (200-500ms vs <50ms), and fragile API dependency. This change creates the data foundation that the `/social` dashboard page (separate change: `add-social-dashboard-page`) will consume.

## What Changes
- Supabase migration: create `moltbook_activity` and `moltbook_daily` tables with indexes and RLS policies
- New TypeScript types module: `ActivityEntry`, `DailySnapshot`, `AgentMetrics`, `AgentConfig`
- `AGENTS` registry array as single source of truth for multi-agent support (VoxAgent now, FinServeAgent later)
- Supabase query helper functions for feed, wins, daily, network, and submolt views
- Add `NOTION_API_TOKEN` to `.env.local` (for optional Notion backup sync)

## Impact
- Affected specs: none (new capability `moltbook-data`)
- Affected code: `src/lib/types/social.ts` (new), `src/lib/supabase/moltbook.ts` (new)
- New Supabase tables: `moltbook_activity`, `moltbook_daily`
- External dependency: VPS logger (`/root/clawd/scripts/moltbook/notion_logger.py`) will need update to dual-write to Supabase (out of scope for this change)
- Related change: `add-social-dashboard-page` depends on this change
