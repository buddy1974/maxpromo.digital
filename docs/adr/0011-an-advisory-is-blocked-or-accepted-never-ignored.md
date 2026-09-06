# ADR-0011 — An advisory is blocked or accepted, never ignored

**Status:** Accepted
**Date:** 2026-09-06

---

## Context

v15.0 made dependency advisories visible for the first time and found eight,
four of them HIGH. It reported them and acted on none, which was correct for a
sprint whose brief was to make things measurable — but it left the platform
with a security signal nothing acted on, which is the same shape as no signal
at all.

v15.1 looked at the eight properly, and the first finding was that the previous
summary understated the problem. `npm audit`'s node for `next` collapses its
advisories into one line; underneath it were **twenty-eight**, and the ones that
matter most on this platform are a family:

```
Middleware / Proxy bypass via segment-prefetch routes            CVSS 7.5
Middleware / Proxy bypass through dynamic route parameter injection    8.1
Middleware / Proxy bypass using Turbopack and a single locale       (no CVSS)
Middleware / Proxy redirects can be cache-poisoned                     3.7
SSRF in rewrites via attacker-controlled destination hostname     (no CVSS)
```

Middleware *is* this platform's security boundary. Route isolation — the rule
that a product domain serves four paths and never the consultancy's — is
enforced there, and so is the staff gate on `/os`. A middleware bypass defeats
both. The Turbopack-and-single-locale variant is precise: `apps/web` builds with
Turbopack, and `publishers24.org` and `drive24.live` are single-locale domains.

Fixing that was straightforward. What was not straightforward was the four
MODERATE findings, and they are the reason this ADR exists.

## The problem with "fail on any advisory"

The four MODERATE findings are one chain: `drizzle-kit` → `@esbuild-kit/*` →
`esbuild@0.18.20`. Every fact about it argues against blocking a release:

- `drizzle-kit` is a **devDependency**, a migration CLI run by hand. It is in no
  build output and runs on no server.
- The advisory is that esbuild's **development server** answers cross-origin
  requests. drizzle-kit never starts one; it uses esbuild to transpile
  `drizzle.config.ts` on invocation.
- `drizzle-kit@0.31.10` is the **latest published version** and still depends on
  `@esbuild-kit/esm-loader`, which is deprecated. There is no version to move to.
- npm's suggested fix is `drizzle-kit@0.18.1` — a downgrade well below the
  version this schema needs. It is a resolver artefact, not advice.

A gate that blocks a release on that is a gate whose first act is to be
overridden, and a gate people override is worse than no gate: it converts a real
signal into a habit of ignoring one.

## Decision

**An advisory is blocked, or accepted with a record. It is never ignored.**

`audit:dependencies` classifies every advisory on four axes:

| | |
|---|---|
| **reach** | can the vulnerable package sit under a `dependencies` entry of some workspace, and so reach a served request — or only under `devDependencies`? |
| **severity** | critical and high are treated differently from moderate and low |
| **remediation** | is there a published version that resolves it, or is npm's "fix" a downgrade? |
| **acceptance** | has it been looked at, written down, and given an owner and a review date? |

```
CRITICAL + production   blocks. No acceptance can excuse it.
HIGH     + production   blocks unless a live acceptance names it.
everything else         reported.
```

**Reach is computed, not declared.** The vulnerable package has no section of
its own; its *root* does. `npm audit`'s `effects` graph is walked upward to the
direct dependency that pulled it in, and that root's section decides. A root
that cannot be identified counts as production — an advisory whose provenance is
unclear is not one to be lenient about.

**An acceptance is a record.** `packages/config/security.ts` holds one entry per
carried advisory, naming the actual exposure rather than the advisory's
abstract, the mitigation, the upgrade path and why it is unavailable, an owner,
and a review date. After that date the acceptance expires, the advisory blocks
again, and the audit says which record lapsed.

**An accepted advisory is still printed, still counted, and still in the release
report.** It is excluded from blocking and from nothing else.

## Consequences

**Three of four HIGH advisories were remediated by one upgrade.** `next`
16.1.6 → 16.3.4 cleared its own twenty-eight, and moved its pinned `postcss`
from 8.4.31 to 8.5.23 and its `sharp` from 0.34.5 to 0.35.4 — both of which were
flagged only because Next pinned them.

**The smallest secure version was not the one chosen, and the reason is
recorded.** `next@16.3.0` is the first release clearing all three: it is where
postcss moves to 8.5.23 and sharp to ^0.35.3. 16.3.4 was taken instead — the
same minor bump, four patch releases of fixes on top, no additional feature
surface. Shipping the `.0` of a minor to ten production domains is the larger
risk, and "smallest secure" should not mean "least tested".

**The fourth HIGH was remediated too, and its exposure was already nil.**
`drizzle-orm` 0.38.4 → 0.45.2 closes an identifier-escaping SQL injection.
Every identifier in `apps/bureau` comes from the static schema; the only raw SQL
is two constant `count(*)` literals. The upgrade was taken anyway, because a
vulnerable path that no current code reaches is a vulnerable path the next
query might.

**The four MODERATE findings are accepted, with records.** Reviewed by
2026-12-06.

**The decision is a pure function.** `blocksRelease()` lives in the risk
register and `prove:security` exercises it against a truth table, because this
gate has been green since the moment it was written — every advisory the
platform carries is development-only — and a gate that has only ever been seen
passing is not known to block.

## Alternatives considered

**Run `npm audit fix`.** Explicitly refused by the brief, and rightly: it would
have taken `drizzle-kit` to 0.18.1, three minor versions below what this schema
needs, in the name of resolving a development-only advisory.

**Block on everything and let people use an override flag.** The override
becomes the workflow. A record with an owner and an expiry is the same
permission with a name attached to it.

**Accept the `drizzle-orm` HIGH rather than upgrade.** Defensible on exposure
alone — no dynamic identifiers exist. Rejected because the remediation turned
out to be available and verifiable: typecheck, lint and build pass on both
applications, and `drizzle-kit check` validates the existing migration journal
at the new version. An acceptance is for what cannot be fixed, not for what
would be inconvenient to test.
