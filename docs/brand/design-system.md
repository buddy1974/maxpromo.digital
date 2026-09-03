# Design System

One system. Everything inherits from `@maxpromo/design-tokens`. There are no
copies, and the build fails if a colour appears outside it.

---

## Palette

**Official brand colours.** These are the brand and do not change.

| | Hex | Role |
|---|---|---|
| Brand Black | `#111111` | Text, inverted surfaces. Carries the message. |
| Brand Lime | `#A3E635` | The accent. A FILL. |
| Dark Green | `#65A30D` | Hover fill, and the button's perceivable edge. |
| Light Surface | `#F7FEE7` | Tinted callouts and badge backgrounds. Not a section wash. |
| White | `#FFFFFF` | Page and card surfaces. |

**Derived ramp.** The five above cannot express an accessible interface on
their own, so the token file adds what they need to function. The most
important derivation is `#4D7C0F` — 5.00:1 on white — because neither Brand
Lime (1.51:1) nor Dark Green (3.08:1) can legally be body text.

---

## The three rules

**1. The accent has exactly three jobs.**
Primary action fill; active or current state; at most one emphasis mark per
page. Forbidden as: section background, card border, icon fill, label text,
body link, badge, divider, hover background, table header, chart fill.
Target: under 2% of viewport pixels, at most three instances above the fold.

**2. The accent is a fill, never a text colour.**
Brand Lime on white measures 1.51:1 — invisible. Text *on* the accent is black
(12.52:1), never white. Where an accent text colour is genuinely wanted,
`--brand-primary-text` measures 5.00:1. This has regressed three times through
three different syntaxes, so the build now checks for it.

**3. Brand colours are never semantic colours.**
Identity and meaning are separate namespaces: `--brand-*` and `--semantic-*`.
Success is blue-shifted emerald precisely so it cannot be read as the green
brand.

---

## Typography

One neutral grotesque. Hierarchy from weight, size and composition — never
from a second typeface.

| Role | Size | Weight |
|---|---|---|
| H1 | 32 → 52px | 600 |
| H2 | 26 → 36px | 600 |
| H3 | 20 → 24px | 600 |
| Body | 17px / 1.7 | 400 |
| Label | 13px uppercase | 500 |

Headings cap at 22 characters and paragraphs at 68, set on the element rather
than at each call site. Mono is for code, data tables and document reference
numbers — it is not a label face.

The scale was reduced twice. A page that shouts is the clearest startup tell,
and 64px headings are landing-page size.

---

## Spacing

Three section rhythms and nothing else: `--section-y-compact` (48→72),
`--section-y` (64→112), `--section-y-feature` (80→160). A section not using one
of them fails review.

---

## Retired, and not to be reintroduced

The `//` label motif · split-colour headlines · marketing pills and badges ·
emoji in interface chrome · decorative gradients and glows · tick lists ·
oversized icon tiles · drop shadows as decoration · the orange accent ·
Space Grotesk.

Each was removed for a stated reason recorded in `docs/history/`. Reintroducing
one is a decision, not a detail.

---

## Enforcement

`npm run check:tokens`. It scans every application and shared package for hex
literals, raw Tailwind palette classes, rgba literals and accent-as-text, and
exits non-zero rather than reporting clean when it finds no targets — because
a check that silently scans nothing is worse than no check, and that has
happened here.
