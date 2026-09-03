# Maxpromo Platform v3.0 — Phase 1 Audit

Status: **Delivered, awaiting review**
Date: 2026-09-03
Scope: `maxpromo.digital` (primary) + `maxpromo-agent-bureau` (secondary)
Method: static measurement of both working trees. **No code was changed.**

Governing authority for this audit: `docs/MAXPROMPO-CORE-MEMORY.md`.

---

## 0. Pre-flight exceptions (read first)

**0.1 — Required pre-flight document is missing.**
`docs/MAXPROMPO DIGITAL + OPENCLAW HANDOVER REPORT.md` does not exist in either repository.
`docs/New Text Document.txt` exists, is untracked, and is **0 bytes** — it appears to be where
the report was meant to be pasted. Phase 1 is audit-only and was not blocked by this, but
**Phase 2 architecture decisions should not be finalised without it.**

**0.2 — Cross-project instruction bleed (governance defect).**
`C:\Users\loneb\Documents\ai-software-dev\projects\CLAUDE.md` is the **X-PATH constitution**.
Its first line reads *"This repository (xpath.report, owner Marcel / Maxpromo Digital)…"*.
Because it sits at the parent of every repository in `projects/`, it is loaded into every
session for every project — including this one. It mandates reading `PROJECT_HEADER.md`,
the X-PATH handover, CAP protocols, and guardrails G1–G8, none of which apply to Maxpromo
Digital. It should be moved into `projects/xpath-report/CLAUDE.md`.

**0.3 — Uncommitted, undocumented working-tree changes.**
`messages/de.json` (104 lines) and `messages/en.json` (108 lines) are modified with no
change-log entry explaining why. These must be resolved (committed or reverted) **before**
any migration batch starts, or they will be indistinguishable from migration output.

---

## 1. Repository audit

### 1.1 Platform baselines diverge on almost every axis

| | `maxpromo.digital` | `maxpromo-agent-bureau` |
|---|---|---|
| Next.js | **16.1.6** | **^15.1.6** |
| Tailwind | **v4** (CSS-first, `@theme inline`) | **v3.4.17** (`tailwind.config.ts`) |
| React | 19.2.3 (pinned) | ^19.0.0 |
| i18n | next-intl, DE+EN, 1612 keys each | **none** — German hardcoded |
| Auth | custom signed httpOnly cookie (`lib/auth.ts`, 188 ln) | NextAuth v4 + argon2 |
| DB access | `@neondatabase/serverless` 1.0.2, raw SQL (`lib/db.ts`, 8 ln) | Neon 0.10.4 + **drizzle-orm** |
| Migrations | none | drizzle, 2 migrations + journal |
| Validation | ad-hoc | **zod** |
| AI | `@anthropic-ai/sdk` used directly | provider abstraction (Anthropic + OpenAI) |
| Content | MDX blog + 2368-line product registry | `lib/mock/*` (14 files) + drizzle |
| Dev port | 3020 | 3000 |
| Vercel link | not present in tree | `prj_3OWjluaJPD4Rcrnupylmpwq1Vgqf` |
| `tsc --noEmit` | **PASS** | **PASS** |

Both repositories typecheck clean today. That is the single most valuable fact in this
audit: **we are migrating from a green baseline**, so any breakage during Phase 3 is
attributable to the migration itself.

### 1.2 Scope correction — what "OpenClaw" and "os.maxpromo.digital" actually are

Workstream D lists OpenClaw, os.maxpromo.digital, dashboards and admin panels as separate
migration targets. In the filesystem they are not separate repositories:

- **`os.maxpromo.digital` = `maxpromo.digital/app/os/(protected)/*`** — 13 pages, an internal
  business OS (clients, invoices, Angebote, jobs, leads, newsletter, inbox) inside the
  primary repo.
- **OpenClaw** has no repository under `projects/`. It is the operational intelligence layer,
  not a codebase to restyle.
- **Dashboards / admin panels** = `app/os/(protected)` (digital) and `app/dashboard` (bureau,
  19 pages). Those two are the entire set.

### 1.3 Ecosystem scope risk

`projects/` contains **37 repositories**. At least six products named in the Core Memory
ecosystem list exist as their own repos outside this program's stated 2-repo scope:
`restaurant-os`, `handwerker` (HandwerkOS), `taxkontrol`, `drive-me`, `replica.printshop`,
`xpath-report`. Meanwhile `maxpromo.digital` already ships marketing pages *and* a rendering
engine for all of them (`lib/registry/products.ts`, 11 products).

The brief says "one design language across the ecosystem" but names only two repositories.
**These two statements are not compatible.** Decision required in Phase 2 — see §7.

---

## 2. Duplication audit

### 2.1 The design system is implemented twice, from one spec that has forked

Both repos independently implemented the same "Visual Facelift v2.1" brief, and the spec
document itself now exists as two divergent copies:

| | lines | notes |
|---|---|---|
| `maxpromo.digital/design/visual-facelift-v2.1.md` | 117 | claims scope over the whole ecosystem |
| `maxpromo-agent-bureau/docs/visual-facelift-v2.1.md` | 179 | carries a conflict warning against `PLAN.md` §7–8 and an ADR-002 supersession note that the digital copy **does not have** |

Same design decisions, two implementations, two documents, one of which knows about a
governance conflict the other does not.

### 2.2 Two admin shells, two admin design languages

| | `app/os/(protected)/layout.tsx` | `components/dashboard/{DashboardShell,Sidebar,Topbar}` |
|---|---|---|
| Lines | **489**, one monolithic client component | **129** across 3 files |
| Nav glyphs | emoji | geometric (◆ ❖ ◉ ◷ ▢ ✓ ⚐) |
| Colour | hardcoded dark (`#0a0a0a`, `#0d0d0d`) | tokenised light (`bg-white`, `border-zinc-200`, `bg-accent`) |
| Embeds | a full AI chat panel inline in the layout | — |
| Tokens used | **0** | consistent |

The Agent Bureau shell is the better foundation and should be the basis for the unified
admin shell. The digital OS layout needs decomposition, not restyling.

### 2.3 Marketing chrome duplicated

| Component | digital | bureau |
|---|---|---|
| Footer | `components/Footer.tsx` (234) | `components/marketing/Footer.tsx` (71) |
| Nav | `components/Navbar.tsx` (260) | `components/marketing/Nav.tsx` (37) |
| Hero | `components/Hero.tsx` (102) | `components/marketing/Hero.tsx` (55) |
| BeforeAfter | `components/BeforeAfter.tsx` (401) | `components/marketing/BeforeAfter.tsx` (57) |

Not copy-paste clones — parallel independent implementations of the same concept, which is
harder to consolidate than literal duplicates.

### 2.4 Utilities duplicated — every pair exists in both repos

| Concern | digital | bureau |
|---|---|---|
| Rate limiting | `lib/rate-limit.ts` (103) | `lib/security/rate-limit.ts` (167) |
| Telegram | `lib/telegram.ts` (216) | `lib/integrations/telegram/notify.ts` (66) |
| AI client | `lib/ai.ts` (113) | `lib/ai/anthropic-provider.ts` (125) |
| Env config | `lib/env.ts` (122) | `config/env.ts` (60) |
| Session/auth | `lib/auth.ts` (188) | `lib/auth/session.ts` (54) |
| DB client | `lib/db.ts` (8) | `lib/db/index.ts` (27) |

### 2.5 Severity-to-colour map duplicated 10x inside Agent Bureau alone

`RiskBadge`, `DocumentRiskBadge`, `StatusBadge`, `GovernanceRiskCard`, `AuditFindingCard`,
`TaskList`, `WaitingCustomerCard`, `DataSensitivityMatrix`,
`app/dashboard/projects/page.tsx`, `app/dashboard/client-implementation/page.tsx` each
declare their own `low/medium/high` to className lookup. This is the single highest-value,
lowest-risk consolidation target in either repo.

### 2.6 Legal identity — bureau does it right, digital does not

Agent Bureau centralises it in `config/legal.ts` (`BUSINESS`, `UST_CLAUSE`, marked LOCKED).
`maxpromo.digital` hardcodes the same facts in **8+ files** (`impressum`, `privacy`,
`agb`, `data-deletion`, `layout.tsx` JSON-LD, `api/os/ai/route.ts`,
`api/os/ai/scan-client/route.ts`, `api/newsletter/subscribe/route.ts`) — including a
**mis-spelled variant, `Koernerstr. 8`, in the newsletter email footer**.

Bureau's `config/legal.ts` is the pattern to adopt platform-wide.

### 2.7 Agent Bureau is marketed twice

`maxpromo.digital/app/[locale]/systems/agent-bureau/page.tsx` +
`components/homepage/AgentBureauSection.tsx` describe the same product as
`maxpromo-agent-bureau/app/(marketing)/page.tsx` + `components/marketing/AgentBureau.tsx`.
Two marketing surfaces for one product, in two design systems, one bilingual and one not.

### 2.8 Dead code and duplicate scripts

- `app/[locale]/products/care-os/` and `app/[locale]/products/real-estate-os/` are
  **permanently redirected** in `next.config.ts` but their `page.tsx` files still exist —
  unreachable code that still typechecks, builds, and misleads.
- `scripts/alignment-i18n.js` + `.mjs`, `scripts/update-i18n.js` + `.mjs` — same script, twice.
- `_to_delete/` (2 probe files) still tracked in the tree.

---

## 3. Colour audit

### 3.1 maxpromo.digital — token adoption is 4 of 9 zones

1252 hardcoded hex literals, 61 distinct values, against 1139 `var(--color-*)` uses.
The average is meaningless; the distribution is the finding:

| Zone | hex literals | `--color-*` uses | verdict |
|---|---:|---:|---|
| `app/[locale]` | 12 | **897** | migrated |
| `components/homepage` | 3 | 79 | migrated |
| `components/systems` | 10 | 40 | migrated |
| `components/ui` | 4 | 12 | migrated |
| `components/landing` | 18 | 0 (uses 85 `--brand-*`) | different token system |
| `components/max` | 21 | **0** | untouched |
| `components/documents` | 7 | **0** | untouched |
| `app/api` (email HTML) | 25 | **0** | untouched |
| `lib` (email, print CSS, docs) | 119 | **0** | untouched |
| `app/os` | **354** | **0** | untouched |

The marketing site is done. **The OS, the documents, the emails and the PDFs were never
migrated at all** — and those are precisely the surfaces Workstream D names (invoices,
quotations, PDF generation, email templates).

### 3.2 Orange inventory

~**430 literal occurrences across 72 files** in `maxpromo.digital`:

| Notation | count |
|---|---:|
| `#F97316` | **231** |
| `rgba(249,115,22,a)` — **24 distinct alpha values** | ~170 |
| `hsl(28 100% 58% / a)` | 11 |
| `#EA580C` | 1 |
| Tailwind `outline-orange-500` | 3 |

One colour, three notations, twenty-four alpha variants. `app/globals.css` — the file that
is supposed to *be* the token layer — itself contains 26 raw hex values and hardcodes
`rgba(249,115,22,…)` in 12 rules (`.sys-cta`, `.dark-card`, `.process-step`,
`.industry-card`, `.audit-chip`, …).

Agent Bureau by contrast: **21 hex literals total**, 131 accent usages of which ~98 go
through the `accent` token. It is an order of magnitude cleaner.

### 3.3 Brand orange vs semantic warning — do not conflate them

Agent Bureau's remaining 33 raw `orange-*` / `amber-*` Tailwind classes are **not brand
colour**. They are severity semantics:

```
RiskBadge:             medium -> amber,     high -> orange
StatusBadge:           paused -> amber
AuditFindingCard:      medium -> amber,     high -> orange
DataSensitivityMatrix: internal -> amber,   confidential -> orange
TaskList / GovernanceRiskCard / WaitingCustomerCard / projects: same pattern
```

A blanket "remove all orange" sweep would destroy risk-severity legibility in the
governance dashboard — the product's core value proposition. These must be **re-mapped to
`--brand-warning` / `--brand-danger`, not deleted.** This distinction has to be written into
the Phase 3 batch instructions.

### 3.4 Target palette is entirely absent

Neither repo contains **Brand Lime `#A3E635`**, **Dark Green `#65A30D`**, or
**Light Surface `#F7FEE7`** anywhere. The only overlap with the target palette is
**Brand Black `#111111`**, already used 45x in digital.

The brand migration is a from-scratch introduction, not an adjustment.

### 3.5 Documented governance rules currently *mandate* the orange being retired

This is the highest-priority governance item in the audit.

| Rule | Where | What it says |
|---|---|---|
| **VG-03** | `components/landing/showcaseTokens.ts` | *"CTA button color is **locked** to #F97316 and is **intentionally NOT a CSS variable** — it must render identically on every product regardless of brandColor."* |
| **VG-02** | `LandingThemeProvider.tsx` | *"Never use var(--brand-accent) for CTA buttons, those are always #F97316 (VG-03)."* |
| **VG-01** | `LandingThemeProvider.tsx` | dark background default `#080808`; light `#F5F4F0` is a per-product exception |
| **v2.1 §3** | `maxpromo-agent-bureau/tailwind.config.ts` | *"Single accent: Maxpromo orange (#F97316)"* |
| **ADR-002** | `maxpromo-agent-bureau/docs/decision-log.md` | supersedes the 2026-05-29 dark-premium lock *in favour of* the orange light system |

**VG-01, VG-02, VG-03 and ADR-002 must be formally superseded by a new ADR before Phase 3
begins.** If they are not, a future session will read `showcaseTokens.ts`, see the word
"locked", and correctly re-apply `#F97316`. Deleting the colour without retiring the rule
guarantees regression.

---

## 4. Design audit

### 4.1 Three coexisting token systems

1. **`--color-*`** — `app/globals.css`, Tailwind v4 `@theme inline`. Governs the localised
   marketing site. Light.
2. **`--brand-*`** — `LandingThemeProvider.tsx` + `showcaseTokens.ts`. Governs product
   showcase pages. **Per-product accent, dark by default.** Its own file states that colours
   are *"deliberately NOT"* shared with system 1.
3. **`surface` / `footer` / `accent`** — `maxpromo-agent-bureau/tailwind.config.ts`,
   Tailwind v3 named colours. Governs Agent Bureau. Light.

Plus four zero-token zones (`app/os`, `lib/documents`, `lib/email`, `components/max`) that
belong to no system at all.

### 4.2 Same values, three names — and one silent divergence

| Role | digital `--color-*` | digital `--brand-*` | bureau |
|---|---|---|---|
| page background | `--color-bg` `#FFFFFF` | `--brand-bg` `#080808` / `#F5F4F0` | `surface.DEFAULT` `#FFFFFF` |
| section background | `--color-bg-section` `#F8F9FA` | — | `surface.subtle` `#F8F9FA` |
| accent | `--color-primary` `#F97316` | `--brand-accent` (per product) | `accent.DEFAULT` `#F97316` |
| **accent hover** | **`#EA580C` (darker)** | — | **`#FB8B3D` (lighter)** |
| footer surface | `#161A1D` / `#D6D8DB` | — | `#161A1D` / `#D6D8DB` |
| container width | `1500px` | `80rem` (1280px) | `1500px` |

Two of the three systems already disagree on **hover direction** — one darkens, one lightens
— and on **container width**. This is exactly the drift a shared token package prevents.

### 4.3 Component-class collisions

`.btn`, `.btn-primary`, `.btn-secondary` and `.card` are each defined **in both repos, with
different implementations** (digital: plain CSS with custom properties; bureau: Tailwind
`@apply` in `@layer components`). A shared component library cannot use either name until
one wins.

The eyebrow label exists as a **CSS class** in bureau (`.eyebrow`) and as a **TypeScript
style object** in digital (`EYEBROW_STYLE`) — one design element, two mechanisms, neither
importable by the other.

### 4.4 The "one design language" claim is not currently true

The v2.1 spec declares a light system. Reality:

- Marketing site (`app/[locale]`) — **light**
- Agent Bureau (marketing + dashboard) — **light**
- Internal OS (`app/os`) — **dark** (`#0a0a0a`, `#0d0d0d`, `#080808`)
- Product showcase pages — **9 of 11 dark** (`backgroundDark: true`), 1 light exception
  (PraxisOS `#F5F4F0`), all with **different accents**

### 4.5 Eleven competing product accents

`lib/registry/products.ts` assigns each product its own `brandColor`:

| Product | brandColor | dark bg |
|---|---|---|
| Max Agent Bureau | `#F97316` | yes |
| RestaurantOS | `#F97316` | yes |
| HandwerkOS | `#22C55E` | yes |
| PraxisOS | `#3B82F6` | **no** |
| PrintShopOS | `#EC008C` | yes |
| CareOS | `#14B8A6` | yes |
| RealEstateOS | `#7C3AED` | yes |
| PublishingOS | `#8B5E3C` | yes |
| TaxKontrol | `#1E3A5F` | yes |
| Drive24 | `#009A44` | yes |
| Maxpromo OS | `#F97316` | yes |

This is a deliberate architecture (per-product identity), documented as VG-02 — and it is in
direct tension with *"visitors should feel they are using one company."* **This is a product
decision, not an implementation detail.** See §7.

---

## 5. Architecture audit

### 5.1 `maxpromo.digital` is three applications in one repository

| App | Location | Design system | Auth | Data |
|---|---|---|---|---|
| Localised marketing site | `app/[locale]` (36 pages) | `--color-*` | public | MDX + registry |
| Product showcase engine | `components/landing` + registry | `--brand-*` | public | registry |
| Internal business OS | `app/os` (13 pages, 20 API routes) | none | signed cookie | raw SQL |

They share Next.js and nothing else — no shared design layer, no shared component library,
no shared data layer. The consolidation problem is therefore **larger than "two repos"**:
it is four applications across two repositories.

### 5.2 Product registry

`lib/registry/products.ts` — **2368 lines, 11 products, one file**, with 6 adapters
(`homepage`, `landing`, `os`, `products`, `systems`, + utils). Genuinely good centralisation
and the strongest existing platform pattern in either repo.

Two problems: it is a 2368-line monolith, and it **encodes design decisions**
(`brandColor`, `backgroundDark`) that belong in the design system rather than in product
data.

### 5.3 Information architecture overlap (Workstream E)

Three parallel top-level sections describe overlapping things:

- `/services/*` — 6 pages (ai-agents, customer-inquiries, reviews, social-media,
  websites-platforms, workflow-automation)
- `/systems/*` — 10 pages (the OS products)
- `/products/*` — 3 pages, **2 of them unreachable** (redirected, §2.8)

The homepage is **413 lines** composing 8 section components plus the full `LandingEngine`.
The brief says "do not expand the homepage; move detail into deeper pages" — the deeper-page
structure that detail would move *into* is currently three competing hierarchies.

### 5.4 Two incompatible auth models

| | digital | bureau |
|---|---|---|
| Mechanism | custom signed httpOnly cookie, verified in `middleware.ts` | NextAuth v4 JWT + `withAuth` |
| Password | — | argon2 |
| Scope | `/os/*` + `/api/os/*` | `/dashboard/*` only |
| API protection | yes (middleware covers `/api/os/*`) | **no — documented as deferred to Auth-3** |

`maxpromo-agent-bureau/middleware.ts` documents in its own header that `/api/**` is
unprotected and that **`/api/ai/generate` remains an open cost surface**. That is a live
risk that must be carried into consolidation planning, not discovered during it.

### 5.5 Two incompatible data layers

Bureau has drizzle schema (4 modules), 2 migrations with a journal, 10 query modules and 10
seed scripts. Digital has an 8-line Neon client and raw SQL with no migration history.
**Only one of the two has a migration path.** Any consolidation that keeps digital's
approach discards the only versioned schema in the platform.

Note also that the Agent Bureau dashboard is substantially **mock-backed** (`lib/mock/*`,
14 files) — its visual surfaces are further along than its data layer.

---

## 6. Documentation audit

### 6.1 Four governance-mandated documents are empty files

`maxpromo.digital/CLAUDE.md` requires these before implementation. Current state:

| Document | digital | bureau |
|---|---|---|
| `product-brief.md` | **0 bytes** | missing |
| `workflow-map.md` | **0 bytes** | missing |
| `release-checklist.md` | **0 bytes** | — |
| `security-checklist.md` | **0 bytes** | — |
| `repository-map.md` | missing | missing |
| `architecture.md` | present (143 ln) | missing |
| `data-ownership.md` | missing | missing |
| `production-readiness.md` | missing | missing |
| `decision-log.md` | **13 lines / 2 entries** | 583 lines |
| `change-log.md` | 16 lines | missing |
| `known-risks.md` | 30 lines | 64 lines |

The startup procedure in `CLAUDE.md` says *"If a required document is missing: report it,
create it from the AI Operating System templates, and continue only after repository context
is established."* **That step has never been completed for either repository** — digital's
own decision-log entry of 2026-07-10 admits it explicitly and defers it.

### 6.2 `CLAUDE.md` is byte-identical in both repos

`diff` returns nothing. It is generic boilerplate: it names neither repository, neither
owner, no lifecycle stage, no repository class, no current task — all of which its own
preflight section demands be confirmed. It governs process but carries no project identity.

### 6.3 Governance maturity is asymmetric

Agent Bureau has a 583-line decision log with numbered ADRs, a route-protection matrix, an
auth-readiness inventory and a 532-line PLAN.md. Maxpromo Digital — the *primary*
repository — has 2 decision entries and 4 empty required documents.

**The secondary repository is better governed than the primary one.**

---

## 7. Decisions required from Marcel before Phase 2

These are architecture and product decisions. Per `CLAUDE.md` an AI agent must not make
them unilaterally.

**7.1 — Deliver the missing handover report** (`docs/MAXPROMPO DIGITAL + OPENCLAW HANDOVER
REPORT.md`). Blocking for Phase 2.

**7.2 — Per-product brand colours.** Do the 11 products keep their own accents (current
VG-02 architecture), or does everything inherit Brand Lime? This single answer determines
whether Phase 3 is a token swap or a re-architecture of the showcase engine.

**7.3 — Light or dark.** v2.1 mandates light; `app/os` is dark and 9 of 11 showcase products
are dark. Either the dark surfaces migrate to light, or the design system must formally
support both — which means the token set doubles.

**7.4 — Consolidation shape.** Three viable options: (a) monorepo with npm workspaces and a
`packages/ui` + `packages/tokens`; (b) a published shared package consumed by both repos;
(c) fold Agent Bureau into `maxpromo.digital` as a route group. Each has different migration
risk and different implications for the other 35 repositories.

**7.5 — Platform standards.** Auth: NextAuth+argon2 (bureau) or signed cookie (digital)?
Data: drizzle (bureau) or raw SQL (digital)? Validation: adopt zod platform-wide?
Recommendation on all three: **bureau's stack**, since it is the only one with migrations,
schema and documented route protection.

**7.6 — Version alignment.** Agent Bureau must move Next 15 to 16 and Tailwind v3 to v4
before any shared component package is possible. This is a prerequisite, not a cleanup task.

**7.7 — Ecosystem scope.** Two repositories, or the 6+ sibling OS repositories named in Core
Memory as well? The brief's success criteria imply the latter; its stated scope names the
former.

**7.8 — Formal supersession.** Approve an ADR retiring VG-01, VG-02, VG-03 and re-scoping
ADR-002, so the locked orange rule cannot be correctly re-applied by a future session.

---

## 8. Top risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | VG-03 ("orange is locked, deliberately not a variable") survives the migration and regresses the brand | **High** | ADR supersession before Phase 3 (§7.8) |
| R2 | Blanket orange removal destroys severity semantics in the governance dashboard | **High** | Separate brand orange from `--brand-warning` in every batch instruction (§3.3) |
| R3 | 473 hardcoded colours in zero-token zones (`app/os`, `lib`, emails, PDFs) — invoices and quotations are legally-sensitive output | **High** | Tokenise `lib/documents` + `lib/email` as their own batch, with printed-output verification |
| R4 | Next 15/16 + Tailwind v3/v4 split makes a shared component package impossible today | **High** | Version alignment is a prerequisite batch, not cleanup (§7.6) |
| R5 | Uncommitted i18n changes will be indistinguishable from migration output | Medium | Resolve before Phase 3 (§0.3) |
| R6 | Legal identity duplicated 8x including a typo — brand migration will touch these files | Medium | Adopt `config/legal.ts` platform-wide; `Koernerstr.` to `Körnerstr.` |
| R7 | Bureau `/api/**` unprotected; `/api/ai/generate` an open cost surface | Medium | Carry Auth-3 into the consolidation plan, do not defer again |
| R8 | 4 required governance docs empty; charter never instantiated for either repo | Medium | Instantiate during Phase 2 |
| R9 | X-PATH constitution loaded into every Maxpromo session | Medium | Move to `projects/xpath-report/` (§0.2) |
| R10 | Dead redirected routes still compile and mislead | Low | Delete in the IA batch |

---

## 9. What is already good

Stated deliberately, because the consolidation plan should preserve it:

- **Both repositories typecheck clean.** Green baseline.
- **`lib/registry/products.ts`** — one source of truth for 11 products with 6 adapters. The
  strongest platform pattern in either repo.
- **`app/[locale]`** — 897 token uses against 12 hex literals. The marketing site proves
  the token approach works at scale here.
- **`config/legal.ts`** (bureau) — correct centralisation of locked business identity.
- **Agent Bureau's dashboard shell** — 129 lines, decomposed, tokenised. The right basis for
  the unified admin shell.
- **Agent Bureau's governance** — 583-line decision log with numbered ADRs, route-protection
  matrix, auth-readiness inventory. The standard the primary repo should be raised to.
- **`showcaseTokens.ts`** — despite VG-03, its spacing/radius/typography scale is exactly the
  shared-token thinking this program needs, and it documents *why* each value exists.

---

## 10. Phase 1 exit statement

Audit complete. No code changed. No files moved. No colours altered.

Phase 2 (Architecture) is **blocked** pending §7.1 (handover report) and the decisions in
§7.2 to §7.8.
