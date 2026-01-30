# Tasks: Supabase-Backed Session Titles

## 1. Design / Spec
- [ ] 1.1 Add delta spec for chat-interface session title persistence

## 2. Backend / Data
- [ ] 2.1 Update `/api/profile` PUT to merge existing `preferences` keys instead of overwriting

## 3. Frontend / Gateway Client
- [ ] 3.1 Load session titles from Supabase (via `user_profiles.preferences`) for the current user
- [ ] 3.2 Merge Supabase titles into `sessions.list` results as primary `displayName`
- [ ] 3.3 Persist auto-generated titles to Supabase (allow duplicates)
- [ ] 3.4 Prune stored titles for sessions no longer returned by gateway

## 4. UX Improvements
- [ ] 4.1 Avoid using internal/noise messages (e.g. profile-sync) as title seeds
- [ ] 4.2 Keep sidebar fallback titles stable and non-repeating

## 5. Validation
- [ ] 5.1 `npm run lint`
- [ ] 5.2 `npm run build`
- [ ] 5.3 Manual verification: open chat on 2 devices → title consistency

