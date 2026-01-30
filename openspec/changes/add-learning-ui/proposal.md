# Proposal: Learning Display and User Feedback UI

## Why
The observer system (Phases 1-3) produces learning insights invisibly. Without a UI layer, there is no way for users to see what the agent learned, no way for admins to verify the observer is working, and no feedback loop to correct wrong insights. The personal AI assistant solves this with structured reports; the WebChat team version needs a minimal, non-intrusive display + feedback mechanism.

## What Changes
- Extend `AgentInsightPanel` with a new "Agent Learning" collapsible section (default closed; visible only when `showDetails` is on).
- Add minimal feedback buttons (thumbs up / thumbs down) to assistant message groups — signal-only, no forced text input.
- Enhance `buildProfileSyncMessage()` to include recent high-confidence learning events so the agent retains awareness of what it previously learned.

## Scope / Non-Goals
- **No learning analytics dashboard** — the insights page extension is a future follow-up.
- **No forced feedback** — buttons are hover-visible only, signal-only (no modal, no text input).
- **No "you are being observed" disclosure** — the learning display is opt-in via the existing detail toggle; team members are not confronted with surveillance-like UI.
- **No feedback processing logic** — feedback signals are captured by `add-signal-capture` and analyzed by `add-vps-learner`; this proposal only provides the UI trigger.

## Impact
- Affected specs:
  - `openspec/specs/chat-interface/spec.md` (modify: add learning display + feedback buttons)
  - New capability: `user-feedback`
- Affected code:
  - `src/components/AgentInsightPanel.tsx` (add "Agent Learning" section)
  - `src/components/MessageGroup.tsx` (add feedback buttons)
  - `src/app/chat/ChatClient.tsx` (pass learning data to panel + enhance `buildProfileSyncMessage`)

## Risks
- Team members may feel "monitored" if learning display is too prominent; mitigated by default-closed, showDetails-only visibility.
- Feedback buttons may be clicked accidentally; mitigated by hover-only visibility + confirmation visual (brief icon change on click).
- Adding learning events to profile sync increases message size; mitigated by limiting to top 5 events with confidence > 0.7.

## Relations
- **Depends on**: `add-vps-learner` (provides learning events data) and `add-signal-capture` (provides feedback signal ingestion).
- **Standalone UI**: Can be deployed before learner is active — displays "No learning data yet" gracefully.
