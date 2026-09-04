# ADR-0004 — A check that cannot find its input must fail

**Status:** Accepted
**Date:** 2026-09-04

---

## Context

This platform's automated checks have now silently passed **four** times. Each
time, the tool reported success while examining nothing, and each time the
failure was found by accident rather than by the tool:

1. **Allowlist regexes written with `[\/]`** matched nothing on Windows. The
   allowlist silently did nothing; the check happened to still pass, so the
   defect was invisible until a legitimate entry failed to be honoured.

2. **The token check run from the workspace root** resolved `app/`,
   `components/` and `lib/` relative to the current directory, found none of
   them after the applications moved down a level, scanned zero files, and
   printed *clean*.

3. **Agent Bureau's ESLint** had been doing nothing for an unknown period — a
   legacy `.eslintrc.json` that ESLint 9 cannot read, invoked through
   `next lint`, which Next 16 removed. Exit code zero, no output, no errors.

4. **The token check's comment skipping** used a line-by-line `inBlock` flag
   that tested for a block-comment opener *before* testing whether the line was
   an ordinary `//` comment. A line comment containing a path glob —
   `messages/*.json` — read as opening a block comment that never closed, and
   every subsequent line in the file went unscanned. The check reported clean
   while examining roughly half of one of the largest components on the
   homepage. Three real contrast failures were living in the unscanned half.

A fifth was caught during authoring rather than in production: the first draft
of the WCAG 4.1.3 rule in `audit-a11y.mjs` had `\b` written into its pattern as
a literal backspace byte, so it matched `<form` followed by U+0008 and therefore
nothing at all.

The pattern is identical every time, and it is the dangerous one. **The tool
does not fail. It succeeds, while checking nothing.** A red build gets fixed
within the hour; a green build that verified nothing can persist for months and
actively suppresses the suspicion that would otherwise find the defect.

## Decision

Every check in `packages/tooling/` must satisfy all four:

1. **Resolve its scan targets explicitly and print the count.** Never rely on
   the current working directory.

2. **Exit non-zero if it resolves zero targets.** The message says so plainly:
   *"Refusing to report clean without having checked anything."*

3. **Parse, do not pattern-match, when tracking state.** Comment and string
   state is handled by `packages/tooling/strip-comments.mjs`, which walks
   characters and tracks string and template-literal state, so a delimiter
   inside a string or a `//` inside a URL cannot change the comment state. Its
   recovery rule matters as much as its parsing: an unterminated quote resets at
   the newline rather than swallowing the remainder of the file.

4. **Be demonstrated to fire before it is believed.** A new rule must be
   observed producing findings on the real codebase, and then producing none
   after the fix. A rule that has only ever printed *clean* has not been tested;
   it has been assumed.

## Consequences

**Good.** The class of failure that has cost this platform the most is the one
now hardest to reintroduce.

**Cost.** Rule (4) means a new check cannot be written and committed in one
motion — it has to be watched failing first. This is slower and it is the whole
value of the ADR.

**Residual risk.** `strip-comments.mjs` does not model regular-expression
literals. A `/*` inside a regex could still open a comment span. This would
cause a **false positive**, not a silent pass, so it fails in the safe
direction; it is recorded here rather than fixed speculatively.
