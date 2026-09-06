# The Maxpromo Platform Constitution

**Status:** Authoritative
**Version:** 1.0 — 2026-09-05
**Supersedes:** nothing. Points at everything.

---

## How to read this document

This is the highest-level architectural document in the repository. It states
what the platform is, how it is put together, and the rules a change must
satisfy.

**It is an index, not an encyclopedia.** Every section below is short on
purpose and ends by naming the document that holds the detail. Where this file
and a linked document disagree, the linked document is wrong and should be
corrected — one authoritative location per fact is the rule this platform has
broken most expensively, and a constitution that restates its own architecture
becomes the second copy.

Three documents sit outside this one and are not summarised here:

| | |
|---|---|
| `openclaw/core-memory.md` | The company: the founder, the mission, how decisions are made. Read before any architectural or product decision. |
| `openclaw/governance.md` | OpenClaw's role: what it owns, what it escalates, what it never decides. |
| `governance/known-risks.md` | What is open right now, and who owns it. |

---

## 1. Purpose

Maxpromo Digital builds intelligent business operating systems: software that
removes repetitive work, preserves organisational knowledge and runs the
operations of small and medium-sized companies.

This repository is the engineering platform those systems are built on. It
serves eleven public domains from two deployments, and it exists so that
building the twelfth product is a matter of adding records rather than
inventing architecture.

---

## 2. Vision

One engineered ecosystem, not a collection of repositories.

A new operating system for a new industry should inherit the design system, the
component library, the token scale, the accessibility baseline, the metadata
strategy, the deployment pipeline and the certification gates on the day it
starts — and should differ from its siblings in exactly two respects: what it
does, and what it looks like.

Every decision should strengthen architecture, governance, business memory,
reusable systems and enterprise quality. Speed that costs any of those is a
loan against work not yet done.

---

## 3. Platform philosophy

**Identity first, presentation derived.** A request resolves to a domain, a
domain resolves to a product, and everything downstream — metadata, routes,
languages, chrome, legal pages, crawl policy, colour — is read from those two
records. Nothing guesses from the URL and nothing hardcodes a domain name.
See **ADR-0008**.

**Never two implementations.** If two applications need the same thing it goes
in `packages/` and neither keeps a copy. This is the rule the platform has
broken most expensively: two design systems from one brief, two token files
synced by hand, eleven status maps in one dashboard, two legal identity modules
disagreeing on the tax office.

**One name for each value.** A second name for a value that already has one is
not a convenience; it is a second token file. See **ADR-0005**.

**A rule that cannot fail is not a rule.** Every automated check must be
demonstrated failing before it is believed. See **ADR-0004** and §21.

**Governance is more important than autonomy.** No agent approves its own work,
releases, security exceptions, architecture changes or production deploys.

---

## 4. Engineering principles

1. **Understand the operational model before selecting technology.** Business
   problem → process → workflow → system → architecture → technology.
2. **Documented, not remembered.** Chat history is not a source of truth.
   Decisions go in `adr/`, risks in `governance/known-risks.md`, changes in
   `history/change-log.md`.
3. **Enforced, not reviewed.** Anything that has regressed twice becomes a
   gate. Ten of the eleven gates exist because something silently broke.
4. **Fail loudly.** A check that finds nothing must prove it looked. Every one
   exits non-zero rather than reporting clean on zero targets.
5. **State the trade-off.** A decision recorded without its alternatives is not
   a decision record.
6. **Never invent evidence.** No claim about a client outcome, a compliance
   posture or a capability without something checkable behind it. See
   **ADR-0007**.

---

## 5. Repository structure

```
apps/web        maxpromo.digital + 9 product domains + the internal OS
apps/bureau     agents.maxpromo.digital
packages/
  config        legal identity · Domain Registry · Brand Registry · budgets
                accepted security risks
  design-tokens brand.css and its TypeScript mirror
  observability logging · errors · health
  ui            shared components
  tooling       the audits, the shared eslint/tsconfig/postcss bases
docs/           this file, and everything it points at
```

One repository, separate deployments — governance is shared, blast radius is
not. **ADR-0001** records why, and what it deliberately does not deliver (not
one database, not one auth session).

Detail: `architecture/platform.md`.

---

## 6. Application architecture

| Application | Serves | For |
|---|---|---|
| `web` | ten public domains through host-based routing, plus `/os` | prospects, customers, staff |
| `bureau` | `agents.maxpromo.digital` — offer page and supervised-agent dashboard | prospects, then operators |

The internal OS is a route group inside `apps/web`, gated by that application's
middleware. `os.maxpromo.digital` and an `apps/os` workspace are planned, not
built.

Detail: `architecture/platform.md`.

---

## 7. Shared packages

| Package | Owns |
|---|---|
| `@maxpromo/config` | Legal identity and the §19 UStG clause; the Domain, Brand and accepted-risk registries; the performance budgets |
| `@maxpromo/design-tokens` | `brand.css` (the web) and `index.ts` (email, PDF, manifests — anywhere a custom property cannot resolve) |
| `@maxpromo/ui` | Components used by more than one application |
| `@maxpromo/observability` | One logging standard, one error contract, one health contract. Dependency-free; emits to stdout |
| `@maxpromo/tooling` | The audits, and the shared ESLint, TypeScript and PostCSS bases |

The token package is dependency-free by design: it *names* the fonts and each
application defines them. **ADR-0006** records what that costs when an
application forgets.

---

## 8. Domain Registry

`packages/config/domains.ts` — one record per public host, eleven of them.

Each record carries: identity and parent company, product slug, the language
set the domain serves, URL shape, origin and canonical strategy, metadata
source, social card, favicon, manifest, robots and sitemap policy, navigation
and footer mode, contact destination, route allowlist, analytics key and chat
identity.

It lives in the shared package because one of the eleven hosts is served by the
other application. A registry only one application could see would be the same
duplication one level down.

Authority: **ADR-0008**. Gate: `check:domains`.

---

## 9. Host resolution

Every request resolves its identity before anything else happens:

```
Host header → normalise → Domain record → decisions
```

In order: staff-route gate (hub host only), route isolation (a path this domain
does not serve redirects to the hub), language governance (a locale this domain
does not speak is redirected, never rendered), then locale routing.

Isolation runs before locale routing because "does this domain serve `/about`"
is a question about the domain, not about the URL's spelling.

Detail: `architecture/diagrams.md` §3, and `apps/web/middleware.ts`.

---

## 10. Design token system

Two layers. `--mp-*` primitives are the raw values; `--brand-*` and
`--semantic-*` are what components use. Nothing outside the token package
writes a colour.

Three rules that are enforced rather than remembered:

1. The accent has exactly three jobs, and is under 2% of viewport pixels.
2. **The accent is a fill, never a text colour.** Brand Lime on white is
   1.51:1. The accessible text form is `--brand-primary-text`, 5.00:1.
3. **Brand colours are never semantic colours.** Identity and meaning are
   separate namespaces.

Detail: `brand/design-system.md`. Gate: `check:tokens`, `check:token-inputs`.

---

## 11. Brand system

`packages/config/brands.ts` — one record per product, twelve of them.

Each carries name, short name, company, tagline, description; the accent and
its accessible text form, the theme colour and the dark theme colour; and every
asset that carries the identity — logo, monochrome logo, wordmark, favicon,
Apple touch icon, manifest icons, OpenGraph and Twitter images, PDF and email
marks.

Two things about it are deliberate:

**Empty slots are declared.** A registry that lists only what exists cannot
tell you what is missing. `check:brands` classifies every slot KEEP / REPLACE /
CREATE / REMOVE and prints the counts on every run, so the asset backlog is a
number rather than a memory.

**Copy is not here.** Headlines, sublines and FAQ answers stay in
`apps/web/lib/registry/products.ts`, localised. The registry declares where a
product's metadata comes from, not what it says.

A product inherits every other visual decision unchanged. Exactly two things
vary: its accent, and the assets that carry its name.

Gate: `check:brands`.

---

## 12. Component hierarchy

```
packages/ui                shared across applications
apps/*/components/         one application's own
  landing/                 the registry-driven product engine
    ShowcaseChrome         nav + footer + legal, on every page a product domain serves
    LandingEngine          hero and content blocks, on the product page only
    sections/              one file per block, each renders nothing without data
```

Chrome belongs to the domain, not to a page on it. A component every page must
wear lives in the layout.

Detail: `architecture/sprint-correction/component-tree.md`.

---

## 13. Routing strategy

The hub carries a locale prefix on every URL (`/de/...`, `/en/...`). A product
domain shows no prefix for the language it leads with and prefixes any second
one — `restaurant-os.de/contact` and `restaurant-os.de/en/contact` are the two
addresses of one page.

A product domain serves its product, its contact page and the operator's legal
pages. Every other path answers `308` to the same path on the hub: the page
exists and is worth reading, it is simply not this domain's page, and
redirecting keeps inbound links alive.

Detail: **ADR-0008**, `architecture/diagrams.md` §4.

---

## 14. Metadata strategy

Every domain owns its `<title>`, description, canonical, OpenGraph, Twitter
card, JSON-LD, robots, favicon, manifest and sitemap — resolved from its
registry record, never inherited from the consultancy.

The title template is the load-bearing part: every child page that sets a bare
title inherits the site-wide suffix, so a product domain's contact page reads
`Kontakt | RestaurantOS`.

Naming the parent company in a title is a per-domain decision the registry
records (`parentInTitle`), not a blanket rule: right for the hub and for Agent
Bureau, wrong for a protected product.

Detail: **ADR-0008**. Gate: `check:domains`, and `audit:domain-experience`
against a running server.

---

## 15. SEO readiness

**No SEO work has been done, and none is in scope until Track C.** What exists
is the architecture Track C plugs into:

- every domain has its own identity, canonical strategy and origin
- every domain publishes its own `robots.txt` naming itself as host
- every domain publishes its own `sitemap.xml` of its own URLs
- every domain can own its own structured data
- every domain can be registered as its own Search Console property today

Detail: `architecture/sprint-correction/seo-architecture.md`.

---

## 15b. Observability

Nothing fails silently, and everything important is measurable.

Error boundaries at both levels in both applications. One logging standard —
five levels, five questions per line, redaction applied by the logger, one
stream. A correlation id minted in the middleware and stamped on every
response. `/api/health` on both applications, three states, unauthenticated,
with probes that never write and never cost money.

Performance has budgets (`packages/config/budgets.ts`), a gate that measures
the build against them, and a Lighthouse baseline covering every public domain
on desktop and mobile.

Authority: **ADR-0010**, `architecture/observability.md`. Dashboard
architecture: `architecture/engineering-dashboard.md`.

---

## 16. Translation strategy

Two locales, `de` and `en`. Message catalogues in `apps/web/messages/`;
product copy localised in the product registry.

**A domain declares the languages it has, and serves no others.** The product
registry falls back from German to English field by field, silently, so a
partly-translated product produces a page with German section headings around
English copy under `lang="de"`. There is no point after rendering at which that
can be detected; the only place to prevent it is the `languages` array on the
domain record.

`publishers24.org` and `drive24.live` declare `['en']` because that is what
they have. `check:domains` fails the build if a domain claims a language its
product cannot fill.

---

## 17. Documentation strategy

One documentation tree. Every fact has one authoritative location; everything
else cross-references it.

| Directory | Holds |
|---|---|
| `PLATFORM-CONSTITUTION.md` | This file. The index. |
| `architecture/` | How the platform is put together |
| `adr/` | Why things are the way they are |
| `governance/` | The standards, the open risks, the commitments |
| `brand/` | The design system |
| `deployment/` | Vercel projects, environments, runbooks |
| `openclaw/` | Company memory and OpenClaw's role |
| `history/` | Superseded documents. Nothing here is current. |

**Architecture documents**, all under `architecture/`:
`platform.md` (how it is put together) · `diagrams.md` (ten diagrams) ·
`observability.md` (errors, logging, health, performance) ·
`engineering-dashboard.md` (architecture only) ·
`ai-governance-readiness.md` (where Track B's concerns belong) ·
`agent-bureau-auth-readiness.md` · `agent-bureau-route-protection.md` ·
`agent-bureau-document-package.md` · and the `sprint-correction/` family:
`domain-strategy.md`, `component-tree.md`, `landing-engine-v2.md`,
`image-architecture.md`, `seo-architecture.md`, `lead-flow-architecture.md`,
`walkaround-architecture.md`.

**Governance documents**, under `governance/`: `standards.md` (what every
change must satisfy) · `known-risks.md` (what is open) ·
`delivery-commitments.md` and `pricing-alignment-review.md` (recommendations
made to Marcel, not implemented).

**Brand**: `brand/design-system.md`. The superseded direction is kept at
`brand/visual-facelift-v2.1-superseded.md`.

**Deployment**: `deployment/vercel.md`, `deployment/deploy-verify.md`,
`deployment/social-automation/README.md`.

**History**, kept because decisions are only legible with it:
`history/change-log.md` · `history/architecture-2026-07.md` ·
`history/migration-baseline-2026-07.md` · `history/agent-bureau-plan.md` ·
`history/agent-bureau-decision-log.md` · and `history/platform-v3/` —
`PROGRESS.md`, `phase-1-audit.md`, `phase-2-architecture.md`,
`phase-2b-design-direction.md`, `track-b-migration-plan.md`.

A document in `history/` describes how things were. It is kept because a
decision record that refers to a deleted document is unreadable.

Gate: `check:docs`.

---

## 18. ADR process

A decision that changes how the platform is built gets a record. Each states
context, the decision, why the alternatives were rejected, and consequences —
including what the decision deliberately does not deliver.

| | |
|---|---|
| `adr/0001-one-repository-separate-deployments.md` | One repository, separate deployments |
| `adr/0002-tone-not-severity.md` | Tone, not severity |
| `adr/0003-one-icon-set.md` | One icon set |
| `adr/0004-checks-must-fail-loudly.md` | Checks must fail loudly |
| `adr/0005-one-name-for-each-value.md` | One name for each value |
| `adr/0006-the-token-package-declares-its-inputs.md` | The token package declares its inputs |
| `adr/0007-a-claim-is-checked-like-a-token.md` | A claim is checked like a token, never corrected like one |
| `adr/0008-a-domain-is-an-identity.md` | A domain is an identity |
| `adr/0009-a-product-has-one-identity.md` | A product has one identity, and empty slots are declared |
| `adr/0010-nothing-fails-silently.md` | Nothing fails silently |
| `adr/0011-an-advisory-is-blocked-or-accepted-never-ignored.md` | An advisory is blocked or accepted, never ignored |

The running record of decisions too small for an ADR is `adr/decision-log.md`.

Superseding an ADR is itself an ADR. The superseded one stays.

---

## 19. Governance process

OpenClaw holds the platform's memory and enforces its standards so quality does
not depend on whoever is working that day.

It **stops and escalates** for: a legal or compliance question, including any
public claim the infrastructure does not support; a production data operation,
or moving personal data between regions; an architecture change not already in
an ADR; anything requiring a security control to be bypassed; documentation
that contradicts the code.

It **never decides**: whether to deploy to production, whether to accept a
legal or compliance risk, whether to move customer data, whether to change the
brand.

Detail: `openclaw/governance.md`, including the seven-question review checklist
applied to every change.

---

## 20. Certification pipeline

```
npm run verify     12 gates — the merge gate
npm run certify    verify + a11y + consistency + platform + claims + docs
```

The merge gate is defined **once**, in the root `package.json`. Everything else
calls it or is compared against it — and `check:governance` is gate 1 precisely
because three things once claimed to be the gate and one of them ran a stale
subset while reporting green.

| # | Gate | |
|---|---|---|
| 1 | `check:governance` | one definition of the gate; CI calls it; the standards table matches |
| 2 | `check:domains` | the Domain Registry against the repository |
| 3 | `check:brands` | the Brand Registry against the repository |
| 4 | `check:tokens` | no colour outside the token package |
| 5 | `check:token-inputs` | every `var()` resolves, and none travels into email |
| 6 | `check:icons` | no Unicode mark standing in for an icon |
| 7 | `check:responsive` | grids collapse, widths fit, section rhythm |
| 8 | `audit:typography` | the type scale and the weight rule |
| 9 | `typecheck` · 10 `lint` · 11 `build` | every workspace |

| 12 | `check:budgets` | what the build costs, against `packages/config/budgets.ts` |

Report-only audits, run by `certify`: accessibility, cross-application
consistency, platform structure, public claims, documentation.

`audit:dependencies` runs in `certify` and is the one audit there that can
fail: a CRITICAL advisory reaching production blocks a release, and a HIGH one
blocks unless `packages/config/security.ts` records an acceptance with an
exposure, a mitigation, an owner and a review date. See **ADR-0011**.

Run deliberately, not on every merge: `audit:lighthouse` (every domain, desktop
and mobile, against a production build) and `audit:domain-experience` (the live
domain walk). Both need a running server; neither should fail a merge on a
number that moves with the machine.

Detail: `governance/standards.md`.

---

## 21. Every check must be able to fail

Nine checks in this repository have silently passed — reported success while
examining nothing, or while examining the wrong thing.

Anything added to `packages/tooling/` must: resolve its targets explicitly and
print the count; exit non-zero on zero targets; use `strip-comments.mjs` for
comment state; and be **demonstrated failing** before it is believed.

Two of those demonstrations are checked in rather than performed by hand —
`npm run prove:domains` and `npm run prove:brands` break their registries one
way at a time and assert the audit reports each one. A demonstration nobody can
re-run is a claim, not evidence.

Authority: **ADR-0004**.

---

## 22. Release process

```
branch → verify → certify → review → Marcel approves → merge → deploy → document
```

Deployment is per application: separate Vercel projects, separate databases,
independent rollback. A bad deploy on `web` is a ten-domain outage, which is
why no other application can cause one.

Detail: `deployment/vercel.md`, `deployment/deploy-verify.md`.

---

## 23. Definition of Ready

A change may start when:

- the current milestone covers it, and nothing wider
- the operational model behind it is understood, not just the request
- any decision it embodies is either already in an ADR or the ADR is part of it
- it does not need a legal, financial or data-residency answer nobody has given

---

## 24. Definition of Done

A change is done when:

1. `npm run verify` passes — actually run, not assumed
2. it duplicates nothing that already exists in `packages/`
3. it adds no colour, size, spacing or motion value outside the token system
4. it makes no public claim the infrastructure does not support
5. every decision it embodies is written down
6. the accessibility and responsive baselines are not regressed
7. anything with live behaviour — a login, a deploy, a generated document — was
   demonstrated, not merely written
8. `adr/`, `governance/known-risks.md` and `history/change-log.md` are updated
   where they apply

"Should work" is not a state a change can be in.

---

## 24b. Programmes, and where Track A stands

**Track A — Platform Foundation.** Engineering complete and certified at tag
`track-a-foundation-v15.1` (commit `8e700a2`, 2026-09-06).

It covers: repository architecture · governance · design-token governance ·
domain identity · brand identity · documentation governance · accessibility
governance · observability · performance baselines · dependency governance ·
the security release gate · the certification pipeline.

**Status: CERTIFIED, NOT YET CLOSED.** Closure requires production
verification, and production verification requires a deployment that is
currently blocked on two Vercel project settings — see
`deployment/track-a-release.md`. Track A closes when that release is verified
in production, not before; a foundation that has only ever run on a laptop is
not a foundation anything should be built on.

**Track B — AI Governance and Assistant Forensics.** Not started. Its first
mission is discovery, not modification. Scope and starting findings:
`architecture/ai-governance-readiness.md`.

---

## 24c. The Track A freeze

Once Track A closes, the foundation is frozen. These are governed platform
changes, not ordinary work:

- the Domain Registry and the Brand Registry
- the design token system
- the governance gates and the certification pipeline
- the observability contracts
- the security policy and the accepted-risk register
- this constitution
- host resolution and the middleware
- the performance budgets

A change to any of them needs a stated justification and an ADR, in that
order. Track B consumes these foundations; it does not reinvent them.

**What being frozen does not mean.** A defect in a foundation is still a
defect and is still fixed. Freezing is about deliberate change, not about
pretending the platform is finished.

**Carried forward, and not grounds for reopening Track A:** mobile LCP
optimisation · the hub's canonical Lighthouse anomaly, pending one production
run · product brand assets (35 to create, 42 to replace) · core-memory and
Brand Registry product naming · the four accepted development-toolchain
advisories · the EU hosting claim · German copy for the two English-only
products. Each has an owner in `governance/known-risks.md`.

---

## 25. Platform freeze rules

During a freeze, only these merge:

- a correctness defect on a public surface
- a legal, compliance or security correction
- a documentation correction

Not: redesigns, refactors, optimisations, new features, new pages, new
products, new copy, dependency upgrades.

A freeze ends with a binary verdict supported by evidence. There is no
conditional pass.

---

## 26. Future product onboarding

Adding an operating system to the platform, in order:

1. **Product entry** — `apps/web/lib/registry/products.ts`: slug, name,
   localised copy, workflow, FAQ. German and English both complete, or the
   domain declares one language.
2. **Brand record** — `packages/config/brands.ts`: accent, accent-as-text
   measured against white, and every asset slot, declared even when empty.
3. **Domain record** — `packages/config/domains.ts`: host, origin, language
   set, route allowlist, contact destination, crawl policy.
4. **Assets** — card image at the declared dimensions, in the serving
   application's `public/`.
5. **Verify** — `check:domains` and `check:brands` will reject a record the
   repository cannot honour.

No new components, no new routes, no new metadata code. If a product needs any
of those, that is an architecture change and needs an ADR first.

---

## 27. What this platform will not do

Stated so it does not have to be re-litigated:

- **No pricing.** Maxpromo does not sell predefined packages. There is no price
  list, no pricing page, and no figure on a public surface.
- **No invented evidence.** No client outcome, compliance posture or capability
  without something checkable behind it.
- **No protected product marketed from the consultancy site.** The operating
  systems live on their own domains.
- **No second implementation** of anything `packages/` already does.
- **No VAT calculated or displayed.** §19 UStG, on every commercial surface.

---

_Maxpromo Digital — Gemäß §19 UStG wird keine Umsatzsteuer berechnet._
