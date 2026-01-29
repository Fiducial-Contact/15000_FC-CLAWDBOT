## 1. Data Layer

- [x] 1.1 Create `skills_registry` table via migration (include `status` + `updated_at`)
- [x] 1.2 Add RLS policies: read for authenticated, write for creator (no admin override in P1)
- [x] 1.3 Add `updated_at` handling (trigger or app-managed updates)
- [x] 1.4 Seed initial data for existing workspace skills

## 2. Gateway Client Extension

- [x] 2.1 Add skill types to `src/lib/gateway/types.ts`
- [x] 2.2 Add `skillsStatus()` method to `src/lib/gateway/client.ts`
- [x] 2.3 Test `skills.status` RPC against live gateway, document response format

## 3. Skills Hook

- [x] 3.1 Create `src/lib/gateway/useSkills.ts` (or extend useGateway)
- [x] 3.2 Implement merge logic: Gateway status + Supabase metadata
- [x] 3.3 Handle loading/error states (including disconnected WebSocket)

## 4. UI Components

- [x] 4.1 Create `src/components/SkillCard.tsx`
- [x] 4.2 Create `src/app/skills/page.tsx` (server component)
- [x] 4.3 Create `src/app/skills/SkillsClient.tsx` (client component)
- [x] 4.4 Add "Skills" navigation link to `src/components/Header.tsx`

## 5. Verification

- [x] 5.1 Verify API: Gateway `skills.status` returns expected data
- [x] 5.2 Verify UI: `/skills` page shows skill cards with status
- [x] 5.3 Verify creator display: Cards show "By: [email]" or "By: Team"
- [x] 5.4 Verify navigation: Header links to `/skills` correctly
- [x] 5.5 Verify disconnected state shows connection-required message
