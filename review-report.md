# Combined Review Report

> Date: 2026-01-29
> Project: 15000_FC-CLAWDBOT-main
> Scope: requested skills `review-clean-code`, `review-doc-consistency`, `review-merge-readiness`, `review-quality`, `review-react-best-practices`
> Note: Outputs merged into a single document per request.

---

## Clean Code Review

### Function Size: `useGateway` hook is too large (SRP violation)
- **Principle**: Small Functions + SRP
- **Location**: `src/lib/gateway/useGateway.ts:221`
- **Severity**: High
- **Issue**: The hook is ~900+ lines handling connection, history, streaming, session management, uploads, and UI state.
- **Suggestion**: Split into focused hooks (connection, sessions, streaming, uploads) and compose them.

### Function Size: `sendMessage` is doing multiple jobs
- **Principle**: Small Functions + SRP
- **Location**: `src/lib/gateway/useGateway.ts:758`
- **Severity**: High
- **Issue**: Message creation, session title updates, upload orchestration, error handling, and gateway send are all inline.
- **Suggestion**: Extract `prepareMessage`, `uploadAttachments`, `buildOutboundText`, `sendToGateway` helpers.

### Duplication: Attachment upload logic repeated
- **Principle**: DRY
- **Location**: `src/lib/gateway/useGateway.ts:817` and `src/lib/gateway/useGateway.ts:964`
- **Severity**: Medium
- **Issue**: Image/file upload + attachment state updates are duplicated in `sendMessage` and `retryFileAttachment`.
- **Suggestion**: Share a single `uploadAndPatchAttachments()` helper returning updated attachments + URL text.

### Duplication: `buildFileUrlText` and `buildImageUrlText` are nearly identical
- **Principle**: DRY
- **Location**: `src/lib/gateway/useGateway.ts:170`
- **Severity**: Low
- **Issue**: Two functions differ only in label prefix.
- **Suggestion**: Replace with one formatter that accepts a label prefix.

### Duplication: `formatFileSize` duplicated across components
- **Principle**: DRY
- **Location**: `src/components/ChatInput.tsx:22` and `src/components/ChatMessage.tsx:220`
- **Severity**: Low
- **Issue**: Two identical implementations.
- **Suggestion**: Move to `src/lib/utils.ts` and reuse.

### Magic Numbers: Timing constants embedded in logic
- **Principle**: Avoid Hardcoding
- **Location**: `src/lib/gateway/useGateway.ts:164`, `src/lib/gateway/useGateway.ts:558`, `src/lib/gateway/useGateway.ts:603`
- **Severity**: Medium
- **Issue**: Title length (30), history refresh (400ms), tool cleanup (3000ms) are inline.
- **Suggestion**: Centralize as named constants with intent (e.g., `HISTORY_REFRESH_DELAY_MS`).

### Magic Numbers: UI timings and sizes embedded in components
- **Principle**: Avoid Hardcoding
- **Location**: `src/components/ChatInput.tsx:83` and `src/components/ChatInput.tsx:91`
- **Severity**: Low
- **Issue**: Max textarea height (200), placeholder timing (400/4000), highlight timeout (2000) are inline.
- **Suggestion**: Extract to constants to make UX tuning clear.

### Structural Clarity: `normalizeBlock` has nested branching with mixed shape normalization
- **Principle**: Readability First
- **Location**: `src/lib/gateway/useGateway.ts:59`
- **Severity**: Medium
- **Issue**: Mixed normalization rules and nested ternaries make the logic hard to reason about.
- **Suggestion**: Split into separate normalizers per block type and a dispatcher map.

---

# Documentation Consistency Review Report

> Review Date: 2026-01-29
> Project: 15000_FC-CLAWDBOT-main
> Review Scope: README.md, docs/**/*.md, .env.example, config, code references

## Issue List

### 1. README gateway port contradicts runtime config
- **Severity**: P1
- **Location**:
  - Documentation: `README.md:121`
  - Code: `config/clawdbot.json:77`
- **Evidence**:
  - Documentation excerpt:
    ```
    | Gateway Port | 18789 (loopback) |
    ```
  - Code excerpt:
    ```json
    "port": 18889,
    ```
- **Impact**: Operators will open and forward the wrong port.
- **Suggestion (minimal fix)**: Update README to 18889 or change config to 18789.
- **Related Principle**: Code is truth

### 2. README gateway host/port mismatches startup script
- **Severity**: P2
- **Location**:
  - Documentation: `README.md:215`
  - Code: `start.sh:10`
- **Evidence**:
  - Documentation excerpt:
    ```
    Host: 46.224.225.164:18789
    ```
  - Code excerpt:
    ```bash
    echo "   Port: 18889"
    ```
- **Impact**: Devs point clients at the wrong port.
- **Suggestion (minimal fix)**: Align README host/port with `start.sh`.
- **Related Principle**: Code is truth

### 3. README model reference differs from config model
- **Severity**: P2
- **Location**:
  - Documentation: `README.md:216`
  - Code: `config/clawdbot.json:16`
- **Evidence**:
  - Documentation excerpt:
    ```
    Agent: work (claude-sonnet-4-5)
    ```
  - Code excerpt:
    ```json
    "anthropic/claude-opus-4-5": { "alias": "opus" }
    ```
- **Impact**: Readers assume a different model is in use.
- **Suggestion (minimal fix)**: Update README to match configured model.
- **Related Principle**: Code is truth

### 4. Env name `GATEWAY_AUTH_TOKEN` is documented but not used
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:13`
  - Code: `src/lib/gateway/useGateway.ts:488`
- **Evidence**:
  - Documentation excerpt:
    ```
    GATEWAY_AUTH_TOKEN=your-gateway-token
    ```
  - Code excerpt:
    ```ts
    const token = process.env.NEXT_PUBLIC_GATEWAY_TOKEN;
    ```
- **Impact**: Users set the wrong env var and authentication fails.
- **Suggestion (minimal fix)**: Rename doc to `NEXT_PUBLIC_GATEWAY_TOKEN` or change code to read `GATEWAY_AUTH_TOKEN`.
- **Related Principle**: Reproducibility

### 5. `NEXT_PUBLIC_GATEWAY_HOST` is documented but unused
- **Severity**: P3
- **Location**:
  - Documentation: `.env.example:11`
  - Code: `src/lib/gateway/useGateway.ts:487`
- **Evidence**:
  - Documentation excerpt:
    ```
    NEXT_PUBLIC_GATEWAY_HOST=your-gateway-host
    ```
  - Code excerpt:
    ```ts
    const wsUrl = process.env.NEXT_PUBLIC_GATEWAY_WS_URL;
    ```
- **Impact**: Extra env var suggests a config path that doesn't exist.
- **Suggestion (minimal fix)**: Remove or document how host/port are derived into WS URL.
- **Related Principle**: Terminology consistency

### 6. `NEXT_PUBLIC_GATEWAY_PORT` is documented but unused
- **Severity**: P3
- **Location**:
  - Documentation: `.env.example:12`
  - Code: `src/lib/gateway/useGateway.ts:487`
- **Evidence**:
  - Documentation excerpt:
    ```
    NEXT_PUBLIC_GATEWAY_PORT=18789
    ```
  - Code excerpt:
    ```ts
    const wsUrl = process.env.NEXT_PUBLIC_GATEWAY_WS_URL;
    ```
- **Impact**: Same as above; config drift.
- **Suggestion (minimal fix)**: Remove or clarify how port is used to build WS URL.
- **Related Principle**: Terminology consistency

### 7. Gateway envs marked optional, but app requires them
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:9`
  - Code: `src/lib/gateway/useGateway.ts:490`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Clawdbot Gateway (optional - for WebSocket connection)
    ```
  - Code excerpt:
    ```ts
    if (!wsUrl) { setError('Gateway URL not configured'); return; }
    ```
- **Impact**: Setup instructions imply optional config; app fails without it.
- **Suggestion (minimal fix)**: Mark as required for chat/skills pages.
- **Related Principle**: Reproducibility

### 8. Missing `NEXT_PUBLIC_GATEWAY_TOKEN` in env example
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:9`
  - Code: `src/lib/gateway/useGateway.ts:488`
- **Evidence**:
  - Documentation excerpt:
    ```
    NEXT_PUBLIC_GATEWAY_WS_URL=ws://your-gateway-host:18789
    ```
  - Code excerpt:
    ```ts
    const token = process.env.NEXT_PUBLIC_GATEWAY_TOKEN;
    ```
- **Impact**: Missing token config for authenticated gateways.
- **Suggestion (minimal fix)**: Add `NEXT_PUBLIC_GATEWAY_TOKEN` to `.env.example`.
- **Related Principle**: Reproducibility

### 9. Missing `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` in env example
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `src/app/chat/ChatClient.tsx:151`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```ts
    const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || '';
    ```
- **Impact**: Push UI fails without documented key.
- **Suggestion (minimal fix)**: Add to `.env.example` and README.
- **Related Principle**: Reproducibility

### 10. Missing `WEB_PUSH_PRIVATE_KEY` in env example
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `src/app/api/push/send/route.ts:51`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```ts
    const privateKey = process.env.WEB_PUSH_PRIVATE_KEY || '';
    ```
- **Impact**: Push send endpoint 500s in production.
- **Suggestion (minimal fix)**: Document `WEB_PUSH_PRIVATE_KEY`.
- **Related Principle**: Reproducibility

### 11. Missing `WEB_PUSH_API_TOKEN` in env example
- **Severity**: P1
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `src/app/api/push/send/route.ts:28`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```ts
    const apiToken = process.env.WEB_PUSH_API_TOKEN || '';
    ```
- **Impact**: Push endpoints reject all requests (401).
- **Suggestion (minimal fix)**: Add token to docs and env example.
- **Related Principle**: Security default tightening

### 12. Missing `WEB_PUSH_SEND_URL` in env example
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `scripts/push-relay.mjs:5`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```js
    const sendUrl = process.env.WEB_PUSH_SEND_URL;
    ```
- **Impact**: Push relay cannot dispatch notifications.
- **Suggestion (minimal fix)**: Add to env example and README.
- **Related Principle**: Reproducibility

### 13. Missing `WEB_PUSH_SUBJECT` in env example
- **Severity**: P3
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `src/app/api/push/send/route.ts:52`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```ts
    const subject = process.env.WEB_PUSH_SUBJECT || 'mailto:admin@fiducial.com';
    ```
- **Impact**: VAPID subject becomes implicit and undocumented.
- **Suggestion (minimal fix)**: Add to env example with default.
- **Related Principle**: Reproducibility

### 14. Missing `SUPABASE_SERVICE_ROLE_KEY` in env example
- **Severity**: P1
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `src/app/api/push/send/route.ts:45`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```ts
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    ```
- **Impact**: Push send endpoint fails in production.
- **Suggestion (minimal fix)**: Document `SUPABASE_SERVICE_ROLE_KEY`.
- **Related Principle**: Security default tightening

### 15. Missing `GATEWAY_WS_URL` in env example for push relay
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `scripts/push-relay.mjs:3`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```js
    const wsUrl = process.env.GATEWAY_WS_URL;
    ```
- **Impact**: Push relay cannot connect to gateway.
- **Suggestion (minimal fix)**: Add relay envs to docs.
- **Related Principle**: Reproducibility

### 16. Missing `GATEWAY_TOKEN` in env example for push relay
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `scripts/push-relay.mjs:4`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```js
    const token = process.env.GATEWAY_TOKEN;
    ```
- **Impact**: Relay auth setup is undocumented.
- **Suggestion (minimal fix)**: Add `GATEWAY_TOKEN` to env docs.
- **Related Principle**: Security default tightening

### 17. Missing `GATEWAY_SSH_HOST` in env example
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `src/app/api/chat/route.ts:4`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```ts
    const GATEWAY_HOST = process.env.GATEWAY_SSH_HOST || '46.224.225.164';
    ```
- **Impact**: SSH proxy host is undocumented.
- **Suggestion (minimal fix)**: Document `GATEWAY_SSH_HOST`.
- **Related Principle**: Reproducibility

### 18. Missing `GATEWAY_AGENT` in env example
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `src/app/api/chat/route.ts:5`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```ts
    const GATEWAY_AGENT = process.env.GATEWAY_AGENT || 'work';
    ```
- **Impact**: Agent selection is undocumented.
- **Suggestion (minimal fix)**: Document `GATEWAY_AGENT`.
- **Related Principle**: Reproducibility

### 19. Missing `GATEWAY_SESSION_ID` in env example
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:1`
  - Code: `src/app/api/chat/route.ts:6`
- **Evidence**:
  - Documentation excerpt:
    ```
    # Supabase
    ```
  - Code excerpt:
    ```ts
    const SESSION_ID = process.env.GATEWAY_SESSION_ID || 'web-chat';
    ```
- **Impact**: Session routing is undocumented.
- **Suggestion (minimal fix)**: Document `GATEWAY_SESSION_ID`.
- **Related Principle**: Reproducibility

### 20. Env example uses port 18789 but config uses 18889
- **Severity**: P2
- **Location**:
  - Documentation: `.env.example:10`
  - Code: `config/clawdbot.json:77`
- **Evidence**:
  - Documentation excerpt:
    ```
    NEXT_PUBLIC_GATEWAY_WS_URL=ws://your-gateway-host:18789
    ```
  - Code excerpt:
    ```json
    "port": 18889,
    ```
- **Impact**: Default WS URL is wrong for the configured gateway.
- **Suggestion (minimal fix)**: Update port in `.env.example` or config.
- **Related Principle**: Code is truth

### 21. Fly deploy doc uses `MS_APP_ID` but config uses `appId`
- **Severity**: P2
- **Location**:
  - Documentation: `docs/FLYIO-DEPLOY.md:19`
  - Code: `config/clawdbot.json:65`
- **Evidence**:
  - Documentation excerpt:
    ```
    fly secrets set MS_APP_ID="<YOUR_APP_ID>"
    ```
  - Code excerpt:
    ```json
    "appId": "75dd7001-a533-4370-a7c1-a103effaeb7e",
    ```
- **Impact**: Fly secrets do not map to runtime config.
- **Suggestion (minimal fix)**: Align env name or update config to read `MS_APP_ID`.
- **Related Principle**: Code is truth

### 22. Fly deploy doc uses `MS_APP_PASSWORD` but config expects `MSTEAMS_APP_PASSWORD`
- **Severity**: P1
- **Location**:
  - Documentation: `docs/FLYIO-DEPLOY.md:20`
  - Code: `config/clawdbot.json:66`
- **Evidence**:
  - Documentation excerpt:
    ```
    fly secrets set MS_APP_PASSWORD="<YOUR_APP_PASSWORD>"
    ```
  - Code excerpt:
    ```json
    "appPassword": "${MSTEAMS_APP_PASSWORD}",
    ```
- **Impact**: Deployed app fails to auth to Teams.
- **Suggestion (minimal fix)**: Rename env var in docs to `MSTEAMS_APP_PASSWORD`.
- **Related Principle**: Code is truth

### 23. Fly deploy doc uses `MS_TENANT_ID` but config hardcodes tenantId
- **Severity**: P2
- **Location**:
  - Documentation: `docs/FLYIO-DEPLOY.md:21`
  - Code: `config/clawdbot.json:67`
- **Evidence**:
  - Documentation excerpt:
    ```
    fly secrets set MS_TENANT_ID="<YOUR_TENANT_ID>"
    ```
  - Code excerpt:
    ```json
    "tenantId": "7cbf9cf0-b1b1-4fec-9a9b-9a303f329c82",
    ```
- **Impact**: Docs imply env override that does not exist.
- **Suggestion (minimal fix)**: Document that tenantId is fixed, or make it env-driven.
- **Related Principle**: Code is truth

### 24. Web push service worker not documented
- **Severity**: P2
- **Location**:
  - Documentation: `README.md:191`
  - Code: `public/sw.js:1`
- **Evidence**:
  - Documentation excerpt:
    ```
    ### Web Chat App
    ```
  - Code excerpt:
    ```js
    self.addEventListener('push', (event) => {
    ```
- **Impact**: Push feature is implemented but not discoverable.
- **Suggestion (minimal fix)**: Add a Web Push section to README.
- **Related Principle**: User-facing commitments first

### 25. `/api/push/subscribe` endpoint not documented
- **Severity**: P2
- **Location**:
  - Documentation: `README.md:191`
  - Code: `src/app/api/push/subscribe/route.ts:26`
- **Evidence**:
  - Documentation excerpt:
    ```
    ### Web Chat App
    ```
  - Code excerpt:
    ```ts
    export async function POST(request: NextRequest) {
    ```
- **Impact**: Integrators cannot set up subscription flow.
- **Suggestion (minimal fix)**: Document push subscribe API.
- **Related Principle**: Reproducibility

### 26. `/api/push/unsubscribe` endpoint not documented
- **Severity**: P2
- **Location**:
  - Documentation: `README.md:191`
  - Code: `src/app/api/push/unsubscribe/route.ts:6`
- **Evidence**:
  - Documentation excerpt:
    ```
    ### Web Chat App
    ```
  - Code excerpt:
    ```ts
    export async function POST(request: NextRequest) {
    ```
- **Impact**: Users cannot find how to disable push.
- **Suggestion (minimal fix)**: Document unsubscribe API.
- **Related Principle**: Reproducibility

### 27. `/api/push/send` endpoint not documented
- **Severity**: P2
- **Location**:
  - Documentation: `README.md:191`
  - Code: `src/app/api/push/send/route.ts:26`
- **Evidence**:
  - Documentation excerpt:
    ```
    ### Web Chat App
    ```
  - Code excerpt:
    ```ts
    export async function POST(request: NextRequest) {
    ```
- **Impact**: Push relay setup is unclear.
- **Suggestion (minimal fix)**: Document send endpoint and auth.
- **Related Principle**: Reproducibility

### 28. Push relay script not documented
- **Severity**: P3
- **Location**:
  - Documentation: `README.md:203`
  - Code: `scripts/push-relay.mjs:1`
- **Evidence**:
  - Documentation excerpt:
    ```
    pnpm install
    pnpm dev
    ```
  - Code excerpt:
    ```js
    import WebSocket from 'ws';
    ```
- **Impact**: Ops scripts are undiscoverable.
- **Suggestion (minimal fix)**: Add a section on running `scripts/push-relay.mjs`.
- **Related Principle**: Reproducibility

### 29. Supabase table `web_push_subscriptions` not documented
- **Severity**: P2
- **Location**:
  - Documentation: `README.md:191`
  - Code: `src/app/api/push/subscribe/route.ts:50`
- **Evidence**:
  - Documentation excerpt:
    ```
    ### Web Chat App
    ```
  - Code excerpt:
    ```ts
    await supabase.from('web_push_subscriptions').upsert(
    ```
- **Impact**: DB migrations are missing; push will fail at runtime.
- **Suggestion (minimal fix)**: Document required Supabase tables.
- **Related Principle**: Contracts first

### 30. Supabase table `skills_registry` not documented
- **Severity**: P2
- **Location**:
  - Documentation: `README.md:191`
  - Code: `src/lib/gateway/useSkills.ts:75`
- **Evidence**:
  - Documentation excerpt:
    ```
    ### Web Chat App
    ```
  - Code excerpt:
    ```ts
    supabaseRef.current.from('skills_registry').select('*')
    ```
- **Impact**: Skills page will error without DB setup.
- **Suggestion (minimal fix)**: Add schema notes to README/docs.
- **Related Principle**: Contracts first

### 31. `/skills` route not documented
- **Severity**: P3
- **Location**:
  - Documentation: `README.md:191`
  - Code: `src/app/skills/page.tsx:7`
- **Evidence**:
  - Documentation excerpt:
    ```
    ### Web Chat App
    ```
  - Code excerpt:
    ```ts
    export default async function SkillsPage() {
    ```
- **Impact**: Feature is hidden from users.
- **Suggestion (minimal fix)**: Add route list to README.
- **Related Principle**: User-facing commitments first

### 32. `/how-it-works` route not documented
- **Severity**: P3
- **Location**:
  - Documentation: `README.md:191`
  - Code: `src/app/how-it-works/page.tsx:7`
- **Evidence**:
  - Documentation excerpt:
    ```
    ### Web Chat App
    ```
  - Code excerpt:
    ```ts
    export default function HowItWorksPage() {
    ```
- **Impact**: Feature is hidden from users.
- **Suggestion (minimal fix)**: Add route list and purpose.
- **Related Principle**: User-facing commitments first

## Review Conclusion

### Verdict

- [ ] **Pass**
- [x] **Conditional Pass** - Must fix these prerequisites first:
  1. Env variable mismatches and missing required envs (Issues 4, 8–16, 17–19, 22)
  2. Gateway port mismatch in README/`.env.example` (Issues 1, 2, 20)
- [ ] **Fail**

### Summary Statistics

| Level | Count |
|-------|-------|
| P0 Blocker | 0 |
| P1 Major | 3 |
| P2 Minor | 20 |
| P3 Nit | 9 |
| Pending Evidence | 0 |
| **Total** | **32** |

### Suggested Fix Priority

1. **Fix Immediately (P0)**:
   - None
2. **Priority Fix (P1)**:
   - #11 WEB_PUSH_API_TOKEN missing
   - #14 SUPABASE_SERVICE_ROLE_KEY missing
   - #22 MS_APP_PASSWORD vs MSTEAMS_APP_PASSWORD
3. **Planned Fix (P2)**:
   - #1 #2 #4 #7 #8 #9 #10 #12 #13 #15 #16 #17 #18 #19 #20 #21 #23 #24 #25 #26 #27 #29 #30
4. **Low Priority (P3)**:
   - #5 #6 #28 #31 #32

### Change Impact

| Impact Area | Required | Notes |
|-------------|----------|-------|
| Demo Update | No | N/A |
| Screenshot Update | No | N/A |
| Script Update | Yes | Update `.env.example` and README for push relay |
| Changelog | Optional | If docs are user-facing |
| External Notification | No | N/A |

---

## Merge Readiness Review

### Strengths
- Clear error responses in API routes (`400/401/403/500`) and explicit response payloads.
- Hooks are composed cleanly in UI (`useGateway`, `useSkills`) and state is managed predictably.

### Issues

#### Critical (Must Fix)
- **Location**: `src/app/api/chat/route.ts:4`
  - **What’s wrong**: Unauthenticated endpoint executes SSH as `root` using user-provided `agent` input.
  - **Why it matters**: Exposes a remote command execution path to any caller; high-severity security risk.
  - **Minimal fix**: Require auth (Supabase session), validate `agent` against allowlist, remove `root@` or use a restricted user.

#### Important (Should Fix)
- **Location**: `config/clawdbot.json:46` and `config/clawdbot.json:63`
  - **What’s wrong**: Duplicate JSON keys (`session`, `configWrites`) cause overrides and ambiguity.
  - **Why it matters**: Hidden config behavior and operator confusion.
  - **Minimal fix**: Remove duplicates and keep a single authoritative key.

- **Location**: `README.md:121`, `.env.example:10`
  - **What’s wrong**: Docs show gateway port 18789 while config/start script uses 18889.
  - **Why it matters**: Misconfigured deployments and failed connectivity.
  - **Minimal fix**: Align docs + env example with config.

- **Location**: repo root
  - **What’s wrong**: No tests or verification outputs recorded for this change set.
  - **Why it matters**: No evidence of correctness/regression coverage.
  - **Minimal fix**: Add at least `pnpm lint` + `pnpm build` to a verification checklist.

#### Minor (Nice to Have)
- **Location**: `scripts/push-relay.mjs:9`
  - **What’s wrong**: Relay exits if envs missing but docs do not list those envs.
  - **Why it matters**: Operability friction.
  - **Minimal fix**: Document relay envs alongside `.env.example`.

### Recommendations
- Add an auth guard for `/api/chat` and explicitly document its intended use.
- Introduce a minimal test/verification checklist in README.

### Assessment

**Ready to merge?** With fixes

**Reasoning:** Security risk in `/api/chat` blocks readiness; config/doc mismatches should be corrected to avoid broken deploys.

---

## Quality Review

## Summary
- Verdict: **With fixes**
- Scope: `HEAD` (no tracked diff; review based on current working tree)

## Triage
- Docs-only: **no**
- React/Next perf review: **yes**
- UI guidelines audit: **yes**
- Reason:
  - UI-heavy Next.js app (`src/app`, `src/components`)
  - Docs + env mismatch surfaced

## Strengths
- Consistent component-level styling and state co-location in chat flow.
- Good use of `useMemo` and `useCallback` around hot paths (`ChatClient`).

## Issues

### Critical (Must Fix)
- **Location**: `src/app/api/chat/route.ts:4`
  - **What**: Unauthenticated SSH execution as root.
  - **Why it matters**: Security exposure / remote command risk.
  - **Minimal fix**: Require auth + allowlist agents; drop root.

### Important (Should Fix)
- **Location**: `.env.example:9` + `src/lib/gateway/useGateway.ts:487`
  - **What**: Gateway envs marked optional yet required by runtime.
  - **Why it matters**: Fresh setups fail silently.
  - **Minimal fix**: Clarify docs + enforce env checks at startup.

- **Location**: `config/clawdbot.json:46`
  - **What**: Duplicate keys (session/configWrites) in JSON config.
  - **Why it matters**: Hard-to-debug config overrides.
  - **Minimal fix**: Remove duplicates.

### Minor (Nice to Have)
- **Location**: `src/lib/gateway/useGateway.ts:817`
  - **What**: Sequential uploads for images then files.
  - **Why it matters**: Adds avoidable latency.
  - **Minimal fix**: Start both uploads in parallel.

## UI Guidelines (terse)

## src/components/ChatInput.tsx

src/components/ChatInput.tsx:368 - textarea missing aria-label/label
src/components/ChatInput.tsx:378 - `outline-none` without focus-visible replacement
src/components/ChatInput.tsx:397 - icon-only button lacks aria-label

## src/components/ChatMessage.tsx

src/components/ChatMessage.tsx:636 - img missing explicit width/height
src/components/ChatMessage.tsx:209 - img missing explicit width/height

## src/components/LoginForm.tsx

src/components/LoginForm.tsx:49 - input missing autocomplete/name
src/components/LoginForm.tsx:73 - input missing autocomplete/name
src/components/LoginForm.tsx:115 - "Signing in..." should use ellipsis "…"

---

## React Best Practices Review

**Summary**: Core flows are solid, but there are a few performance and latency issues that can be improved without changing behavior.

### Critical fixes
1) **Rule**: Start Promises Early, Await Late (`async-parallel-promises.md`)
- **Location**: `src/lib/gateway/useGateway.ts:817`
- **Why it matters**: Image uploads and file uploads are sequential; this increases total send latency.
- **Minimal fix**: Start image and file uploads concurrently and `await Promise.all`.

### High impact
1) **Rule**: Use content-visibility for Long Lists (`rendering-content-visibility.md`)
- **Location**: `src/app/chat/ChatClient.tsx:591`
- **Why it matters**: Chat renders long message lists without virtualization or `content-visibility` hints.
- **Minimal fix**: Apply `content-visibility: auto` to message items or use list virtualization.

### Medium / Low
1) **Rule**: Extract Expensive Work into Memoized Components (`rerender-extract-memoized.md`)
- **Location**: `src/app/chat/ChatClient.tsx:145`, `src/app/skills/SkillsClient.tsx:96`, `src/lib/gateway/useSkills.ts:62`
- **Why it matters**: `createClient()` is invoked on re-renders (or as eager init), creating unnecessary work.
- **Minimal fix**: Memoize Supabase clients with `useRef` + lazy init or `useMemo`.

