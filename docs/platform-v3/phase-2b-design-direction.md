# Maxpromo Platform v3.1 — Corporate Design Evolution

Status: **Delivered, awaiting approval**
Date: 2026-09-03
Role: Design Director · Information Architect · UX Architect · Design System Architect
Supersedes: `phase-2-architecture.md` §4.2 and parts of §4.3. Everything else in Phase 2 stands.

---

## 0. What v3.1 changes in the approved architecture

| Phase 2 position | v3.1 ruling | Status |
|---|---|---|
| Success = Dark Green `#65A30D` (brand doubles as success) | *"Brand colours are NEVER semantic colours"* | **Overruled.** Revised in §3.3. |
| `--brand-surface-subtle` — D2 open question | *"Brand colours are accents, not dominant elements"* | **Answered.** Neutral washes. D2 closed. |
| Derived palette ramp — D4 open question | Independent semantic colours **require** a wider ramp | **Confirmed in substance.** D4 closed. |
| Lime as primary fill + accent | *"Use brand lime much less"* | **Tightened.** Hard rule in §3.2. |
| Typography inherited from v2.1 | New scale specified | **Replaced.** §3.1. |

D1 (two-tier brand) and D3 (`app/os` to light) remain open from Phase 2.

---

## 1. Corrections — three things in the brief do not match the repository

I am reporting these rather than quietly designing around them.

### 1.1 The hero described in v3.1 is not in `main`

> *"The hero still feels like two unrelated columns. The dashboard should appear as the visual representation of the headline."*

**Measured:** `components/Hero.tsx` (the homepage hero on `maxpromo.digital`) is **single-column,
typography-led, 52rem wide, with no visual element at all.** Its own header comment records
why: the v2.1 facelift removed the 4-slide Ken Burns carousel, particles and ambient glow, and
*"no replacement diagram/screenshot asset exists yet… so the correct call per spec is no
decorative visual rather than a placeholder."*

Agent Bureau's hero is also single-column.

The only two-column hero in either repository is `components/landing/sections/ProductHero.tsx`
— the **product showcase** hero used on `/systems/*` and the product domains, not the homepage.

**Three possible explanations,** and I will not guess between them:
1. You are looking at a deployed preview ahead of local `main` (local `main` == `origin/main`;
   working tree has only `messages/*.json` modified).
2. You are describing `ProductHero` on a `/systems/*` page.
3. The "validated homepage redesign" exists somewhere not committed here.

**This blocks the hero work only.** Everything else in v3.1 proceeds. → **D5.**

### 1.2 There are no fake company logos to remove

> *"Remove fake company logos."*

**Measured:** neither repository contains invented customer logos or client names. What exists:

- `components/marketing/Integrations.tsx` (Bureau) — a marquee of **real tools** (Gmail, Slack,
  Stripe, Notion, n8n, HubSpot), which is an integrations wall, not a customer wall. Honest.
- `components/marketing/StatusTicker.tsx` (Bureau) — a live-event feed **explicitly labelled
  "Produktvorschau" (product preview)**, with a source comment stating it is pre-launch, not
  live data. Honest.
- `ProofMetrics` (digital) — carries a `source` field per metric. Honest.

**The authenticity problem you are guarding against has already been avoided.** I recommend
building the industries band anyway — as a **new trust section**, not as a replacement for
something fraudulent. Framing matters: this is an addition, not a cleanup.

### 1.3 Most decorative noise is already gone; what remains is different

The v2.1 facelift removed the gradients and glows. Remaining across `app` + `components`:

| Target from v3.1 | Actual count | Note |
|---|---:|---|
| heavy gradients | **7** | 3 of which are in dead files already slated for deletion (B0) |
| glowing effects | 14 `rgba` box-shadows | mostly subtle card shadows, not glow |
| colourful pills | **4** | minor |
| `//` motif | **~140** | 45 in components, 87 per locale file, 8 in Bureau |
| emoji in UI | **15 files** | incl. homepage, about, contact, case-studies, and the entire OS nav |
| large coloured heading text | **38 spans** | including a **full-width coloured H1 line** |
| accent-coloured link/label text | **220 occurrences** | the real lime-dominance problem |

**The noise is not gradients any more. It is the `//` motif, emoji, and 220 accent-coloured
text elements.** That reframes the work: this is a *typography and colour-restraint* pass, not
a decoration-stripping pass.

---

## 2. The finding that matters most for "does this look AI-generated"

**`public/` is 127 MB.** Individual homepage and blog PNGs are **1.5–2.2 MB each** — unoptimised
PNGs where WebP/AVIF would be a fraction of the size.

**And 11 assets are unreferenced, including five untouched `create-next-app` starter files:**
`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` — plus `handwerk.jpg`,
`restaurant.jpg`, `printshop.jpg`, `urology.jpg`, `nmi-education.jpg`, `envico-dashboard.jpg`.

A senior engineer checking whether a site was thrown together looks at exactly this: leftover
scaffold assets and 2 MB heroes. **This is the single strongest "vibe-coded" tell in the
repository**, and it costs nothing to fix. It goes in B0.

---

## 3. Revised design system

### 3.1 Typography — authority through restraint

**Observation.** H1 is `clamp(2.75rem, 6vw, 5.25rem)` at **weight 800** — 44–84px. H2 is
`clamp(2.25rem, 4vw, 3.25rem)` at 700. Body is 20px/1.7. This is the "shouting" v3.1 identifies.

**Recommendation — new scale:**

| Role | Size | Weight | Line-height | Was |
|---|---|---|---|---|
| H1 | `clamp(2.5rem, 4vw, 4rem)` — 40→**64px** | **700** | 1.1 | 44→84px @ 800 |
| H2 | `clamp(2rem, 3vw, 2.75rem)` — 32→**44px** | **600** | 1.15 | 36→52px @ 700 |
| H3 | `clamp(1.5rem, 2vw, 2rem)` — 24→**32px** | **600** | 1.25 | 30px @ 600 |
| Body | **18px** | 400 | **1.75** | 20px / 1.7 |
| Small | 15px | 400 | 1.6 | — |
| Label | 13px, uppercase, `0.12em` | 500 | 1.4 | 13px mono, **coloured** |

**Recommendation — retire Space Grotesk from headings.** This is the largest single lever on
"AI startup vs. software consultancy" and I want to be direct about it.

Space Grotesk is a geometric display face with distinctive quirks. It is *the* typeface of
2022–2024 AI startup landing pages. It is doing more to signal "AI startup" than any colour in
the system.

Every reference company named in the brief uses a neutral grotesque and differentiates
hierarchy by **weight and size, not by family** — Stripe, Linear, GitHub, Atlassian, Notion,
Vercel, Basecamp, Thoughtworks, without exception.

**Recommendation: Inter for both headings and body.** One family, differentiated by weight.
Roboto Mono is retained but **demoted to code, data tables and document numbers only** — it is
removed from labels and eyebrows, where it currently signals "developer-tool startup". → **D6.**

### 3.2 Colour restraint — a rule, not an intention

**Observation.** `color: var(--color-primary)` appears **220 times**. Every section eyebrow,
every "view all" link, every inline emphasis, and one full line of the H1 are accent-coloured.
"Use less lime" needs to be mechanical or it will not survive contact with the codebase.

**Recommendation — lime has exactly three permitted jobs. Nothing else.**

1. **Primary action fill.** Button background, with `#111111` text.
2. **Active / current state.** The underline on the active nav item; the selected tab marker.
3. **One emphasis mark per page, maximum.** A single word in a single heading, *or* a short
   rule above a section — never both, never more than one.

**Forbidden:** section backgrounds, card borders, icon fills, eyebrow and label text, body
links, badges, dividers, hover backgrounds, decorative rules, table headers, chart fills.

**Recommendation — links become black with an underline**, hover to `--brand-primary-text`
(`#4D7C0F`). This one change removes roughly 200 of the 220 accent occurrences, and it is the
documentation-style convention every reference company uses. It is the single biggest lever on
"use lime much less".

**Recommendation — the eyebrow loses its colour and its mono face.** 13px uppercase sans in
`--brand-text-secondary`, no `//`. Section labels are currently the most frequent accent
appearance on every page; removing colour there does more than any other single edit.

**Recommendation — the H1 stops colouring a whole line.** `headlineAccent` currently renders as
a block-level fully-coloured line. It becomes plain `--brand-text`, matching v3.1's example:

```
Business systems
built around
your business.
```

**Verification target:** on any page, lime covers **< 2% of viewport pixels** and appears in
**≤ 3 places** above the fold. This is checkable in the B-batch QA, not a matter of taste.

### 3.3 Semantic colours — fully independent of brand (v3.1 ruling)

**Constraint.** The brand is yellow-green and success is conventionally green. Since brand
colours may not be semantic, success must be green **and** unmistakably not the brand.

**Recommendation: blue-shift the success green.** `#047857` (emerald) sits in a different hue
family from `#A3E635`/`#65A30D` (yellow-green) and is distinguishable at badge size.

| Token | Value | Contrast on white | Role |
|---|---|---:|---|
| `--semantic-success` | `#047857` | **5.49 : 1** | blue-shifted — cannot be read as brand |
| `--semantic-warning` | `#B45309` | **4.68 : 1** | fixes Bureau's `amber-600` (3.1:1, fails AA) |
| `--semantic-danger` | `#B91C1C` | **6.54 : 1** | |
| `--semantic-info` | `#1D4ED8` | **6.33 : 1** | |

Deliberately renamed `--semantic-*`, not `--brand-*`, so the separation is enforced by the
token name itself and cannot drift back.

**One clarification, so this is not misread later:** the primary button is lime because lime is
the **action** colour. Action is not a semantic *status*. A lime button and an emerald success
badge coexist correctly.

**Recommendation:** semantic colours **never appear on marketing pages.** They exist only in
product surfaces — dashboards, forms, documents. The marketing site is black, white, grey and
rare lime. That restriction is most of what makes a site read as consultancy rather than SaaS.

### 3.4 Spacing — one rhythm

**Observation.** Two competing systems. `app/[locale]/page.tsx` uses
`clamp(4.5rem, 8vw, 8.75rem)` for every section — but the final CTA overrides it to
`clamp(5rem, 10vw, 9.5rem)`, and `TeamTrust` hardcodes its own copy. `showcaseTokens.ts` has
**five** different section paddings.

**Recommendation — 8px base scale, and exactly three section rhythms:**

```
--space-1  4px    --space-5  24px   --space-12  72px
--space-2  8px    --space-6  32px   --space-16  96px
--space-3  12px   --space-8  48px   --space-20 128px
--space-4  16px   --space-10 64px   --space-24 160px
```

```
--section-y-compact  72px   metric strips, tickers
--section-y         112px   DEFAULT — every content section
--section-y-feature 160px   hero and final CTA ONLY
```

Three values replace eight. Any section not using one of the three fails review.

---

## 4. Component classification

`KEEP` · `REFINE` (same structure, new tokens/type/colour) · `REDESIGN` (rebuild) · `REMOVE`.

### 4.1 REMOVE — 14 dead components + 11 dead assets

Already scheduled in B0. 1958 lines, 45 hex, 41 orange refs, zero risk.

| Component | Reason |
|---|---|
| `landing/sections/{HeroWorld, Pain, HowItWorks, Features, InAction, AIImport, Installation}` | Retired V1 engine. Unimported. Flagged for cleanup in July, never done. |
| `FaqSection`, `MaxAgent`, `PricingSection`, `ProofSection`, `ROICalculator`, `ServiceCards`, `SocialProof` | Unimported. `MaxAgent` alone carries 16 orange refs. |
| `public/{next,vercel,file,globe,window}.svg` | **`create-next-app` scaffold.** The strongest "not a real company" tell present. |
| `public/{handwerk,restaurant,printshop,urology,nmi-education,envico-dashboard}.jpg` | Unreferenced. |
| `_to_delete/`, duplicate `.js`/`.mjs` scripts | Housekeeping. |

### 4.2 REDESIGN

| Component | Why | Target |
|---|---|---|
| `components/Hero.tsx` | Weight 800 at 84px; **full coloured H1 line**; no visual anchor | New type scale; single-colour headline; integrated Operations Center visual — **pending D5** |
| `app/os/(protected)/layout.tsx` | 489-line monolith, emoji nav, hardcoded dark, zero tokens | Decompose onto Bureau's shell. v3.1's *"proprietary interface language, not generic analytics"* is what Bureau's geometric glyph nav already is. |
| Homepage Process section | Decorative icons | Discovery → Assessment → System Design → Implementation → Continuous Improvement, as a numbered editorial sequence with rules, no icons |
| `SystemsTabs` | Tabbed SaaS pattern + gradient | Documentation-style structured list |
| `PainCards` / `PainSlider` | Card-grid marketing pattern; slider is decoration | Editorial problem statement. Consider merging — two components for one idea |
| `landing/sections/ProductHero` | The two-column split v3.1 objects to (if this is what you meant — D5) | Integrated hero |
| Bureau `marketing/Hero.tsx` | `//` eyebrow, `text-accent` half-headline, **three marketing badges** ("DSGVO-konform", "EU-gehostet", "Made in Essen") — explicitly retired by v3.1 | Rebuild on new scale; badges become a plain footer line |
| Footer (both) | v3.1: *"should feel like documentation"* | Increase whitespace, reduce density, stronger hierarchy |

### 4.3 REFINE — structure is right, presentation is not

Applies the new type scale, drops `//`, de-colours labels/links, adopts the spacing rhythm.

`Navbar` · `TeamTrust` · `ProofMetrics` · `FaqAccordion` · `AgentBureauSection` ·
`SystemCard` (all 7 variants) · `SystemGrid` · `ConnectedSystems` · `HomepageSystemsGrid` ·
`ProductsPageGrid` · `SystemsPageGrid` · `landing/sections/*` (14 live sections) ·
`CookieBanner` · `NewsletterSignup` · `MobileStickyCTA` · `Reveal` · `ScreenshotSlot` ·
`ServiceImage` · Bureau `marketing/{Nav, Pillars, BeforeAfter, AgentBureau, AuditCta, Stats, SafeActionLifecycle, BusinessFlowInfographic}`

Two notes:
- **`ProofMetrics` and `TeamTrust` are structurally sound and honest** — sourced metrics, no
  invented claims. They need type and colour only.
- **`TeamTrust` re-implements `SectionLabel`/`SectionTitle` inline, byte-identically** to the
  local copies in `page.tsx`. Extract to `packages/ui` (B12) rather than refine twice.

### 4.4 KEEP — no visual change needed

| Component | Reason |
|---|---|
| `marketing/Integrations.tsx` (Bureau) | Real tools, honestly presented. Exactly the authenticity v3.1 asks for. |
| `marketing/StatusTicker.tsx` (Bureau) | Explicitly labelled "Produktvorschau". Honest. Refine type only. |
| `dashboard/{DashboardShell, Sidebar, Topbar}` (Bureau) | Already the proprietary interface language v3.1 describes. Becomes the platform shell. |
| `lib/registry/*`, `lib/host/*`, `lib/images/registry.ts` | Data and routing. No visual surface. |
| `documents/{InvoiceDocument, AngebotDocument, DocumentTable}` | Structure is correct; colour sweep only (B6). |

### 4.5 NEW

| Component | Why |
|---|---|
| `IndustryBand` | v3.1's industries trust section. Healthcare · Construction · Property · Hospitality · Publishing · Professional Services. Typographic, no logos, no icons. |
| `ProcessSequence` | The five-step consulting methodology. |
| `OperationsCenter` | The hero's integrated product visual — Projects, Business Systems, Automation Health, Workflows, Notifications, Documents, Reports, Operational Metrics. **Pending D5.** |
| `SectionHeader` | Extracted from the three duplicate inline copies. |

---

## 5. Revised batch plan

v3.1 folds into the v3.0 roadmap. Batches renumbered where affected; **the sweep-then-flip
strategy is unchanged** — it now carries typography and colour-restraint through the same
mechanism.

| Batch | Change from v3.0 |
|---|---|
| **B0** | **+** delete 11 dead public assets incl. the 5 scaffold SVGs; **+** image optimisation pass (127 MB → target < 15 MB, PNG → WebP/AVIF) |
| **B1–B2** | unchanged (version alignment, monorepo) |
| **B3** | **+** new type scale, spacing scale, `--semantic-*` set, lime-restraint rules encoded as token comments + lint |
| **B3a** *(new)* | **Typography migration.** New scale applied platform-wide. Brand still orange. Verified by type-only visual diff. |
| **B3b** *(new)* | **`//` retirement + de-colouring.** ~140 motif instances; 220 accent-coloured elements → black links, grey labels; H1 single-colour. **Biggest single step toward the consultancy feel, and it happens while still orange** — proving the effect is typography and restraint, not the new palette. |
| **B4–B8** | unchanged token sweeps |
| **B9** | the flip — now genuinely small, because B3b already removed most accent surface |
| **B10** | **+** lime-coverage verification (< 2% viewport, ≤ 3 instances above fold) |
| **B11–B15** | unchanged consolidation; `SectionHeader` extraction moves into B12 |
| **B16** | IA — unchanged |
| **B17** | **+** `IndustryBand`, `ProcessSequence`, hero redesign (D5), homepage reduction from 14 sections |
| **B18–B19** | **+** v3.1's eight validation audits |

**Why B3b sits before the flip:** de-colouring while still orange isolates the variable. If the
site already reads as a consultancy in orange, the palette change is confirmation rather than
rescue — and if it does not, we learn that before committing to lime.

---

## 6. Decisions

**Carried from Phase 2 — still open:**
**D1** Two-tier brand — hub always lime, product accents only on their own domains.
**D3** `app/os` migrates to light. *v3.1's "internal operations software" language leans light
and structured; I still recommend it.*

**New:**

**D5 — Which hero do you mean?** (§1.1) `components/Hero.tsx` on `main` is single-column with
no dashboard. Point me at the URL or preview you are describing, or confirm you mean
`ProductHero` on the `/systems/*` pages. *Blocks hero work only; everything else proceeds.*

**D6 — Retire Space Grotesk?** (§3.1) Move headings to Inter, one family differentiated by
weight. My position: this is the **largest single factor** in whether the site reads as AI
startup or software consultancy — larger than the palette. Every reference company you named
does it this way. *If you want to keep Space Grotesk, say so and I will hold it; but then the
"looks AI generated" risk stays substantially unaddressed.*

**Closed by v3.1:** D2 (neutral washes — brand colours are accents), D4 (ramp approved in
substance; independent semantic colours require it).

**Still outstanding:** the handover report.

---

## 7. Exit statement

Phase 2b delivered. No code changed.

**B0 and B1 are unblocked and carry no design decisions** — dead code, the 5 scaffold SVGs, the
127 MB image problem, governance, ADR-003, version alignment. I recommend starting there on
your word while D1, D3, D5 and D6 are settled; the first batch that depends on any of them is
B3.
