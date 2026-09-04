# Change Log

## 2026-07-10 — Public MVP completion sprint (Sonnet implementation)

Full report: see `public-mvp-completion-sprint-report.md` delivered alongside this session (not checked into the repo automatically — copy it into `docs/` if you want it version-controlled).

- Fixed broken homepage pain-card images (`components/homepage/PainCardsClient.tsx`) with a graceful gradient/icon fallback instead of a 404 — no approved photography exists yet for these 6 cards.
- Refactored 7 product pages (`care-os`, `handwerk-os`, `praxis-os`, `printshop`, `publishing-os`, `real-estate-os`, `restaurant-os`) from client-side `useLocale()` to the server `params.locale` pattern already used by `taxkontrol/page.tsx`. Extracted client-only contact forms into standalone components receiving `locale` as a prop.
- Localised `components/systems/ConnectedSystems.tsx` and `components/CookieBanner.tsx` (both were previously English-only / bilingual-simultaneously).
- Fixed "Kühenrouting" → "Küchenrouting" typo on restaurant-os; removed stray UK/auction-specific copy on real-estate-os.
- Added `metadataBase`, `app/sitemap.ts`, `app/robots.ts`, and `generateMetadata` to 12 previously-bare pages (homepage, products index, 8 product pages); added metadata-only `layout.tsx` wrappers for 4 client-component routes (contact, discovery, estimate, portfolio — portfolio is `noindex`).
- Hardened lead-capture API routes: per-channel failure isolation, rate limiting (in-memory, per-IP), input length caps — `audit`, `diagnostic`, `newsletter/subscribe`, `max-agent/submit`, `estimate`, `estimate/send`, `discovery/estimate`, `discovery/send`.
- Security: `portfolio/auth` now rate-limited with constant-time (SHA-256 + `timingSafeEqual`) comparison instead of `===`; `os/login` rate-limited (core session logic untouched); newsletter honeypot added server-side.
- Fixed a mobile grid-overflow bug on `app/[locale]/estimate/page.tsx` below 480px.

No commits/pushes/deploys performed. Build/typecheck/lint could not be run trustworthily in-session — see known-risks entry below.

## 2026-09-03 - Platform v4.0: brand migration complete on customer-facing surfaces

Branch feature/platform-v4. Six batches, each independently verified with
tsc --noEmit, eslint, next build and browser QA. Full detail and remaining work
in docs/platform-v3/PROGRESS.md.

**B0 - dead code and assets.** Removed 14 unimported components (1958 lines),
including the seven retired V1 landing sections flagged for cleanup in July and
never deleted. Removed 11 dead public assets, among them the five untouched
create-next-app scaffold SVGs. Removed two page files that had been unreachable
behind permanent redirects. Re-encoded 72 oversized images in place: public/
drops from 127 MB to 44 MB, largest asset from 2.5 MB to 0.86 MB, with no
filename or reference changes.

**B3 - design system.** design/tokens/brand.css (two-layer: primitives and
semantics) plus design/tokens/index.ts (TypeScript mirror for email and PDF,
which cannot resolve custom properties). app/globals.css rewritten - the v2.1
stylesheet carried 26 raw hex values, 12 rules hardcoding the orange, and 22 CSS
classes with no remaining consumers. One typography scale; 684 inline font
declarations removed from 131 headings so they inherit it. 218 accent-coloured
text elements neutralised, 214 instances of the slash-slash label motif retired.
Hero rebuilt as a server component with the new Operations Center panel; the
problem grid rebuilt as a hairline reference grid with no cards, icon tiles or
pills.

**B4 - showcase engine.** The second design system retired: --brand-* in the
landing engine renamed to --showcase-*, and the surfaces unified onto platform
tokens. Two-tier brand implemented. VG-01/02/03 retired in code and comments.

**B5 - documents and email.** 158 hardcoded values across invoices, quotations,
print CSS and every transactional email template moved onto the token module.
Accent-as-text separated from accent-as-fill, without which invoices would have
become illegible at Brand Lime.

**B6/B9 - the brand.** 195 orange literals under app/os unified, then the
transitional block deleted. Every surface moved to Brand Lime from one file.
Primary buttons switched from white to black text automatically, because the
rule lived in the token rather than at the call sites.

**Microcopy.** Site and homepage metadata rewritten from AI-first positioning
("AI Business Systems & Automation Infrastructure") to the consultancy framing
("Business Systems, Built in Essen").

## 2026-09-03 — Track B: platform unification

Two repositories became one. `maxpromo.digital` is now `maxpromo-platform`:
`apps/web`, `apps/bureau`, and four shared packages.

- **B1** Architecture frozen and documented (`docs/architecture/platform.md`).
- **B2** Agent Bureau merged via `git subtree`, preserving its 32 commits.
  Workspace root created; duplicated root configuration removed. Twelve shared
  dependencies aligned to one specifier each, which fixed a duplicate `next`
  install and surfaced eight genuine react-hooks defects, all fixed.
- **B3/B4** `packages/design-tokens`, `tooling`, `config`, `ui`. Legal identity
  merged from two disagreeing copies. Eleven dashboard status maps replaced by
  one tone system.
- **B5** Five component classes declared in both stylesheets moved to
  `@maxpromo/ui/components.css`. Parity verified against computed styles in
  both running applications.
- **B6** One documentation tree. Agent Bureau's separate docs, PLAN.md and
  CLAUDE.md consolidated; risk registers merged.
- **B7** Separate Vercel projects with selective rebuilds; settings documented.
- **B8** CI verify workflow and a pull request template carrying the gates that
  need judgement.
- **B9** Validation: zero duplicate files, tokens, components, docs or orange.

Deferred with reasons: `apps/os` extraction (needs `packages/shared` first, and
its own domain and Vercel project); one database and one auth session (both
separate pieces of work, recorded in ADR-0001).

## 2026-09-03 — v6.0: platform audit, zero legacy, certification suite

- **Audit tooling.** Four checks: design tokens, responsive, accessibility
  (rendered output, 38 routes), cross-application consistency (33 resolved
  tokens plus component classes, both apps compared live). `npm run verify` is
  the merge gate; `npm run certify` runs everything.
- **Zero legacy.** 24.3 MB of orphaned imagery removed (`public/` 44 MB → 20 MB),
  13 dead modules, 2 unused i18n namespaces, 2 unused package exports.
- **A third copy of the legal identity** found in the document system, already
  drifted (`country: 'Germany'` vs `'Deutschland'`), now derived from
  `@maxpromo/config`. It prints on invoices.
- **Two "orphans" were gaps, fixed not deleted:** a German RestaurantOS card the
  registry never referenced, and a misleading TODO on an internal product's
  missing card.
- **Performance.** framer-motion removed — one consumer shipping a ~110 KB
  runtime to fade three numbers in. Client JS 1160 KB → 1055 KB.
- **Not removed:** 19 Agent Bureau API routes the audit called uncalled. They
  are a working, secured data layer; the dashboard just uses mocks. Recorded as
  debt.

## 2026-09-04 - Platform v7.0: enterprise polish, and four audits that were not auditing

Branch feature/track-b. Three batches, each verified against the full gate.

**The headline is not the polish.** Extending the accessibility audit exposed
that the design-token check had been reporting "clean" while examining roughly
half of one of the largest components on the homepage, and that the failures it
was not seeing were real. What follows is in the order it was found, because
the order is the point.

### A check a comment could switch off

`check-design-tokens.mjs` skipped comments with a line-by-line `inBlock` flag
that tested for a block-comment opener before testing whether the line was an
ordinary line comment. A comment containing a path glob therefore opened a block
that never closed, and the remaining 250 lines of the file went unscanned.

Replaced by `strip-comments.mjs`, a character walk that tracks string and
template-literal state, so a delimiter inside a string cannot change the comment
state. Comment spans are blanked rather than deleted, so line numbers still
point at real source.

This is the fourth silent pass in this repository. ADR-0004 now governs the
class: resolve targets explicitly, exit non-zero on zero targets, parse rather
than pattern-match, and demonstrate a rule firing before believing it.

### What the repaired check found

Three accent-as-text failures on the homepage, all at 1.51:1 on a light ground.
A new fifth rule then found a second alias with fifteen more on the Agent Bureau
page. Both hid the same way:

    const ORANGE = 'var(--color-primary)'   // then: color: ORANGE

The rule matched the token at the point of use, so binding it to a name walked
straight past. `ACCENT_ALIAS` now flags the binding. The name in question still
said "orange" three brand generations after that colour was retired, which is
how fifteen sites of an unreadable colour survived two design passes.

Replaced by role: nine section labels de-coloured to secondary grey (which the
corporate design brief had asked for independently), six emphasis sites to
`--brand-primary-text` at 5.00:1, two rules to `--brand-primary-edge` at 3.09:1,
four icon strokes to 5.00:1.

### WCAG 4.1.3, status messages

Four forms showed errors and announced none of them. The fix is a component, not
an attribute: `{error && <p role="alert">}` inserts the region and its content
in one paint, which assistive technology handles inconsistently. `FormStatus`
renders the region on first paint and empty, and changes only its contents.

Also `aria-busy` on the two document scanners - found by reading their markup
rather than assuming the pattern from the other three held, which it did not.

### One icon language

36 distinct Unicode marks across 68 files. The visible problem was stroke
weight; the real one was that three navigations had each invented a vocabulary
and six marks carried twelve meanings across two applications a user moves
between. Full reasoning in ADR-0003.

Replaced by one SVG set in `@maxpromo/ui`: stroke only, 1.5px, currentColor,
four sizes, decorative unless labelled. 72 call sites.

Writing the check that was meant to lock this in found another 110 occurrences,
because the inventory had walked `app/` and `components/` and the internal OS
keeps its labels in `lib/os-i18n/dictionary.ts`. The marks were in the copy -
180 lines of it, plus emoji in the WhatsApp invoice text sent to clients and in
the Telegram operations notification, whose status dot was the retired brand
colour rendered as an emoji.

### Typography

927 inline size declarations across 31 distinct values, 21 of which referenced
a token. 91 sat at 9px - on form labels, table headers and status badges, in
uppercase mono at 0.2em tracking. Moved to the 10px floor; twelve sub-pixel
sizes rounded onto steps already in use. 31 distinct values down to 26.

`--weight-bold: 700` added to the scale. It was used 118 times against a scale
that stopped at 600: the scale was incomplete rather than 118 call sites being
wrong. Its role is documented and excludes headings.

### Gates

`npm run verify` now runs seven gates, four of them static audits. Every one has
been observed producing findings on this codebase and then producing none.

Nothing pushed. Nothing merged to main.
