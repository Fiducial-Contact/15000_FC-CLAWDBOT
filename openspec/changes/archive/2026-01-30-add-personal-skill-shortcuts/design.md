## Context
The profile modal contains “Learned” items, but the Skills panel is the main discoverability surface. We want to surface personal learned items as quick actions without introducing multi-agent complexity.

## Goals / Non-Goals
- Goals: show per-user Personal shortcuts in Skills panel; fast reuse via click-to-prefill.
- Non-Goals: add new agent skills, multi-agent routing, or admin-level skill management.

## Decisions
- Use existing profile storage (user_profiles.learned_context) as the backing store.
- Treat Personal shortcuts as UI-level skills only (not Clawdbot skills).
- Prefill chat input on click; optional “send” if in future toggled.

## Risks / Trade-offs
- Shortcuts are UI-only and won’t appear in the agent’s system prompt skill list.
- Overloading learned_context for shortcuts may need a rename later if semantics diverge.

## Migration Plan
1) Update profile model & API if needed.
2) Add Personal section in Skills UI.
3) Verify persistence and prefill behavior.

## Open Questions
- ~~Should Personal shortcuts be editable from the Skills panel (add/remove), or profile modal only?~~
  **Resolved**: Personal shortcuts are editable only from the Skills panel. Profile modal continues to show "What I've Learned" for reference but primary management is in Skills panel.
