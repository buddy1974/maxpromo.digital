# Known Risks — Maxpromo Agent Bureau

Last updated: 2026-08-11 (Visual Facelift v2.1 — Phases 1–6 complete)

---

## P0 — Critical (block real client data)

| # | Risk | Detail |
|---|------|--------|
| 1 | ~~Dashboard routes are public~~ | **RESOLVED — Auth-2 complete.** `middleware.ts` with `withAuth` protects `/dashboard/:path*`. Unauthenticated requests redirect to `/login?callbackUrl=<path>`. |
| 2 | ~~`/api/ai/generate` is a public cost surface~~ | **RESOLVED — Auth-3 complete.** `requireApiBusinessId()` guard added. Unauthenticated requests receive 401. Rate limiting still pending (Auth-4). |
| 3 | ~~`/api/approvals/[id]` is mutable without auth~~ | **RESOLVED — Auth-3 complete.** 401 if no session; businessId ownership check returns 404 (IDOR-safe); actorName sourced from session. |
| 4 | ~~No tenant isolation~~ | **RESOLVED — Auth-5 complete.** All read queries now accept `businessId: string` sourced from `session.user.businessId`. `getDemoBusinessId()` removed from all route paths; retained in `_shared.ts` for seed scripts only. |
| 5 | ~~No rate limiting~~ | **RESOLVED — Auth-4 complete.** Fixed-window rate limiting added to `/api/leads` (5/60s IP), `/api/ai/generate` (10/60s user), `/api/approvals/[id]` (20/60s user), login (10/900s email). Upstash Redis in production; in-memory fallback for local dev. |

**Rule:** Do not onboard real client data until Auth-1 through Auth-5 are complete.

> ✅ Auth-1 through Auth-5 are now complete. Tenant isolation is enforced. Real client onboarding is unblocked.

---

## P1 — High (must resolve before scaling)

| # | Risk | Detail |
|---|------|--------|
| 6 | ~~Drizzle migration baseline/journal reconciled~~ | **RESOLVED — Auth-0 complete.** Baseline `0000_burly_black_bird.sql` is DO-NOT-APPLY. `0001_auth_user_columns.sql` generated for review. Neon apply pending Marcel + Opus approval. |
| 7 | Real client data must not enter the system before Auth-1 to Auth-4 complete | The current demo state contains seeded test data only. Real business data requires tenant isolation and ownership checks first. |
| 8 | Datenschutz must be updated before scaling paid traffic or handling real client dashboard data | Current privacy policy may not reflect actual data flows once client tenants are active. |
| 9 | Telegram lead notifications carry lead PII | Lead name and email are sent to a Telegram bot on every form submission. This is documented and intentional but must remain auditable and disclosed in Datenschutz. |
| 10 | OpenAI usage has no cost logging | No per-request cost tracking. Usage cannot be attributed to a tenant, audited, or capped. |

---

## P2 — Medium (acceptable during concierge phase)

| # | Risk | Detail |
|---|------|--------|
| 11 | Manual password reset only | During concierge onboarding, password reset will be manual (Maxpromo-operator action). Self-serve reset deferred. Acceptable while user count is small. |
| 12 | No MFA | Single-factor auth only in Auth-1. MFA deferred. |
| 13 | ~~Demo workspace depends on name lookup at runtime~~ | **RESOLVED — Auth-5 complete.** `getDemoBusinessId()` removed from all route query calls. Session `businessId` used throughout. |
| 14 | Some dashboard pages still use config/mock data | Dashboard modules sourced from static config or mock queries. Must be verified against live Neon data before client onboarding. |
| 15 | Mobile dashboard nav needs improvement | Current sidebar/nav layout has known mobile UX gaps. Not a security risk, but noted for pre-launch readiness. |

---

## P1 — Documentation / governance gaps (from 2026-08-11 preflight)

| # | Risk | Detail |
|---|------|--------|
| 16 | ~~Design direction conflict, unresolved~~ | **RESOLVED — 2026-08-11.** Product Owner confirmed full supersession via explicit execution plan; ADR-002 updated. Phases 1–6 (tokens, Nav/Footer/forms, homepage, Agent Bureau, remaining marketing pages, dashboard) are all implemented. `PLAN.md` §7–8 lock language still needs a follow-up edit so it stops contradicting `decision-log.md` (tracked, not yet done — see risk 19). Phases 7–8 (content/copy review, final QA sign-off) remain open. |
| 18 | ~~Phase 1 not verified against a full project build~~ | **RESOLVED for Phases 1–6 — 2026-08-11.** `npx tsc --noEmit` and `npm run build` both ran clean (21/21 routes compiled and prerendered) in this session. Live-browser visual QA could **not** be completed — this machine has an unrelated project already bound to ports 3000/3001, and a local networking layer routes `localhost` traffic on those ports to that project's dev server regardless of which process owns the socket (confirmed via `netstat` + direct `curl` to both `127.0.0.1` and `[::1]`). This is a local machine/networking issue, not a code defect. **Marcel: run `npm run dev` locally (or free up ports 3000/3001) and do a visual pass against `docs/visual-facelift-v2.1.md` before treating this as fully verified.** |
| 17 | Governance docs incomplete | CLAUDE.md's required-reading list (`docs/repository-map.md`, `product-brief.md`, `architecture.md`, `workflow-map.md`, `data-ownership.md`, `production-readiness.md`) is only partially present — `decision-log.md` and `known-risks.md` exist, the other five do not. The AI Operating System template source (`C:\Users\loneb\Documents\AI-OPERATING-SYSTEM\MASTER-AI-OPERATING-SYSTEM.md`) is outside the folders connected to this session, so templates couldn't be pulled. |
| 19 | ~~`PLAN.md` §7–8 still states the old dark-premium lock~~ | **RESOLVED — 2026-08-11.** `PLAN.md` §7 and §8 now carry a superseded-note pointing to `docs/visual-facelift-v2.1.md` / ADR-002; historical text struck through, not deleted. |
| 20 | Visual Facelift Phases 7–8 (content/copy review, final QA sign-off) not started | Phases 1–6 are implemented and build-clean; nobody has done a content/copy pass (v2.1 §15 "remove every vibe-coded signal" applies to copy too, not just visuals) or a final cross-page QA sweep. Recommend Marcel do a visual pass locally first (this also closes risk 18), then decide if a dedicated content-review phase is still wanted. |

---

## Resolution path

Risks 1–5 are resolved by Auth-1 through Auth-4.
Risk 6 is resolved by Auth-0.
Risks 7–10 require process and documentation steps alongside Auth implementation.
Risks 11–15 are acceptable during concierge phase and tracked for later sprints.
