# Known Risks — Maxpromo Platform

## OPEN — Agent Bureau claims EU hosting; its database is in us-east-1

`agents.maxpromo.digital` states publicly, in its hero: "DSGVO-konform, in der
EU gehostet, gebaut in Essen." Its Neon database is in **us-east-1** (Virginia).
The web application's is correctly in eu-central-1.

The tables in that US instance include `contacts`, `leads`,
`waiting_room_items`, `memory_entries` and `document_intake_items` — personal
data of German business contacts.

This is a factual mismatch between a public statement and deployed
infrastructure, with GDPR Chapter V (third-country transfer) implications.

**Not resolved unilaterally, deliberately.** Both available actions are
Marcel's: changing the copy removes the claim rather than the discrepancy and
erases the evidence of it; moving the database is a production data migration
on live customer records.

**Disclosure:** the sentence in its current wording was written during the v5.1
copy rewrite. The claim predates that as the trust badge "EU-gehostet", but it
was carried forward without being checked against the infrastructure.

**Owner:** Marcel. **Blocks:** onboarding further personal data into Agent
Bureau.

---

## 2026-07-10 — Build/typecheck/lint unverified after public MVP sprint (BLOCKING)

The Cowork session's sandboxed shell had a stale page-cache bug on this repo's mount: content of files edited during the session was served from an old cached copy (confirmed via `stat` mtimes up to a month stale) even though every file was correctly written to the real Windows filesystem. As a result, `npm run build`, `npx tsc --noEmit`, and `npm run lint` could not be run trustworthily from inside that session. Every changed file was manually re-verified structurally sound (balanced JSX, no truncation) by reading it directly, but this is not a substitute for a real build.
**Action required: run `npm run build`, `npx tsc --noEmit`, and `npm run lint` locally before the next deploy.**

## 2026-07-10 — In-memory rate limiting won't survive multi-instance/serverless scale

Rate limiting added this sprint (`newsletter/subscribe`, `estimate`, `estimate/send`, `discovery/estimate`, `discovery/send`, `portfolio/auth`, `os/login`) uses an in-memory, per-process, per-IP sliding window (`lib/rate-limit.ts`) — no Redis/Upstash dependency exists in this repo. Fine at current traffic; will not hold once the app runs across multiple serverless instances or survives cold starts reliably. Revisit with a shared store if traffic or deployment topology changes.

## 2026-07-10 — Newsletter honeypot is backend-only

A honeypot field check was added to `app/api/newsletter/subscribe/route.ts`, but no frontend form currently sends a hidden `website`/`company_url` field, so it's currently a no-op. Needs `components/NewsletterSignup.tsx` (or equivalent) updated with a hidden field to activate.

## 2026-07-10 — Open Graph image is an interim fallback

`app/layout.tsx` now points OpenGraph/Twitter `images` at `/logo.png` (square logo) so shared links never render blank, but this is not a proper 1200×630 social-preview asset. Produce a dedicated OG image.

## 2026-07-10 — Homepage pain cards and 5 service-page hero photos still missing

`public/images/homepage/pain/` and 5 `public/images/services/{slug}/hero.jpg` paths have no approved photography. Both currently degrade gracefully (no broken images), but the visual is incomplete until real photography is dropped in — shot lists exist in `public/images/homepage/README.md` and `public/images/services/README.md`.

## 2026-07-10 — Unverified locale-leak claims from the release audit

`/de/automation-audit`, `/de/discovery`, `/de/portfolio`, `/de/automation-lab`, `/de/data-deletion` were flagged in a prior audit as rendering English content on German routes. This was not independently re-checked in the 2026-07-10 sprint — status unknown, needs verification.

## 2026-07-10 — Sandbox-only orphan files (non-blocking, cosmetic)

Six `.fuse_hidden########` files and one `.tsc_out.txt` were left in the working tree by the sandbox's FUSE mount during concurrent file writes this session. They are untracked, contain no useful content (old pre-edit copies), and could not be deleted from the sandbox (`Operation not permitted`). Safe to delete by hand if still present.

## 2026-09-03 - Agent Bureau is still on the retired orange (VISIBLE)

maxpromo-agent-bureau was not touched in the v4.0 pass. It is a separate
repository on Next 15 / Tailwind v3 and cannot consume design/tokens until it is
aligned to Next 16 / Tailwind v4 (batch B1). Until then agents.maxpromo.digital
renders in the retired orange while maxpromo.digital renders in Brand Lime.
**This is the one place the ecosystem is currently visibly inconsistent.**
Prioritise B1 then B8.

## 2026-09-03 - app/os surfaces remain dark; 235 hardcoded values

The OS accent was unified so it flipped to lime with everything else, but its
dark surfaces are untouched. The marketing site is light and the internal OS is
dark - still two visual languages, now sharing one accent. The light migration
is a redesign of 13 pages plus decomposition of a 489-line layout component, and
was deliberately not coupled to the brand change. Decision D3 is still open.

## 2026-09-03 - No mechanical enforcement of the no-hardcoded-colour rule yet

Phase 2 section 4.4 specified a CI check failing the build on hex literals
outside the token package, plus a lint rule banning raw Tailwind palette
classes, introduced warn-only and promoted to error at the end. Neither is
implemented yet. The v2.1 system was specified in August, implemented twice, and
still left 1252 hardcoded values - writing the rule in a document has already
been tried and has already failed. Without the check, drift will resume.

## 2026-09-03 - Responsive and accessibility QA incomplete

Browser QA covered the homepage and a product page at 1440px, plus
computed-style verification of token resolution. Not yet done: mobile and tablet
breakpoints across the full page set, keyboard navigation, focus-state audit,
ARIA review, and a systematic contrast audit of every rendered pair. The token
values were contrast-checked at design time; the rendered result has not been.

## 2026-09-03 - Showcase product imagery is off-brand marketing collage

The product pages (for example /systems/handwerk-os) carry large promotional
composites containing their own green branding, their own typography and their
own layout. v4.0 requires that every image teach something and that decorative
marketing imagery be removed. These are content assets, not code, and need
replacing with real product screenshots, workflow diagrams or architecture
illustrations.

## OPEN — the Agent Bureau dashboard renders from mock data

Every page under `/dashboard` reads from `lib/mock/*` (14 files). The 19 API
routes behind them query the real database, are correctly guarded and, where
they mutate, rate limited — but nothing calls them.

This is not dead code and must not be deleted: it is a working, secured data
layer that the interface has not been wired to. The v6.0 platform audit
reported those routes as uncalled, and deleting them on that signal would have
destroyed the layer.

**Consequence:** the dashboard looks finished and is not. Anyone demonstrating
it should know the figures are fixtures.

**Owner:** Marcel. **Next step:** wire the pages to the queries, page by page,
verifying tenant scoping on each.

---

## Technical debt — recorded 2026-09-03

- **Tenant ownership is checked inline per route**, not through a shared
  helper. Every new route that reads tenant-scoped data must remember to derive
  `businessId` from the session and compare. The reasoning and the pattern are
  in `docs/architecture/agent-bureau-route-protection.md`.
- **Most Agent Bureau API routes have no rate limit.** Only `/api/leads`,
  `/api/ai/generate` and `/api/approvals/[id]` do. The others are
  authentication-gated, so the exposure is bounded, but an authenticated client
  can call them without limit.
- **`apps/os` is not extracted.** The internal OS still lives inside
  `apps/web`, sharing `lib/db` and `lib/email`. Extraction needs
  `packages/shared` first, plus its own domain and Vercel project.
- **No automated test suite.** Verification is types, lint, build and four
  audits. There are no unit or integration tests; correctness of business logic
  — invoice totals, VAT handling, document numbering — rests on review.

---

---

# Agent Bureau — risks carried over

These were recorded in `maxpromo-agent-bureau/docs/known-risks.md` before the
repositories merged. They are reproduced verbatim; nothing has been re-assessed.

Last updated: 2026-09-04 (v7.0 — enterprise polish)

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

## P2 — Platform debt recorded during v7.0 (2026-09-04)

| # | Risk | Detail |
|---|------|--------|
| 21 | `middleware.ts` uses a convention Next 16 deprecates | Next 16 warns on every build that the `middleware` file convention is deprecated in favour of `proxy`. **Not migrated, deliberately.** Both files are the authentication enforcement layer: `apps/web/middleware.ts` gates `/os/*` and `/api/os/*` on a signed cookie, and `apps/bureau/middleware.ts` is a NextAuth v4 `withAuth` default export guarding `/dashboard/*`. NextAuth v4's helper is written against the middleware convention and its behaviour under `proxy` is unverified; a wrong guess here silently opens a dashboard rather than breaking a build. **Action:** migrate deliberately, against a preview deployment, verifying that an unauthenticated request to `/os` and to `/dashboard` still redirects. Do not treat as a mechanical rename. |
| 22 | The icon set is bundled as one module | `packages/ui/primitives/Icon.tsx` keys every path off one object, so any client component importing `Icon` pulls the whole set. Measured cost: apps/web client JS went from 1055 KB to 1087 KB (+32 KB uncompressed, roughly 8 KB gzipped). Acceptable at ~45 icons; if the set passes roughly fifty, either split into per-icon modules or adopt a licensed set — see ADR-0003. |
| 23 | 255 of 825 type sizes, and 718 spacing declarations, are still raw | **Type:** was 906 of 927; the scale gained its two bottom steps and 649 declarations moved on at identical values, 2% to 69%. What is left must move about a pixel to reach a step. **Spacing:** 575 declarations moved onto `--space-*` at identical values; 718 did not, because at least one part of the shorthand is off the scale. The scale steps in eights above 16px and the product is built at a granularity of two — 10px (189), 14px (106), 20px (105) and 6px (79) account for most of it, and 657 of 1,030 raw parts do not land on a 4px grid. Neither is wrong; they do not describe each other. **Action:** one design pass that decides, per band, whether the scale gains steps or the call sites move. Not a script — every option is a visible change on dense screens. |
| 24 | 10px uppercase mono remains at the edge of legibility | Unchanged, and now named: `--text-label-dense`. 265 declarations sit on it, on form labels, table headers and status badges in uppercase mono at 0.2em tracking. The 1px step up from 9px was chosen over a larger one because 91 sites across dense tables could not be visually verified in-session and a 22% jump risks wrapping column headers that currently fit. **Action:** a human should look at the OS tables and decide whether those labels belong at 11px (`--text-label`). |
| 25 | 19 Agent Bureau API routes are a secured data layer nothing calls | Carried forward. The dashboard renders from `lib/mock/*` while the routes exist, are authenticated, and are unreferenced. They are not dead code to delete; they are unfinished wiring. |
| 26 | The showcase engine keeps a second heading scale | `apps/web/components/landing/showcaseTokens.ts` exports `HEADING_SIZE` — five clamp values (`display`, `cta`, `section`, `compact`, `narrative`) parallel to `--text-h1/h2/h3`. It is documented as the two-tier brand rather than an accident, and the ten showcase domains are a different surface from the consultancy site. But it is a second type scale in a repository whose first governance rule is "never two implementations", and nothing checks that the two stay in proportion. **Action:** decide whether the showcase tier is a deliberate second scale (then say so in an ADR and check it) or drift (then fold it into the platform scale). |
| 27 | `audit-consistency` compares declarations, not resolutions | It fetches both applications' emitted CSS and compares token values as text. That is what let the typeface divergence of ADR-0006 pass: both applications declared `--brand-font-sans: var(--font-inter), ...` character for character, and only one of them defined `--font-inter`. `check-token-inputs` closes that specific hole. The general one — a value that reads identically and resolves differently — is still open, and closing it means running a real browser and reading `getComputedStyle`. **Action:** consider driving the two apps through a headless browser in `certify`. |
| 28 | The internal OS keeps its own status colour map | `apps/web/app/os/(protected)/leads/page.tsx` declares a local `STATUS_COLOR`. ADR-0002 replaced eleven such maps in Agent Bureau with the shared tone system, but the OS uses inline styles with CSS custom properties while `TONE_TEXT` / `TONE_BADGE` export Tailwind class strings, so it cannot consume them. One of its five entries was the brand accent used as a status, which v7.0 corrected to `--semantic-warning`. **Action:** either add a CSS-custom-property form of the tone maps to `@maxpromo/ui`, or move the OS onto classes. |
| 29 | The two applications answer "nothing here" differently | Agent Bureau has an `EmptyState` component — icon, title, hint, on the shared `.empty-state` panel. The internal OS renders one line of muted 13px text inside a table cell, at twelve sites. Neither is wrong and they are not duplicates of each other, which is why no rule catches it; they are two different answers to the same question in one platform. The OS variant sits inside `<td colSpan>`, so adopting the panel is a real change to the table design rather than a swap. **Action:** decide whether the line is the deliberate dense-table variant (then name it in `@maxpromo/ui` alongside the panel) or an omission (then move `EmptyState` into the package and adopt it). |
| 30 | `.btn-ghost` has no consumers | Declared in `packages/ui/components.css` with focus and disabled states, referenced by neither application. It is part of a coherent button set rather than an accident, so it is recorded rather than deleted — but a variant nothing uses has never been seen, and its hover treatment is unverified. |
| 31 | The showcase engine's scroll reveal runs on one page | `components/ui/Reveal.tsx` fades content up on scroll and is used by `agent-bureau` and nowhere else, so one page of the site has a motion language the other twenty do not. It is well built — SSR renders it visible, it respects reduced motion — but it also sets `opacity: 0` after hydration, so an element already on screen when the effect runs is hidden and re-shown for at least a frame. **Action:** decide whether scroll reveal is the platform's motion language or none of it is, and either adopt it or remove it; if it stays, skip elements already in the viewport at mount. |
| 32 | The type scale has no step between 13px and 15px, and the product wants 14 | 14px is used 43 times for type and 106 times for spacing. It is the clearest single gap left in the scale and is bundled into the risk-23 design pass rather than decided here. |
| 33 | **The same case study is quoted in two currencies** | The homepage proof strip says `€14k/mo`; the case-studies page says `£14,000/month` — both in both languages, on a site selling to German SMEs from Essen. `npm run audit:claims` reports it (ADR-0007). **A second problem sits behind the first:** the case study states three people spent two days a month each on reconciliation — six person-days — and claims £14,000/month saved, which is about £2,300 per person-day. The figure does not follow from the inputs the same paragraph gives. **Not corrected here.** Which currency, and whether the figure is right, are both statements about delivered work. |
| 34 | **The proof numbers are framed two ways in the same section** | The homepage strip introduces the three figures as "Examples of operational outcomes our systems are **designed to improve**" and closes them with "**Results from live production systems.** Client details withheld under NDA." One is aspirational, the other is a factual claim about delivered work, and they sit four lines apart. The Resources page raises the stakes: it describes case studies as "Specific projects… **without numbers we cannot evidence**". A reader who notices stops trusting the figures, and the site has stated the standard it is failing. **Not corrected here** — resolving it means deciding whether the numbers are evidenced, which is Marcel's to state. |
| 35 | Agent Bureau is German-only, and the hub is bilingual | `agents.maxpromo.digital` has no locale routing — `/en` is a 404 and `<html lang="de">` is fixed. An English visitor reads the English hub, follows the English Agent Bureau page, clicks "View system" and lands in German. Building the English site is new scope, deliberately out of bounds for a refinement pass. **Action:** decide whether Agent Bureau is a German-market product (then say so on the hub before the link) or a bilingual one (then it needs the locale work the hub already has). |
| 36 | Eight of thirteen articles are written and unpublished | `content/blog/*` holds 13 posts; 5 are `status: published`. One of the drafts is complete enough that two other articles linked to it, which is how a published article came to point at a 404. **Action:** an editorial pass — publish, cut, or mark them clearly as a backlog. Resources build authority only once they are readable. |
| 37 | No resolver for translated strings nothing renders | 160 strings across four homepage sections were maintained in both languages and rendered by nothing; they were found by reading which namespaces the page actually calls. Keys are often built dynamically (`t(\`${id}Title\`)`), so a naive scan reports hundreds of false positives and cannot be trusted to delete. **Action:** a resolver that understands the dynamic-key patterns, or a convention that forbids them. |
| 38 | **The pricing page sells a marketing retainer** | Three monthly plans — Digital Starter / Growth / Full Care, €149 / €249 / €399 — whose contents are website maintenance, a Google Business profile, 4 to 12 **social posts per month**, review responses, a newsletter, **Google Ads management** and **competitor monitoring**. That is a digital marketing agency retainer, offered on the page where a buyer goes to understand the commercial relationship. Every other page says the opposite: "we design and build the systems companies run on", "most businesses do not need another website", "we do not start from a technology". The core memory's permanent rule is that Maxpromo is never positioned as a website or marketing agency. A reader who visits /about and then /pricing concludes /about is aspirational. **Not rewritten** — a company's commercial offer is Marcel's to define. |
| 39 | "Full account team" for a one-person legal entity | `pricing.tiers.t3I8`. The Impressum, the footer and the tax clause all state a single-person business under §19 UStG. A buyer comparing the two has found a discrepancy in the first minute. |
| 40 | **The site disagrees with itself about how long a build takes** | The homepage process section commits to **1–4 weeks** for "Build and go live". Four sections below, the FAQ says installation takes **2 to 6 weeks**. And the three case studies on the site were delivered in **4, 6 and 8 weeks** — every one of them outside the process commitment, two outside the FAQ's. The evidence on the site contradicts the promise on the site. |
| 41 | Two lengths for the same first meeting | The homepage says **30 minutes** twice; /about and all six industry pages say **around 45 minutes**. Same meeting, two commitments. |
| 42 | **Maintenance is described as included and sold as a subscription** | The homepage FAQ answers "What happens after launch?" with "We stay on. Maintenance, adjustments and improvements are **included, not billed as extras**." The pricing page sells maintenance as three monthly plans. "Included" plausibly means "included in your plan", but a prospect reads it as free, and that is the kind of ambiguity that becomes a dispute after signature. **Flagged, not rewritten** (Part 9). |
| 43 | Three complete content sets exist for features that do not | `proof.*`, `roi.*` and `faq.*` are read by nothing — a testimonial block, an ROI calculator and a six-question FAQ, written and translated into both languages. Two carry claims: a customer quote ("from 40 hours of manual invoicing per week to under 4") and an ROI payback of "60–90 days". Unlike the sections removed in v8 these look planned rather than retired, so they are recorded rather than deleted — but `roi.paybackValue` is an unevidenced commercial claim sitting one wire-up away from publication. |
| 44 | The engineering discipline is invisible to buyers | The platform runs eight merge gates, keeps seven decision records, audits accessibility across 38 rendered routes and cross-application consistency against two running apps, and refuses to merge without all of it passing. A business buying a mission-critical system asks exactly this, and no public page mentions any of it. It is the strongest available trust signal and the site does not make it. **Not written** — I can verify this platform is built that way; I cannot verify client systems are, and a claim about delivery practice has to come from Marcel. |

---

## Resolution path

Risks 1–5 are resolved by Auth-1 through Auth-4.
Risk 6 is resolved by Auth-0.
Risks 7–10 require process and documentation steps alongside Auth implementation.
Risks 11–15 are acceptable during concierge phase and tracked for later sprints.

