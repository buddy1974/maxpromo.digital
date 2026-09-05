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

## 2026-09-04 - v7.0 continued: the rules that could not see

Branch feature/track-b. Every gate re-run and passing; both live audits run
against both applications on their real ports.

**The finding is not a defect, it is a pattern.** Four checks in this repository
were widened this session, and every one of them produced findings immediately
- defects that had been live while the check reported clean. In each case the
rule was correct and its reach was not. The order below is the order they were
found, because the order is the argument.

### The accent, reached through a syntax the rule did not model

`check-design-tokens` matched the accent only where the token followed `color:`
immediately, and only where it was bound with `const`. Both of the syntaxes
actually in use walked past it:

    color: isOpen ? 'var(--brand-primary)' : ...       ternary
    { light: { hoverText: 'var(--color-primary)' } }   style map

Ten live failures at 1.51:1, including the language toggle in the header of
every page on the site, and the FAQ marker on the homepage. Two of the ten used
the brand accent as a *status* colour, which the token file forbids by name.

Also two `var(--token)22` values - a hex alpha suffix left on a token by the
v4.0 migration. Not a colour, so those backgrounds never rendered at all.

### An icon range that stopped one block short

The mark sweep of the previous session retired 36 Unicode icons. Its scan
ranges ended at U+27BF; the rotation arrow U+27F3 sits above it. Fourteen uses
survived, twelve of them frozen inside the internal OS translation strings -
where a label carries an icon it cannot restyle and a translator has to keep.
The convert button swapped its entire label for the glyph, so a control lost
its accessible name for the duration of the action.

### A rhythm written in three documents and checked in none

"Exactly three section rhythms; a section not using one fails review" appears
in the token file, the design system and the standards. The public site shipped
five ad-hoc clamps and used a token in one place. Two of them sat adjacent on
the homepage, 140px of padding above a section and 112px below it, which no
single screenshot shows.

Writing that check reproduced ADR-0004's fifth failure exactly: `` landed in
the pattern as a literal backspace byte, so one of its two patterns matched
nothing while the other found 15 and made the rule look alive. Repaired, it
found 18.

### A weight the font did not have

`--weight-bold` documents one role - the small uppercase mono label and the
numeric, where 600 disappears - and says headings use 600. Every h1 and h2 in
the internal OS carried an inline 700 at 18 to 30px: 46 declarations, in the
application whose own stylesheet says not to.

And the 51 sites that use 700 *correctly*, on mono, were being synthesised:
Roboto Mono was loaded at 400 and 500 only. Faux bold at 10px uppercase with
0.2em tracking is the worst place to have it.

### Two applications, two typefaces

The one that had been hiding longest. `@maxpromo/design-tokens` is
dependency-free, so it cannot load a webfont; it names one, and each
application defines it. Agent Bureau passed `variable: '--font-sans'` to
next/font and loaded JetBrains Mono as `--font-mono`. Neither is a name the
token package reads.

Nothing failed. An undefined `var()` does not warn - it falls through. So Agent
Bureau rendered in Segoe UI while maxpromo.digital rendered in Inter, and both
of Agent Bureau's downloaded webfonts sat unused in its bundle. It survived a
design system, a consolidation, a brand migration and six audits, because each
of those looked at one application at a time and each was internally
consistent. `audit-consistency` compared the declarations, which were identical
character for character, and passed.

New gate: `check-token-inputs.mjs`. ADR-0006.

### One namespace

The v4.0 alias block - twenty-four `--color-*` and `--font-*` names repointed at
the token package "until call sites migrate" - had 507 call sites, on a
homepage carrying both names in the same style object. All migrated, block
deleted, `@theme` reduced to the three font keys whose utilities are used.
ADR-0005.

### Typography

The scale gained the two steps it was missing. 476 of 927 declarations sat at
10px or 11px and neither had a name: the published scale described the
marketing site while the product ran on two sizes it did not contain. 649
declarations moved onto tokens at identical computed values - token coverage 2%
to 69%, with no pixel moved.

Agent Bureau's body text was 18px against the website's 17px, because its
`@theme` redeclared `--text-body` and `@theme` lands in `:root`. One platform,
two reading sizes, and neither stylesheet said so.

### Also

- A voice widget styled for a dark ground, mounted on the white contact form:
  every surface a 3-15% white veil, so the mic button, the transcript panel and
  each divider had no visible boundary. The cookie dialog had a `border`
  shorthand written between the two `borderLeft` longhands it was meant to keep.
- Agent Bureau's dev script did not pin a port. Both live audits address
  `:3021` by name, so `certify` after `npm run dev:bureau` could not reach it.
- `check-design-tokens` had an allowlist entry requiring an import of
  `@/design/tokens`, a path that stopped existing at the consolidation. Nothing
  was hiding behind it, but the entry had quietly withdrawn itself.
- `architecture/platform.md` described `apps/os` and `packages/shared` in the
  present tense. Neither exists; both were deferred with reasons that were
  recorded while the document was not. Now marked planned.

### Gates

`npm run verify` runs eight, five of them static audits. Every one has been
observed producing findings on this codebase and then producing none.

Live: `audit:a11y` clean across 38 routes; `audit:consistency` clean across 33
tokens and 3 component classes in both running applications.

Nothing pushed. Nothing merged to main.

## 2026-09-04 - v7.1: the values nobody chose

Branch feature/track-b. Three batches, full gate green after each; both live
audits run against both applications.

v7.0 found rules that could not see. v7.1 found the opposite problem: values
that no rule was looking at, because none of them is wrong on its own. A 3px
corner is fine. A 3px corner beside a 4px one beside a 5px one is a build.

### One motion language

Nine durations and four curves across 41 transitions. 0.15s and 150ms in the
same codebase; 0.2s, 200ms, 220ms and 0.25s all meaning about a fifth of a
second. Nobody chose that - it is what accumulates when each call site types a
number. Now two tokens and one curve.

`transition: all` on a card removed: it animates every property including
layout, and hides what is moving from anyone reading the component.

### One radius scale, plus the step it was missing

Twelve raw values - 2, 3, 4, 5, 6, 8, 9, 10, 12px - against a scale of five.
164 declarations moved onto tokens.

The scale was also missing its most used step. 2px is 73 declarations: every
data surface in the internal OS and the dashboards, where 8px reads as a card.
Named `--radius-xs`. Third time this session's finding has had that shape.

### Spacing

575 declarations onto `--space-*` at identical computed values. 718 did not
move, and the reason is recorded rather than rounded away: the scale steps in
eights above 16px and the product is built at a granularity of two.

### Eight tables a phone could not read

Six in the internal OS, four in Agent Bureau, each in a wrapper with
`overflow: hidden`. On a narrow viewport the far columns were clipped, not
scrolled - gone rather than off-screen. The responsive audit looks for fixed
widths and collapsing grids and a table of auto-width columns has neither, and
`.table-wrap { overflow-x: auto }` had been sitting unused in the stylesheet
the whole time. Third orphan in this repository that was a gap, not dead code.

### The glows

Three elements had each invented their own elevation and two invented it out of
the accent:

    chat bubble   0 4px 24px lime 45% + 0 2px 8px black 40%    every page
    chat panel    0 24px 80px black 70%
    showcase CTA  0 0 36px lime 30%                             no offset

A shadow with no offset is not elevation, it is light. `--shadow-overlay` now
covers the case those three were reaching for, and it is the heaviest shadow
the platform has.

The chat bubble was the clearest single artefact left on the public site. Its
own comment described it as "56px, orange, soft glow" - a colour retired three
brand generations ago. It drew its own chat glyph as inline SVG next to an icon
package that has one, had no perceivable edge (lime on white is 1.51:1, the
problem `--brand-primary-edge` exists for), and kept its hover in
`onMouseEnter`, so a keyboard user was told nothing.

### Focus

Sixteen classes had a `:hover` and no `:focus-visible`. Never an audit failure,
because the reset draws a ring - it is that the affordance and the ring are
different things, and only one of them was being offered to a keyboard user.

### Skip link

The website had one. Agent Bureau did not, so a keyboard visitor tabbed the
whole navigation on every page, and the dashboard's twenty-two-link sidebar
before every screen. Moved into `@maxpromo/ui` rather than copied.

### Dangling var()

`check-token-inputs` now also fails on any custom property an application
references and nothing defines. Four survivors of the v7.0 alias retirement,
all in the chat widget: `var(--font-body, system-ui, sans-serif)`. The fallback
list is why they survived - it made a dead reference look deliberate, and
rendered the chat in the system font.

Its first run produced four false positives, because the showcase engine
declares its per-product theme as quoted keys in a React style object and the
detector only understood CSS declarations. Watched failing, corrected, watched
failing again on a reintroduced defect, then clean.

### Marks

Thirteen straight apostrophes and two typographic ones in one locale, on the
same journey: the homepage said "we've", the contact page said "We'll". Forty-
four labels ended in three periods where others used an ellipsis. Standardised,
except the terminal mock - three periods are what a CLI prints.

### Also

- Nine files declared both `sans` and `grotesk` as `var(--brand-font-body)`:
  two names for one value in the same file, one naming a typeface retired three
  brand generations ago.
- Five dead rules removed, including a 2s infinite pulse with nothing to
  indicate and a second implementation of `@maxpromo/ui`'s `.status-error`.
- Ten row-action controls had `padding: 0` - a hit area around 30x14. They now
  carry a transparent one, with the label in exactly the same place.
- Agent Bureau's dev port pinned so `certify` can reach it; web states
  `font-display` explicitly, as Agent Bureau already did.

Nothing pushed. Nothing merged to main.

## 2026-09-04 - v8.0: the site as a prospect reads it

Branch feature/track-b. Two batches, full gate green after each; both live
audits run against both applications, and the site crawled before and after.

v7.0 and v7.1 were about what the code contained. This pass walked the site as
a visitor, then crawled it, and the two disagreed in ways neither an audit nor
a reviewer of one page at a time would see.

### The link graph

A published article offered exactly one "Continue reading" and it was a 404 -
the target is still `status: draft`. Two articles carried the link, in both
languages.

/ai-websites served the same 74 lines as /solutions/websites-platforms:
identical H1, identical body, no canonical tag, no inbound link, and both
submitted in the sitemap. One page, one address; it is now a permanent
redirect.

/automation-lab was in the sitemap and linked from nowhere, so its only
possible visitor arrived cold from a search result onto the most technical
page the company publishes. It now sits on Resources, where a reference
belongs.

Agent Bureau - the one product marketed publicly from the hub, and the largest
section on the homepage - had one inbound link on the whole site. It is in the
footer now.

The crawl reports no 404, no dead end, nothing in the sitemap that cannot be
reached, and nothing reachable that is missing from it.

### The homepage told the same story four times

"Why Maxpromo" said we start from your daily operation. "Built by operators"
said it again. "How Maxpromo thinks" listed Observe / Understand / Design /
Install / Support. Two sections later "Five steps. Then it runs." listed the
same sequence - with durations and commitments attached, which is the version
a buyer can act on. The duplicate list is gone and the positioning prose it
sat beside stays.

The Agent Bureau section reproduced the dedicated page: the same lifecycle,
the same six capability panels, 405 lines. The homepage introduces and the
page educates. 405 to 234, with the CSS the removed markup owned.

### One call to action

  Contact / Kontakt                   16   utility, nav and footer
  Start a conversation / Gespräch …   15   the dominant action
  Request demo → / Demo anfragen →     2   contextual, carries ?system=
  Talk about your existing system      1   contextual, the legacy section

Identical counts in both languages. What it had instead was a second name for
the dominant action on two pages, each pair pointing at the same page. A
secondary earns its place by going somewhere else, which /about and the hero
already do.

Correcting the homepage close caught one introduced in the same session: it
read "Gespräch beginnen" against eighteen existing "Gespräch vereinbaren".

### Business before technology

Three headlines led with the technology while the sentence underneath them
already led with the outcome. The Agent Bureau site made it plainest: an H1
reading "Ein KI-Team, das Ihren Betrieb führt", three sections above an H2
reading "Wir verkaufen keine KI. Wir verkaufen Ergebnisse." The page contained
the rule its own headline broke - and "führt Ihren Betrieb" claims the agents
run the business, which the rest of the page exists to deny.

### Crossing between the two properties

Agent Bureau's footer linked to /de/systems, a route the hub retired. Its one
link offering a look at the product pointed at /dashboard, behind
authentication, so a prospect following "System-Vorschau ansehen" arrived at a
login form.

### Not corrected: two claims

The same client saving is quoted as €14k/mo on the homepage and £14,000/month
on the case-studies page - in both languages, to a German market. And the
three proof figures are introduced as outcomes the systems are "designed to
improve" and closed as "results from live production systems", four lines
apart, on a site whose Resources page promises case studies "without numbers
we cannot evidence".

Both are public commercial claims. Picking a currency changes a stated client
saving; deciding whether the numbers are results or examples states something
about delivered work. Recorded as known-risks 33 and 34.

### Verified, not changed

The six industry pages are the strongest work on the site - specific,
operator-voiced, a different closing offer per sector - and needed nothing.
German and English are structurally identical page for page: same headings,
same link counts, same CTA counts, same quality. 1,418 strings, no marketing
or AI cliché in either.

Nothing pushed. Nothing merged to main.

## 2026-09-04 - v9.0: what the site claims, and whether it agrees with itself

Branch feature/track-b. One batch. Full certification green - eight gates,
accessibility across 38 rendered routes, cross-application consistency against
both running apps - plus a new report-only audit that is deliberately not
green, because its findings need answers this session cannot give.

### The shape of this pass

v8 fixed what the site said twice. v9 asked whether what it says is true, and
almost everything found is a business fact rather than a defect. Seven of the
nine findings are recorded and left in place; the brief's own instruction for
claims is to flag rather than rewrite, and CLAUDE.md makes a public claim the
infrastructure does not support a stop-and-escalate condition.

### A claim is now checked like a token

`audit-claims.mjs` reads the message catalogues and reports two things that no
single string reveals: the same magnitude carrying more than one currency
symbol, and a hedge word in a string whose key presents it as a result.
Magnitudes are normalised, so 14k, 14.000 and 14,000 compare equal across the
German and English number formats.

Five findings, symmetric across both locales, on 1,376 strings, with no false
positives. ADR-0007. It reports and never rewrites, and it sits in `certify`
rather than `verify`, because a check whose findings need a business decision
cannot block every merge.

Its hedge rule fired on "Client satisfaction scores increased significantly"
and missed "Kundenzufriedenheit deutlich gestiegen" - the stem list was built
from infinitives and German puts the change in the participle. A rule that
catches one half of a translated pair looks correct in every English review it
will ever get.

### What the case studies promise, and what they contain

The page opens: "Where a number appears, it came from the system rather than
from an estimate. Where we cannot evidence something, it is not here." Under
that standard:

- The same client saving is €14k/mo on the homepage and £14,000/month here.
- "Cash flow improved by approximately 18 days per quarter." "Client
  satisfaction scores increased significantly."
- The £14,000 does not follow from its own paragraph: three people, two days a
  month each, is six person-days - about £2,300 a person-day.

### What the site disagrees with itself about

- **How long a build takes.** The process section commits to 1-4 weeks. The
  FAQ four sections below says 2 to 6. The three case studies were delivered
  in 4, 6 and 8 - every one outside the process commitment.
- **How long the first meeting is.** 30 minutes on the homepage, twice; around
  45 on /about and all six industry pages.
- **Whether maintenance is included.** The homepage FAQ says "included, not
  billed as extras". The pricing page sells it as €149-399 a month.

### What the pricing page sells

Three monthly plans whose contents are website maintenance, a Google Business
profile, 4 to 12 social posts a month, review responses, a newsletter, Google
Ads management and competitor monitoring. That is a marketing retainer, on the
page where a buyer goes to understand the commercial relationship, under a
brand whose permanent rule is never to be positioned as a website or marketing
agency - and beside an /about page that says most businesses do not need
another website. One of the two is wrong about what the company sells.

Also "Full account team", in a business whose Impressum, footer and tax clause
all state one person.

### Verified without change

The six solution pages answer every question the brief asks of a service page
- who it is for, the business problem, the approach, the outcome, the next
step - and each carries an explicit "what is included, and what is not",
including "a chatbot that guesses without a grounded knowledge base" under Not
included. With the industry pages, they remain the strongest work on the site.

Three content sets - a testimonial block, an ROI calculator, a six-question
FAQ - are written, translated and read by nothing. Recorded rather than
removed: unlike the sections deleted in v8 these look planned, but `roi`
carries a "60-90 days payback" claim sitting one wire-up away from publication.

### Not written

The platform runs eight merge gates, keeps seven decision records and audits
accessibility on every public route before anything merges. A business buying a
mission-critical system asks precisely this, and no public page mentions it. I
can verify the platform is built that way; I cannot verify client systems are,
and a claim about delivery practice has to come from Marcel.

Nothing pushed. Nothing merged to main.

## 2026-09-04 - v9.5: commercial alignment

Branch feature/track-b. Full certification green - eight gates, accessibility
across 38 rendered routes, cross-application consistency, a clean crawl - and
the claims audit reporting seven findings it is meant to report.

v9 flagged nine things and fixed none. v9.5's instruction is different:
*resolve everything that can be resolved without changing a business fact.* So
this pass sorted the list by that test rather than by severity.

### A commitment is a claim, and now gets the same treatment

`audit-claims` gains a third rule: one commitment, one value. It groups
durations by what they commit to and reports any commitment carrying more than
one value, in either language. It found both live conflicts:

    the first conversation      30 minutes  ×6      45 minutes  ×2
    building and going live     1-4 weeks   ×2      2-6 weeks   ×2

The first two sentences end identically - "afterwards you will know where the
time is going, whether or not we work together" - after "thirty minutes" in one
and "around 45 minutes" in the other. The second pair are both on the homepage,
four sections apart.

Getting "which keys describe the same thing" right took three attempts, and the
failures are in the file because they are the useful part. Key-stem grouping
found two of the three conflicts. Whole-parent grouping found all three and
also read a case study's 90 minutes of invoice processing as a commitment about
meeting length. Shared-prefix grouping is what shipped.

Then German, twice. Plurals in -n and -en rather than -s, so every English
duration matched and no German one. And "und" missing from the range
separators, so "zwischen 2 und 6 Wochen" read as "6 weeks". Both the same shape
as the participle that got past the hedge rule one release earlier: **a rule
that reports the English half of a translated pair looks correct in every
English review it will ever get.**

Case-study timelines are excluded by name. "Delivered in 8 weeks" is evidence
about one project, and comparing it with a general promise is a conclusion a
human draws, not a script.

### Resolved

Three content sets - a testimonial block, an ROI calculator and a six-question
FAQ - written, translated and read by nothing. 49 strings per locale, removed.
v9 recorded them on the grounds they looked planned; copy no component reads
makes no public promise, and two of them carried claims - a customer quote and
a "60-90 days payback" - that one wire-up would have published unevidenced.

It also cleaned the audit: a dead string had been contributing a third build
duration, so the tool was reporting a conflict the public site does not have.

### Recommended, not implemented

**`docs/governance/pricing-alignment-review.md`** - every pricing item
classified KEEP / RETIRE / RESTRUCTURE / MOVE against the company identity,
and the observation that matters more than the classification: the site already
describes a full commercial ladder - discovery, assessment, design, build,
managed operations, support - with a page for every rung and a price on one.
The monthly plans that should price the last rung price social posts and Google
Ads instead. The recommendation is not to invent a pricing model but to price
the one the site already describes.

**`docs/governance/delivery-commitments.md`** - one value per commitment, the
two that conflict, and every page that has to inherit each once they are set.

### Unchanged, deliberately

Both conflicting durations, the currency, the hedged results, the maintenance
wording, "full account team", and the pricing model. Every one requires knowing
a business fact. That is the test this pass applied throughout.

Nothing pushed. Nothing merged to main.

## 2026-09-04 - v9.6: public pricing retired

Branch feature/track-b. Marcel's decision on the commercial question v9.5 put
to him: the website no longer displays prices, because Maxpromo does not sell
predefined packages. Full certification green.

### The page

Route deleted, 64 strings per locale removed, nav link, footer link, sitemap
entry and the Resources card gone. /pricing redirects permanently to /contact,
so an old link or a search result lands where the answer now lives. Resolves
known-risks 38, 39, 42 and 45.

### What the page was hiding

Removing it meant sweeping every surface for prices, and the sweep found that
the page was not the only place the company published them.

Max, the chat agent on every page of the site, carried a full price list in its
system prompt - Starter from GBP 2,500, Growth from GBP 6,500, payment plans
over GBP 3,000 - under the instruction "Give specific numbers. Do not be
vague." The offline fallback in lib/ai.ts repeated it. lib/prompts.ts held a
third copy. The internal OS assistant held a fourth model at EUR 799-6,000+.

Four price models. One of them in pounds sterling, on a site selling to German
SMEs. None matching the page that was published. None visible to any audit,
because none of them is a page.

The same prompt pointed at /services and /pricing, both retired routes, offered
an ROI calculator that does not exist, and quoted a "60-90 day payback" that
nothing evidences - the same figure removed from the catalogue one release
earlier, still live in the agent.

All four now say the same thing: there is no price list, scope decides cost,
the business check is free and a fixed quote follows it. The agent is
instructed not to produce a figure it was not given.

### The claims audit reads articles now

ADR-0007 recorded "copy outside the message catalogues" as a known limit. It
was hiding three currency conflicts in one published article, which gives a
migration's hosting cost as "from GBP 89/month to GBP 19/month" in English and
"von 89 Euro/Monat auf 19 Euro/Monat" in German - four lines above "those are
documented outcomes from a real project". Update cost is "GBP 50-200" and
"50-200 Euro". The figures agree; the currency does not.

Recorded as risk 47 rather than corrected, for the same reason as risk 33: one
of the two is wrong and only Marcel knows which.

### Kept, deliberately

The AGB's "orders above EUR 500 require written form" is a legal threshold, not
a price. Invoice and quotation documents carry prices because they are client
documents. The estimate email builder produces a per-engagement quote, which is
the model Marcel has just chosen - though nothing currently calls it. The
portfolio's agency-cost figure sits behind a password.

### Noted

The whole message catalogue is serialised into the payload of every page, so
the case-study figures ship on routes that never display them. Not a pricing
issue - and a reason the discipline of removing copy nothing renders is worth
keeping.

Nothing pushed. Nothing merged to main.

## 2026-09-04 - v10.0: enterprise readiness sprint

Branch feature/track-b. Full certification green - eight gates, accessibility
across 36 rendered routes, cross-application consistency, clean crawl.

Most of this sprint's work packages were closed in v7.0 through v9.6, so this
pass went at the three items on the risk register that were still real
component debt rather than business decisions.

### Nine status maps, and the reason the shared one went unused

ADR-0002 replaced eleven status maps in Agent Bureau with a tone system, and
concluded that an abstraction callers ignore is wrong. The internal OS then
accumulated **nine of its own** - dashboard, quotations and invoices in list
and detail form, leads, job priority, inbox log type, document-scan confidence.

The reason is worth recording: `TONE_TEXT` and `TONE_BADGE` are Tailwind class
strings, and the OS styles with inline objects and custom properties. **It
could not consume the shared abstraction, which has the same effect as
ignoring it.** So the drift arrived exactly as before - the dashboard coloured
a new lead with the brand accent while the leads page coloured it amber. One
status, two colours, two screens.

Five of the nine used `--brand-primary` as a status, forbidden twice over:
brand colours are never semantic colours, and Brand Lime as text is 1.51:1.
Four appended a hex alpha pair to a `var()` reference - `${color}20` - which is
not a colour, so those backgrounds never rendered. Same defect class as the two
found in v7.0, in four more places.

`TONE_VARS` is the same six tones as custom properties. All nine migrated.

### A heading scale documented as removed, and still there

`showcaseTokens.ts` opened by saying the heading scale "has moved to the
platform type scale - showcase headings are the same headings". Directly below
that sentence sat `HEADING_SIZE`, five entries, two with no consumers, one of
them the 4rem display size the design system retired by name: *"64px headings
are landing-page size."*

Its two live consumers were paragraphs used as section headings - so two
showcase sections, on nine public domains, had no heading element in the
outline at all. One is now an `h2` and inherits the platform scale; the other
is a standfirst and joins it explicitly. The constant is deleted.

### Content hidden and re-shown

`Reveal` sets `opacity: 0` after hydration and waits for an IntersectionObserver
callback, which is asynchronous - so an element already on screen when the
effect runs disappears for at least a frame before fading back in. Most likely
above the fold, on a fast connection, for the first thing a visitor looks at.
It now leaves visible elements alone.

Nothing pushed. Nothing merged to main.

## 2026-09-05 - Architecture certification: the gate that was not enforcing itself

Branch feature/track-b. Full certification green - nine gates now, plus the
three live audits.

The brief was to prove the ecosystem behaves as one governed platform. Measured
first: dependency versions across six workspaces showed **zero drift**, and the
package boundary rule (no package depends on an application) was already clean.

Then the gate itself, which turned out to be the drift.

### Three definitions of `verify`

    package.json              eight gates
    apps/<app>/package.json   four gates, same script name
    .github/workflows         six steps, listed by hand

The workflow enumerated the gates deliberately, so a failure would be legible
in the checks list without opening a log. That is a real benefit, and its cost
was that every gate added afterwards had to be remembered in a second place.
Three were not: `check:token-inputs`, `check:icons` and `audit:typography` had
been in the developer's gate since v7.0 and **had never run in CI**.

So the workflow that exists to enforce the standard was enforcing a stale
subset of it, and reporting green. And an engineer running `npm run verify`
inside `apps/web` got a four-gate pass under the same command name.

One definition now. The applications define no `verify`; CI calls it; the
standards table names each gate's script so the documentation can be compared
to the chain rather than read alongside it.

### The check that keeps it that way

`check:governance` is the first gate in the chain, because it checks that the
rest of the chain is what the standards say it is. Three rules: one definition
of `verify`, CI calls it, every gate is in the table.

**Two of the three did not work when first written, and both looked right.**
Rule 2 searched the whole workflow file for `npm run verify` - and the file
explains at length why it calls it, so the rule was satisfied by a comment
about the rule and would have passed a workflow that had stopped calling the
gate. Rule 3 searched the whole standards document, and the script names also
appear in the audit-suite table further down, so removing a gate from the gate
table still passed.

Each rule was then watched failing on a reintroduced defect and passing after
it was restored. That is ADR-0004's fourth rule, and it has now caught a dead
rule in four consecutive releases.

Nothing pushed. Nothing merged to main.

## 2026-09-05 - v12.0: platform freeze preparation

Branch feature/track-b. Full certification green: nine gates, accessibility
across 36 rendered routes, cross-application consistency against both running
applications, a clean crawl, and the two report-only audits.

### Governance audit

One definition confirmed for each governed thing. Lint and TypeScript already
extended a shared base; dependency versions showed zero drift across six
workspaces; the merge gate was collapsed to one definition the release before.
Three findings:

**The two applications had different security postures.** Agent Bureau set
`poweredByHeader: false` and `reactStrictMode: true`; the web application set
neither, so the deployment serving ten public domains answered every request
with `X-Powered-By: Next.js` and the one serving a single domain did not. Both
are now stated in both, rather than one relying on a framework default that a
minor release is free to change.

**Two PostCSS configurations** declared the same single plugin and had already
drifted to different quote conventions. One definition now, imported by both.

**No formatter exists** — no Prettier, no Biome, no editorconfig. Recorded as
risk 50 and deliberately not fixed: adding one reformats the whole repository,
which is the largest possible diff at the moment the objective is to stop
changing things.

### Documentation audit

46 file paths and 9 audit scripts named across the documentation, checked
against the tree. Every script exists. Every missing path is either explicitly
marked planned (`apps/os`, `packages/shared`) or lives in `docs/history`, which
`docs/README.md` defines as describing how things were. Seven ADRs on disk,
seven referenced, none orphaned in either direction.

### Repository hygiene

Two one-off scripts removed — `alignment-i18n.mjs` and `update-i18n.mjs` — and
they were not merely clutter. Both overwrite the message catalogues wholesale
with copy from three brand generations ago, and one of them reintroduces the
`//` label motif the design system lists under "retired, and not to be
reintroduced". The July phase-1 audit had already flagged them and they were
still executable.

Also removed: `CapabilityIcon`, six hand-drawn icons left behind when the
homepage Agent Bureau section was trimmed in v8.0. It was the only lint warning
in the workspace.

Nothing pushed. Nothing merged to main.

