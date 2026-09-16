# Deployment — Vercel

One repository, separate projects. Deploy independently, govern together.

---

## Projects

| Project | Root Directory | Domains | Database |
|---|---|---|---|
| `maxpromo-digital` | `apps/web` | maxpromo.digital + 9 product domains | Neon `eu-central-1` |
| `maxpromo-agents` | `apps/bureau` | agents.maxpromo.digital | Neon `us-east-1` |

Both build from `buddy1974/maxpromo.digital`, production branch `main`.

### Why not one project

- **The web project serves ten public domains.** The Domain Registry
  (`packages/config/domains.ts`) classifies each request and the root route renders the
  matching product. A bad deploy there is a ten-domain outage, and no other
  application should be able to cause it.
- **The applications hold different `DATABASE_URL` values** pointing at
  different Neon instances in different regions. One project cannot hold both.
- **Independent rollback** per application is worth more than a single
  pipeline. Governance is shared; blast radius is not.

---

## Settings changed when the monorepo landed — done

Both projects pointed at their old single-application repositories and built
from the repository root, which is why deploys from the merged repository
failed. Corrected in the Vercel dashboard — `maxpromo-digital` on 2026-09-06,
`maxpromo-agents` on 2026-09-07:

| Project | Setting | From | To |
|---|---|---|---|
| maxpromo-digital | Git repository | `maxpromo.digital` (standalone) | `buddy1974/maxpromo.digital` |
| maxpromo-digital | Root Directory | *(empty)* | `apps/web` |
| maxpromo-agents | Git repository | `buddy1974/maxpromo-agent-bureau` | `buddy1974/maxpromo.digital` |
| maxpromo-agents | Root Directory | *(empty)* | `apps/bureau` |
| both | **Include files outside root directory** | off | **on** |

That last setting is not optional. Both applications import from `packages/`,
which sits above their root directory; without it the build cannot resolve
`@maxpromo/design-tokens` and fails at compile time.

Verified by reading the project records back: both carry the same `repoId`
(1173436051) and production branch `main`. Recorded in
`governance/known-risks.md` as resolved.

---

## Selective rebuilds

Each application ships a `vercel.json` with an `ignoreCommand`:

```
git diff --quiet HEAD^ HEAD -- ../../apps/<name> ../../packages
```

A commit touching only the other application does not trigger a rebuild. A
commit touching `packages/` rebuilds both, which is correct — a token change is
a change to every surface.

---

## Environment variables

Per project. They do not move and they must not be merged: keeping them
separate is what keeps the two databases separate.

| Variable | web | bureau |
|---|---|---|
| `DATABASE_URL` | eu-central-1 instance | us-east-1 instance |
| `ANTHROPIC_API_KEY` | ✓ | ✓ |
| `OPENAI_API_KEY` | ✓ | ✓ |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | ✓ | ✓ |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | ✓ | — |
| `OS_PASSWORD` / `OS_SESSION_SECRET` | ✓ | — |
| `PORTFOLIO_PASSWORD` | ✓ | — |
| `AUTH_SECRET` | — | ✓ |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | — | ✓ |
| `NEXT_PUBLIC_SITE_URL` | — | ✓ |

> ⚠️ **Open compliance item.** The bureau database is in `us-east-1` while
> `agents.maxpromo.digital` publicly claims EU hosting. Recorded in
> `docs/governance/known-risks.md`. Resolve before onboarding further personal
> data.

---

## Rollback

| Layer | Mechanism | Time |
|---|---|---|
| 1 | Vercel instant rollback to the previous deployment | seconds |
| 2 | `git revert` of the offending commit | minutes |
| 3 | Tag `pre-track-b` on both original repositories | **no longer a live path** |

**Layer 3 is historical.** Both original repositories still exist, but neither
is a usable rollback target: `maxpromo-agent-bureau` predates the consolidation,
and a push to it would now fail to build. Rollback is layer 1 or layer 2.
Agent Bureau's repository should be archived rather than deleted, so its issue
history stays readable — it is not authoritative for anything.

---

## Verifying a deploy

`docs/deployment/deploy-verify.md` holds the route-by-route checklist. In
short: both locales of the homepage, one solution page, one industry page, the
protected OS login, the bureau dashboard login, and one generated document.
