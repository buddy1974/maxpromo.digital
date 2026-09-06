# ADR-0003 — One icon set, drawn not typed

**Status:** Accepted
**Date:** 2026-09-04
**Supersedes:** nothing. Codifies a decision that had never been made.

---

## Context

An audit of both applications found **36 distinct Unicode marks** used as icons
across **68 files** — geometric shapes, dingbats, arrows and box drawing, mixed
freely.

Inconsistent stroke weight was the visible symptom. The real problem was
semantic. Three navigations had each invented a vocabulary, independently, and
the vocabularies disagreed:

| mark | internal OS | Agent Bureau |
|---|---|---|
| ❖ | Clients | Operating Model |
| ▤ | Invoices | Briefing |
| ▦ | Angebote | Aufgaben |
| ◉ | Jobs | Audit Console |
| ◷ | Inbox | Warteraum |
| ▥ | Newsletter | Research |

Six marks carrying twelve meanings, in two applications of one platform that a
user is expected to move between. This is invisible in a screenshot of either
application and invisible in review of either registry, because each registry is
internally consistent. Only a cross-application comparison surfaces it — which
is the same argument that produced `audit-consistency.mjs`.

There was a second, quieter problem. A glyph is drawn by whichever font on the
user's machine happens to cover that codepoint. `⊟`, `◰`, `⚐` and `❑` have thin
coverage on Windows and Android, where they fall back to a different face at a
different weight and optical size — or to a replacement box. The platform's
visual consistency was, for those marks, a property of the reviewer's laptop.

## Decision

**One SVG icon set, in `packages/ui/primitives/Icon.tsx`.**

- Stroke only, never fill. `1.5px` at every size, round caps and joins.
- `currentColor`, always. An icon inherits its context and can never introduce
  a colour — which is also why an icon cannot regress the accent-as-text rule.
- Four sizes and no others: 14, 16, 20, 24. Every path drawn on the same 24×24
  grid, so stroke weight is optically equal across the set.
- Decorative by default: `aria-hidden` unless given a `label`. An icon beside
  its own text label must stay silent, or a screen reader announces the label
  twice. `label` makes it a `role="img"` with a title, for the icon that is the
  entire content of a control.

**Icons are named, not drawn, at the call site.** A navigation entry says
`icon: 'invoice'`. Two entries can now share an icon only by naming the same
one, which is visible in review — the collision above cannot be reintroduced
silently.

**Labels are text.** Copy does not carry marks. Whether a label gets an icon,
which icon, and at what size is a decision for the component that renders it —
not something frozen into a translation string, where it cannot inherit colour,
cannot respond to context, and has to be translated alongside the words.

## What remains typographic

The rule distinguishes typography from iconography rather than banning a
character range. An arrow inside a line of text — "Back to home →" — sets with
the text, inherits its colour and size, and is not pretending to be an icon. So
`→` and `←` stay, along with the real minus sign `−` in currency amounts, the
comparators in prose, and the box drawing that renders the monospace org tree.

## Enforcement

`packages/tooling/check-icons.mjs`, the second gate in `npm run verify`. It
refuses to report clean if it resolves zero scan targets. Two files are
allowlisted with a stated reason — a system prompt's section rules, and the
extraction prompt that has to name the decorations it tells the model to strip.
Neither is ever rendered.

## Consequences

**Good.** One visual language across three navigations. Identical rendering on
every platform. An icon can never introduce a colour. Adding an icon is a
deliberate act — a path on the grid — rather than reaching for whichever
character looks close enough.

**Cost.** `Icon.tsx` is ~360 lines and will grow. Every new icon is a small
design decision that has to be made rather than improvised. That is the point,
but it is real friction and it should be acknowledged rather than discovered.

**Not addressed.** The icon set is not audited for cultural legibility, and the
paths are hand-drawn rather than taken from an established library. If the set
grows past roughly fifty icons, adopting a licensed set and mapping names onto
it becomes the better trade.
