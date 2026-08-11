# Decision Log — Maxpromo Agent Bureau

---

## ADR-001 — Auth + Tenancy Boundary

**Date:** 2026-06-05
**Status:** Approved for implementation planning
**Owner:** Marcel Tabit Akwe (Product Owner)

### Decision

Auth.js / NextAuth v5 with Credentials provider.

### Locked choices

- Email + argon2id-hashed password
- No public signup
- Maxpromo-provisioned accounts only
- JWT session strategy
- JWT carries `userId`, `businessId`, `role`
- `app_users` is the tenant user table
- `businesses` is the tenant root
- One user belongs to one business for now
- Future multi-business access deferred
- Dashboard routes protected behind login
- AI routes protected
- Approval mutation routes protected + ownership check
- Public landing page (`/`) remains open
- `/api/leads` remains public but rate-limited
- Upstash Redis recommended for rate limiting
- Public preview route deferred

### Rejected for now

- Magic link first
- Public self-signup
- Google OAuth first
- DB sessions (server sessions)
- Public dashboard with blocked writes

### Reason

The product is installed/concierge-based, not self-serve SaaS. Account creation is controlled by Maxpromo during client onboarding. This reduces abuse, protects OpenAI cost, and keeps tenant boundaries clear and auditable.

### Security driver

The current system is demo-ready but not ready for real client data until auth, ownership checks, and rate limiting are implemented.

### Implementation order

| Phase | Name | Description |
|-------|------|-------------|
| Auth-0 | Drizzle baseline reconcile | Clean migration tracking before auth columns |
| Auth-1 | Auth foundation | Auth.js, Credentials provider, provisioned users, password_hash |
| Auth-2 | Protect dashboard | Dashboard behind login, login page, logout, session helpers |
| Auth-3 | Protect APIs | requireUser, requireBusinessAccess, ownership checks |
| Auth-4 | Rate limiting | Upstash Redis for leads, AI, approvals, login |
| Auth-5 | Session business context | Remove runtime demo-by-name lookup, session businessId into queries |
| Auth-6 | Demo/admin controls | Guarded demo reset, preview route decision |

---

## ADR-002 — Drizzle Migration Baseline Strategy (Auth-0)

**Date:** 2026-06-08
**Status:** Complete
**Owner:** Marcel Tabit Akwe (Product Owner)

### Decision

Establish a Drizzle migration baseline via file-only `db:generate` before implementing any auth schema changes.

### Outcome

- `0001_sprint3_platform.sql` (manual, untracked) moved to `lib/db/migrations/_archive/`
- Drizzle baseline generated: `0000_burly_black_bird.sql` + `meta/_journal.json` + `meta/0000_snapshot.json`
- Baseline is a **phantom** — schema already applied to Neon; this file must never be re-applied

### Locked rules

- `0000_burly_black_bird.sql` is DO-NOT-APPLY — Neon already has this schema
- `drizzle-kit migrate` must not be used until migration tracking strategy is intentionally revisited
- All future schema changes must go through `db:generate` → review → manual apply via `IF NOT EXISTS` SQL
- Auth-1A migration (`0001_auth_user_columns.sql`) generated for review; not yet applied to Neon

### Migration tracking note

`db:generate` cannot run in the sandbox environment (esbuild IPC restriction). All future migration generation must be run locally by Marcel or executed via manual snapshot construction.

---

## ADR-004 — Auth-1B: NextAuth Foundation

**Date:** 2026-06-08
**Status:** Complete
**Owner:** Marcel Tabit Akwe (Product Owner)

### Decision

NextAuth v4.24.14 (not v5 — v4 is the installed version). JWT strategy. Credentials provider only.

### Files created

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth config — Credentials provider, JWT/session callbacks |
| `app/api/auth/[...nextauth]/route.ts` | App Router handler (runtime: nodejs) |
| `lib/auth/password.ts` | `hashPassword` / `verifyPassword` (argon2id) |
| `lib/auth/session.ts` | `getCurrentUser`, `requireUser`, `AuthRequiredError` |
| `lib/auth/tenancy.ts` | `getCurrentBusinessId`, `requireCurrentBusiness`, `requireBusinessAccess`, `BusinessAccessError` |
| `types/next-auth.d.ts` | Module augmentation — adds `userId`, `businessId`, `role` to Session/JWT |
| `app/login/page.tsx` | Login page (server component, German UI, dark premium) |
| `components/auth/LoginForm.tsx` | Client island — `signIn("credentials")` call |
| `components/auth/Providers.tsx` | `SessionProvider` wrapper for root layout |
| `app/api/auth-status/route.ts` | GET — returns `{authenticated, user}` via API envelope |

### Updated files

| File | Change |
|------|--------|
| `app/layout.tsx` | Added `Providers` wrapper for SessionProvider |
| `components/dashboard/Sidebar.tsx` | Added logout button (signOut → /login) |
| `.env.example` | Added `AUTH_SECRET`, `NEXTAUTH_URL` |
| `package.json` | Added `next-auth: ^4.24.14`, `argon2: ^0.44.0` to dependencies |

### Locked rules

- `runtime: "nodejs"` on all auth routes — argon2 native bindings are incompatible with Edge
- Session maxAge: 8 hours (JWT)
- `AUTH_SECRET` must never appear in NEXT_PUBLIC_ vars or be committed
- No public signup — accounts provisioned by Maxpromo only
- Error messages are deliberately vague to prevent user enumeration

---

## ADR-003 — Auth-1A: App User Auth Columns

**Date:** 2026-06-08
**Status:** Migration generated — pending Neon apply
**Owner:** Marcel Tabit Akwe (Product Owner)

### Decision

Add two nullable columns to `app_users` as the foundation for Auth.js / NextAuth v5 Credentials provider:

| Column | Type | Purpose |
|--------|------|---------|
| `password_hash` | `text` nullable | argon2id hash of provisioned password |
| `last_login_at` | `timestamp with time zone` nullable | Audit; detect stale accounts |

### Migration file

`lib/db/migrations/0001_auth_user_columns.sql`

### Apply procedure (when approved)

```sql
ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "password_hash" text;
ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone;
```

Use `IF NOT EXISTS` to make apply idempotent.

### Blocked until

Marcel and Opus review the migration SQL before any Neon apply.
Auth-1B (NextAuth install) must not start until columns are confirmed in Neon.

---

---

## ADR-005 — Auth-1C: Operator Provisioning Script

**Date:** 2026-06-08
**Status:** Complete
**Owner:** Marcel Tabit Akwe (Product Owner)

### Decision

Create a local one-off provisioning script (`scripts/provision-operator-user.mjs`) to hash and store credentials for the first operator user (Marcel) in the demo business.

### Rationale

Auth-1B delivers the auth foundation (NextAuth, password helpers, login page) but cannot function without at least one provisioned account. A dedicated local script keeps provisioning:
- Explicit (not automatic, not part of the seed)
- Auditable (logged to stdout with safe summary only)
- Repeatable (idempotent — safe to re-run to rotate credentials)
- Separate from the application codebase (lives in `scripts/`, not app routes)

### Locked rules

- Script MUST be run locally by Marcel only — never in CI, never on Vercel
- OPERATOR_PASSWORD is read from env; never logged or stored plain
- password_hash is never logged
- Script fails safely if demo business is not found (never creates a business)
- Role is "owner" per ADR-001 provisioned account convention; admin/operator roles deferred to Auth-6
- Script uses same argon2id settings as `lib/auth/password.ts` (memoryCost: 65536, timeCost: 3, parallelism: 1)

### Files

| File | Purpose |
|------|---------|
| `scripts/provision-operator-user.mjs` | Provisioning script |
| `package.json` | Added `auth:provision-operator` npm script |


---

## ADR-006 — Auth-2: Dashboard Middleware Protection

**Date:** 2026-06-08
**Status:** Complete
**Owner:** Marcel Tabit Akwe (Product Owner)

### Decision

Use NextAuth v4 `withAuth` middleware in `middleware.ts` to protect `/dashboard/:path*` behind a valid JWT session. Unauthenticated requests redirect to `/login?callbackUrl=<original path>`.

### Locked rules

- Matcher covers `/dashboard/:path*` only
- API routes remain unprotected until Auth-3
- `withAuth` reads `AUTH_SECRET` (via `NEXTAUTH_SECRET ?? AUTH_SECRET` fallback — confirmed in middleware source)
- `authorized` callback: `!!token` — presence of valid JWT is the only Auth-2 requirement. Role/tenant checks are Auth-3.
- `/api/auth/**` must never be in the matcher (would break NextAuth own endpoints)
- `/api/leads`, `/api/auth-status` must remain public

### Open risks post Auth-2

| Route | Risk | Resolved by |
|-------|------|-------------|
| `/api/ai/generate` | Open cost surface | Auth-3 + Auth-4 |
| `/api/approvals/[id]` | Mutable without auth | Auth-3 |
| All other `/api/**` | Unprotected reads | Auth-3 |
| No tenant isolation in queries | All queries use getDemoBusinessId() | Auth-5 |



---

## ADR-007 — Auth-3: API Route Protection + Ownership Checks

**Date:** 2026-06-08
**Status:** Complete
**Owner:** Marcel Tabit Akwe (Product Owner)

### Decision

Protect all non-public API routes with session authentication and business ownership checks using a dedicated guard module (`lib/auth/api-guard.ts`).

### Files created

| File | Purpose |
|------|---------|
| `lib/auth/api-guard.ts` | `requireApiUser`, `requireApiBusinessId`, `assertBusinessAccess`, `unauthorizedResponse`, `forbiddenResponse` |

### Updated files (19 route handlers)

| Route | Change |
|-------|--------|
| `app/api/ai/generate/route.ts` | `requireApiBusinessId()` guard — closes OpenAI cost surface |
| `app/api/ai/status/route.ts` | `requireApiBusinessId()` guard |
| `app/api/demo/status/route.ts` | `requireApiUser()` + owner/operator role check |
| `app/api/approvals/[id]/route.ts` | `requireApiUser()` + businessId ownership check (404-on-mismatch IDOR guard) + actorName from session |
| `app/api/approvals/route.ts` | `requireApiBusinessId()` guard |
| `app/api/activity/route.ts` | `requireApiBusinessId()` guard |
| `app/api/agents/route.ts` | `requireApiBusinessId()` guard |
| `app/api/agents/[id]/route.ts` | `requireApiBusinessId()` guard |
| `app/api/ai-governance/route.ts` | `requireApiBusinessId()` guard |
| `app/api/audit/route.ts` | `requireApiBusinessId()` guard |
| `app/api/client-implementation/route.ts` | `requireApiBusinessId()` guard |
| `app/api/contacts/route.ts` | `requireApiBusinessId()` guard |
| `app/api/dashboard/summary/route.ts` | `requireApiBusinessId()` guard |
| `app/api/documents/route.ts` | `requireApiBusinessId()` guard |
| `app/api/memory/route.ts` | `requireApiBusinessId()` guard |
| `app/api/operating-model/route.ts` | `requireApiBusinessId()` guard |
| `app/api/playbooks/route.ts` | `requireApiBusinessId()` guard |
| `app/api/projects/route.ts` | `requireApiBusinessId()` guard |
| `app/api/tasks/route.ts` | `requireApiBusinessId()` guard |
| `app/api/waiting-room/route.ts` | `requireApiBusinessId()` guard |

### Public routes (intentionally unchanged)

| Route | Reason |
|-------|--------|
| `POST /api/leads` | Lead capture from public landing page — must remain open |
| `GET/POST /api/auth/**` | NextAuth endpoints — must never be in middleware matcher |
| `GET /api/auth-status` | Session polling / health check — safe read-only |

### Locked rules

- Guard pattern: return-instead-of-throw for route handlers (no try/catch boilerplate at 20+ call sites)
- `PATCH /api/approvals/[id]` returns 404 (not 403) on businessId mismatch — IDOR-safe (no tenant existence leak)
- `actorName` in activity logs sourced from `session.user.name ?? session.user.email` (not hardcoded)
- All newly guarded routes that lacked `runtime = "nodejs"` had it added — required by argon2 import chain via auth.ts
- `GET /api/demo/status` requires `role === "owner" || role === "operator"` (internal tooling, not for future client users)

### Route protection matrix

| Layer | Protected by |
|-------|-------------|
| `/dashboard/**` pages | Auth-2: `middleware.ts` + `withAuth` (JWT redirect) |
| All `/api/**` except public routes | Auth-3: `requireApiBusinessId()` in route handler (401 JSON) |
| `/api/approvals/[id]` PATCH | Auth-3: session auth + businessId ownership check (IDOR guard) |
| `/api/demo/status` | Auth-3: session auth + owner/operator role check |
| `/api/leads`, `/api/auth/**`, `/api/auth-status` | Public — intentionally open |

### Open risks post Auth-3

| Risk | Resolved by |
|------|-------------|
| No rate limiting (leads, AI, approvals, login) | Auth-4 |
| All queries still use `getDemoBusinessId()` (demo session only) | Auth-5 |


---

## ADR-008 — Auth-4: API Rate Limiting

**Date:** 2026-06-08
**Status:** Complete
**Owner:** Marcel Tabit Akwe (Product Owner)

### Decision

Add fixed-window rate limiting to public and authenticated API routes using a custom abstraction (`lib/security/rate-limit.ts`) backed by Upstash Redis in production and an in-memory Map in local dev.

### Why no Upstash package dependency

No new npm package required. The Upstash REST API is a plain JSON HTTP endpoint. Direct `fetch` calls are sufficient and avoid adding a dependency + Edge compatibility concerns.

### Files created

| File | Purpose |
|------|---------|
| `lib/security/rate-limit.ts` | `checkRateLimit`, `getClientIp`, pre-configured limit constants |

### Updated files

| File | Change |
|------|--------|
| `app/api/leads/route.ts` | `checkRateLimit(\`leads:\${ip}\`, LEADS_LIMIT)` — 5/60s per IP |
| `app/api/ai/generate/route.ts` | `checkRateLimit(\`ai:\${userId}\`, AI_GENERATE_LIMIT)` — 10/60s per user |
| `app/api/approvals/[id]/route.ts` | `checkRateLimit(\`approvals:\${userId}\`, APPROVALS_LIMIT)` — 20/60s per user |
| `auth.ts` | `checkRateLimit(\`login:\${email}\`, LOGIN_LIMIT)` in `authorize` callback — 10/900s per email |
| `.env.example` | Added `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

### Rate limit configuration (single source of truth)

| Route | Key | Limit | Window | Notes |
|-------|-----|-------|--------|-------|
| `POST /api/leads` | `leads:{ip}` | 5 | 60s | IP-keyed; unauthenticated |
| `POST /api/ai/generate` | `ai:{userId}` | 10 | 60s | User-keyed; authenticated |
| `PATCH /api/approvals/[id]` | `approvals:{userId}` | 20 | 60s | User-keyed; authenticated |
| Login | `login:{email}` | 10 | 900s | Email-keyed; in authorize callback |

### Locked rules

- Rate limiter **fails open** on Redis errors — availability over strictness
- In-memory fallback is for local dev only — not suitable for multi-instance production
- All 429 responses return `{ ok: false, error: "rate_limited" }` (project envelope)
- Rate limit check is first in handler execution — rejects before JSON parse / DB access
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` must be set in Vercel env before real client data is onboarded

### Required production env vars

```
UPSTASH_REDIS_REST_URL=https://YOUR-DB.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR-TOKEN
```
Create a free Upstash Redis database at upstash.com → copy REST URL + token.

---

## ADR-009 — Auth-5: Tenant Isolation via Session businessId

**Date:** 2026-06-08
**Status:** Accepted
**Sprint:** Auth-5

### Context

All protected API read queries called `getDemoBusinessId()` — a name-based lookup
that returns the single demo business. This is not safe for multi-tenant usage:
any authenticated user would read the same business data regardless of which
business their session belongs to.

### Decision

1. Each query function in `lib/db/queries/` now accepts `businessId: string` as
   an explicit parameter and passes it to the Drizzle `where` clause.
2. Route handlers source `businessId` from `requireApiBusinessId()` (the Auth-3
   guard), which reads `session.user.businessId`.
3. `getDemoBusinessId()` is retained in `lib/db/queries/_shared.ts` for backward
   compat with seed scripts only — it is never called from route handlers.
4. `app/api/demo/status/route.ts` updated: `auth.user.businessId` replaces the
   `getDemoBusinessId()` call.

### Query files updated

`activity`, `agents`, `approvals`, `audit`, `dashboard`, `documents`,
`governance`, `playbooks`, `waiting-room`

### Consequences

- Cross-tenant data leakage is structurally prevented in the query layer.
- TypeScript enforces `businessId` presence — callers cannot omit it.
- Seed scripts are unaffected (they call `getDemoBusinessId()` directly).

---

## ADR-002 — Visual Facelift v2.1 (approved: full supersession)

**Date:** 2026-08-11
**Status:** **Approved — supersedes the 2026-05-29 dark-premium lock.** Product Owner
issued an explicit "MAXPROMO DIGITAL VISUAL REFRESH EXECUTION PLAN" (2026-08-11)
confirming **Option 1 (full supersession)**: the v2.1 light system replaces
dark-premium/orange everywhere, rolled out in 8 phases (Foundation → Homepage →
Image cleanup → Global marketing rollout → Agent Bureau → Dashboards → Content
review → Final QA), pausing for review + a manual `git commit` (Product Owner runs
git; see workflow note) after each phase.
**Owner:** Marcel Tabit Akwe (Product Owner)

### Context

§7–8 of `PLAN.md` records a Product-Owner-locked landing aesthetic (2026-05-29):
**"HYBRID (locked)"** — dark premium background, single orange accent (`#ff6a1a`),
`// comment` monospace labels, live status-ticker, implemented in
`tailwind.config.ts` (`ink-950…600` surfaces) and used across
`components/marketing/*` and `components/dashboard/*`.

On 2026-08-11 the Product Owner supplied a full spec — **"MAXPROMO agent bureau
VISUAL FACELIFT v2.1"** (filed at `docs/visual-facelift-v2.1.md`) — calling for a
**white-background, light-mode, Stripe/Linear/GitHub-style** system across
maxpromo.digital, agents.maxpromo.digital, OpenClaw, dashboards, audit pages,
documentation, and client portals. This is the opposite surface direction from the
2026-05-29 lock (light vs. dark) and would supersede it if approved.

### Decision

**Not yet made.** This entry records that a material, conflicting design decision
has been proposed and is pending explicit confirmation before any component or
Tailwind token changes are implemented, per repository governance (material
architecture decisions require Product Owner approval, not agent self-approval).

### Options presented to Product Owner

1. **Full supersession** — replace the dark-premium/orange system with the v2.1
   light system everywhere (repo-wide token rewrite in `tailwind.config.ts`,
   every component in `components/marketing/*` and `components/dashboard/*`
   touched).
2. **Principles-only adoption** — keep the dark-premium/orange base (honor the
   2026-05-29 lock) but adopt v2.1's underlying philosophy: larger/bolder
   typography, more whitespace, image discipline (no stock/AI imagery — this repo
   already has none), flatter cards, calmer motion.
3. **Split scope** — v2.1 light system for the public marketing site
   (maxpromo.digital / `app/(marketing)`), dark-premium retained for the
   authenticated dashboard (enterprise-operational tone).

### Consequences (once a decision is made)

- Whichever option is chosen must be reflected back into `PLAN.md` §7–8 (the lock
  language) so the two documents stop disagreeing.
- Full supersession is the highest-effort, highest-risk option (touches every
  marketing + dashboard component); needs a staged implementation plan and
  before/after review, not a single large diff.

### Phase 1 — Design Foundation (complete, 2026-08-11)

Tokens + shared marketing chrome only — no layout, no page content, no dashboard
(dashboard is Phase 6). Files changed:

- `tailwind.config.ts` — new `surface`/`footer` color tokens (additive), `accent`
  updated to `#F97316` family, `maxWidth.content` 1120px → 1500px, new `fontSize`
  scale (`hero`, `section-title`, `card-title`, `body`) per v2.1 §4. Legacy
  `ink`/`line` tokens **kept, untouched** — still load-bearing for the dashboard
  until Phase 6.
- `app/globals.css` — `body` now `bg-surface text-zinc-900` (verified safe: dashboard
  shell sets its own `bg-ink-900` wrapper, confirmed via
  `components/dashboard/DashboardShell.tsx` before this change). `.bg-grid` glow
  replaced with a flat section wash (v2.1 §15 — no gradients/glow). New `@layer
  components`: `.card`, `.btn`/`.btn-primary`/`.btn-secondary`, `.field-label`,
  `.field-input`.
- `components/marketing/Nav.tsx` — 90px sticky white nav, no backdrop-blur/glass,
  18px links.
- `components/marketing/Footer.tsx` — `#161A1D` background, orange links, larger
  vertical spacing.
- `components/marketing/LeadForm.tsx`, `AuditCta.tsx` — inputs/buttons/card moved
  onto the new `.field-input`/`.btn-primary`/`.card` classes. No field, validation,
  copy, or layout changes.

**Verification:** JSX/TS syntax-checked clean (isolated `tsc` pass on the 4 changed
components + config, brace-balance check on the CSS) and Tailwind class names
cross-checked against the new token definitions by hand. Could **not** run a full
`npm run typecheck` / `npm run build` against the live project — the device-bridge
shell has a 45s hard ceiling and the project's cold typecheck exceeds it (confirmed:
two attempts timed out at 43–45s). **Marcel: please run `npm run typecheck && npm
run build` locally before/instead of trusting this is 100% clean** — this is a real
verification gap, not a formality.
- Risk 4 in `known-risks.md` is resolved.

### Phases 2–6 — Homepage, Agent Bureau, remaining marketing pages, Dashboard (complete, 2026-08-11)

Full supersession completed for every remaining surface in scope. All dark-premium
(`ink-*`/`border-line`/`#ff6a1a`) classes and hardcoded hex values are gone
repo-wide — confirmed via grep across `**/*.{tsx,ts}` (zero matches). The legacy
`ink`/`line` Tailwind tokens have been removed from `tailwind.config.ts` (dead
code once every consumer migrated); the stale "unaffected until Phase 6" comment
in `app/globals.css` was updated to reflect full supersession.

**Homepage + Agent Bureau (Phases 2 + 5, combined — avoids a visually inconsistent
in-between state):**
- `Hero.tsx` — light `bg-surface-subtle` section, `text-hero` typography token,
  `.btn-primary`/`.btn-secondary` buttons, `StatusTicker` restyled light.
- `Pillars.tsx`, `BeforeAfter.tsx` — cards moved onto the shared `.card` utility
  (white, `border-zinc-200`, 40px padding per v2.1 §8/§5).
- `Stats.tsx` — section background moved to `bg-surface-subtle` (v2.1 §3 Section
  Background token).
- `AgentBureau.tsx` — **redesigned per the "AGENT CARDS" brief**: the nine
  specialist agents changed from a compact two-column manifest table to one
  `.card` per agent (glyph, name, function, approval-scope badge), reusing the
  existing data fields only — no fields (owner/runtime/deployment status) were
  invented, since content/functionality must be preserved, only presentation
  improved. Chief of Staff kept as an elevated banner above the grid.
- `AgentSystemMap.tsx`, `SafeActionLifecycle.tsx`, `BusinessFlowInfographic.tsx` —
  inline-SVG diagrams re-themed light (white nodes, `zinc-200`/`zinc-300`
  rings/lines, `zinc-900` text, accent `#F97316`). The `feGaussianBlur` glow
  filters behind emphasis nodes were **removed** (v2.1 §15 "no glow") and
  replaced with the flat opacity-ring pattern `BusinessFlowInfographic` already
  used elsewhere in the same file.
- `Integrations.tsx`, `StatusTicker.tsx` — ticker/pills moved to white/
  `bg-surface-subtle`; the hover glow box-shadow on integration pills was removed
  (v2.1 §15), leaving a plain border/text color change on hover.
- `AuditCta.tsx`, `LeadForm.tsx`, `Nav.tsx`, `Footer.tsx` — verified already fully
  converted in Phase 1, no changes needed.

**Remaining marketing pages (Phase 4):** `datenschutz/page.tsx`,
`impressum/page.tsx` recolored to light (headings/body text only — legal content
untouched). `app/login/page.tsx` and `components/auth/LoginForm.tsx` converted:
removed the ambient gradient glow behind the login card (v2.1 §15),
card moved onto `.card`, inputs moved onto the shared `.field-input`/
`.field-label` classes (previously bespoke dark input styling), submit button
onto `.btn-primary`.

**Dashboard (Phase 6):** ~46 files (`DashboardShell`, `Sidebar`, `Topbar`, all
~29 `components/dashboard/*` cards/badges/panels, and 17 of 19
`app/dashboard/**/page.tsx` route files — 2 pages needed no change, they only
compose already-converted components) converted from the dark-premium shell to
the v2.1 light system. Semantic status/risk/priority colors (approval states,
audit risk levels, governance flags) were **kept functionally** but tone-mapped
from dark-tuned weights (e.g. `text-emerald-400` on dark) to light-compatible
AA-contrast weights (e.g. `text-emerald-700 bg-emerald-50 border-emerald-200`) —
a straight 1:1 hex swap would have failed WCAG AA on white per v2.1 §16. Orange
accent reserved for the single most important action/state per card, not used
decoratively. Sidebar active-state uses `accent-soft` background + accent text,
no glow.

Work was executed via three parallel background agents (shell+atoms,
card/panel components, route pages) plus direct edits for the homepage/Agent
Bureau centerpiece. One agent attempt on the card/panel slice returned a
false "completed" status without touching any files (caught via `git status`
before trusting it) and was relaunched from scratch — flagged here per the
memory/governance discipline of not trusting agent self-reports without
verification.

**Verification:** `npx tsc --noEmit` — clean, zero errors. `npm run build` —
clean, all 21 static/dynamic routes compiled and prerendered successfully.
Live-browser visual QA **could not be completed** in this session: this
machine has an unrelated project ("Pure Body & Soul" wellness site) already
bound to ports 3000/3001, and a local networking layer (Docker/WSL loopback
relay, unconfirmed) routes `localhost`/`[::1]` traffic on those ports to that
project's dev server regardless of which process actually owns the socket per
`netstat` — confirmed via direct `curl` to both `127.0.0.1` and `[::1]`
explicitly, both returned the wrong site's HTML. This is a local machine/
networking issue, not a code defect. **Marcel: please run `npm run dev`
locally (or free up ports 3000/3001) and do a visual pass against
`docs/visual-facelift-v2.1.md` before treating this as fully verified** — same
category of gap as Phase 1's, now applying to Phases 2–6 as well.
- Risk 16 in `known-risks.md` fully resolved. Risk 18 updated (Phases 2–6 hit
  the same verification-environment limitation as Phase 1, for a different
  reason — port conflict, not a shell timeout).
