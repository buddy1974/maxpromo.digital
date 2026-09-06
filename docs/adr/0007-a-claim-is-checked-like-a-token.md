# ADR-0007 — A claim is checked like a token, but never corrected like one

**Status:** Accepted
**Date:** 2026-09-04

---

## Context

The case-studies page opens with the strongest promise on the site:

> Each of these ran in production. Where a number appears, it came from the
> system rather than from an estimate. Where we cannot evidence something, it
> is not here.

A page that invites that scrutiny has to survive it. Two things had gone wrong
underneath it, and neither is visible from any single string — which is why
reading the copy, in either language, found neither:

**The same figure, two currencies.** A claimed client saving appears as
`€14k/mo` on the homepage and `£14,000/month` on the case-studies page, in both
locales. No reader sees both at once; the site simply disagrees with itself
about a client outcome, and the German page quotes pounds sterling to German
SMEs.

**Results that hedge.** "Cash flow improved by approximately 18 days per
quarter." "Client satisfaction scores increased significantly." Both sit under
a promise that numbers come from systems rather than estimates. A hedge in a
result is an estimate wearing a result's clothes.

The platform already treats colour, iconography, type and spacing as things
too important to leave to memory. A public claim about a client outcome carries
more risk than any of them, and was the only one nothing checked.

## Decision

**Claims are audited. Claims are not auto-corrected.**

`packages/tooling/audit-claims.mjs` reads the message catalogues and reports:

1. **Currency disagreement** — the same magnitude carrying more than one
   currency symbol anywhere in the catalogues. Magnitudes are normalised, so
   `14k`, `14.000` and `14,000` compare equal and the German and English
   number formats do not hide the conflict.

2. **A result stated as an estimate** — a hedge word in a string whose key
   presents it as an outcome (`result`, `headline`, `metric`, `proof`,
   `outcome`). Hedges are fine in a *situation*: "over 60% of staff time"
   describes the problem a client arrived with. They are not fine in a result,
   which is a statement about delivered work.

**It reports and never rewrites**, and it is in `certify` rather than `verify`,
alongside `audit-platform` — the other check that reports and never edits.
The reasoning is the same in both cases and it is the important half of this
record: **resolving a claim requires knowing something about delivered work
that a tool cannot know.** Choosing a currency changes a stated client saving
by seventeen per cent. Deciding whether a figure is a result or an
illustration states something about what was delivered. A tool that "fixed"
either would be inventing a fact about a client, which is worse than the
inconsistency it removed.

`--strict` makes it fail, for use once the findings have been answered.

## Consequences

**Good.** The class of defect where two pages disagree about a client outcome
is now visible in one command instead of requiring somebody to hold both pages
in their head. It found five instances immediately, symmetric across both
locales.

**Cost.** The check will stay non-zero until a human answers its findings, so
it cannot join `verify` without blocking every merge on a business question.
That is the correct trade and it is why the report-only tier exists.

**Method note.** The hedge rule fired on "Client satisfaction scores increased
significantly" and not on its German twin, "Kundenzufriedenheit deutlich
gestiegen" — the stem list was built from infinitives (`steig`) and German puts
the change in the participle (`stieg`). A rule that catches one half of a
translated pair looks correct in every English review it will ever get. That is
ADR-0004's rule (4) again: watched firing, watched missing, then fixed.

**Not addressed.** The audit reads the message catalogues. Copy written inline
in a component — the Agent Bureau homepage section, the landing engine's
registry — is outside it. Those surfaces carry no numeric client claims today;
if one is added there, this check will not see it.
