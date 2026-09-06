# Platform Observability

How the platform says what is happening to it: errors, logs, health, and
performance. One document, because these four are one question — *how healthy
am I* — asked from four angles.

**Authority.** `packages/observability/` for the contracts,
`packages/config/budgets.ts` for the numbers, `PLATFORM-CONSTITUTION.md` §20
for where the checks run. This document explains the shape; those files are the
shape.

---

## The problem this addresses

One deployment answers ten public domains. Before v15.0:

| | |
|---|---|
| Error boundaries | **none**, in either application |
| Log format | 77 `console.*` calls, each deciding for itself |
| Correlation | none — no line could be tied to a visitor |
| Health endpoint | none in `apps/web`; three of three shapes in `apps/bureau` |
| Performance measurement | none of any kind |
| Swallowed errors | 37 `catch {}` blocks that say nothing |

The last row is the shape of the whole problem. The platform's most common way
of failing was to say nothing at all.

---

## 1. Errors

### The boundaries

```
apps/*/app/global-error.tsx    the root layout itself failed
apps/*/app/error.tsx           a page or nested layout failed
apps/web/app/[locale]/not-found.tsx   a route that does not exist
```

Both applications now have all three. Before this, a runtime failure on any of
ten public domains rendered the framework default — a blank page reading
*"Application error: a client-side exception has occurred"* — and nothing was
written down anywhere. The visitor saw nothing useful and the platform learned
nothing.

**`global-error.tsx` cannot use the design system.** It renders when the root
layout has failed, which is the layout that loads the fonts and the token
stylesheet. It takes its colours from the token package's TypeScript mirror
instead: the same values, bundled into the same chunk as the component, with no
stylesheet dependency. That is why it needs no exception to the rule that
nothing in this repository writes a colour.

**`error.tsx` may.** The root layout survived, so the tokens are available and
the page can look like the platform.

Neither boundary tries to work out which domain it is on. They render on ten
public domains and inside the internal OS, and a boundary that resolves
identity is a boundary with one more thing that can fail.

### The reference

Every boundary shows `error.digest` when there is one. That is the server-side
identity of the error — the stack is stripped in production — and it is what
ties the page a visitor is looking at to the line the server already wrote. A
visitor who reports a problem has something to quote.

### What is still open

**37 `catch {}` blocks swallow their error entirely.** Each is a place where
something failed and the platform decided not to mention it. They are not all
wrong — a few are deliberate, and say so — but they have never been reviewed as
a group. That review is not this sprint's; it is recorded in
`governance/known-risks.md`.

**No error reporting destination.** Errors are logged, structured, to stdout.
Sending them to a service — Sentry, or anything else — is a decision with a
cost and a data-processing agreement behind it, and it is Marcel's. What v15.0
guarantees is that when it is made, nothing has to be rewritten to be shipped
somewhere: the lines are already structured, already redacted, already carry a
correlation id.

---

## 2. Logging

`packages/observability/logger.ts`. Five levels, five questions, one stream.

### Every line answers five questions

| | |
|---|---|
| **What** | `event` — short, stable, groupable. `chat.session.created`, never a sentence |
| **Where** | `surface`, and `domain` when the event belongs to a request |
| **Why** | the cause, when one is known — an error, a status, a reason |
| **Impact** | the level carries it |
| **Trace** | `trace`, so one visitor's journey can be reassembled |

The `surface` field is required by the type. On a platform where one deployment
answers ten domains, a log line that does not say where it came from is a line
nobody can act on.

### The levels mean something

```
debug     only useful while working on this. Off in production.
info      something completed that someone might later ask about.
warn      degraded, and continuing. A retry succeeded; a fallback ran.
error     one request failed. The visitor saw something wrong.
critical  the surface is failing, not the request. Wake someone.
```

The distinction that matters is **warn against error**: a warning is something
the platform handled, an error is something it did not. Fifty-seven
`console.error` calls cannot all be true.

### Nothing sensitive is logged

`redact()` runs over every field of every line, applied by the logger rather
than by the caller — a redaction the caller has to remember is one that gets
forgotten on the line that matters. It removes by key name (any field whose
name contains `email`, `phone`, `token`, `name`, `message`, and twenty-odd
others) and by value shape (API keys, bearer tokens, JWTs, connection strings,
addresses appearing in free text).

It is deliberately aggressive. A log that occasionally redacts something
harmless is a nuisance; one that occasionally does not is a disclosure.

### One stream, `console.log`

Not `process.stdout.write`: the middleware runs on the Edge runtime, which has
no `process.stdout` — and the middleware is the one place every request passes
through, so a logger that cannot run there cannot mint a correlation id.

Not split across stdout and stderr either. A platform that divides its own log
has to be reassembled before it can be read, and `level` already carries what
stderr would have said.

### Correlation

`x-mp-trace`, sixteen hex characters. Minted in the middleware when the request
has none, honoured when it has one, and stamped on **every** response the
middleware produces — pass, rewrite, redirect and JSON error alike.

The first version stamped it only on the two paths that were tested, and a
product domain's home page, the most-served route on the platform, went through
the rewrite branch and left without one.

### What is still open

The 77 existing `console.*` calls have not been migrated. The standard exists
and is used by the new surfaces; converting the rest is mechanical, touches
almost every file, and belongs in its own change rather than riding along with
the sprint that wrote the standard.

---

## 3. Health

`packages/observability/health.ts`, served at `/api/health` on both
applications.

### Three states, and the middle one matters

```
ok        working
degraded  working, but not as intended — a fallback is carrying it
down      not working
```

`degraded` exists because most real failures are not binary. A database that
answers in four seconds is not down, and reporting it as `ok` is how an outage
becomes a surprise. The database probe reports `degraded` above 800ms.

**A subsystem that is not configured is `degraded` with a note, never `down`
unless the platform genuinely cannot work without it.** A health endpoint that
goes red on every developer's machine is one everyone learns to ignore.

### What is checked

| Subsystem | Critical | Probe |
|---|---|---|
| registries | yes | the Domain and Brand registries are present and non-empty |
| legal identity | yes | legal name and tax number resolve |
| database | yes | `select 1`, timed |
| authentication | yes | session secret and password are set |
| ai-provider | no | a key is configured — **not called** |
| email | no | configured — **not called** |
| documents | no | the identity documents print resolves |

Two probes deliberately do not call the thing they check. A probe that costs
money per invocation is a probe that gets switched off.

### Constraints on a probe

It must not write. It must not cost money. It must not exceed its timeout — the
runner abandons it and reports `down` rather than letting a broken subsystem
hold the endpoint open, because a health endpoint whose own timeout is the
client's makes an outage worse.

And it must not return anything a caller could not already see. `/api/health`
is unauthenticated by design, so it reports *whether* a subsystem answers,
never *what* it said. `robots.txt` disallows `/api/`, so it is reachable and
not indexed.

### Status codes

`503` when `down`, `200` when `degraded`. Deliberately: a load balancer should
not remove a surface that is serving because a non-critical dependency is slow.

### Aggregation

A non-critical subsystem being down *degrades* the surface rather than downing
it. The public site does not stop working because an outbound channel is
unreachable, and saying otherwise would train whoever reads this to distrust
it.

---

## 4. Performance

`packages/config/budgets.ts` holds the numbers; two tools measure against them.

### `check:budgets` — gate 12, deterministic

Everything a production build determines with no browser and no network:
shared root JavaScript, total JS and CSS, public-directory weight, largest
image, and the count over 500 KB. It runs after `build` because there is
nothing to measure before it, and it **errors rather than passing** when no
application has been built.

Every budget carries three numbers and a sentence: what it measured on the day
it was written, what it may become, and what the number protects. The limit
sits above the measurement deliberately — a budget pinned to today's value
fails on the next legitimate change and gets raised without thought, which is
how a budget becomes a formality.

`measured` is never edited to make a check pass. Raising a `limit` is a
decision and belongs in the change log.

### `audit:lighthouse` — measured, not gated

Every public domain, desktop and mobile, against a **production build**. Not a
merge gate: a Lighthouse performance score moves with whatever else the machine
was doing, and failing a merge on that teaches everyone to ignore the gate.

Two things about how it works are worth knowing:

**It reaches ten domains from one server** by launching Chrome with
`--host-resolver-rules`, mapping every registry host to `127.0.0.1`. Host
cannot be set from script — it is a forbidden header — so the resolver is the
only honest way to make Chrome send the real one. Chrome is spawned with an
argument array rather than through Lighthouse's `--chrome-flags`, because that
option is split on spaces and every one of these rules contains two.

**It refuses to run against a development server.** A performance score against
`next dev` measures the compiler, not the site. Measuring anyway and writing
the number down would be worse than not measuring.

The baseline is `governance/performance-baseline.json`. A ten-point category
drop against it is a finding; three points is Lighthouse noise.

### Lab, not field

Every number in the baseline is a lab measurement. Field data — what real
visitors on real connections experience — needs real traffic and a collector,
and the platform has neither. That gap is recorded in `known-risks.md` rather
than papered over by presenting a lab number as a field one.

---

## What is deliberately not here

**No destination.** Nothing is shipped off-platform: no Sentry, no log drain,
no RUM collector, no uptime pinger. Each is a paid service and a
data-processing relationship, and this repository does not let a tool make that
decision (`PLATFORM-CONSTITUTION.md` §19).

**No dashboard implementation.** The architecture is in
`architecture/engineering-dashboard.md`; nothing renders it.

**No alerting.** There is no on-call, so there is nobody for an alert to reach.
Health endpoints and structured logs are what alerting would be built on when
there is.

---

See `PLATFORM-CONSTITUTION.md` for the platform's rules and
`governance/known-risks.md` for what is open.
