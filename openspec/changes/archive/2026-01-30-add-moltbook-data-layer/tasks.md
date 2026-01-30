## 1. Database Schema
- [x] 1.1 Create Supabase migration: `moltbook_activity` table with columns (id, agent_id, type, title, content, moltbook_post_id, moltbook_comment_id, parent_url, submolt, target_agent, url, karma, comment_count, result, influence, notes, created_at)
- [x] 1.2 Create Supabase migration: `moltbook_daily` table with columns (id, agent_id, date, karma, rank, karma_delta, followers, posts_today, comments_today, top_post_url, notes, created_at) with unique constraint on (agent_id, date)
- [x] 1.3 Add indexes: `idx_activity_agent(agent_id, created_at desc)`, `idx_activity_type(type)`, `idx_activity_result(result)`, `idx_daily_agent(agent_id, date desc)`
- [x] 1.4 Add check constraint on `result`: `check (result in ('viral', 'engaged', 'moderate', 'flat'))`
- [x] 1.5 Add check constraint on `type`: `check (type in ('post', 'comment', 'reply', 'daily', 'agent'))`
- [x] 1.6 Add check constraint on `influence`: `check (influence in ('local', 'submolt', 'cross-submolt', 'platform'))`
- [x] 1.7 Enable RLS on both tables: authenticated users can SELECT, service_role can INSERT/UPDATE

## 2. TypeScript Types
- [x] 2.1 Create `src/lib/types/social.ts` with interfaces: `ActivityEntry`, `DailySnapshot`, `AgentMetrics`, `AgentConfig`, `SocialViewType`
- [x] 2.2 Define `AGENTS` registry array with VoxAgent config (id, name, displayName, xHandle, moltbookProfile, notionDbId)

## 3. Data Query Helpers
- [x] 3.1 Create `src/lib/supabase/moltbook.ts` with typed query functions:
  - `fetchFeed(agentId, cursor?, pageSize?)` — type in (post, comment, reply), order by created_at desc
  - `fetchWins(agentId, cursor?, pageSize?)` — result = 'viral', order by karma desc
  - `fetchDaily(agentId, cursor?, pageSize?)` — from moltbook_daily, order by date desc
  - `fetchNetwork(agentId, cursor?, pageSize?)` — type = 'agent' or target_agent not null, order by created_at desc
  - `fetchSubmolt(agentId, cursor?, pageSize?)` — type = 'post', order by created_at desc (group by submolt client-side)
  - `fetchMetrics(agentId)` — latest daily entry for karma, rank, delta, followers + computed win rate

## 4. Environment
- [x] 4.1 Add `NOTION_API_TOKEN` to `.env.local` (for optional Notion backup — not used by web app runtime)

## 5. Verification
- [x] 5.1 Run migration in Supabase SQL editor — confirm tables exist with correct columns and constraints
- [x] 5.2 Test insert via Supabase dashboard — confirm RLS allows service_role write
- [x] 5.3 `pnpm build` — confirm no type errors from new modules
