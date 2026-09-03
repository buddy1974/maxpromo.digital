# Maxpromo Platform v3.0 — Phase 2 Architecture

Status: **Delivered, awaiting approval**
Date: 2026-09-03
Author role: Lead Architect
Depends on: `phase-1-audit.md` (approved)

Every section is split into **Observation** (measured fact), **Recommendation**
(my architectural position), and where relevant **Decision required** (only where the
answer materially changes implementation).

---

## 0. Summary of recommendations

| # | Question | Recommendation |
|---|---|---|
| A | Per-product brand colours | **Two-tier brand.** Hub surfaces always Maxpromo lime; product accents survive only on their own domains. Mechanism already exists. |
| B | Light or dark | **Light is the platform.** Dark becomes an inverted *surface*, not a second system. |
| C | Consolidation shape | **npm-workspace monorepo `maxpromo-platform`**, staged. Not a route-group merge. |
| D | Platform standards | **drizzle + zod adopted outright.** Auth: NextAuth, but port digital's stricter middleware posture into it. |
| E | Ecosystem scope | **Two repos now.** Tokens package designed for external consumption; other 35 repos are a follow-on program. |
| F | Migration strategy | **Sweep to tokens first, flip the brand last, in one file.** No mixed-brand state ever ships. |
| G | Palette completeness | The five given colours are **not sufficient for an accessible system**. A derived ramp is required — see §4.3. |

**Decisions I need from you: 4** (§8). Everything else I am proceeding on unless you object.

---

## 1. The central architectural idea

**Observation.** There are ~430 orange literals and 1252 hardcoded hex values in
`maxpromo.digital`. The instinctive plan — find-and-replace orange with lime — would touch
72 files in one commit, be impossible to review, impossible to roll back cleanly, and would
leave the 354 untokenised colours in `app/os` still orange afterwards.

**Recommendation.** Invert the order. **Tokenise everything first while keeping it orange,
then change the brand in a single file.**

```
Batches B4–B8:  sweep every zone onto tokens.  Brand still orange.
                → QA question is "did anything change?"  Answer must be NO.
                → Easiest possible verification. Fully reversible per batch.

Batch  B9:      change ~12 values in packages/tokens/brand.css.
                → The entire platform turns lime at once.
                → One file. One commit. One revert.
```

This is the difference between a migration that can be reviewed and one that cannot. Every
batch before B9 is verified by *absence* of visual change; B9 is verified by presence of it,
and is trivially revertible.

It also means the platform is never half-orange half-lime in production.

---

## 2. Brand architecture — hub vs showcase

**Observation.** `lib/host/HOST_MAP.ts` already classifies every domain as `hub` or
`showcase`. `middleware.ts` already stamps `x-mp-mode` onto every request.
`app/[locale]/layout.tsx` already reads it to suppress Maxpromo chrome on product domains.
`LandingEngine` already has a `bridge` mode for hub-embedded rendering.

**The mechanism for a two-tier brand already exists and is already wired. It is simply not
used for colour.**

Today, `maxpromo.digital/de/systems/handwerk-os` renders green-on-black `#22C55E` / `#080808`
— on Maxpromo's own domain, inside Maxpromo's own navigation. That is the single most direct
contradiction of *"visitors should feel they are using one company."*

**Recommendation — two-tier brand:**

**Tier 1 — Platform surfaces. One identity, no exceptions.**
`maxpromo.digital` (all of it, including `/systems/*`), Agent Bureau, `os.maxpromo.digital`,
every dashboard, every invoice, quotation, PDF and email. Brand Lime. No per-product accent.
This is where a visitor is a *Maxpromo* prospect and must feel one company.

**Tier 2 — Product showcase domains only.** `restaurant-os.de`, `superhandwerk.de`,
`super-praxis.de`, `smartprintshop.de`, `easy-immo24.de`, `pflege-care24.de`, `taxkontrol.de`,
`publishers24.org`, `drive24.live`. These inherit **the entire system** — typography, spacing,
radius, components, layout, motion — and may vary **exactly one token**: `--brand-primary`.
Nothing else. A restaurant owner on `restaurant-os.de` is buying RestaurantOS, not Maxpromo;
product identity there is legitimate.

Implementation: `LandingThemeProvider` reads `x-mp-mode`. `hub` → lime. `showcase` → the
product accent. Roughly a 15-line change to one component.

**Recommendation — close the accent set.** The current 11 accents are ad hoc, not a system
(`#EC008C` hot pink, `#8B5E3C` brown, `#1E3A5F` navy). Replace free-form hex with a closed,
curated `ProductAccent` union in the token package, every member contrast-checked against the
light surface. Products pick from the set; they cannot invent a colour.

**Recommendation — delete `backgroundDark` from the registry.** It is a design decision
living in product data. Surface choice belongs to the design system (§3).

---

## 3. Light or dark

**Observation.** The v2.1 spec mandates light. `app/[locale]` is fully migrated to light
(897 token uses). Agent Bureau is light. But `app/os` is dark (`#0a0a0a`/`#0d0d0d`), 9 of 11
showcase products are dark (`#080808`), and `LandingThemeProvider` defaults to dark.

Core Memory's reference set is mixed — Stripe, GitHub, Notion and Figma are light-first;
Linear, Vercel and Raycast are dark-first. So precedent does not settle it. What settles it:
light is already the specified direction, and it is the only migration that has actually been
completed at scale.

**Recommendation.** **Light is the platform default and the only shipped mode.** Reverting
would discard the one finished piece of work in the program.

But build the token layer so this is not a dead end. Tokens are defined by **semantic role**
(`--brand-surface`, `--brand-text`, `--brand-border`), never by appearance (`--brand-white`).
A dark mode then becomes a re-mapping of ~14 values, not a second system. Two dark surfaces
ship now, as *inverted surfaces* rather than a theme:

- the footer (already spec'd, re-based from `#161A1D` onto Brand Black `#111111`)
- an `inverted` section surface for deliberate emphasis (final CTA bands)

`app/os` and the 9 dark showcase pages migrate to light.

**Honest cost statement:** this is the single largest chunk of Phase 3. `app/os` is 354 hex
literals across 13 pages, and its dark shell was built assuming dark. This is batch B5 and I
expect it to be the one that needs the most QA. I am recommending it anyway, because a dark
internal OS beside a light marketing site *is* two design languages, which is the exact
problem this program exists to solve.

---

## 4. Design system

### 4.1 Observation — the given palette is incomplete

The five brand colours cannot express an accessible interface. Measured WCAG contrast:

| Pair | Ratio | Verdict |
|---|---:|---|
| Brand Lime `#A3E635` text on White | **1.51 : 1** | unusable for anything |
| White text on Brand Lime | **1.51 : 1** | unusable — **a white-on-lime button is illegible** |
| **Black `#111111` on Brand Lime** | **12.62 : 1** | excellent |
| Dark Green `#65A30D` text on White | **3.08 : 1** | fails AA body text (needs 4.5), passes large text / borders |
| Dark Green on White, large text only | 3.08 : 1 | passes AA-large |

Two consequences that must be designed in, not discovered later:

1. **The primary button is lime with BLACK text, never white.** The current orange system
   uses white-on-orange (`.btn-primary { background: var(--color-primary); color: #FFFFFF }`).
   Carrying that pattern to lime produces a 1.5:1 button — invisible. This inverts a rule
   that holds everywhere in the current codebase.
2. **Neither Brand Lime nor Dark Green can be a link or small-text colour.** A darker green
   is required. `#4D7C0F` measures **5.00 : 1** on white and passes AA.

**Recommendation.** Extend the palette with a derived ramp. The five given colours remain the
brand and are unchanged; the ramp exists to make them usable.

### 4.2 Observation — success-green collides with a green brand

The current system uses `#22C55E` for success. Against a lime-green brand, a green success
badge beside a green primary button is confusable.

**Recommendation.** **Success = Dark Green `#65A30D`** — the brand colour *is* the positive
colour. This removes the collision, shrinks the palette, and follows GitHub (in Core Memory's
reference list), which uses one green for both primary action and success.

**Recommendation.** Warning and danger must then be unmistakably non-green: amber and red.
Note this also fixes an existing accessibility defect — Agent Bureau's `text-amber-600`
(`#D97706`) measures ~3.1:1 on white and fails AA. Specifying warning at the 700 level
(`#B45309`, ~4.7:1) corrects 19 components as a side effect of the migration.

### 4.3 Recommended token architecture

Two layers. Components may **only** consume layer 2.

**Layer 1 — primitives.** Raw values. Never referenced by a component.

```
--mp-black        #111111   Brand Black          (given)
--mp-white        #FFFFFF   White                (given)
--mp-lime-50      #F7FEE7   Light Surface        (given)
--mp-lime-100     #ECFCCB   derived
--mp-lime-200     #D9F99D   derived — borders, soft fills
--mp-lime-400     #A3E635   Brand Lime           (given)
--mp-lime-600     #65A30D   Dark Green           (given)
--mp-lime-700     #4D7C0F   derived — accessible text/link green (5.00:1)
--mp-lime-800     #3F6212   derived — hover for text green
--mp-gray-50…900            derived neutral ramp
--mp-amber-700    #B45309   warning
--mp-red-700      #B91C1C   danger
--mp-blue-700     #1D4ED8   info
```

**Layer 2 — semantic tokens.** The only names components may use. Matches the brief's list,
extended where the brief's list is insufficient.

```
--brand-black            --mp-black
--brand-background       --mp-white
--brand-surface          --mp-white          card / panel
--brand-surface-subtle   --mp-lime-50        section wash  ← see decision D2
--brand-surface-inverted --mp-black          footer, emphasis bands
--brand-border           --mp-gray-200
--brand-border-strong    --mp-gray-300
--brand-text             --mp-black
--brand-text-secondary   --mp-gray-600
--brand-text-inverted    --mp-gray-100
--brand-primary          --mp-lime-400       FILL ONLY
--brand-primary-dark     --mp-lime-600       hover fill
--brand-primary-text     --mp-lime-700       accessible accent text / links
--brand-on-primary       --mp-black          ← text ON primary. NOT white.
--brand-success          --mp-lime-600
--brand-warning          --mp-amber-700
--brand-danger           --mp-red-700
--brand-info             --mp-blue-700
```

Plus `-soft` background variants for badges, and the non-colour scales already proven in
`showcaseTokens.ts` (spacing, radius, typography) promoted into the same package.

### 4.4 Recommendation — enforcement, or this document is decoration

**Observation.** The v2.1 system was specified in August, implemented twice, and there are
still 1252 hardcoded hex values. Writing "no hardcoded colours" in a document has already
been tried and has already failed.

**Recommendation.** Make it mechanical:

1. A CI script failing the build on any hex literal outside `packages/tokens`, with a narrow
   documented allowlist (email HTML, which cannot use CSS custom properties — see §6).
2. An ESLint rule banning raw Tailwind palette classes (`text-orange-500`, `bg-amber-50`)
   outside the token package.
3. Introduced **warn-only in B3**, promoted to **error in B14**, so it never blocks a batch
   mid-migration but is permanently on afterwards.

This is the single highest-leverage item in Phase 2. Without it we will run this program
again in a year.

---

## 5. Repository consolidation

### 5.1 Observation — options and their real costs

| Option | Verdict |
|---|---|
| **(a) npm-workspace monorepo** | One install, one lockfile, instant propagation, no publish step, no version skew. Requires Vercel root-directory config per app and forces version alignment — which is needed regardless. |
| **(b) Published shared package** | Right end state for 37 repos, but needs a private registry, publish flow and version discipline now, and does **not** solve duplication *inside* `maxpromo.digital`. |
| **(c) Fold Bureau into digital as a route group** | Tempting given "Agent Bureau is no longer a standalone product" — but it merges two auth systems and two data layers *simultaneously with* the brand migration. And `maxpromo.digital` already suffers from being three apps in one repo; this makes it four. It solves a positioning problem with a packaging change. |

**Recommendation: (a), staged.**

"Agent Bureau is no longer a standalone product" is a **product and brand** statement, not a
deployment one. It is satisfied by shared identity, shared components, shared navigation and
`agents.maxpromo.digital` — not by living in the same Next.js app. Option (c) would couple
three high-risk migrations into one un-reviewable change.

### 5.2 Recommendation — target structure

```
maxpromo-platform/
├─ package.json                  workspaces root
├─ packages/
│  ├─ tokens/                    ← the design system. ZERO react dependency.
│  │  ├─ brand.css                 layer 1 + layer 2 custom properties
│  │  ├─ scales.ts                 spacing / radius / type (from showcaseTokens)
│  │  ├─ accents.ts                closed ProductAccent union (§2)
│  │  └─ semantic.ts               severity → token map (kills 10 duplicates)
│  ├─ ui/                        ← shared React components
│  │  ├─ primitives/               Button, Card, Badge, Input, Eyebrow
│  │  ├─ status/                   RiskBadge, StatusBadge — one implementation
│  │  ├─ shell/                    AppShell, Sidebar, Topbar (Bureau's, generalised)
│  │  └─ marketing/                Nav, Footer, Hero, BeforeAfter
│  ├─ config/                    legal.ts (Bureau's, promoted), env schema
│  └─ tsconfig/                  shared TS configs
├─ apps/
│  ├─ web/                       maxpromo.digital — marketing + showcase + /os
│  └─ bureau/                    agents.maxpromo.digital
└─ docs/
   ├─ platform-v3/               this program
   └─ adr/                       numbered decision records
```

`packages/tokens` has **no React dependency by design** — so any of the other 35 repositories
can adopt the brand by importing one CSS file, without joining the monorepo. That is the
ecosystem answer (§7) without the ecosystem scope.

**Recommendation — do not extract `apps/os` yet.** `app/os` shares `lib/db`, `lib/documents`
and `lib/email` with `apps/web`. Extraction is correct eventually and is declared as a
**Phase 5** item; doing it during the brand migration would mean restructuring the data layer
and the visual layer at once.

### 5.3 Recommendation — platform standards

| Concern | Standard | Reasoning |
|---|---|---|
| ORM | **drizzle** (Bureau) | Only implementation with schema + migrations + journal. No contest. |
| Validation | **zod** (Bureau) | Digital has none. No contest. |
| Legal identity | **`config/legal.ts`** (Bureau) | Promoted to `packages/config`. Fixes the `Koernerstr.` typo as a side effect. |
| AI access | **provider abstraction** (Bureau) | Digital calls the SDK directly. |
| i18n | **next-intl** (Digital) | Bureau has none and needs it — 1612 keys of proven pattern. |
| Design tokens | **CSS custom properties** (Digital's mechanism) | Works in Tailwind v4, plain CSS, print CSS and inline styles. Bureau's Tailwind-config colours do not reach print or email. |

**Auth — I do not simply endorse Bureau here.** Bureau uses NextAuth v4 (the conventional
choice) but its own middleware documents that **`/api/**` is unprotected and
`/api/ai/generate` is an open cost surface**. Digital's custom cookie is less conventional but
its middleware *does* cover `/api/os/*`.

**Recommendation: adopt NextAuth as the mechanism, and adopt Digital's protection posture.**
Deny-by-default middleware covering API routes, with an explicit public allowlist — Bureau's
`route-protection-matrix.md` already documents the intended shape.

**Flagged for verification, not assumed:** NextAuth v4 against Next 16. I have not verified
this and will not claim it works. It is the first task in batch B1; if it fails, the Auth.js
v5 decision arrives early and I will bring it to you rather than improvise.

---

## 6. Documents, invoices, emails — the surfaces nobody migrated

**Observation.** `lib/documents`, `lib/email`, `components/documents` and the email HTML in
`app/api` hold **158 hardcoded hex values and zero tokens**. These generate invoices,
quotations and customer email. They are the most externally visible and most legally
consequential output the company produces, and they are the *least* migrated surface.

**Observation — a genuine technical constraint.** Email clients do not reliably support CSS
custom properties. `lib/email.ts` and the API route email HTML **cannot** consume
`var(--brand-primary)`.

**Recommendation.** `packages/tokens` exports the same values twice: as CSS custom properties
for the web, and as a **plain TypeScript constant map** for email and print, generated from
one source. Email templates interpolate the constant. One source of truth, two output
formats. The hex-literal CI check allowlists these files *only* when the value comes from the
token import.

Print CSS (`lib/documents/printCss.ts`) has no such constraint and moves to custom properties
normally.

**Recommendation.** Batch B6 carries a hard verification gate: an invoice and a quotation
rendered to PDF and compared against a pre-migration reference. This is the one batch where
"it builds" is not sufficient evidence.

---

## 7. Ecosystem scope

**Observation.** 37 repositories exist; at least six are Core Memory ecosystem products with
their own codebases. The brief's success criteria imply platform-wide reach; its stated scope
names two repos.

**Recommendation.** Hold the line at two repositories for this program — Core Memory's own
scope discipline. But make the deliverable ecosystem-ready: because `packages/tokens` is
framework-free CSS plus TS constants, any other repo adopts the brand by importing one file.
Rolling it out to the other 35 is a **follow-on program**, planned once the token package has
proven itself on two consumers.

**No decision needed** unless you want the ecosystem inside *this* program's scope.

---

## 8. Decisions required

Only these four materially change implementation. I am proceeding on everything else.

**D1 — Two-tier brand (§2).** Confirm: hub surfaces (including `maxpromo.digital/systems/*`)
are always Maxpromo lime; the 11 product accents survive only on their own domains, from a
closed set.
*If you instead want total uniformity, the 11 accents die entirely and the showcase engine
loses per-product identity — a bigger change to `LandingEngine` and to how the products are
sold on their own domains.*

**D2 — Section-wash colour (§4.3).** `--brand-surface-subtle` = Light Surface `#F7FEE7`
(the given brand tint — greenish) or a neutral grey `#F9FAFB`?
*Materially different feel: `#F7FEE7` across every section wash makes the whole platform
read faintly green; neutral grey keeps lime as a pure accent. My recommendation is **neutral
grey for large washes, `#F7FEE7` reserved for lime-tinted callouts and badge backgrounds** —
a full-bleed brand tint on every section is the kind of thing that reads as templated.*

**D3 — `app/os` migrates to light (§3).** Confirm. This is the largest single batch (354 hex,
13 pages) and the internal OS is the tool you personally use all day. If you want it to stay
dark, say so now — the token layer can support it as an inverted surface, but it must be
designed in at B3, not retrofitted.

**D4 — Palette extension (§4.1).** Confirm I may add the derived ramp — specifically
`#4D7C0F` for accent text/links and black-on-lime buttons. Without it there is no accessible
link colour and the primary button is illegible. The five brand colours are unchanged; this
adds what they need to function.

**Also awaiting:** the handover report (`docs/MAXPROMPO DIGITAL + OPENCLAW HANDOVER REPORT.md`)
— still missing. I have proceeded without it. If it contradicts anything above, this document
yields to it.

---

## 9. Migration roadmap — implementation batches

Each batch: independently reviewable, independently revertible, validated before the next
starts. Validation is `tsc --noEmit` + `next build` + `lint` on both apps unless stated.

### Stage 1 — Ground clearing (no visual change)

**B0 · Governance & dead code**
- ADR-003: supersede VG-01/VG-02/VG-03, re-scope ADR-002. *Blocking for everything.*
- Move `projects/CLAUDE.md` (X-PATH constitution) to `projects/xpath-report/`.
- Resolve the uncommitted `messages/{de,en}.json` changes.
- **Delete 14 dead components — 1958 lines, 45 hex, 41 orange refs.** The 7 retired V1
  landing sections (`HeroWorld`, `Pain`, `HowItWorks`, `Features`, `InAction`, `AIImport`,
  `Installation`, flagged for cleanup in July and never done) and 7 unimported top-level
  components (`FaqSection`, `MaxAgent`, `PricingSection`, `ProofSection`, `ROICalculator`,
  `ServiceCards`, `SocialProof`). *Deleting before migrating removes ~10% of the orange
  problem at zero risk.*
- Delete the 2 dead redirected product routes, `_to_delete/`, duplicate `.js`/`.mjs` scripts.
- Instantiate the 4 empty + 3 missing charter documents.

**B1 · Version alignment (Bureau) — prerequisite**
- Next 15 → 16, Tailwind v3 → v4.
- **First task: verify NextAuth v4 under Next 16.** If it fails, stop and escalate.
- Validate: build + full visual comparison against pre-upgrade Bureau.

**B2 · Monorepo scaffold**
- Create `maxpromo-platform`, workspaces, move both repos to `apps/`, shared tsconfig.
- Update Vercel root directories. Both apps deploy green from new paths.
- Zero source changes beyond import paths.

### Stage 2 — Tokenise (brand stays orange; every batch verified by *no* visual change)

**B3 · Author the token layer**
- `packages/tokens`: primitives, semantic tokens, scales, accents, severity map.
- Both apps import it. **Existing names aliased to new tokens** (`--color-primary` →
  `var(--brand-primary)`; Bureau's `accent` → same) so nothing shifts.
- `--brand-primary` still resolves to `#F97316` at this point. Deliberately.
- Hex-literal CI check added, **warn-only**.

**B4 · Sweep `components/landing` + retire the `--brand-*` fork** — unify system 2 onto tokens.
**B5 · Sweep `app/os`** — 354 hex, 13 pages. Largest batch. Includes the light-surface move (D3).
**B6 · Sweep `lib/documents` + `lib/email` + API email HTML** — 158 hex.
  *Hard gate: invoice + quotation rendered to PDF and diffed against pre-migration reference.*
**B7 · Sweep `components/max`, `components/documents`, remainder.**
**B8 · Bureau sweep** — `accent` → tokens, and remap the 33 `orange-*`/`amber-*` classes to
  `--brand-warning`/`--brand-danger`. *Severity semantics preserved, not deleted.*

### Stage 3 — The flip

**B9 · Brand migration**
- Change ~12 values in `packages/tokens/brand.css`. Orange → lime.
- Primary button text: white → black (§4.1).
- One file. One commit. Full platform. Fully revertible.
- Validate: build + browser QA + automated contrast audit on every token pair.

**B10 · Contrast & QA remediation** — fix what the flip exposes.

### Stage 4 — Consolidation

**B11 · `packages/ui` — status primitives.** Severity map + badges. Kills 10 duplicates.
**B12 · `packages/ui` — primitives.** Button, Card, Input, Eyebrow. Resolves the `.btn`/`.card`
  collision and the `EYEBROW_STYLE`-vs-`.eyebrow` split.
**B13 · Unified app shell.** Bureau's shell generalised; digital's 489-line OS layout
  decomposed onto it.
**B14 · Marketing chrome.** Shared Nav/Footer/Hero. Bureau adopts next-intl.
**B15 · `packages/config`.** Legal identity centralised; `Koernerstr.` typo fixed.

### Stage 5 — Website (Workstream E)

**B16 · Information architecture.** Resolve `/services` vs `/systems` vs `/products`.
**B17 · Homepage simplification.** Reduce the 413-line homepage; detail moves into the IA
  settled in B16. *Deliberately last — restructuring the homepage before the IA exists just
  moves the problem.*

### Stage 6 — Close

**B18 · Enforcement to error.** Hex check and lint rule become blocking.
**B19 · Phase 4 validation.** Full suite per the brief: TypeScript, lint, production build,
browser QA, responsive QA, accessibility, internal links, component audit, documentation
audit. Confirm: no duplicated branding, no duplicated design systems, no orange remains, all
applications inherit one visual language.

---

## 10. Sequencing rationale

Three ordering decisions worth stating explicitly, because they are the ones most likely to
be questioned:

**Why delete before migrating (B0).** 14 dead files carry 45 hex and 41 orange references.
Migrating them would be pure waste, and reviewers cannot tell dead code from live code in a
diff.

**Why tokenise before flipping (B4–B8 before B9).** Verification asymmetry. "Nothing changed"
is the cheapest possible QA question; "everything changed correctly" is the most expensive.
Doing seven cheap batches and one expensive one beats eight expensive ones — and production
never shows a half-migrated brand.

**Why the homepage is last (B17).** Workstream E is the most visible work and the most
tempting to start with. But the homepage's problem is that detail has nowhere to go, and the
destination is three competing hierarchies. Simplifying the homepage before fixing the IA
would relocate the problem rather than solve it.

---

## 11. Risk register — Phase 2 additions

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R11 | White-on-lime buttons ship at 1.51:1 by carrying the current white-on-orange rule forward | **High** | `--brand-on-primary` = black, fixed in the token layer at B3, before any component sees lime |
| R12 | NextAuth v4 incompatible with Next 16, blocking B1 and the whole monorepo | **High** | First task in B1; escalate immediately rather than improvise |
| R13 | Invoice/quotation PDF regression — legally consequential output | **High** | B6 hard gate: rendered PDF diff against reference |
| R14 | Email templates cannot use CSS custom properties | Medium | Dual token export (CSS + TS constants) from one source, §6 |
| R15 | Success-green indistinguishable from brand-lime in dashboards | Medium | Success = Dark Green by design (§4.2); verified in B10 |
| R16 | Monorepo move breaks Vercel deploys | Medium | B2 is its own batch, no source changes, deploy verified before B3 |
| R17 | Bureau's untouched i18n gap surfaces late — it has no next-intl and 19 German-only pages | Medium | Scoped explicitly into B14, not discovered during it |

---

## 12. Phase 2 exit statement

Architecture delivered. No code changed.

Phase 3 begins at **B0** on approval of **D1–D4**. B0 and B1 are self-contained and carry no
brand decisions — if you approve the direction but want longer on D1–D4, I can start B0
immediately and bring D1–D4 back before B3, which is the first batch that depends on them.
