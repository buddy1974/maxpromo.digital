# Auth Readiness Inventory — Maxpromo Agent Bureau

Last updated: 2026-06-05
Purpose: Pre-implementation reference for Auth-0 through Auth-6 planning.

---

## 1. Current Auth State

- No authentication
- No session management
- No middleware.ts (file does not exist)
- No route protection of any kind
- No rate limiting
- All dashboard pages and API routes are publicly accessible

---

## 2. Current Database Tables (relevant to auth)

| Table | Purpose | Auth relevance |
|-------|---------|----------------|
| `businesses` | Tenant root | Will become the boundary for all data access |
| `app_users` | Tenant user records | Will store credentials; needs `password_hash`, `last_login_at` |
| `agent_proposals` | Agent action proposals | Needs ownership check via `businessId` |
| `approval_events` | Approval decisions | PATCH route needs ownership check |
| `activity_logs` | Audit trail | Should be scoped to `businessId` |
| `lead_submissions` | Lead capture | Public POST; no auth needed but rate limiting required |

`app_users` current columns: `id`, `businessId`, `email`, `name`, `role`, `createdAt`

---

## 3. Required Schema Additions (Auth-1)

| Column | Table | Type | Purpose |
|--------|-------|------|---------|
| `password_hash` | `app_users` | `text NOT NULL` | argon2id hash of provisioned password |
| `last_login_at` | `app_users` | `timestamp with time zone` | Audit; detect stale accounts |

These columns do NOT exist yet. Must be added via Drizzle migration in Auth-1, after Auth-0 baseline reconcile.

---

## 4. Required Helpers to Create (future sprints)

| File | Sprint | Purpose |
|------|--------|---------|
| `lib/auth/session.ts` | Auth-2 | Session read helpers, `requireUser()` guard |
| `lib/auth/tenancy.ts` | Auth-3 | `requireBusinessAccess(businessId)`, ownership checks |
| `lib/auth/rate-limit.ts` | Auth-4 | Upstash Redis rate limit wrapper |
| `middleware.ts` | Auth-2 | Next.js edge middleware; protects `/dashboard/**` and `/api/**` (except `/api/leads`) |

---

## 5. Required Future Environment Variables

| Variable | Sprint | Purpose |
|----------|--------|---------|
| `AUTH_SECRET` (or `NEXTAUTH_SECRET`) | Auth-1 | JWT signing secret |
| `UPSTASH_REDIS_REST_URL` | Auth-4 | Rate limiting store |
| `UPSTASH_REDIS_REST_TOKEN` | Auth-4 | Rate limiting store auth |

---

## 6. Route Files That Will Need Auth (by sprint)

### Auth-2 — Middleware covers all dashboard pages

```
app/dashboard/page.tsx
app/dashboard/agents/page.tsx
app/dashboard/ai-governance/page.tsx
app/dashboard/ai-lab/page.tsx
app/dashboard/approvals/page.tsx
app/dashboard/audit/page.tsx
app/dashboard/briefing/page.tsx
app/dashboard/client-implementation/page.tsx
app/dashboard/contacts/page.tsx
app/dashboard/documents/page.tsx
app/dashboard/memory/page.tsx
app/dashboard/operating-model/page.tsx
app/dashboard/playbooks/page.tsx
app/dashboard/projects/page.tsx
app/dashboard/research/page.tsx
app/dashboard/settings/page.tsx
app/dashboard/tasks/page.tsx
app/dashboard/waiting-room/page.tsx
```

### Auth-3 — Individual API route hardening

```
app/api/activity/route.ts
app/api/agents/route.ts
app/api/agents/[id]/route.ts
app/api/ai-governance/route.ts
app/api/ai/generate/route.ts          ← rate-limited too
app/api/ai/status/route.ts
app/api/approvals/route.ts
app/api/approvals/[id]/route.ts       ← ownership check + rate-limited
app/api/audit/route.ts
app/api/client-implementation/route.ts
app/api/contacts/route.ts
app/api/dashboard/summary/route.ts
app/api/demo/status/route.ts          ← admin/operator role only
app/api/documents/route.ts
app/api/memory/route.ts
app/api/operating-model/route.ts
app/api/playbooks/route.ts
app/api/projects/route.ts
app/api/tasks/route.ts
app/api/waiting-room/route.ts
```

### Stays public (rate-limited in Auth-4)

```
app/api/leads/route.ts
```

---

## 7. Demo Business Context References (must be replaced in Auth-5)

All query files use `getDemoBusinessId()` from `lib/db/queries/_shared.ts`.
This is a name-based lookup using `DEMO_BUSINESS_NAME = "Maxpromo Demo Operations"` from `config/demo.ts`.

Files that call `getDemoBusinessId()`:

| File | Line |
|------|------|
| `lib/db/queries/_shared.ts` | 26 (definition) |
| `lib/db/queries/activity.ts` | 9 |
| `lib/db/queries/agents.ts` | 9 |
| `lib/db/queries/approvals.ts` | 11 |
| `lib/db/queries/audit.ts` | 10 |
| `lib/db/queries/documents.ts` | 13 |
| `lib/db/queries/governance.ts` | 20 |
| `lib/db/queries/playbooks.ts` | 13 |
| `lib/db/queries/waiting-room.ts` | 9 |
| `app/api/demo/status/route.ts` | 21 |

**Auth-5 action:** Replace all `getDemoBusinessId()` calls with session-derived `businessId`. The `config/demo.ts` constants and `getDemoBusinessId()` helper must be retired from the application runtime.

---

## 8. Public URL / Route Audit

### `/dashboard/ai-lab`
- Correct route: `app/dashboard/ai-lab/` ✓
- Sidebar link: `components/dashboard/Sidebar.tsx` line 29 → `/dashboard/ai-lab` ✓
- `/ai-lab` is intentionally NOT a route (no `app/ai-lab/` directory exists)

### Vercel preview URLs
- `maxpromo-agent-bureau.vercel.app` — Vercel preview domain, exposes same unprotected routes
- `maxpromo-agents.vercel.app` — no reference found in codebase
- **Risk:** Preview URLs bypass any future domain-level protection. Must be handled by:
  - Auth-2 middleware (session required) applied to all environments
  - Optionally: Vercel deployment protection (password-protect preview deployments)

### OpenAI key exposure
- `OPENAI_API_KEY` referenced in: `config/env.ts`, `lib/ai/openai-provider.ts`
- Not hardcoded; read from environment ✓
- `.env.example` has placeholder `OPENAI_API_KEY=""` ✓
- No cost logging or per-request attribution currently

---

## 9. Middleware Status

`middleware.ts` — **does not exist**

Must be created in Auth-2. Will use NextAuth's `withAuth` wrapper or custom session check.

Matcher pattern (draft):
```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/agents/:path*',
    '/api/approvals/:path*',
    '/api/ai/:path*',
    '/api/activity',
    '/api/audit',
    '/api/contacts',
    '/api/dashboard/:path*',
    '/api/documents',
    '/api/memory',
    '/api/operating-model',
    '/api/playbooks',
    '/api/projects',
    '/api/tasks',
    '/api/waiting-room',
    '/api/client-implementation',
    '/api/ai-governance',
    '/api/demo/:path*',
  ],
};
```
