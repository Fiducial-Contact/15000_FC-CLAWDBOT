## Why
The profile modal currently uses mock data and does not persist user preferences. Team members cannot build a personal profile that improves responses over time.

## What Changes
- Add a persistent user profile store in Supabase with per-user RLS.
- Expose authenticated API endpoints to read/update the profile.
- Wire the profile modal to load/save real data and show save errors.

## Impact
- Affected specs: chat-interface
- Affected code: profile types, chat client, profile modal, new API route, new Supabase migration
