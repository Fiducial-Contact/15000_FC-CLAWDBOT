## 1. Implementation
- [x] 1.1 Add Supabase migration for `user_profiles` table + RLS policies
- [x] 1.2 Add `/api/profile` route (GET/PUT) using authenticated Supabase server client
- [x] 1.3 Add profile mapping helpers (default profile, db <-> UI)
- [x] 1.4 Wire `ChatClient` to fetch profile and handle save/update
- [x] 1.5 Update `UserProfileModal` to accept profile + onSave + error states
- [x] 1.6 Add minimal UI error messaging for load/save failures

## 2. Verification
- [x] 2.1 Run TypeScript check or build (if available)
- [ ] 2.2 Manual flow: open modal, edit profile, save, reload, confirm persistence
