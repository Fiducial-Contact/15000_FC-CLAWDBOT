# Proposal: VPS-Side Observer Learning (Dimension Rotation)

## Why
The personal AI assistant has a "researcher + observer" architecture that learns user behavior through dimension rotation (behavior-patterns, emotional-track, interest-map), produces deliverables, and self-heals when data is missing. The WebChat team version has no equivalent — the agent has no mechanism to learn from accumulated interactions or write insights back to the user profile.

This proposal maps the personal version's learning logic onto Clawdbot's native capabilities: **heartbeat** for periodic silent observation, **session tools** for cross-session scanning, and **workspace memory** for state persistence. The VPS agent does the analysis; a new API endpoint writes results back to Supabase.

## What Changes
- Create `learning_events` Supabase table for structured learning deliverables (dimension, insight, confidence, evidence).
- Create `POST /api/profile/learn` endpoint for authenticated agent writeback (API key auth, not user auth).
- Extend `GET /api/profile` to include recent learning events alongside the profile.
- Add `LearningEvent` and `LearningDimension` types to `src/lib/types/profile.ts`.
- **VPS-side** (deployed via SSH, not in this repo): create `TEAM-LEARNER.md` (4-dimension rotation protocol), update `HEARTBEAT.md` (learning cycle), create `team-learning-state.json` (rotation tracking), create `team-data-allowlist.md` (privacy boundary).

## Scope / Non-Goals
- **No client-side learning logic** — all analysis runs on VPS during heartbeat.
- **No user-facing messages from the learner** — heartbeat uses `target: "none"` + `HEARTBEAT_OK` suppression.
- **No real-time learning** — learning is async, batched during heartbeat cycles.
- **No auto-correction of user-filled profile fields** — agent insights are additive only.

## Constraints (must be locked before implementation)

| Constraint | Rule |
|-----------|------|
| **Data allowlist** | Only learn: software, topics, response style preference, work-related open-loops, infra health. Never: personal life, salary, health, politics, religion, credentials |
| **Cost limit** | Per heartbeat: max 5 users scanned, max 50 messages per user, total token budget < 100K |
| **Writeback rule** | Append evidence + confidence. Never overwrite user-filled fields. Only write to `learned_context[]` when confidence >= 0.5 |
| **Pruning limits** | `learned_context[]` max 50 items (prune lowest confidence first). `learning_events` uncapped but old events have diminishing weight |
| **Heartbeat session** | Run in **main session** with `target: "none"` (Option A). This ensures `sessionToolsVisibility` includes all sessions without sandbox restrictions |

## Impact
- Affected specs:
  - New capability: `observer-learning`
- Affected code:
  - `supabase/migrations/YYYYMMDD_create_learning_events.sql` (new)
  - `src/app/api/profile/learn/route.ts` (new)
  - `src/app/api/profile/route.ts` (modify GET to include learning events)
  - `src/lib/types/profile.ts` (add types)
- VPS files (outside repo):
  - `/root/clawd/workspace/team/TEAM-LEARNER.md` (new)
  - `/root/clawd/workspace/team/HEARTBEAT.md` (modify)
  - `/root/clawd/memory/team-learning-state.json` (new)
  - `/root/clawd/memory/team-data-allowlist.md` (new)

## Risks
- **Sandbox + session visibility**: If heartbeat runs in a non-main session with `sandbox.mode: "non-main"`, `sessionToolsVisibility` defaults to `"spawned"` and the observer cannot see other users' sessions. Mitigated by running heartbeat in main session (Option A).
- **Agent writeback key leak**: `AGENT_LEARN_API_KEY` is a shared secret. Mitigated by rate-limiting the endpoint and quarterly key rotation.
- **Stale learning**: User changes role/software but old insights persist. Mitigated by self-review cycle (D4) and confidence decay over time.
- **Empty signals**: If `add-signal-capture` is not yet deployed, the learner falls back to `sessions_history` only (reduced signal richness but still functional).

## Relations
- **Depends on**: `add-signal-capture` (optional — enriches analysis but not required; learner can use `sessions_history` alone).
- **Feeds into**: `add-learning-ui` displays learning results.
- **References**: Personal AI observer architecture (dimension rotation, self-review, deliverable-oriented output, "perception vs root cause" infra diagnosis).
