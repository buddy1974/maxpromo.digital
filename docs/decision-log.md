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
