# ADR-0001 — One repository, separate deployments

Date: 2026-09-03
Status: **Accepted**
Supersedes: the two-repository arrangement described in
`docs/history/platform-v3/phase-1-audit.md` §1

---

## Context

Maxpromo Digital was two repositories: `maxpromo.digital` (197 commits, ten
public domains, the marketing site plus the showcase engine plus the internal
OS) and `maxpromo-agent-bureau` (32 commits, one domain).

They shared a design brief but no code. The consequences were measurable:
two implementations of one design system that had already drifted on hover
direction and container width; a token file kept in sync by hand; two legal
identity modules disagreeing on the tax office name; twelve shared dependencies
with twelve different version specifiers.

## Decision

**One repository. Separate Vercel projects.**

`maxpromo.digital` becomes the platform root. Agent Bureau enters as
`apps/bureau` via `git subtree add`, preserving its commits. Shared code moves
to `packages/`. Each application keeps its own Vercel project, its own
`DATABASE_URL` and its own domains.

## Why not one deployment

"One platform" is not the same as one deployment target, and conflating them
would be a mistake:

- The web project serves **ten public domains** through host-based routing. A
  bad deploy there is a ten-domain outage; no other application should be able
  to cause it.
- The applications hold different `DATABASE_URL` values pointing at Neon
  instances in **different regions**. One project cannot hold both.
- Independent rollback per application is worth more than a single pipeline.

Governance is shared; blast radius is not.

## Why not rewrite history

The `.git` directory is 188 MB, almost entirely pre-optimisation image blobs.
Shrinking it with `filter-repo` would invalidate every clone and every commit
SHA referenced in the decision log, in exchange for clone speed. If that trade
is ever wanted it should be taken deliberately, not as a rider on a
consolidation.

**Known limitation, accepted:** `git log -- apps/bureau` shows the subtree
commit rather than the full path history, because those commits recorded paths
at their original repository root. The commits are in the object graph and
reachable by SHA. Making them appear under `apps/bureau` would require the
history rewrite this decision rules out.

## Consequences

- Vercel needs reconfiguring — root directory, repository, and "include files
  outside root directory". Until that is done, deploys from the merged
  repository fail. This is the one step that requires the dashboard, and it
  should be done against a preview before merging to `main`.
- Both original repositories stay in place, tagged and deployable, until Track
  B is signed off. Agent Bureau's is archived rather than deleted so its issue
  history stays readable.
- A single `npm run verify` now covers every application.

## What this does not deliver

Stated explicitly, because it would otherwise be discovered later:

- **Not one database.** Two Neon instances, two regions, two unrelated schemas.
  Merging them is a data migration.
- **Not one auth session.** Cookie sessions and NextAuth JWTs are different
  mechanisms. Single sign-on across the three surfaces is a feature with its
  own design.
