# Route Protection Matrix — Maxpromo Agent Bureau

Last updated: 2026-06-08 (Auth-4 complete)

---

## Page Routes

| Route | Current Status | Target Status | Protection Needed | Notes |
|-------|---------------|---------------|-------------------|-------|
| `/` | Public | Public | None | Landing page, lead capture CTA |
| `/impressum` | Public | Public | None | Legal requirement |
| `/datenschutz` | Public | Public | None | Legal requirement |
| `/dashboard` | Public (no auth) | Protected | Auth session required | Redirect to `/login` if no session |
| `/dashboard/briefing` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/agents` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/ai-lab` | Public (no auth) | Protected | Auth session required | Correct route; `/ai-lab` is not a route |
| `/dashboard/approvals` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/audit` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/client-implementation` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/ai-governance` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/contacts` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/documents` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/memory` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/operating-model` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/playbooks` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/projects` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/research` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/settings` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/tasks` | Public (no auth) | Protected | Auth session required | |
| `/dashboard/waiting-room` | Public (no auth) | Protected | Auth session required | |
| `/login` | Does not exist | Must create | None (public) | Created in Auth-2 |

---

## API Routes

| Route | Method | Current Status | Target Status | Protection Needed | Notes |
|-------|--------|---------------|---------------|-------------------|-------|
| `/api/leads` | POST | **Rate-limited (Auth-4)** | Public + rate-limited | `checkRateLimit` 5/60s per IP | ✓ |
| `/api/dashboard/summary` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/agents` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/agents/[id]` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/activity` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/ai-governance` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/approvals` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/approvals/[id]` | PATCH | **Protected + Rate-limited (Auth-3/4)** | Protected + rate-limited | `requireApiUser()` + ownership check + `checkRateLimit` 20/60s per user | ✓ |
| `/api/audit` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/client-implementation` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/contacts` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/documents` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/memory` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/operating-model` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/playbooks` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/projects` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/tasks` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/waiting-room` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/ai/status` | GET | **Protected (Auth-3)** | Protected | `requireApiBusinessId()` | ✓ |
| `/api/ai/generate` | POST | **Protected + Rate-limited (Auth-3/4)** | Protected + rate-limited | `requireApiBusinessId()` + `checkRateLimit` 10/60s per user | ✓ |
| `/api/demo/status` | GET | **Protected (Auth-3)** | Protected (owner/operator) | `requireApiUser()` + role check (owner/operator) | ✓ |

---

## Notes

- All protected dashboard pages will be covered by a single `middleware.ts` matcher in Auth-2.
- Individual API route protection (`requireUser`, `requireBusinessAccess`) applied in Auth-3.
- Rate limiting applied via Upstash Redis middleware in Auth-4.
- `getDemoBusinessId()` in all query files is replaced with session `businessId` in Auth-5.
- Login rate limiting (10 attempts / 900s per email) is applied inside the NextAuth `authorize` callback (`auth.ts`).
- Vercel preview URLs (maxpromo-agent-bureau.vercel.app) must not be treated as public-facing. They expose the same unprotected routes. Resolved implicitly by Auth-2 + Auth-3.
