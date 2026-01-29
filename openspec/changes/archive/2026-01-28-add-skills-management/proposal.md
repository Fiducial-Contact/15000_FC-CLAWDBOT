## Why

The webchat currently has no visibility into available Clawdbot skills. Team members cannot see what capabilities are available, who created custom skills, or which skills are enabled/disabled. This makes skill discovery difficult and blocks future "user-created skills" functionality.

## What Changes

- **Gateway Client Extension**: Add `skills.status` RPC method to GatewayClient and a `useSkills` hook for fetching/merging data
- **Supabase Table**: Create `skills_registry` table via migration with RLS for creator metadata and enrichment data
- **Skills Dashboard**: New `/skills` page showing skill cards with status, creator attribution, and descriptions (fallback to "By: Team" when missing)
- **Navigation**: Add "Skills" link to Header component
- **Connection Handling**: Show a connection-required state when the Gateway WebSocket is unavailable

**Key Decision**: Use Gateway RPC `skills.status` instead of SSH - more reliable in serverless environment and aligns with existing WebSocket architecture.

## Impact

- **Affected specs**: Creates new `skills-management` capability
- **Affected code**:
  - `src/lib/gateway/client.ts` - Add `skillsStatus()` method
  - `src/lib/gateway/types.ts` - Add skill type definitions
  - `src/lib/gateway/useSkills.ts` - New hook for merge logic and error states
  - `src/app/skills/` - New page and client component
  - `src/components/SkillCard.tsx` - New component
  - `src/components/Header.tsx` - Add navigation link
  - Supabase migrations - New table and RLS

## Out of Scope (P2/P3)

- Skill creation/editing UI (requires file writes to workspace - high-privilege operation)
- Skill enable/disable toggles (requires `skills.update` RPC)
- ClawdHub skill installation
