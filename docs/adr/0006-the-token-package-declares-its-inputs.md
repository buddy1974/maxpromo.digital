# ADR-0006 — The token package declares its inputs, and the build checks them

**Status:** Accepted
**Date:** 2026-09-04

---

## Context

`@maxpromo/design-tokens` is deliberately dependency-free, so that any
repository can adopt the brand by importing one stylesheet. That also means it
cannot load a webfont. It names one instead:

```css
--brand-font-sans: var(--font-inter), ui-sans-serif, system-ui, ...;
--brand-font-mono: var(--font-roboto-mono), ui-monospace, ...;
```

and each application is expected to define `--font-inter` and
`--font-roboto-mono` — in Next, by passing `variable: '--font-inter'` to
next/font.

`apps/web` did. **`apps/bureau` never did.** It loaded Inter as `--font-sans`
and JetBrains Mono as `--font-mono`, neither of which is a name the token
package reads.

Nothing failed. An undefined custom property inside `var()` does not warn, does
not log, and does not break a build — it falls through to the rest of the list.
So every `--brand-font-sans` in Agent Bureau resolved to `ui-sans-serif`:
**Agent Bureau rendered in Segoe UI on Windows while maxpromo.digital rendered
in Inter**, and both of the webfonts Agent Bureau downloaded sat unused in its
bundle.

This survived a design system, a repository consolidation, a brand migration
and six audits.

## Why nothing caught it

Each check was looking at the wrong level.

- **`check-design-tokens`** asks whether a colour is hardcoded. A font stack
  contains no colour and no hex.
- **`audit-consistency`** compares both applications' resolved token *values*,
  and passed: both declare
  `--brand-font-sans: var(--font-inter), ui-sans-serif, ...`, character for
  character. It compared the declaration; the divergence was in the resolution.
- **Review** looked at one application at a time, and each was internally
  consistent — the same blind spot ADR-0003 records for the icon vocabulary.
- **The browser** rendered a perfectly reasonable typeface.

The general shape: **a contract between a package and its consumers, with no
party responsible for checking it.** The package cannot verify that a consumer
defines the variable; the consumer does not know the package needs it.

## Decision

**A package that reads a variable it does not define has declared an input, and
the build verifies that every application supplies it.**

`packages/tooling/check-token-inputs.mjs`, the second gate in `npm run verify`:

1. Reads `brand.css` and collects every custom property it *references* but
   does not *define*. That set is the contract. It is derived, never
   hand-maintained, so a new input is covered the moment it is written.
2. Requires each application under `apps/` to define each one — as a CSS
   declaration, or as a `variable:` binding, which is how next/font produces
   one.
3. Refuses to report clean if it finds zero inputs, zero applications, or
   cannot read the token package (ADR-0004).

Agent Bureau now loads Inter as `--font-inter` and Roboto Mono as
`--font-roboto-mono` — the same faces as the website.

## Consequences

**Good.** The contract is stated by construction rather than by convention, and
a package can safely name a variable it cannot itself provide.

**Cost.** The definition test is deliberately literal: a CSS declaration or a
`variable:` binding. A framework that produces custom properties some other way
would need a case added. That is a known limit, and better than a regex
pretending to understand every binding syntax.

**Method note.** The first draft built its pattern with `new RegExp` over a
template literal, and a JavaScript template literal eats the backslash in `\s`
before RegExp ever sees it. The pattern matched nothing, and the check reported
both applications broken while one of them was correct. That is the third time
in this repository an escape has died between the source and the pattern — see
ADR-0004's Windows-only allowlist regex and its literal backspace byte — and it
was caught only because rule (4) requires watching a rule fire and then stop
firing. The matcher is now written with string comparison, which has no escapes
to eat.
