## 1. Database

- [x] 1.1 Create Supabase migration `20250130000001_create_learning_events.sql` with schema: `id`, `user_id`, `dimension`, `insight`, `confidence`, `evidence` (JSONB), `source`, `created_at`; CHECK constraint on confidence [0,1]; indexes on `(user_id)` and `(dimension)`; RLS: users read own, service-role writes all
- [x] 1.2 Run migration locally and verify table exists

## 2. API Routes

- [x] 2.1 Create `src/app/api/profile/learn/route.ts` — POST with `AGENT_LEARN_API_KEY` Bearer auth; accepts `{ userId, insights: [{ dimension, insight, confidence, evidence }] }`; inserts into `learning_events`; updates `user_profiles.learned_context` for items with confidence >= 0.5 (append only, never overwrite user-filled items); enforce max 50 items in `learned_context` (prune lowest confidence)
- [x] 2.2 Add rate limiting: max 10 requests/minute per API key (in-memory counter, reset on minute boundary)
- [x] 2.3 Modify `GET /api/profile` in `src/app/api/profile/route.ts` to also return `recentLearning` (last 20 learning_events for the authenticated user)

## 3. Types

- [x] 3.1 Add `LearningDimension`, `LearningEvent`, and `ProfileWithLearning` types to `src/lib/types/profile.ts`

## 4. VPS Deployment (SSH)

- [ ] 4.1 Create `/root/clawd/workspace/team/TEAM-LEARNER.md` — 4-dimension rotation protocol, data allowlist reference, deliverable format, self-review questions
- [ ] 4.2 Create `/root/clawd/memory/team-data-allowlist.md` — explicit list of what can/cannot be learned
- [ ] 4.3 Create `/root/clawd/memory/team-learning-state.json` — initial state `{ nextDimension: 1, nextUserIndex: 0, perUser: {} }`
- [ ] 4.4 Update `/root/clawd/workspace/team/HEARTBEAT.md` — add learning cycle step: read TEAM-LEARNER.md, get rotation state, scan sessions, analyze, POST to /api/profile/learn, update rotation state
- [ ] 4.5 Verify heartbeat runs in main session with `target: "none"` — confirm no messages sent to team members during heartbeat
- [ ] 4.6 Verify `sessions_list` and `sessions_history(limit=50)` return data from main session context (no sandbox restriction)

> Note: Tasks 4.1–4.6 require SSH access to VPS (46.224.225.164). These are deployment tasks, not code changes in this repo.

## 5. Validation

- [x] 5.1 Simulate agent POST to `/api/profile/learn` with test insights → verify `learning_events` has rows
- [x] 5.2 Verify `user_profiles.learned_context` was appended (not overwritten) for confidence >= 0.5
- [x] 5.3 Verify items with confidence < 0.5 are NOT written to `learned_context` (but ARE stored in `learning_events`)
- [x] 5.4 Verify pruning: insert 60 items → only 50 remain in `learned_context` (lowest confidence removed)
- [x] 5.5 Verify GET `/api/profile` returns profile + recentLearning array
- [x] 5.6 Verify rate limit: 11th request within 1 minute returns 429
- [ ] 5.7 Run heartbeat on VPS → verify `team-learning-state.json` updates with next dimension/user — requires VPS
- [x] 5.8 TypeScript build passes (`npm run build`)

## Dependencies
- `add-signal-capture` is **optional** (enriches learner data but not required — learner falls back to `sessions_history` only)
- Tasks 1-3 (WebChat code) and Tasks 4.x (VPS files) can be done in parallel

## Parallelizable
- Tasks 1.x (DB), 2.x (API), 3.x (types) are sequential (types → DB → API)
- Tasks 4.x (VPS) are fully parallel with 1-3
- Task 5.x (validation) depends on all prior tasks
