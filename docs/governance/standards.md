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
| 1 | **Design token audit** | Hex literals, raw Tailwind palette classes, rgba literals, and the brand accent used as a text colour — anywhere outside the token package |
| 2 | **TypeScript** | `tsc --noEmit` in every workspace |
| 3 | **ESLint** | Zero errors in every workspace. Warnings are allowed; errors are not |
| 4 | **Production build** | Every application builds |

The token audit runs first on purpose: it is the fastest and it catches the
class of regression this platform has had most often.

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

**Typography.** One scale, one family. Hierarchy comes from weight, size and
composition — never from a second typeface. Headings and paragraphs carry a
measure; no call site sets its own.

**Spacing.** Three section rhythms. A section not using one of them fails
review.

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
