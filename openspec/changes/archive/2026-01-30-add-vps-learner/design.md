## Context

This is the "brain" of the observer system — the component that actually analyzes interaction data and produces learning insights. It runs on the VPS as part of the Clawdbot Gateway agent's heartbeat cycle, using native Clawdbot capabilities (heartbeat, session tools, workspace memory) rather than custom infrastructure.

Key reference: the personal AI assistant's researcher uses dimension rotation to avoid shallow analysis — each heartbeat focuses deeply on one dimension rather than superficially on all four.

## Goals / Non-Goals

- **Goals**: Per-user learning via dimension rotation; structured deliverables (learning_events); self-review; infra health diagnosis; writeback to Supabase.
- **Non-Goals**: Real-time learning; user-facing notifications; auto-modifying agent behavior (insights are advisory).

## Decisions

### Decision 1: Heartbeat session — Main session (Option A)

**Chosen**: Heartbeat runs in main session with `target: "none"`.

**Why**:
- Main session has full `sessionToolsVisibility` (can see all user sessions via `sessions_list` + `sessions_history`).
- `target: "none"` ensures no messages are sent to any channel/user.
- `HEARTBEAT_OK` response is suppressed by the Gateway (ackMaxChars mechanism).
- No sandbox restrictions — main session is not sandboxed by default.

**Alternative B**: Separate non-sandbox agent with `sessionToolsVisibility: "all"` — cleaner isolation but requires additional Gateway config. Deferred to future iteration.

**Risk**: Main session heartbeat shares context with admin interactions. Mitigated by `HEARTBEAT_OK` suppression and keeping observer logic in `TEAM-LEARNER.md` (read on each heartbeat, not cached).

### Decision 2: Four learning dimensions

| D | Name | What it analyzes | Data sources |
|---|------|-----------------|-------------|
| 1 | `skill-level` | Software proficiency, question complexity, familiarity with shortcuts | `sessions_history`, `topic_mentioned` signals |
| 2 | `interaction-style` | Language preference, verbosity preference, time-of-day patterns | `sessions_history`, `message_sent` signals |
| 3 | `topic-interests` | Recurring question clusters, capability usage | `topic_mentioned` signals, `capability_used` signals |
| 4 | `frustration-signals` | Thumbs-down feedback, repeated questions, rapid follow-ups, dropped topics + **infra root cause attribution** | `feedback` signals, `rapid_messages` signals, `gateway_disconnect` signals |

**Rotation**: Each heartbeat processes 1 dimension for 1 user. State tracked in `memory/team-learning-state.json`:
```json
{
  "nextDimension": 1,
  "nextUserIndex": 0,
  "lastRotatedAt": "...",
  "perUser": {
    "<userId>": { "d1_lastChecked": "...", "d2_lastChecked": "...", ... }
  }
}
```

### Decision 3: Self-healing (from personal version)

**Signals missing but user active**: If `user_signals` table returns empty for a user who has recent `sessions_history`, log a `health_event` insight instead of "nothing new". This detects broken signal capture pipeline.

**Perception vs root cause**: If user frustration signals coincide with `gateway_disconnect` signals, attribute the frustration to infrastructure (not agent quality). This is the "most valuable insight" from the personal version's observer.

### Decision 4: Writeback API authentication

**Chosen**: Dedicated `AGENT_LEARN_API_KEY` in Authorization header (Bearer token).

**Why**: VPS agent acts as a system actor, not as any individual user. Using Supabase user auth would require impersonating users, which is a worse security model.

**Rate limit**: Max 10 requests per minute per API key.

### Decision 5: Pruning strategy

**`learned_context[]` (on user_profiles)**: Max 50 items. When limit reached, remove the item with the lowest confidence (tie-break: oldest `created_at`).

**`learning_events` table**: No row limit. Old events keep diminishing analytical weight but remain for audit trail. Optional: add annual archival if table exceeds 10K rows.

**`frequentTopics[]`**: Max 20 items. Prune by staleness (oldest `lastSeen` first).

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Main session context pollution | `target: "none"` + `HEARTBEAT_OK` suppression; observer reads `TEAM-LEARNER.md` fresh each heartbeat |
| Token cost per heartbeat | Limit to 5 users × 50 messages = 250 messages max; budget < 100K tokens |
| Stale insights | D4 self-review cycle; confidence decay (insights > 30 days lose 20% confidence) |
| Signal pipeline down | Self-healing: detect missing signals + user active → log health_event |
| API key compromise | Quarterly rotation; rate limiting; audit log on all writes |

## Migration Plan
- Deploy Supabase migration first (table creation).
- Deploy API route to Vercel.
- Deploy VPS files via SSH.
- No breaking changes to existing functionality.
- Rollback: delete VPS files + disable heartbeat = system returns to pre-observer state.

## Open Questions
- Should confidence decay be continuous (e.g., -1% per day) or step-based (e.g., -20% at 30 days)? Recommend step-based for simplicity.
- Should `learning_events` include a `supersedes_id` for tracking insight evolution? Recommend yes for audit trail, but not MVP-blocking.
