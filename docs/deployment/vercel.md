# Deployment — Vercel

One repository, separate projects. Deploy independently, govern together.

---

## Projects

| Project | Root Directory | Domains | Functions | Database |
|---|---|---|---|---|
| `maxpromo-digital` | `apps/web` | maxpromo.digital + 9 product domains | `fra1` (from the ADR-0021 release; `iad1` before) | Neon `eu-central-1` |
| `maxpromo-agents` | `apps/bureau` | agents.maxpromo.digital | `fra1` (from the ADR-0021 release; `iad1` before) | Neon `us-east-1` until the EU cutover (runbook in `docs/architecture/control-plane-reconciliation.md` §21) |

Both build from `buddy1974/maxpromo.digital`, production branch `main`. The function region
is set in each app's `vercel.json` (`regions`), so it is reviewed like code.

**Retired 2026-10-23:** the standalone `maxpromo-agent-bureau` project (pre-monorepo copy).
Git disconnected, every variable removed, repository archived; its last deployment runs on
its build-time snapshot until the project is paused (owner action).

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

Each application ships a `vercel.json` with an `ignoreCommand`. Exit 0 skips
the build; anything else builds.

**Web (`apps/web/vercel.json`), corrected 2026-10-06:**

```
if git cat-file -e "${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}^{commit}" 2>/dev/null    && git diff --quiet "${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}" HEAD -- ../../apps/web ../../packages ../../package.json ../../package-lock.json
then exit 0; else exit 1; fi
```

(One line in the file; wrapped here.)

**The contract.** Vercel reads the exit code: 0 skips the build, 1 builds,
and *anything else fails the deployment*. So the gate is fail-open — it exits
0 only when it can prove nothing relevant changed, and 1 in every other case,
including when it cannot compare at all.

- It compares against `VERCEL_GIT_PREVIOUS_SHA`, the last successfully
  deployed commit, falling back to `HEAD^` when that is unset or empty.
- It counts the root manifest and lockfile, because a dependency update
  changes the deployed runtime without touching `apps/web`.
- Vercel's clone is shallow and may not contain the previous deployed commit.
  The gate checks the commit is present (`git cat-file -e`) before comparing;
  absent, unresolvable or malformed → exit 1 → build.

**History, recorded rather than rewritten.** The original rule
(`HEAD^ HEAD -- ../../apps/web ../../packages`) cancelled the Iteration 1
release: 38 commits were pushed together and the last one changed only the
root lockfile (the sharp security patch). The first correction (96718af) used
the previous deployed SHA directly and assumed a SHA missing from the shallow
clone would make git exit 128 and the build run. That was wrong: the release
deployment failed with `fatal: bad object 77dbc20…`, because Vercel treats 128
as an error, not as "build". The commit-presence check replaced it. Both
failures happened before any application code was built; production stayed on
`77dbc20` throughout.

**Bureau (`apps/bureau/vercel.json`) used the old form** until 2026-10-23, and it did
exactly what the web incident predicted: every Bureau build after `c0bf517` was cancelled,
so the Next.js 16.4.2 security fix never reached agents.maxpromo.digital (known risks 67
and 106). It now uses the same commit-presence form as web, including the root manifest
and lockfile.

A commit touching only the other application does not trigger a rebuild. A
commit touching `packages/` rebuilds both, which is correct — a token change is
a change to every surface.

---

## Environment variables

Per project. They do not move and they must not be merged: keeping them
separate is what keeps the two databases separate.

| Variable | web | bureau |
|---|---|---|
| `DATABASE_URL` / `NEON_DATABASE_URL` | `NEON_DATABASE_URL`, eu-central-1 | `DATABASE_URL`, us-east-1 until the EU cutover |
| `ANTHROPIC_API_KEY` | ✓ | — (no AI key in production; the AI Lab cannot run) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | ✓ (the only Telegram sender) | — (removed 2026-10-23) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | ✓ | — |
| `OS_PASSWORD` / `OS_SESSION_SECRET` | ✓ | — |
| `HOSTINGER_WEBHOOK_SECRET` / `EMAIL_PROVIDER` | ✓ | — |
| `HOSTINGER_MAIL_API_TOKEN` / `HOSTINGER_MAILBOX_RESOURCE_ID` (read-only provider spam state, ADR-0022; **not set yet**) | owner to set | — |
| `OS_BUREAU_AGENT_SECRET` | ✓ (verifies) | ✓ (signs) — one fresh value, 2026-10-23 |
| `OS_BUREAU_ALLOWED_AGENTS` | `bureau:intake,bureau:console` | — |
| `OS_AGENT_SECRET` / `OS_AGENT_ALLOWED_ACTORS` | — (removed 2026-10-23; legacy door closed) | — |
| `BUREAU_OS_BUSINESS_ID` | — | the Bureau tenant that is Maxpromo |
| `CRON_SECRET` | — | ✓ (daily intake-outbox flush) |
| `AUTH_SECRET` | — | ✓ |
| `PORTFOLIO_PASSWORD` | ✓ | — |
| `NEXT_PUBLIC_SITE_URL` | — | ✓ |

The two `OS_BUREAU_AGENT_SECRET` copies must be equal; the web gate refuses it if it ever
equals another client's secret (ADR-0021). Rotate by setting a new value on both projects and
deploying both.

> ⚠️ **Compliance item, partly resolved.** Functions move to Frankfurt with the ADR-0021
> release, and the Bureau's legal text now states the database region from
> `apps/bureau/config/infrastructure.ts` instead of claiming the EU. The database itself
> stays in `us-east-1` until the EU cutover. Recorded in `docs/governance/known-risks.md`.

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

## Release 1bfa5cf — 2026-10-23 (was: pending release)

Ten commits are ready but unreleased. **Order matters:** Bureau migration 0002 on the Bureau
production database first, then the Hostinger REST variables (recommended), then `git push origin main`.
Exact SQL and verification: `docs/architecture/control-plane-reconciliation.md` §22.

Released 2026-10-23: web `dpl_4GGd98RRNvuA8pbxgKPaFUBJp9dW`, Bureau `maxpromo-agents-lnkmh6exl`, both on 1bfa5cf in fra1.

Env-only redeploy (2026-10-23): the ignored-build step cancels a git redeploy when no app file
changed, so a new Production variable is picked up with `vercel deploy --prod` from the clean repo
root instead (`dpl_EYDDFZ4URsFToAm2U4rqubmeoDQU`, reports 19479aa).

## Overnight product run — 2026-10-24

- `maxpromo-digital` gains a daily cron (`vercel.json`): `/api/cron/owner-notices` at 05:15 UTC. It
  refuses every call until `CRON_SECRET` is set on the project (owner action).
- New optional variables (all owner-controlled, none required for the release):
  `OWNER_TELEGRAM_NOTICES=1` activates owner pushes (ADR-0024); `MAIL_SEND_DISABLED=1` stops every
  outbound email; `MAIL_ATTACHMENTS_DISABLED=1` turns attachment downloads off.
- Production schema: migrations 0017 and 0018 applied 2026-10-24 before the release.

## Stripe ↔ Money + Email completion run — 2026-10-24

- Production schema: migrations **0019** (money domain) and **0020** (draft attachments, delivery reports)
  must be applied **before** the release — every balance query calls `money.invoice_paid()`.
- New owner variables (none required for the release; card payment stays off without them):
  `STRIPE_SECRET_KEY` (test or restricted key), `STRIPE_WEBHOOK_SECRET` (endpoint signing secret(s),
  comma-separated during rotation), `STRIPE_LIVE=1` (go-live switch for a live key),
  `STRIPE_PAYMENTS_DISABLED=1` (kill switch).
- Document emails no longer need `RESEND_API_KEY`; they need the mailbox send path
  (`HOSTINGER_MAIL_API_TOKEN`, `HOSTINGER_MAILBOX_RESOURCE_ID`, not `MAIL_SEND_DISABLED`).
- Webhook endpoint for the Stripe dashboard: `https://www.maxpromo.digital/api/channels/stripe`, API version 2024-06-20.
