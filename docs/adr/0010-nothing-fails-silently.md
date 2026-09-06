# ADR-0010 — Nothing fails silently

**Status:** Accepted
**Date:** 2026-09-06

---

## Context

By v14.0 the platform was governed: twelve gates, nine ADRs, three registries,
every architectural boundary enforced rather than agreed. The v14.0 scorecard
still gave **performance 1 out of 5**, and the reason was stated plainly at the
time: nothing measured it. No budget, no bundle gate, no Lighthouse run, no
field data. Fast was a belief.

Measuring it revealed that performance was not the only thing nobody could see.

**No error boundary existed in either application.** Not `error.tsx`, not
`global-error.tsx`, in an application serving ten public domains. A runtime
failure rendered the framework's default — a blank page reading *Application
error: a client-side exception has occurred* — and wrote nothing anywhere. The
visitor saw nothing useful and the platform learned nothing.

**Seventy-seven `console.*` calls, each deciding for itself what to say.**
Fifty-seven of them `console.error`. Not one carried a correlation id, a
surface, or a severity anything could filter on. On a platform where one
deployment answers ten domains, a log line that does not say which domain it
came from cannot be acted on.

**Thirty-seven `catch {}` blocks swallow their error entirely.** The platform's
most common way of failing was to say nothing at all.

**No health endpoint in `apps/web`.** `apps/bureau` had three status endpoints
of three different shapes, none of them answerable by a monitor. There was no
way to ask whether the platform was up that did not involve opening a browser.

**Eight open security advisories, four of them HIGH**, surfaced by nothing —
including one in `next` for HTTP request smuggling *in rewrites*, on a platform
whose entire host architecture is built on middleware rewrites.

Each of these is the same defect: something important that could change without
anyone noticing.

## Decision

**Nothing fails silently. Everything important is measurable.**

Four contracts, one package, two new checks.

**`packages/observability`** holds the contracts: a logger whose type will not
compile without a surface, a health-check runner with three states and a
timeout, and a redactor applied by the logger rather than by the caller.
Dependency-free, emitting to stdout.

**Error boundaries in both applications**, at both levels.
`global-error.tsx` takes its colours from the token package's TypeScript
mirror rather than from `var(--brand-*)`: it renders when the root layout has
failed, so the stylesheet defining those properties may never have loaded,
while the mirror is a plain object in the same chunk as the component. Same
values, no stylesheet dependency, no exception to the rule that nothing here
writes a colour.

**A correlation id on every response.** `x-mp-trace`, minted in the middleware —
the one place every request passes through — honoured if inbound, and stamped
on every response path.

**`/api/health` on both applications**, in one shape, unauthenticated, with
three states. `degraded` is the state that matters: a database answering in
four seconds is not down, and calling it `ok` is how an outage becomes a
surprise. Two probes deliberately do not call what they check, because a probe
that costs money per invocation is a probe that gets switched off.

**`packages/config/budgets.ts`** — the numbers, each with what it measured on
the day it was written, what it may become, and what it protects.
`check:budgets` is gate 12, running after `build` because there is nothing to
measure before it.

**`audit:lighthouse`** measures every public domain, desktop and mobile,
against a production build. Not a gate: its performance score moves with
whatever else the machine was doing.

**`audit:dependencies`** reports advisories and never acts on them.

## Consequences

**Twenty real measurements exist** where there were none. Desktop performance
is 100 on all nine product domains; mobile is 79–90, with six domains below the
85 floor and a mobile LCP of about 3.4 seconds on every one of them —
structural, not per-product.

**Two of the three sub-100 Lighthouse categories are harness artefacts.**
`best-practices` scores 78 everywhere because the local harness serves over
HTTP: the two failing audits are `is-on-https` and `redirects-http`, neither of
which can be true on Vercel. This is recorded rather than corrected, because
the honest response to a number that cannot be measured locally is to say so.

**The floors were set to industry norms and the platform does not meet all of
them.** Mobile performance and hub accessibility fall short. Lowering a floor
to make the report green was available and rejected: the gap is the finding.

**The advisories are reported, not fixed.** Four HIGH, including `next` and
`drizzle-orm`. Upgrading is sometimes a major version and always a decision;
this platform does not let a tool make one (`PLATFORM-CONSTITUTION.md` §19). The
recommendation and its risk are in `governance/known-risks.md`.

**Three things this deliberately does not do.** No destination — nothing ships
off-platform, because each option is a paid service and a data-processing
relationship. No dashboard implementation — the architecture is written down
and nothing renders it. No alerting — there is no on-call, so there is nobody
for an alert to reach.

**The 77 existing `console.*` calls are not migrated.** The standard exists and
the new surfaces use it; converting the rest touches almost every file and
belongs in its own change rather than riding along with the sprint that wrote
the standard.

## Alternatives considered

**Add a monitoring service and be done.** Sentry would have given error
reporting, tracing and release health in an afternoon. Rejected for this sprint
because it inverts the order: a destination without a standard produces
whatever shape eighty scattered `console.error` calls happen to have. The
standard first means the destination is a configuration change, not a rewrite.

**Make Lighthouse a merge gate.** Tempting — it is the most complete signal the
platform has. Rejected: the performance score depends on the machine, and a
gate that fails for reasons unrelated to the change is a gate people learn to
re-run until it passes.

**Set the Lighthouse floors to what the platform currently scores.** That would
have made the first run green. It would also have made the check incapable of
saying anything, which is the definition this repository already uses for a rule
that cannot fail (ADR-0004).

**Fix the security advisories in this sprint.** A `next` patch upgrade covers
three of the four HIGH findings and is not a major version. Still rejected: the
brief for this sprint said *recommend*, the platform's own rules escalate
security decisions, and upgrading the framework that routes ten domains is a
change that deserves its own verification rather than a footnote in an
observability sprint.
