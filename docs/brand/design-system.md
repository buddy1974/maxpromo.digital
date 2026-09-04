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

One neutral grotesque — Inter — with Roboto Mono for code, data tables and
document reference numbers. Hierarchy from weight, size and composition, never
from a second typeface.

**The token package names the fonts; each application loads them.** It is
dependency-free by design, so `--brand-font-sans` is `var(--font-inter)` and
every application must define `--font-inter`. Agent Bureau did not, for a year,
and rendered in Segoe UI while the website rendered in Inter — an undefined
`var()` falls through in silence. `check-token-inputs` fails the build on it
now. See **ADR-0006**.

| Role | Token | Size | Weight |
|---|---|---|---|
| H1 | `--text-h1` | 32 → 52px | 600 |
| H2 | `--text-h2` | 26 → 36px | 600 |
| H3 | `--text-h3` | 20 → 24px | 600 |
| Lede | `--text-lede` | 19px | 400 |
| Body | `--text-body` | 17px / 1.7 | 400 |
| Small | `--text-small` | 15px | 400 |
| Label | `--text-micro` | 13px uppercase | 500 |
| Interface label | `--text-label` | 11px uppercase mono | 700 |
| Dense interface label | `--text-label-dense` | 10px uppercase mono | 700 |

The bottom two steps were added in v7.0. They were already the platform's most
used sizes — 476 of 927 declarations, fifty-one per cent — and had no name, so
the published scale described the marketing site while the product ran on two
sizes it did not contain. Their role is narrow and is not prose: the uppercase
mono label over a data table, a status badge, a dense toolbar. 10px is the
legibility floor rather than a recommendation.

**Weight 700 belongs to those two steps and nothing above them.** Its one job is
the small uppercase mono label and the numeric, where 600 disappears. A heading
at 700 is the startup voice this brief retired, and the audit fails on any 700
paired with a size above 13px.

Headings cap at 22 characters and paragraphs at 68, set on the element rather
than at each call site. Mono is for code, data tables and document reference
numbers — it is not a label face.

The scale was reduced twice. A page that shouts is the clearest startup tell,
and 64px headings are landing-page size.

---

## Spacing

Three section rhythms and nothing else: `--section-y-compact` (48→72),
`--section-y` (64→112), `--section-y-feature` (80→160). Horizontal padding is
`--section-x` (20→32).

**This is checked, not reviewed.** It was written in three documents and
enforced in none, and the site shipped five ad-hoc clamps against one token use
— two of them adjacent on the homepage, 140px of padding above a section and
112px below it, which no single screenshot shows. `audit-responsive` now fails
on a clamp-based section padding that is not one of the three.

Inside a section, spacing comes from `--space-*`. 575 declarations moved onto
it in v7.1 at identical computed values. What did not move is recorded rather
than rounded: the scale steps in eights above 16px (16, 24, 32, 48) and the
product is built at a granularity of two — 10px, 14px, 6px and 20px account for
479 of the raw values. The scale describes the marketing site and the product
runs on a finer grid, which is the same shape as the type scale before v7.0.
See known-risks 23.

---

## Radius

Six steps: `--radius-xs` (2), `--radius-sm` (4), `--radius-md` (6),
`--radius-lg` (8), `--radius-xl` (12), `--radius-full`.

`--radius-xs` was added in v7.1. 2px is the most used corner in the platform —
73 declarations, every data surface in the internal OS and the dashboards,
where 8px reads as a card — and it had no name, so twelve raw values were in
use against a scale of five: 2, 3, 4, 5, 6, 8, 9, 10 and 12px. A 3px corner
beside a 4px one beside a 5px one is not a decision anyone made.

---

## Motion

Two durations and one curve.

| Token | Value | For |
|---|---|---|
| `--duration-fast` | 120ms | a state change on a control: colour, border |
| `--duration-base` | 180ms | a surface moving: background, transform, opacity |
| `--ease` | `cubic-bezier(0.2, 0, 0.2, 1)` | everything |

Before v7.1 the platform wrote nine durations and four curves across 41
transitions — 0.15s and 150ms in the same codebase, and 0.2s, 200ms, 220ms and
0.25s all meaning about a fifth of a second. Motion that varies by 30ms between
two adjacent controls does not read as a decision.

`transition: all` is not used. It animates every property including layout, and
hides what is moving from anyone reading the component.

---

## Elevation

`--shadow-sm`, `--shadow-md`, `--shadow-lg` for surfaces that sit in the page;
`--shadow-overlay` for the few that float above it — the chat bubble and panel,
a toast.

`--shadow-overlay` exists because those three had each invented their own, and
two invented it out of the accent: a 24px Brand Lime glow at 45% on the chat
bubble, on every page, and a 36px lime halo on a showcase call to action. A
shadow with no offset is not elevation, it is light, and the accent is a fill.

---

## Retired, and not to be reintroduced

The `//` label motif · split-colour headlines · marketing pills and badges ·
emoji in interface chrome · decorative gradients and glows · tick lists ·
oversized icon tiles · drop shadows as decoration · the orange accent ·
Space Grotesk · JetBrains Mono · Unicode marks standing in for icons ·
`--color-*` alias names · headings at weight 700 · coloured glows ·
`transition: all` · hover states with no matching focus state.

Each was removed for a stated reason recorded in `docs/history/`. Reintroducing
one is a decision, not a detail.

---

## Enforcement

`npm run verify` — eight gates, five of them static audits. See
`docs/governance/standards.md` for the table.

The colour rule is `check:tokens`: hex literals, raw Tailwind palette classes,
rgba literals, and the accent used as text — including the accent reached
through a conditional (`color: open ? accent : grey`) and the accent bound to a
field named as text (`{ hoverText: accent }`), neither of which the first
version of the rule could see. Ten live contrast failures were behind those two
syntaxes, one of them on the language toggle in the header of every page.

Every check exits non-zero rather than reporting clean when it finds no targets,
because a check that silently scans nothing is worse than no check, and that has
now happened here six times. **ADR-0004.**

## One name for each value

There are no aliases. A second name for a value that already has one is not a
convenience, it is a second token file — see **ADR-0005**, and the twenty-four
aliases that were supposed to shrink and reached 507 call sites instead.
