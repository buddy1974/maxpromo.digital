# ADR-0015 — A gate protects a class of output, not a list of filenames

**Status:** accepted · 2026-09-19
**Supersedes:** nothing. **Related:** ADR-0004 (a check must be able to fail),
ADR-0010 (nothing fails silently), ADR-0005 (one name for each value).

---

## Context

`check:token-inputs` has a rule against writing a CSS custom property into
markup that leaves the browser. The reason is sound and is written down: a mail
client does not implement custom properties, so `color:var(--brand-text)` is an
invalid declaration, it is dropped, and the element inherits. The failure is
silent and looks plausible, which is why it needs a gate rather than a habit.

The rule was implemented as a list of two filenames:

```js
const NO_CUSTOM_PROPERTIES = [
  { file: /lib[\/]email\.ts$/,                  why: 'transactional email markup' },
  { file: /lib[\/]documents[\/]emailHtml\.ts$/, why: 'invoice and quotation email markup' },
]
```

Those are the two files where the defect was found the first time. They were
fixed, they are still clean, and the gate reported clean for months while the
same defect existed in three other files: thirty-eight unresolved custom
properties across the invoice email, the quotation email and the newsletter
welcome email. Rendered from real source, the invoice email emitted no
`#111111` anywhere. The body text of every invoice the company sends had no
colour of its own.

The gate did not fail to detect them. It never looked at them. A file joins the
protected set only when a person remembers to add it, and the person who
forgets is by definition the person who has just written a new email surface.

This is ADR-0004's failure mode in a different shape. ADR-0004 says a check
must be able to fail and must say so when it has checked nothing. This check
*could* fail, and it *did* check something, so both of its own guards passed
while the thing it exists to prevent was shipping.

`docs/governance/standards.md` meanwhile described the general rule, so the
documentation stated a guarantee the tooling did not provide. Anyone reading
the standard would reasonably conclude they were covered.

---

## Decision

**A gate is defined by the property that makes something dangerous, not by the
identity of the things already known to be dangerous.**

For this gate the property is: *markup that reaches the mail transport must not
reference a CSS custom property.* It is now computed:

1. **The transport is found by behaviour.** The module that posts to the mail
   API, located by that fact rather than by its path. If it moves or a second
   one appears, the gate follows it.
2. **The outbound set is its import graph, in both directions.** Upstream by
   importer, because a route that imports the transport ships its own markup.
   Downstream by import, because a module a sender pulls in to build the
   message travels too.
3. **Of those, the files containing markup are checked.**

Coverage went from two files to six, a strict superset of what it protected
before. A new route that imports the mail transport and writes
`var(--brand-text)` is in the set the moment it is saved, with nobody editing
the gate.

`TOKEN_INPUTS_LIST=1` prints the set, because a derived set cannot be audited
by reading the code that derives it.

---

## What this does not say

**It does not say enumeration is always wrong.** A list is the right shape when
the set is genuinely fixed and short, such as the applications under `apps/`.
It is the wrong shape when the set grows every time someone does normal work,
which is the case here.

**It does not say every `var()` outside a component is a defect.**
`lib/documents/printCss.ts` uses `var(--brand-surface)` and is correct: it is
injected as a `<style>` element in the browser, where custom properties
resolve. Under the old list it needed a comment explaining why it was left out.
Under the graph it needs nothing, because no mail route imports it. When
classification falls out of the architecture, the exception list gets shorter
rather than longer, and that is the test of whether the invariant was chosen
well.

**It does not claim the detector is infallible.** Two bugs in it were found
after it was written and both were found by printing the set and reading it,
not by the check going red: the import pattern forbade newlines and so could
not see a four-line import, and walking importers alone would have silently
dropped `lib/documents/emailHtml.ts` while appearing to widen coverage. A
derived set needs to be inspectable for exactly this reason.

**It does not cover every outbound surface in principle.** It covers what
reaches the mail transport. PDF generation, if it ever produces standalone
markup rather than being printed from a browser page, would need the same
treatment anchored to its own boundary.

---

## Consequences

Documentation and implementation now describe the same guarantee. The sentence
in `docs/governance/standards.md` that promised general protection is true.

Adding an outbound email surface requires no gate maintenance. Adding an
exclusion requires a reason naming who renders the file, and the exclusion list
is currently empty.

The gate reads more files than before and does an import walk per application.
It runs in the same second; if that ever stops being true, the walk is cached
per run rather than narrowed.

When a check is found to have missed a defect, the question to ask is not
"which file should be added" but "why was the file not already in scope". The
first answer keeps the gate one step behind the work forever.
