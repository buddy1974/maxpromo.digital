# Decision Log

## 2026-07-10 — Build on existing uncommitted product-page WIP rather than discard it

**Decision:** The 7 generic product pages and `messages/*.json` had pre-existing uncommitted changes using a client-side `useLocale()` pattern flagged as architecturally wrong by the sprint brief. Rather than `git stash` and rewrite from scratch, the existing bilingual copy was kept and the pages were refactored in place to the server `params.locale` pattern (matching `taxkontrol/page.tsx`).
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

