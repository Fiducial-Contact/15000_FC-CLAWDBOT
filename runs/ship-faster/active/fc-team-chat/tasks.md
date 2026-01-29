# FC Team Chat - Tasks

**Status**: active  
**Scope**: full  
**Created**: 2026-01-27

## Next Action

1. Implement Supabase Auth
2. Connect Gateway WebSocket
3. Deploy to Vercel

## Approvals

(none pending)

---

## Foundation

- [x] Next.js 16.1.5 initialized
- [x] Tailwind CSS 4 configured
- [x] Supabase packages installed (@supabase/ssr, @supabase/supabase-js)
- [x] Build passes (`pnpm build` → success)
- [x] ESLint passes
- [x] TypeScript strict mode enabled
- Evidence: `evidence/foundation.md`

## Design System

- [x] Created design-system.md with Fiducial brand tokens
- [x] Brand already applied to all components
- [x] User confirmation: inherited from fiducial-brand-guideline skill

## UI/UX Implementation

- [x] Login page follows design system
- [x] Chat page follows design system
- [x] All components use CSS variables
- [x] Responsive design implemented
- [x] Focus states and accessibility

## Guardrails

- [x] ESLint config (core-web-vitals + typescript)
- [x] TypeScript strict: true
- [ ] Pre-commit hooks (optional, skipped)

## Trace Cleanup

- [x] Removed Next.js starter SVGs
- [x] Removed default favicon.ico
- [x] No vendor branding traces
- [x] No hardcoded localhost URLs
- Evidence: `evidence/trace-scan.md`

## Docs Baseline

- [x] README.md complete
- [ ] Environment variables documented (.env.example)
- [ ] Setup instructions verified

## Feature: Supabase Auth

- [ ] Create auth client utilities
- [ ] Server-side auth (middleware)
- [ ] Login page integration
- [ ] Protected routes
- [ ] Session management
- [ ] Logout flow

## Feature: Gateway WebSocket

- [ ] WebSocket client implementation
- [ ] Connect handshake with auth token
- [ ] chat.send implementation
- [ ] Streaming response handling
- [ ] chat.history implementation
- [ ] Error handling & reconnection

## Deploy (Vercel)

- [ ] Create GitHub repo
- [ ] Connect Vercel
- [ ] Environment variables
- [ ] Production deploy
- [ ] Verify live site

---

## Scope / Disabled Steps

- SEO: disabled (need_seo=false) - internal tool only
- Stripe: disabled (need_billing=false)

## Delivery Summary

(to be filled on completion)
