## 1. Agent Insight Panel

- [x] 1.1 Add `'agentLearning'` to `PanelSectionKey` type and `defaultSections` (default: false) in `AgentInsightPanel.tsx`
- [x] 1.2 Add "Agent Learning" collapsible section between "Learning Profile" and "Profile Sync" — shows dimension badge, insight text, confidence bar, evidence count per event
- [x] 1.3 Pass `recentLearning: LearningEvent[]` prop to `AgentInsightPanel` from `ChatClient.tsx`
- [x] 1.4 Handle empty state: show "No learning data yet" when `recentLearning` is empty

## 2. Feedback Buttons

- [x] 2.1 Add thumbs-up / thumbs-down icon buttons to assistant message groups in `MessageGroup.tsx` — visible on hover only, using existing Lucide icons (ThumbsUp, ThumbsDown)
- [x] 2.2 On click: call `captureFeedback(messageId, 'helpful' | 'not_helpful')` from `useSignalCapture` hook — signal only, no modal or text input
- [x] 2.3 Visual confirmation: brief icon color change (green for helpful, red for not helpful) lasting 1.5s, then reset
- [x] 2.4 Prevent double-click: disable buttons for 2s after click

## 3. Profile Sync Enhancement

- [x] 3.1 Modify `buildProfileSyncMessage()` in `ChatClient.tsx` to append recent learning events (top 5, confidence > 0.7) under a `recentLearning:` section
- [x] 3.2 Fetch learning events from `/api/profile` response (already extended by `add-vps-learner`)

## 4. Validation

- [x] 4.1 Open AgentInsightPanel → verify "Agent Learning" section is collapsed by default
- [x] 4.2 Toggle showDetails → verify section becomes expandable
- [x] 4.3 With learning data: verify dimension badges, insight text, confidence bars render correctly
- [x] 4.4 Without learning data: verify "No learning data yet" message
- [x] 4.5 Hover over assistant message → verify feedback buttons appear
- [x] 4.6 Click thumbs-up → verify signal captured (check `user_signals` table) + visual confirmation
- [x] 4.7 Verify profile sync message includes learning events section
- [x] 4.8 TypeScript build passes (`npm run build`)

## Dependencies
- Requires `add-vps-learner` for learning event data (graceful empty state without it)
- Requires `add-signal-capture` for feedback signal ingestion (buttons are non-functional without it)
- Tasks 1.x and 2.x can be done in parallel
- Task 3.x depends on 1.3 (needs learning data plumbing)

## Parallelizable
- Tasks 1.x (panel) and 2.x (feedback buttons) are fully parallel
- Task 3.x depends on 1.3
