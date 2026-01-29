## Context

Clawdbot Gateway runs on VPS (46.224.225.164) with skills loaded from `<workspace>/skills/`. The webchat client connects via WebSocket and needs to display skill information to users. Currently no skills API exists in the client.

**Constraints**:
- Serverless deployment (Vercel) - SSH unreliable
- Gateway already supports `skills.status` RPC on server
- Creator information not stored in Gateway (only runtime state)

## Goals / Non-Goals

**Goals**:
- Display skill list with status (ready/missing/disabled)
- Show creator attribution for workspace skills
- Prepare data model for future skill management features

**Non-Goals**:
- Skill creation/editing (P2)
- Real-time skill status updates via WebSocket events (P2)
- ClawdHub integration (P3)

## Decisions

### Decision 1: Gateway RPC over SSH

**What**: Use `skills.status` RPC via existing WebSocket connection instead of SSH.

**Why**:
- SSH in serverless is fragile (connection timeouts, key management)
- WebSocket already established and authenticated
- Follows existing `chat.*`, `sessions.*` patterns

**Alternatives considered**:
- SSH to VPS: Rejected - unreliable in Vercel, security surface
- REST API on Gateway: Rejected - requires new server endpoint

### Decision 2: Dual Data Sources

**What**: Gateway = availability truth, Supabase = metadata truth.

**Data flow**:
```
Gateway skills.status → Runtime state (available, enabled, errors)
Supabase skills_registry → Metadata (creator, description, icon, triggers)

Merge on skill_name → Combined view for UI
```

**Why**:
- Gateway doesn't persist "who created this"
- Supabase provides RLS, persistence, query flexibility
- Clean separation of concerns

### Decision 3: skills_registry Table Design

```sql
CREATE TABLE skills_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL UNIQUE,  -- matches Gateway skill key
  display_name TEXT,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id),
  creator_email TEXT,
  source TEXT DEFAULT 'workspace',  -- 'workspace' | 'bundled' | 'clawdhub'
  status TEXT DEFAULT 'active',     -- metadata only (active | disabled | draft)
  icon TEXT,                        -- emoji or lucide icon name
  triggers TEXT[],                  -- trigger words for discoverability
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policy**:
- All authenticated users can read
- Only creator can update their own records
- Admin override via service_role only if a server-side admin route is added (out of scope for P1)

### Decision 4: Client-Side Fetching

**What**: Fetch skills status through useGateway hook, merge with Supabase metadata on client.

**Why**:
- Reuses authenticated WebSocket connection
- Avoids server-side API route complexity
- Client already has user context for Supabase queries

**Pattern**:
```typescript
// In useGateway hook or new useSkills hook
const { data: gatewaySkills } = await client.skillsStatus();
const { data: metadata } = await supabase.from('skills_registry').select('*');

// Merge by skill_name
const skills = mergeSkillsData(gatewaySkills, metadata);
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Gateway skills.status RPC format unknown | Test against live gateway, document response schema |
| Supabase table missing records | Show "By: Team" for unknown creators, seed initial data |
| WebSocket not connected when viewing /skills | Show loading state, require connection before fetch |
| RLS admin writes undefined | Default to creator-only writes until admin role is defined |

## Migration Plan

1. Create Supabase table via migration (preferred over dashboard)
2. Seed existing workspace skills with team creator
3. Deploy Gateway client changes
4. Deploy frontend pages
5. Verify end-to-end flow

**Rollback**: No breaking changes - new capability only.

## Open Questions

1. Exact `skills.status` RPC response format - need to test against gateway
2. Should skill status refresh automatically or require manual refresh?
3. Icon format preference - emoji vs Lucide icon names?
4. Do we need an admin write path for registry entries in P1 (requires role definition)?
