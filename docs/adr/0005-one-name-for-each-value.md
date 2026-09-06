# ADR-0005 — One name for each value

**Status:** Accepted
**Date:** 2026-09-04
**Supersedes:** the "legacy aliases" block introduced in v4.0 batch B3

---

## Context

The v4.0 design-system rewrite moved every colour, size and space into
`packages/design-tokens`. Roughly 1100 call sites referenced the previous
`--color-*` names, so rather than rewrite them, the application stylesheet
repointed the old names at the new tokens:

```css
:root {
  --color-bg:         var(--brand-background);
  --color-bg-section: var(--brand-surface-subtle);
  --radius-card:      var(--radius-lg);
  /* ... twenty-four in all */
}
```

The comment above it said the block would "shrink over time" as call sites
migrated opportunistically.

**It did not shrink. It grew.** A year later the aliases had 507 call sites,
and new code was still being written against them, because both names resolved
and nothing marked either as the wrong one. The homepage carried both in the
same style object:

```tsx
<section style={{ background: 'var(--color-bg)',                 /* alias */
                  borderTop: '1px solid var(--brand-border)' }}>  /* token */
```

Three costs, in increasing order of seriousness.

**It made review harder.** Two names for one value means a reviewer cannot tell
by reading whether two declarations are the same colour.

**It hid the accent.** The v7.0 token audit found fifteen contrast failures
behind `const ORANGE = 'var(--color-primary)'` — an alias of an alias, still
named for a colour retired two brand generations earlier. The rule matched the
token at the point of use and walked straight past the binding.

**It duplicated the thing this platform has most expensively duplicated.** The
governance rule is "never two implementations", written after two design
systems, two token files and eleven status maps. An alias layer is two token
files with extra steps.

## Decision

**One name for each value. No aliases, no compatibility layer.**

- All 507 call sites were migrated to the token names. The alias block is
  deleted.
- `@theme` declares only what a Tailwind *utility* needs — in `apps/web`, three
  font names, because `font-sans`, `font-mono` and `font-display` are the only
  type utilities in use. Colours, sizes and spacing are referenced as tokens.
- Where Tailwind forces a duplicate — a utility exists only if its theme key is
  declared in the application, and a key cannot reference the token it shadows
  — the value is repeated with a comment naming the constraint, and
  `audit-consistency` compares both applications' resolved values.

**A migration that leaves the old name working is not a migration.** It is two
systems and a stated intention. If a rename is worth doing, the call sites are
rewritten in the same change; if they are not worth rewriting, the rename is
not worth doing.

## Consequences

**Good.** A value has one name, so two declarations of the same colour read as
the same colour. The class of defect where a rule matches a token but not its
alias cannot recur, because there is no alias.

**Cost.** The migration touched 52 files in one commit, which is a large diff
to review. It was mechanical and gated by the full audit suite, but a large
mechanical diff can hide a small deliberate one, and this one should be read
with that in mind.

**Residual.** `apps/bureau` still maps Tailwind theme names onto tokens
(`--color-ink: var(--brand-text)`). That is a framework binding, not a second
system: the names generate utilities and each resolves to exactly one token.
The line between the two is whether a name can drift from its value, and a
`var()` reference cannot.
