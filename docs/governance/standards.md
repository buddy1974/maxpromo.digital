# Platform Standards

Every change to this repository must satisfy this document before it merges.
It is enforced in CI, not by memory — see `.github/workflows/verify.yml`.

---

## The one command

```bash
npm run verify
```

From the workspace root. It runs, in order:

| # | Gate | What it catches |
|---|---|---|
| 1 | **Design token audit** | Hex literals, raw Tailwind palette classes, rgba literals, and the brand accent used as a text colour — directly, through a conditional, aliased to a local name, or bound to a field named as text. Anywhere outside the token package |
| 2 | **Token input audit** | A custom property the token package reads that an application never defines, and any `var()` an application uses that nothing defines at all. An undefined `var()` does not warn: with a fallback it silently uses it, without one the whole declaration is dropped — see ADR-0006 |
| 3 | **Icon audit** | Any Unicode mark standing in for an icon. Typography (the CTA arrow, the real minus sign, the monospace tree) is allowed and named |
| 4 | **Responsive audit** | Every grid collapses; no fixed width exceeds a 380px viewport; no section padding outside the three rhythms |
| 5 | **Typography audit** | Any size below the 10px legibility floor, any sub-pixel size, and weight 700 above the 13px label band |
| 6 | **TypeScript** | `tsc --noEmit` in every workspace |
| 7 | **ESLint** | Zero errors in every workspace. Warnings are allowed; errors are not |
| 8 | **Production build** | Every application builds |

The static audits run first on purpose: they are the fastest and they catch the
classes of regression this platform has had most often.

### Every check must be able to fail

Six checks in this repository have silently passed — reported success while
examining nothing, or while examining the wrong thing. See **ADR-0004**. The
rules it imposes apply to anything added to `packages/tooling/`:

- Resolve scan targets explicitly and print the count.
- Exit non-zero on zero targets.
- Use `strip-comments.mjs` for comment state. Never a line-by-line flag.
- Demonstrate the rule firing on the real codebase before believing it. This is
  the one that keeps paying: three of the six were found this way, including a
  rule whose pattern contained a literal backspace byte where `` should have
  been, and a second whose escape was eaten by a template literal. Both looked
  correct in the source and matched nothing.

---

## Gates that are not automated yet

Judgement, not scripts. Required for any change with a visual or public surface.

**Accessibility.** Contrast against the token pairs, a single `h1` per page, no
heading-level skips, a `main` landmark, visible focus states, labelled form
controls. The measured baseline is 21/21 token pairs passing and 14 pages
audited clean; a change must not regress it.

**Responsive.** Every multi-column grid has a single-column state. No fixed
width at or above 380px. Checked at 390, 768, 1440 and 1920.

**Internal links.** No route added or removed without the sitemap and any
redirect updated in the same change.

**Documentation.** If a decision was made, it goes in `docs/adr/`. If a risk
was found, `docs/governance/known-risks.md`. If something shipped,
`docs/history/change-log.md`. Chat history is not a source of truth.

**Security.** No secret in the repository. No new public API route without a
rate limit and an explicit auth decision recorded. Personal data must not
change region or provider without a legal review — see the open item in
`known-risks.md`.

---

## Design rules the audit enforces

**Colour.** Components reference `--brand-*` and `--semantic-*` only. Never a
primitive, never a raw value. The allowlist in the token check is narrow and
every entry states a reason; adding to it needs a reason too.

**The accent has three jobs.** Primary action fill, active state, and at most
one emphasis mark per page. It is a fill, not a text colour: on white it
measures 1.51:1. Where an accent text colour is genuinely needed,
`--brand-primary-text` measures 5.00:1. Text on an accent fill is black.

**Brand colours are never semantic colours.** Identity and meaning are separate
namespaces, and success is deliberately blue-shifted so it cannot be read as
the green brand.

**Typography.** One scale, one family, one mono. Hierarchy comes from weight,
size and composition — never from a second typeface. Headings and paragraphs
carry a measure; no call site sets its own. Nothing below 10px. Weight 700
exists for one role — the small uppercase mono label and the numeric, at 10 to
13px, where 600 disappears — and the audit fails on 700 above that band.

**Spacing.** Three section rhythms and no fourth. A clamp-based section padding
that is not one of them fails the responsive audit. Inside a section, spacing
comes from `--space-*`.

**Motion.** Two durations and one curve, from the tokens. Never `transition:
all` — it animates layout and hides what is moving from the reader.

**Interaction.** Every `:hover` has a matching `:focus-visible`. The focus ring
from the reset is not the affordance; it sits on top of it. A state a mouse user
is shown and a keyboard user is not is a defect even when the audit passes.

**Elevation.** Four shadows, from the tokens. No coloured shadow: a glow is the
accent used as light, and the accent is a fill.

**Iconography.** One set, in `@maxpromo/ui`. Stroke only, 1.5px, currentColor,
four sizes. Icons are named at the call site, never typed as a character, and
never carried inside a translation string. See **ADR-0003**.

---

## Never two implementations

If two applications need the same thing, it lives in `packages/` and neither
keeps a copy. This is the rule the platform has broken most expensively:

- two design systems built from one brief, drifted on hover direction and
  container width
- two token files kept in sync by hand
- eleven status maps in one dashboard, differing on which amber failed contrast
- two legal identity modules disagreeing on the tax office name

A shared component that reaches into an application's own modules is not
shared, it is borrowed. Packages depend on `@maxpromo/design-tokens` and on
each other, never on an application.

---

## Deployment

Separate Vercel projects, one repository. Deploy independently, govern
together. Details in `docs/deployment/vercel.md`.

Nothing merges to `main` without `npm run verify` passing. Production deploys
are a human decision, not an automatic consequence of a merge.

---

## The audit suite

Four checks, each answering a question the others cannot.

```bash
npm run verify            # the merge gate. Runs without a server.
npm run certify           # verify + the three audits that need one.
```

`certify` needs both applications running on the ports the audits address:

```bash
npm run dev:web           # :3020
npm run dev:bureau        # :3021
```

Agent Bureau's dev script did not pin its port until v7.0 — it started on
whichever port was free, and the two live audits address `:3021` by name. A
`certify` run after a plain `npm run dev:bureau` therefore could not reach it.

| Command | Answers | In `verify`? |
|---|---|---|
| `check:tokens` | Is any colour defined outside the token package? | yes |
| `check:token-inputs` | Does every application define what the token package reads, and does every `var()` resolve? | yes |
| `check:icons` | Is any Unicode mark standing in for an icon? | yes |
| `check:responsive` | Does every grid collapse? Does anything exceed a 380px viewport? | yes |
| `audit:typography` | Is any type below the legibility floor, on a sub-pixel size, or at weight 700 above the label band? | yes |
| `audit:a11y` | Landmarks, heading order, alt text, accessible names, labels, titles — on rendered output across every public route | needs both apps running |
| `audit:consistency` | Do both applications resolve the same tokens, type scale and component classes? | needs both apps running |
| `audit:platform` | Dead code, unused assets, unused exports, dependency direction | report only |

`audit:a11y` and `audit:consistency` read **rendered HTML and emitted CSS**, not
source. That distinction matters: a landmark that exists in a layout but never
wraps the page looks correct in the source and is missing in the output, and
two stylesheets can define the same class name and resolve differently.

`audit:platform` reports and never edits. A tool that deletes what it believes
is unused will eventually be wrong about something that matters — on its first
run it flagged 19 API routes that are a working, secured data layer the
dashboard has simply not been wired to yet.
