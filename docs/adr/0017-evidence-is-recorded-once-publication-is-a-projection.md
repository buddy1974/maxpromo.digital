# ADR-0017 — Evidence is recorded once; publication is a projection of it

**Status:** accepted · 2026-09-20 · Marcel
**Supersedes:** nothing. **Related:** ADR-0007 (a claim is checked like a
token), ADR-0015 (a gate protects a class), ADR-0016 (the site is an
acquisition system), and the audit this decides on,
`docs/research/evidence-inventory-2026.md`.

---

## Context

Every surface that describes a delivered project describes it from a different
place, and none of those places is the project.

The narrative lives in the i18n catalogue as `caseStudies.cs1b1` and its
siblings: facts about what a system did, stored as translatable interface copy.
`apps/web/lib/work-entries.ts` decides which of those message keys the Work page
may render. `packages/config/claims.ts` decides which figures may persuade. The
demo registry knows about demonstrations and nothing about the projects they
would demonstrate. The product registry describes eleven products, nine of which
this repository cannot establish exist.

Nobody wrote any of that badly. Each file solved the problem in front of it. The
consequence is structural: there is no single place where *what do we actually
know about this project* is written down, so every surface answers it
independently, from memory, and the answers drift.

They did drift. The same client saving was published as euros on the homepage
and pounds on the case studies at the same time, differing by seventeen per
cent, for long enough that ADR-0007 had to be written about it. Four figures
reached the homepage with no artefact behind any of them, and the reason nobody
noticed is that no file existed whose job was to say what backed them.

Phase B1.1 stopped the bleeding by recording claim *status* and enforcing it.
That is the right rule and it is not a source of truth: it says which sentences
may not be published, not what the company knows.

---

## Decision

**Evidence is recorded once, per project, in a proof package. Everything
published is a projection of what that evidence and the relevant permissions
allow.**

`packages/config/proof.ts` holds the packages. A package records what the
system does, what establishes each statement, what the company does not know,
what media would have to be captured, and what anybody has agreed to.

Three things are kept apart that are routinely confused:

**What is claimed** — a *kind*: a system fact, a process fact, a qualitative
outcome, a quantitative outcome, a customer attribution, a testimonial, a piece
of media.

**What establishes it** — a *basis*: this repository, an artefact, system data,
the owner's word, the client's word, a measurement, a historical claim, or
nothing.

**What is permitted** — eight separate permissions, because agreeing to be named
is not agreeing to a screenshot, and agreeing to a screenshot is not agreeing to
a figure about your costs.

`mayPublish()` is the single function that combines them. No page decides for
itself. The rules that matter:

- A **system fact** is public when the repository proves it, and private
  otherwise, because anything else is somebody's account of the software rather
  than the software.
- A **quantitative outcome** is public only when the basis is `measured`. This
  is the rule the company adopted on 2026-09-20, applied at the source rather
  than at the page.
- A **qualitative outcome** may rest on attestation, because it claims less.
- **Permission is checked before evidence**, and `unknown` is treated exactly as
  `denied`. The difference between "they said no" and "nobody asked" does not
  matter to the person whose information it is.

`check:proof` enforces the invariants that are mechanical, and was proved red on
each of them before being accepted.

---

## What this does not say

**It does not replace the claims registry.** `claims.ts` is protecting live
production and continues to. The two are different views of one subject: a claim
record is the *enforcement* view, keyed by message key, of a fact whose
*provenance* belongs in a proof package. They are linked by reference through
`relatedClaims`, never by copying text between them, and the blocking gate is
not weakened at any point to make the architecture tidier.

**It does not migrate the Work page.** Work reads `work-entries.ts`, which reads
message keys. That works, it is accepted, and rewriting it to consume
projections would risk a live commercial page for an internal improvement. The
migration contract is recorded in the standards; the code moves in B3 or later,
behind the same gates.

**It does not touch the historical case studies.** They are a record of what the
company said, they intentionally preserve unresolved claims, and forcing them
into a model built years later would destroy the thing that makes them useful.
Future evidence-backed case studies derive from packages; the historical three
stay where they are. Two categories, one boundary, written down rather than
blurred.

**It does not make anything public.** No projection is built in this phase. A
package with nine publishable statements has published none of them.

**It is not a content management system.** No dashboard, no editor, no database,
no service. A developer opens one file and reads what happened, what proves it,
what is missing and what may be said. If it ever needs a UI to be usable, it has
become the wrong thing.

---

## Consequences

A derived surface may never state a fact that is not in a package. That is the
rule any future generation step inherits, and it is the point of the whole
arrangement: the reason to record evidence once is so that everything downstream
can be checked against it mechanically.

Missing evidence becomes visible instead of being filled in. The first package
records three open questions, including one nobody in this repository can
answer, and it is complete with them unanswered.

Writing a package for client work will be harder than writing one for our own
system, because eight permissions will be `unknown` and almost nothing will be
publishable. That is the model working. The discomfort is information.

Two registries describe projects until the migration finishes. That is a real
cost, taken deliberately, and the alternative was weakening a gate that is
currently protecting production.
