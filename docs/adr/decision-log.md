# Decision Log

## 2026-07-10 — Build on existing uncommitted product-page WIP rather than discard it

**Decision:** The 7 generic product pages and `messages/*.json` had pre-existing uncommitted changes using a client-side `useLocale()` pattern flagged as architecturally wrong by the sprint brief. Rather than `git stash` and rewrite from scratch, the existing bilingual copy was kept and the pages were refactored in place to the server `params.locale` pattern (matching the TaxKontrol page, since retired — those routes are now served by the LandingEngine from the product registry).
**Why:** Marcel confirmed this explicitly when asked. The copy itself was high quality; only the locale-threading mechanism was wrong.
**Owner:** Marcel (confirmed via clarifying question at sprint start).

## 2026-07-10 — Proceeded without further AI-Operating-System repo onboarding

**Decision:** `maxpromo.digital` has never had its `repo-docs/` charter instantiated from `C:\Users\loneb\Documents\AI-OPERATING-SYSTEM\repo-docs\` templates (no repository-map, no lifecycle-stage declaration). Rather than pausing the sprint to fully onboard the repo into that governance system, the sprint proceeded using the sprint brief + this repo's `CLAUDE.md` + the real architecture docs at `docs/architecture/sprint-correction/*.md` as the operative spec, and used this session to backfill `decision-log.md`, `known-risks.md`, and `change-log.md` per this repo's own memory rule.
**Why:** The sprint was a bounded, well-specified production-hardening task, not a repository bootstrap. Full onboarding (declaring lifecycle stage/class, instantiating all charter docs) is a separate, larger piece of work.
**How to apply:** If a future session needs the full charter (product-brief.md, repository-map.md, architecture.md, workflow-map.md, data-ownership.md, production-readiness.md), that's still outstanding and should be done as its own task, ideally with Marcel's input on lifecycle stage/class rather than an AI guessing it.

## 2026-09-03 - ADR-003: VG-01, VG-02 and VG-03 retired; ADR-002 re-scoped

**Decision:** The showcase governance rules are superseded. VG-03 held the CTA
colour at the literal hex #F97316 and stated it was "intentionally NOT a CSS
variable" so it would "render identically on every product". VG-01 made a dark
#080808 background the default with light as a per-product exception. VG-02
reserved the accent for headline marks. ADR-002 (in the Agent Bureau repo)
adopted the orange light system.
**Why:** VG-03 in particular was the exact mechanism that would have re-applied
the retired orange after the brand migration - a future session reading the word
"locked" would have been correct to restore it. Retiring the colour without
retiring the rule guarantees regression.
**Applied in:** components/landing/showcaseTokens.ts,
components/landing/LandingThemeProvider.tsx, commit 0366756.

## 2026-09-03 - Two-tier brand: hub always Maxpromo, product accents on their own domains only

**Decision:** maxpromo.digital - including every /systems/* page - renders in
the Maxpromo accent without exception. The eleven per-product accents survive
only on the dedicated product domains (restaurant-os.de, superhandwerk.de and
the rest), where exactly one token varies.
**Why:** A visitor on maxpromo.digital is a Maxpromo prospect and must see one
company; a product page rendering green-on-black inside Maxpromo's own
navigation was the most direct contradiction of that. A visitor on
restaurant-os.de is buying RestaurantOS, so product identity is legitimate there.
**How it works:** lib/host/HOST_MAP.ts and middleware.ts were already
classifying every request as hub or showcase and stamping x-mp-mode; the
mechanism existed and had never been used for colour. LandingThemeProvider now
reads it. Roughly fifteen lines.

## 2026-09-03 - Sweep to tokens first, change the brand last, in one file

**Decision:** Tokenisation (B3-B6) deliberately kept the accent at the retiring
orange. The brand change (B9) is the deletion of a single transitional block.
**Why:** Verification asymmetry. "Did anything change?" is the cheapest possible
QA question and it is the question every sweep batch answers; "did everything
change correctly?" is the most expensive, and it is asked once. It also means
production never showed a half-migrated brand, and the flip is revertible with
one git revert.

## 2026-09-03 - The five brand colours extended with a derived ramp

**Decision:** Brand Black, Brand Lime, Dark Green, Light Surface and White are
unchanged and remain the brand. A derived ramp was added around them.
**Why:** The five alone cannot express an accessible interface. Brand Lime as
text on white measures 1.51:1; white text on Brand Lime measures the same, so a
white-on-lime button - the pattern this codebase used everywhere - is illegible.
Black on lime is 12.62:1, so --brand-on-primary is black. Dark Green on white is
3.08:1 and fails AA for body text, so #4D7C0F (5.00:1) was added as the accent
text colour used by links, labels and invoice figures.

## 2026-09-03 - Semantic colours named --semantic-*, and success blue-shifted

**Decision:** Status colours are --semantic-success/warning/danger/info, never
--brand-*. Success is emerald #047857, not a green from the brand ramp.
**Why:** The v3.1 ruling is that brand colours are never semantic colours.
Naming them in a separate namespace enforces that by construction rather than by
convention. Success still has to read as green, so it is blue-shifted far enough
from the yellow-green brand to be unmistakable at badge size. Specifying warning
at amber-700 also fixed an existing AA failure - text-amber-600 measures ~3.1:1
and appears in 19 Agent Bureau components.

## 2026-09-03 - Space Grotesk retired in favour of a single neutral grotesque

**Decision:** Headings and body both use Inter; hierarchy comes from weight and
size, not from a second typeface. Mono is demoted to code, data tables and
document reference numbers.
**Why:** A geometric display face reads as a 2022-24 AI-startup landing page,
which is the precise impression v3.1 and v4.0 exist to remove - arguably a
larger factor than the palette. Every reference company named in the brief
(Stripe, Linear, GitHub, Atlassian, Notion, Vercel, Basecamp, Thoughtworks) uses
one neutral grotesque this way.
**Reversibility:** One token. Restore the Space_Grotesk import in
app/layout.tsx and repoint --brand-font-heading in design/tokens/brand.css.
Implemented under the v4.0 autonomous mandate and flagged for veto.

## 2026-09-03 - backgroundDark removed from the product registry

**Decision:** The per-product backgroundDark flag is deleted from
lib/registry/products.ts, its types and both adapters.
**Why:** It was a design decision living in product data. Nine of eleven
products carried true, which is what made the showcase pages dark while the
marketing site was light - two design languages, sourced from a content file.
Surface choice belongs to the token layer.

## 2026-09-04 - ADR-0005: the legacy alias namespace retired

**Decision:** The twenty-four `--color-*` / `--font-*` / `--radius-card` aliases
in `apps/web/app/globals.css` are deleted and all 507 call sites migrated to the
token names. `@theme` keeps only the three font keys whose Tailwind utilities
are actually used.
**Why:** The block was written in v4.0 to spare a large find-and-replace, with a
comment saying it would shrink over time. It grew instead, from an estimated
1100 references to 507 live ones, and both names resolved so nothing marked
either as wrong. Fifteen contrast failures had been hiding behind an alias named
for a colour retired two brand generations earlier.
**How to apply:** A migration that leaves the old name working is not a
migration. Rename and rewrite the call sites in the same change, or do not
rename.

## 2026-09-04 - ADR-0006: a package declares the variables it reads

**Decision:** `check-token-inputs.mjs` derives the set of custom properties the
token package references but does not define, and fails the build if any
application does not supply them. Wired into `npm run verify` as gate 2.
**Why:** `@maxpromo/design-tokens` is dependency-free and cannot load a webfont,
so it names one. Agent Bureau never defined `--font-inter` or
`--font-roboto-mono`, an undefined `var()` falls through silently, and the two
applications rendered in different typefaces for a year without a single check,
audit or review noticing.
**How to apply:** Any package naming a variable it cannot provide has declared
an input. Inputs are checked, not assumed.

## 2026-09-04 - The type scale gains its two bottom steps

**Decision:** `--text-label` (11px) and `--text-label-dense` (10px) are added to
the scale, with a stated role - interface chrome, uppercase mono, never prose -
and 649 raw declarations moved onto them and the existing steps at identical
computed values.
**Why:** The audit found 927 size declarations of which 476, fifty-one per cent,
sat at 10px or 11px, and neither had a name. The scale described the marketing
site while the product ran on two sizes it did not contain, so nothing could
reference them and nothing could check them. Same finding as `--weight-bold`:
the scale was incomplete, not the call sites wrong.
**Not decided:** The mid-band consolidation - 12, 14, 16, 18, 20, 22, 26, 28,
30, 42, 48 - is a real visual change of about one pixel each across dense
internal screens and is left for a human pass. See known-risks 23.

## 2026-09-04 - Section rhythm is enforced rather than documented

**Decision:** The eighteen ad-hoc section paddings on the public site move onto
`--section-y` and `--section-y-feature`, and `audit-responsive` fails on a
clamp-based section padding that is not one of the three rhythms.
**Why:** "Exactly three section rhythms; a section not using one fails review"
was written in three documents and checked in none. The site shipped five
ad-hoc values and used a token in one place, with two of them adjacent on the
homepage at 140px above and 112px below - which no single screenshot shows.
**Visual effect:** Desktop section padding moves from 140px to 112px on ten
sections. That is the documented value, and it sits inside the 96-128px band the
reference companies use; 140px was above it.

## 2026-09-04 - v7.1: the scales gain the steps the product actually uses

**Decision:** `--radius-xs` (2px) and `--shadow-overlay` are added to the token
package; 164 radius declarations, 41 transitions and 575 spacing declarations
move onto tokens.
**Why:** Three times now the same finding: the published scale describes the
marketing site, the product runs on a step the scale does not contain, and the
call sites therefore write raw values. It was 10px and 11px type in v7.0, and
weight 700 before that. Here it is the 2px corner every data surface in the OS
is drawn at - 73 declarations, the most used radius in the platform, unnamed -
and the elevation a floating element needs, which three components had each
invented, two of them out of the accent.
**How to apply:** When a raw value appears more often than the token it should
be, check whether the scale is missing a step before changing the call sites.

## 2026-09-04 - Every hover state gets a matching focus state

**Decision:** Sixteen classes with a `:hover` and no `:focus-visible` now have
both. Interaction that lived in `onMouseEnter` moved to CSS.
**Why:** The global focus ring meant this was never an audit failure - it is
that a mouse user was told what was interactive and a keyboard user was told
only where they were. The affordance and the ring are different things.

## 2026-09-04 - Eight data tables were clipping rather than scrolling

**Decision:** Wrappers with `overflow: hidden` around full-width tables become
scroll containers.
**Why:** On a narrow viewport the far columns were unreachable, not merely
off-screen. The responsive audit looks for fixed widths and collapsing grids
and finds neither in a table of auto-width columns, and `.table-wrap {
overflow-x: auto }` had been sitting unused in the stylesheet the whole time -
the third "orphan" in this repository that was a gap rather than dead code.

## 2026-09-04 - v8.0: the homepage introduces, the page educates

**Decision:** The homepage Agent Bureau section drops the six-step lifecycle
and the six capability panels that /agent-bureau already carries (405 lines to
234), and the philosophy section drops the five-step list that "Five steps.
Then it runs." states two sections later with durations attached.
**Why:** The homepage told a reader how the work runs four times in four
consecutive sections, and reproduced a dedicated page inside itself. A section
earns its place by answering a question no other section answers.
**How to apply:** Before adding a section to the homepage, name the business
question it answers and check no other section answers it.

## 2026-09-04 - One dominant call to action, and secondaries that go elsewhere

**Decision:** A secondary CTA must have a different destination from the
primary. Two pages carried a second name for the same action pointing at the
same page; both are now single actions.
**Why:** "Contact us" beside "Talk to Maxpromo", both to /contact, asks the
reader to work out whether they differ. The site now shows one dominant label
(15 uses per language), plus contextual actions that carry real context - a
pricing tier, a product demo with ?system=.

## 2026-09-04 - Business before technology, in the headline as well as the body

**Decision:** Three headlines that led with the technology now lead with the
outcome: the hub's Agent Bureau page H1, the homepage section H2, and the
Agent Bureau site's H1.
**Why:** The core memory's permanent rule is "never sell AI, sell business
outcomes", and in every one of the three the sentence directly underneath
already led with the outcome - the order was inverted, not the content wrong.
The Agent Bureau site made it plainest: an H1 selling KI, three sections above
an H2 reading "Wir verkaufen keine KI. Wir verkaufen Ergebnisse."

## 2026-09-04 - Two claims escalated rather than corrected

**Decision:** The currency contradiction in the case study, and the two
framings of the proof numbers, are recorded as known-risks 33 and 34 and left
in place.
**Why:** Both are public commercial claims. Picking a currency changes a
stated client saving by seventeen per cent; deciding whether the figures are
"results" or "examples" states something about delivered work. Neither is a
formatting fix, and CLAUDE.md makes a public claim the infrastructure does not
support a stop-and-escalate condition.

## 2026-09-04 - ADR-0007: claims are audited, never auto-corrected

**Decision:** `audit:claims` reports currency disagreement and results stated
as estimates, in `certify` rather than `verify`, and never rewrites.
**Why:** The case-studies page promises "where a number appears, it came from
the system rather than from an estimate", and two things were wrong underneath
it that no single string reveals - the same client saving in two currencies,
and two results carrying hedges. Correcting either means knowing what was
delivered; a tool that guessed would invent a fact about a client.

## 2026-09-04 - v9.0: seven findings flagged rather than fixed

**Decision:** The pricing page's marketing retainer, "full account team", the
build-duration disagreement, the two meeting lengths, the maintenance wording,
the three orphaned content sets and the invisible engineering discipline are
recorded as known-risks 38-44 and left in place.
**Why:** Every one of them is a statement about what the company sells,
promises or does. CLAUDE.md makes a public claim the infrastructure does not
support a stop-and-escalate condition, and v9's own brief says to flag rather
than rewrite where confirmation is required.
**How to apply:** The test is whether correcting the finding requires knowing a
business fact. Two names for one CTA does not; what maintenance costs does.

## 2026-09-04 - v9.5: a commitment is a claim, and gets the same treatment

**Decision:** `audit:claims` gains a third rule - one commitment, one value. It
groups durations by what they commit to and reports any commitment carrying
more than one value, in either language.
**Why:** A duration stated publicly is a promise a buyer plans around, and the
site stated two of them twice: the first conversation as 30 and 45 minutes, and
building and going live as 1-4 and 2-6 weeks. Neither is visible from one page.
**Method:** Three attempts at "which keys describe the same thing" - key stem
found two of three conflicts, whole-parent found all three plus a case study's
invoice-processing time read as a meeting length, shared-prefix is what shipped.
Then two at German morphology: plurals in -n/-en, and "und" as a range
separator. Both failures are recorded in the file, because a rule that reports
the English half of a translated pair looks correct in every English review.

## 2026-09-04 - Case-study timelines are evidence, not commitments

**Decision:** `audit:claims` excludes `caseStudies.*` from the commitments rule.
**Why:** "Delivered in 8 weeks" describes one project. Comparing it with "1-4
weeks" on the process section compares what happened once with what is promised
generally, and a script should not draw that conclusion. A human should, and
did - known-risk 40 records that all three published projects took longer than
the process section promises.

## 2026-09-04 - Copy that renders nowhere is removed; copy that renders is not

**Decision:** `proof.*`, `roi.*` and `faq.*` deleted - 49 strings per locale.
`pricing.ctaSecondary` with them.
**Why:** v9 recorded them rather than removing them, on the grounds they looked
planned rather than retired. v9.5's instruction is to resolve everything that
can be resolved without changing a business fact, and copy no component reads
makes no public promise. Two carried claims - a customer quote and a "60-90
days payback" - that one wire-up would have published unevidenced. Git keeps
them.

## 2026-09-04 - v9.6: public pricing retired (Marcel's decision)

**Decision:** The website no longer displays prices. Maxpromo does not sell
predefined packages; every engagement begins with understanding the business.
The page, its route, its 64 strings per locale, its nav and footer links and
its sitemap entry are removed. `/pricing` redirects permanently to `/contact`.
**Why:** Marcel's, on the commercial question v9.5 put to him. It resolves
known-risks 38, 39, 42 and 45 in one decision.
**How to apply:** There is no price list, so nothing may quote one - including
the surfaces that are not pages.

## 2026-09-04 - A conversational surface is a publishing surface

**Decision:** The chat agent, its offline fallback, the shared prompt module
and the internal OS assistant are treated as public commercial copy.
**Why:** Retiring the page found four price models nothing had ever reviewed.
Max's system prompt carried "Starter from GBP 2,500, Growth from GBP 6,500,
payment plans over GBP 3,000" and the instruction "Give specific numbers. Do
not be vague." lib/ai.ts repeated it offline, lib/prompts.ts held a third copy
and the OS assistant a fourth at EUR 799-6,000+. Pounds sterling, on a
German-market site, none of it matching the published page, none of it visible
to any page audit. The agent also linked to two retired routes, offered an ROI
calculator that does not exist and quoted a 60-90 day payback nothing
evidences.
**How to apply:** A prompt that speaks to prospects is copy. It is reviewed
when copy is reviewed.

## 2026-09-04 - audit:claims reads articles

**Decision:** The currency rule scans content/**/*.mdx as well as the message
catalogues.
**Why:** ADR-0007 recorded copy outside the catalogues as a known limit. It was
hiding three currency conflicts in one published article, which gives a
migration's hosting cost in pounds in English and euros in German, four lines
above the sentence "those are documented outcomes from a real project".

## 2026-09-04 - v10.0: a shared abstraction the caller cannot consume is unadopted

**Decision:** `@maxpromo/ui` exports `TONE_VARS` - the same six tones as CSS
custom properties - and the internal OS's nine status maps are migrated onto
it. ADR-0002 is amended.
**Why:** ADR-0002 replaced eleven status maps in Agent Bureau with a tone
system, and its general lesson was that an abstraction callers ignore is wrong.
The OS then accumulated nine of its own, because TONE_TEXT and TONE_BADGE are
Tailwind class strings and the OS styles with inline custom properties. It
could not adopt them physically, which is the same outcome as ignoring them.
The drift arrived on schedule: the dashboard coloured a new lead lime, the
leads page amber.
**How to apply:** When extracting a shared abstraction, check the call sites
can consume the form you chose, not only that they share the idea.

## 2026-09-04 - The showcase heading scale is deleted, not documented as moved

**Decision:** `HEADING_SIZE` is removed from the showcase engine.
**Why:** Its own file header had said the heading scale "has moved to the
platform type scale - showcase headings are the same headings" for a release
while the constant sat below it with five entries, two unused and one holding
the 4rem display size the design system retired by name. Documentation that
describes a removal is not a removal.
**Also found:** two showcase sections had no heading element at all - their
headings were paragraphs sized from that constant.

## 2026-09-05 - The merge gate has one definition, and it is checked

**Decision:** `verify` is defined once, in the root package.json. No workspace
redefines it, CI calls it rather than restating its steps, and
`check:governance` - the first gate in the chain - fails the build if any of
those three stops being true.
**Why:** Three things claimed to be the merge gate. The root ran eight gates,
each application defined a four-gate script under the same name, and the CI
workflow enumerated six steps by hand. The workflow enumerated them for a good
reason - a named failing check is legible without opening a log - and the cost
was that every gate added afterwards had to be remembered in a second place.
Three were not: `check:token-inputs`, `check:icons` and `audit:typography` were
in the developer's gate and had never run in CI. **The workflow that exists to
enforce the standard was enforcing a stale subset of it and reporting green.**
**How to apply:** Anything that describes the gate calls it or is compared
against it. The standards table now names each gate's script so the comparison
is exact rather than a guess at prose.

## 2026-09-05 - A rule that cannot fail is not a rule

**Decision:** Recorded as method, not policy: every rule in
`check-governance.mjs` was watched failing on a reintroduced defect before the
check was believed.
**Why:** It needed the discipline. Rule 2 searched the whole workflow file for
`npm run verify`, and the file explains at length why it calls it - so the rule
was satisfied by a comment about the rule, and would have passed a workflow
that had stopped calling the gate. Rule 3 searched the whole standards
document, and the script names also appear in the audit-suite table further
down, so removing a gate from the gate table still passed. Both looked correct.
Both were verified only by deliberately breaking the thing they check.

## 2026-09-05 - A product has one identity, and empty slots are declared

**Decision:** ADR-0009. One brand record per product in
`packages/config/brands.ts`: names, accent, accent-as-text, theme colours, and
every asset slot — declared even when empty, with the reason it is empty.
**Why:** Identity was spread across four files and none of them held it. Two
products had a *semantic* token as their brand accent, which the design system
forbids and no check could see. Four of eleven accents fail contrast as text and
two components colour text with them — the platform has enforced exactly that
rule for its own accent since v3, and product accents were never in scope
because the check knows one token name.
**How to apply:** `check:brands` is gate 3 and holds the registry to the
repository. A slot that is not `own` and has no note is a finding: an empty slot
with no reason is indistinguishable from an oversight, which is what the audit
found in its own registry on its first run.

## 2026-09-05 - A custom property that travels is as undefined as one that does not

**Decision:** No `var()` in output read outside the browser. `lib/email.ts` and
`lib/documents/emailHtml.ts` use the token package's TypeScript mirror; the rule
is in `check:token-inputs`.
**Why:** Ninety-five custom properties were written into transactional email
markup — seventy-one spacing values in `email.ts` and twenty-four colours in
`emailHtml.ts`, including the company name on the invoice letterhead set to
`var(--brand-surface)` on a near-black band. Email clients implement no custom
properties, so each resolves to nothing with the same silence as an undefined
one. ADR-0006's check could not see them: they are all correctly defined by the
web application. They simply travel somewhere that cannot read them.
**How to apply:** The mirror (`token`, `space`, `type`) exists for exactly these
surfaces. `printCss.ts` is deliberately exempt — it renders in a browser page.

## 2026-09-05 - The documentation tree has one index and one authority per fact

**Decision:** `docs/PLATFORM-CONSTITUTION.md` indexes the tree and restates none
of it. `audit:docs` enforces the mechanical part: named files exist, gate counts
beside `npm run verify` are current, every document is reachable.
**Why:** `design-system.md` said the merge gate had eight gates while it ran
ten — correct when written, which is why nobody re-read it. Thirteen documents
named files that had moved or been deleted. Twenty-six had no inbound reference
at all.
**How to apply:** Two of the audit's own rules were wrong before they were
right, and both failures are recorded in the file: the first draft checked
Markdown links in a repository that uses none, and reported clean on zero
targets; the second matched historical narration and reported five findings
against documentation that was correct. A rule that fires on the wrong thing is
as useless as one that fires on nothing.

## 2026-09-05 - A domain is an identity, not a routing hint

**Decision:** ADR-0008. One record per public host in
`packages/config/domains.ts`; metadata, route availability, languages, legal
chrome, robots and sitemap are all derived from it. `apps/web/lib/host/` is
deleted.
**Why:** A host resolved to four facts, and everything else about a domain was
decided downstream by code written when there was only one site. RC1 measured
the result: nine product domains served the consultancy's title, social card
and canonical URL; their robots.txt named the consultancy as their host; all
fifteen consultancy pages answered 200 on every one of them, chrome-less, with
the contact form that collects personal data carrying no Impressum link and no
links at all; and two domains served English product copy inside German page
furniture. Five symptoms, one missing concept.
**How to apply:** Nothing outside the registry names a domain. `check:domains`
is gate 2 and checks the registry against the repository, because a registry
that can lie is worse than no registry.

## 2026-09-05 - The registry declares the languages a domain has, not the ones it wants

**Decision:** `languages` on a domain record is the set the middleware will
serve. `publishers24.org` and `drive24.live` declare `['en']`; `/de` redirects
to `/`, the locale switcher does not render, and no hreflang is published for a
language the domain redirects away from.
**Why:** `pickLocale` returns the English value whenever the German one is
absent, silently, field by field. PublishingOS has German for 1 of 16 localised
fields and Drive24 for none. There is no point after rendering at which a
mixed-language page can be detected — the fallback leaves no trace — so the only
place to prevent one is before it is built.
**How to apply:** When the German copy is written, add `'de'` to one array. The
domain audit fails the build if that array claims a language the product does
not have.

## 2026-09-05 - Chrome belongs to the domain, not to one page on it

**Decision:** ProductNav and ProductFooter moved out of `LandingEngine` into
`ShowcaseChrome`, rendered from `app/[locale]/layout.tsx`.
**Why:** They lived inside the landing page, which renders only at the domain's
root, while the locale layout suppressed all Maxpromo chrome on a showcase
host. Every other page a product domain served therefore had no navigation and
no footer — including `/contact`, the destination of every call to action,
which collected a name, a company, an email address and a telephone number and
contained no links whatsoever. §5 DDG and Article 13 GDPR both attach at the
point of collection.
**How to apply:** Anything every page on a domain must wear lives in the layout,
not in a page component.

## 2026-09-06 - Nothing fails silently

**Decision:** ADR-0010. One logging standard, error boundaries at both levels
in both applications, a correlation id on every response, `/api/health` in one
shape, performance budgets with a gate, and a Lighthouse baseline across every
public domain.
**Why:** The platform's most common way of failing was to say nothing. No error
boundary anywhere; 77 `console.*` calls with no shared shape; 37 `catch {}`
blocks that swallow; no health endpoint on the application serving ten domains;
eight security advisories surfaced by nothing.
**How to apply:** A check that cannot see something must say so rather than
report clean — the dependency audit prints ADVISORIES: UNKNOWN when it cannot
run `npm audit`, and the Lighthouse harness refuses a dev server rather than
recording a meaningless score.

## 2026-09-06 - A number nobody can defend is not a budget

**Decision:** Every entry in `packages/config/budgets.ts` carries three numbers
and a sentence: what it measured when written, what it may become, and what it
protects. `measured` is never edited to make a check pass; raising a `limit` is
a decision for the change log.
**Why:** A budget pinned to today's value fails on the next legitimate change
and gets raised without thought, which is how a budget becomes a formality. The
headroom is the space a real change may take; crossing it should be a decision.
**How to apply:** The Lighthouse floors were set to industry norms and six
domains fall below them on mobile. That gap is the finding — lowering the floor
would have made the check incapable of saying anything, which is ADR-0004's
definition of a rule that cannot fail.

## 2026-09-06 - An advisory is blocked or accepted, never ignored

**Decision:** ADR-0011. `audit:dependencies` blocks a release on a CRITICAL
advisory reaching production, and on a HIGH one unless
`packages/config/security.ts` carries a live acceptance naming the exposure, the
mitigation, an owner and a review date.
**Why:** "Fail on any advisory" would have blocked this platform on four
development-only findings in a deprecated transitive of a migration CLI, whose
only published fix is a downgrade. A gate that fires on something nobody can fix
is a gate people route around, and that converts a real signal into a habit of
ignoring one.
**How to apply:** Reach is computed by walking npm's `effects` graph up to the
direct dependency and reading *its* section — the vulnerable package has none of
its own. A root that cannot be identified counts as production.

## 2026-09-06 - The smallest secure version is not always the one to ship

**Decision:** `next` went to 16.3.4, not to 16.3.0, and the reason is written
down. 16.3.0 is the smallest version clearing all three HIGH findings — it is
where the pinned postcss becomes 8.5.23 and sharp becomes ^0.35.3. 16.3.4 is the
same minor with four patch releases of fixes and no additional feature surface.
**Why:** Shipping the `.0` of a minor to ten production domains is the larger
risk. "Smallest secure" should not be read as "least tested".
**How to apply:** State the security minimum and the shipped version separately,
so the gap is a decision someone can disagree with rather than a number nobody
questioned.

## 2026-09-06 - Track A is certified at a tag, and closed only by production

**Decision:** `track-a-foundation-v15.1` records the certified foundation.
Track A's *status* is CERTIFIED, NOT CLOSED, until the release is verified in
production.
**Why:** A foundation that has only ever run on a laptop is not a foundation
anything should be built on. Production is four sprints behind and still serves
the two RC1 blockers this release fixes; calling Track A closed before that
changes would be recording an outcome that has not happened.
**How to apply:** The freeze rules (constitution §24c) take effect at closure.
Until then the tag is the checkpoint and `deployment/track-a-release.md` is the
path.

## 2026-09-06 - Four sprints, one commit, and the reason said out loud

**Decision:** v13.0 through v15.1 are recorded as a single commit rather than
reconstructed into four.
**Why:** They were developed as one uncommitted stream. Splitting them
afterwards would produce intermediate commits that never existed and were never
individually certified — traceability that reads better and is less true.
**How to apply:** Commit at the end of a sprint. Four sprints of uncommitted
work is how a repository ends up unable to describe its own history honestly.


---

## 2026-09-06 — Merge a release branch to `main` with `--no-ff`

**Decision:** Track A was merged to `main` as a merge commit, not fast-forwarded.

**Why:** `apps/web/vercel.json` gates the build on
`git diff --quiet HEAD^ HEAD -- ../../apps/web ../../packages`. The certified
commit is docs-only, so after a fast-forward that diff is empty and Vercel
skips the production build — leaving production on the old commit while the
merge reports success. A merge commit's first parent is the previous production
commit, so the diff spans the whole release.

Verified before merging by simulating both diffs, and confirmed independently:
the git-triggered preview of the docs-only commit was recorded `CANCELED`.

**How to apply:** Any release whose final commit touches only `docs/` must be
merged with `--no-ff`, or the pipeline will skip it. Check
`main^{tree}` against the release tag's tree afterwards — a `--no-ff` merge
must change no content.

---

## 2026-09-06 — Scan history for secrets before a first push to a public remote

**Decision:** Before pushing 78 previously-unpublished commits to the public
`buddy1974/maxpromo.digital`, every object in the push was scanned for secret
material — 2,312 blobs, 80.5 MB, ten patterns.

**Why:** History contained 1,007 committed `.next` build blobs. Build output can
carry inlined configuration, and a push to a public repository cannot be taken
back. The scan self-tests every pattern against canary input first and refuses
to report clean if it read nothing — a secret scanner that matches nothing
because its patterns are broken is worse than no scanner, because it grants
confidence.

**Result:** the only matches were the Neon driver's own error-message template
and `.env.example` placeholders. Nothing real.

**How to apply:** Any first push of accumulated history to a public remote gets
this treatment. `git log` is not evidence about what is in the objects.
