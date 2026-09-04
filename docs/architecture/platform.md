# Maxpromo Platform — Architecture

Status: **Current.** Updated as the platform changes.
Last updated: 2026-09-04 (v7.0 — corrected against the tree)

> **What is built and what is planned.** Until v7.0 this document described
> `apps/os` and `packages/shared` as though they existed. They do not. The
> internal OS lives inside `apps/web` under `/os`, and the modules intended for
> `packages/shared` are still application-local. Both extractions were deferred
> with reasons in ADR-0001 and the Track B change-log entry; the deferral was
> recorded and this document was not. Planned structure is marked **planned**
> below rather than written in the present tense.

This is the reference for how the platform is put together: what the
applications are, what they share, where they deploy, and where the boundaries
run. It replaces the per-repository architecture notes.

---

## 1. Applications

| Application | Domain(s) | Purpose | Audience |
|---|---|---|---|
| **web** | `maxpromo.digital` + 9 product domains | Public consultancy site, and the showcase engine that renders each product on its own domain | Prospects |
| **bureau** | `agents.maxpromo.digital` | Max Agent Bureau: public offer page plus the supervised-agent dashboard | Prospects, then operators |
| **os** | `/os` inside the web deployment | Internal business operating system — clients, invoices, quotations, jobs, leads, newsletter, inbox | Maxpromo staff |

The OS is **not** a separate application today. It is a route group inside
`apps/web`, gated by that application's middleware, and it ships in the same
deployment as the ten public domains. `os.maxpromo.digital` and an `apps/os`
workspace are **planned** — see §6.

`web` is not one site. `lib/host/HOST_MAP.ts` classifies every request as `hub`
or `showcase` and `middleware.ts` stamps `x-mp-mode`; on a showcase host the
root route renders that product's landing page instead of the marketing home.
**One deployment therefore serves ten public domains**, which is the single most
important operational fact about this platform:

```
maxpromo.digital        hub       the consultancy site
restaurant-os.de        showcase  RestaurantOS
superhandwerk.de        showcase  HandwerkOS
super-praxis.de         showcase  PraxisOS
smartprintshop.de       showcase  PrintShopOS
easy-immo24.de          showcase  RealEstateOS
pflege-care24.de        showcase  CareOS
taxkontrol.de           showcase  TaxKontrol
publishers24.org        showcase  PublishingOS
drive24.live            showcase  Drive24
```

### Public vs protected products

The ten operating systems are **protected products**. They are marketed on
their own domains and are deliberately absent from the consultancy site: no
`/systems` section, no entries in its sitemap, no naming on public pages. Agent
Bureau is the one product marketed publicly from the hub, at `/agent-bureau`.

---

## 2. Shared code and boundaries

Measured coupling, which is what determines where the package boundaries fall:

| Module | web | os | Belongs to |
|---|---:|---:|---|
| `lib/db` | 2 routes (contact, newsletter) | 8 routes | **shared** |
| `lib/email` | 2 routes | 3 routes | **shared** |
| `lib/rate-limit` | 8 | 1 | **shared** |
| `lib/ai`, `lib/prompts` | 3 / 1 | 1 / 1 | **shared** |
| `lib/telegram` | 3 | 0 | **shared** (web today, both later) |
| `lib/legal` | 2 | 0 | **shared** — also used by documents |
| `lib/auth` | middleware only | 3 routes | **os** (cookie session) |
| `lib/documents` | 5 files, all in `components/documents` | 7 | **os** |
| `lib/os-i18n` | 1 | 15 | **os** |
| `components/documents` | — | print + preview only | **os** |

`components/documents` looked shared and is not: its only consumers are the OS
print and preview pages. `lib/auth` is likewise OS-only — `web`'s single use is
the middleware gate that protects `/os`.

---

## 3. Design system

One system, in `packages/design-tokens`, consumed by every application.

- **Layer 1** `--mp-*` primitives. Raw values, never referenced by a component.
- **Layer 2** `--brand-*` identity and `--semantic-*` status. Status colours sit
  outside the brand namespace deliberately: the brand carries identity, semantic
  colours carry meaning, and the rule is that the two never share a value.
- A TypeScript mirror exports the same values for email, PDF and inline SVG,
  which cannot resolve CSS custom properties.

Enforced, not documented: `packages/tooling/check-design-tokens.mjs` fails the
build on any hex literal, raw Tailwind palette class, rgba literal, or use of
the brand accent as a text colour — including the accent reached through a
conditional or bound to a field named as text, both of which the first version
of the rule could not see. The allowlist is narrow and every entry states a
reason.

**The token package declares its inputs.** It is dependency-free, so it cannot
load a webfont; it names one (`var(--font-inter)`, `var(--font-roboto-mono)`)
and each application must define it. An unmet contract here is silent — an
undefined `var()` falls through to the fallback stack without a warning — so
`check-token-inputs.mjs` fails the build instead. See **ADR-0006**.

**Accent rules.** Brand Lime has exactly three jobs: primary action fill, active
state, and at most one emphasis mark per page. It is a fill and never a text
colour — on white it measures 1.51:1. Text on it is black (12.52:1). Where an
accent text colour is genuinely needed, `--brand-primary-text` measures 5.00:1.

---

## 4. Authentication — three mechanisms, deliberately

| Application | Mechanism | Protects |
|---|---|---|
| web | none (public) + a password gate on `/portfolio` | — |
| bureau | NextAuth v4 JWT + argon2 | `/dashboard/**` |
| os | signed httpOnly cookie, verified in middleware | `/os/**`, `/api/os/**` |

These are **not** unified by the consolidation. Single sign-on across the three
is a genuine feature with its own design; sharing a repository does not produce
it. What is shared is the session-handling *posture*: deny by default in
middleware, with an explicit public allowlist.

---

## 5. Data

**Two databases, and they stay separate.**

| Application | Provider | Region | Schema |
|---|---|---|---|
| web + os | Neon | `eu-central-1` | raw SQL, `os_*` tables |
| bureau | Neon | `us-east-1` | drizzle, ~30 tables, versioned migrations |

No table names collide, but the schemas are unrelated and only one has a
migration history. `DATABASE_URL` is therefore per-application and per-Vercel
project. Merging the two is a data migration, not a repository change.

> ⚠️ **Open compliance item.** `agents.maxpromo.digital` publicly states
> "DSGVO-konform, in der EU gehostet" while its database is in `us-east-1`,
> holding `contacts`, `leads`, `waiting_room_items` and `memory_entries`. This
> is unresolved and is recorded in `docs/governance/known-risks.md`. It is a
> legal decision, not an engineering one.

---

## 6. Deployment boundaries

**One repository, separate Vercel projects.** Deploy independently, govern
together.

| Project | Root directory | Domains | Database | Status |
|---|---|---|---|---|
| maxpromo-web | `apps/web` | 10, plus `/os` | eu-central-1 | built |
| maxpromo-bureau | `apps/bureau` | 1 | us-east-1 | built |
| maxpromo-os | `apps/os` | 1 | eu-central-1 | **planned** — the workspace does not exist |

They are not merged into one project on purpose:

- The web project serves ten public domains. A bad deploy there is a ten-domain
  outage, and the other applications must not be able to cause it.
- The applications hold different `DATABASE_URL` values pointing at different
  regions. One project cannot hold both.
- Independent rollback per application is worth more than a single pipeline.

Each project uses an `ignoreCommand` so a commit touching only another
application does not trigger a rebuild.

---

## 7. Governance

Every change must pass, before merge:

```
npm run verify   →  design token audit
                    tsc --noEmit
                    eslint
                    next build
```

plus, for changes with a visual or public surface: responsive check,
accessibility check (contrast, landmarks, heading order, focus), internal link
audit, and a documentation update where a decision was made.

Durable facts live in `docs/`, never in chat history. Decisions go in
`docs/adr/`; risks in `docs/governance/known-risks.md`; changes in
`docs/history/change-log.md`.

---

## 8. Repository layout

```
maxpromo-platform/
├─ apps/
│  ├─ web/        maxpromo.digital + 9 showcase domains, and /os
│  └─ bureau/     agents.maxpromo.digital
├─ packages/
│  ├─ design-tokens/   the design system. Zero dependencies.
│  ├─ ui/              shared React components. Depends on tokens.
│  ├─ config/          legal identity, shared constants
│  └─ tooling/         the audit suite, shared eslint and tsconfig
└─ docs/
   ├─ architecture/    this document
   ├─ adr/             numbered decision records
   ├─ brand/           design system reference
   ├─ deployment/      Vercel, environments, runbooks
   ├─ governance/      the standards every change must meet
   └─ history/         superseded documents, kept for their reasoning
```

**Planned, not built:** `apps/os` (the OS extracted from `apps/web`, with its
own domain and Vercel project) and `packages/shared` (db, email, rate limiting,
AI access — measured as shared in §2 and still application-local). Both are
recorded as deferred in ADR-0001.

Package names are explicit (`@maxpromo/ui`, `@maxpromo/design-tokens`) while
`@/*` stays application-local. An import therefore states whether it crosses an
application boundary — which matters, because both applications previously
mapped `@/*` to their own root and the same specifier meant two different files.
