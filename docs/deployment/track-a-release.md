# Track A Release — runbook and blocker

**Release candidate:** tag `track-a-foundation-v15.1`, commit `8e700a2`
**Status:** certified, tagged, **not deployed**
**Blocker:** Vercel project configuration. Two dashboard settings, per project.

---

## What is in this release

Four sprints that have never been deployed. Production currently runs `main`
at `7bd892e`, last deployed 25 days ago, which predates all of them.

| | |
|---|---|
| v13.0 | domain identity, route isolation, per-domain metadata and crawl policy |
| v14.0 | brand registry, platform constitution, documentation governance |
| v15.0 | observability: logging, health, error boundaries, performance budgets |
| v15.1 | dependency security remediation, security release gate |

This is not a patch release. It changes what ten public domains serve.

---

## The blocker

`ADR-0001` recorded it when the two repositories were merged:

> Vercel needs reconfiguring — root directory, repository, and "include files
> outside root directory". Until that is done, deploys from the merged
> repository fail. This is the one step that requires the dashboard.

It was never done. Both projects still have **Root Directory `.`**:

| Project | Created | Root Directory | Serves |
|---|---|---|---|
| `maxpromo-digital` | 185 days ago | `.` | maxpromo.digital + 9 product domains |
| `maxpromo-agents` | 100 days ago | `.` | agents.maxpromo.digital |

Both were created before the consolidation, when the Next application was at
the repository root. It is now at `apps/web` and `apps/bureau`.

**Verified empirically, not inferred.** A preview deployment on 2026-09-06
built successfully and then failed:

```
Error: The file "/vercel/path0/.next/routes-manifest.json" couldn't be found.
```

The workspace build put its output in `apps/web/.next`; Vercel looked for
`.next` at the repository root. The build is fine. The output location is not
where the project expects it.

---

## The fix

Two settings per project, in the Vercel dashboard — **Settings → General**:

**`maxpromo-digital`**
1. **Root Directory** → `apps/web`
2. **Include files outside the root directory in the Build Step** → **on**
   (required: the build imports `packages/config`, `packages/design-tokens`,
   `packages/ui` and `packages/observability`)

**`maxpromo-agents`**
1. **Root Directory** → `apps/bureau`
2. **Include files outside the root directory in the Build Step** → **on**

There is no CLI command for Root Directory; `vercel project` does not expose
it. It is a dashboard change, or the REST API with a token.

**Do not** work around this with a root-level `vercel.json` pointing
`outputDirectory` at `apps/web/.next`. One repository root cannot serve two
projects with different applications, and `apps/*/vercel.json` already carries
each project's `ignoreCommand`. That would be a second deployment
arrangement — the thing ADR-0001 exists to prevent.

---

## Deploy sequence, once the settings are changed

1. **Preview first.** `vercel deploy` on this branch, per project. ADR-0001 is
   explicit that the reconfiguration is validated against a preview before
   anything reaches `main`.
2. **Verify the preview** with the checks below, against the preview URL.
3. **Merge to `main`.** Both projects deploy from `main`; each
   `apps/*/vercel.json` carries an `ignoreCommand` so an app only rebuilds when
   it or `packages/` changed.
4. **Verify production** with the same checks, against the real hosts.

---

## Verification to run after deploying

Everything below exists and has been run against a local production build. It
has *not* been run against a deployed build.

### Domains — the reason this release matters

```bash
npm run audit:domain-experience -- --base https://www.maxpromo.digital
```

The local run is 175/175. Production today fails most of it — measured
2026-09-06, before this release:

| | |
|---|---|
| product domains carrying the Maxpromo title | **9 of 9** |
| product domains canonicalising to maxpromo.digital | **9 of 9** |
| `robots.txt` naming maxpromo.digital as Host | **9 of 9** |
| consultancy pages served on product domains | **9 of 9** — `taxkontrol.de/about` returns the "Über Maxpromo" page |
| domains with `/api/health` | **0 of 11** |

Those are RC1-01 and RC1-02, live. This release is what closes them.

### Agent Bureau database — the one unverified thing

The v15.1 `drizzle-orm` upgrade (0.38.4 → 0.45.2, seven minor versions of a
0.x library) was verified by typecheck, lint, build and `drizzle-kit check`
against the migration journal. It has **not** run against a live database.

**No migration is required by this release.** The schema is unchanged; only the
ORM version moved. Do not run `drizzle-kit push` or `migrate`.

Non-destructive checks, in order:

1. `GET https://agents.maxpromo.digital/api/health` — the `database` check
   performs `select 1` and reports `degraded` above 800ms.
2. Sign in. Authentication reads through Drizzle.
3. Open the dashboard: activity, agents, approvals, waiting room, documents.
   All are Drizzle reads.
4. `GET /api/demo/status` — the one route using `sql` template literals.
5. Read the deployment logs for `DrizzleError`, `PostgresError`, `syntax error
   at or near`, `relation ... does not exist`, or connection failures.

If any of these fail, roll back before investigating.

### Observability

- `/api/health` on both applications: 200 when ok or degraded, 503 when down.
- `x-mp-trace` present on a 200 and on a 308. `/api/health` will not carry one
  — the middleware matcher excludes `/api/*` except `/api/os`, which is
  pre-existing and recorded in `known-risks.md`.
- Logs are single-line JSON with `level`, `event`, `surface`. Confirm no email
  address, telephone number, name or token appears in any line.

### Security

Confirm the deployed build is the remediated one:

```
next 16.3.4 · drizzle-orm 0.45.2 · drizzle-kit 0.31.10
```

Read the version from the Vercel build log rather than assuming the lockfile
resolved as it does locally.

### Performance

`npm run audit:lighthouse` measures a local production build. Against a
deployed one, expect `best-practices` to *rise* from 78 to about 100: the two
failing audits locally are `is-on-https` and `redirects-http`, neither of which
can be true on Vercel.

Baseline to compare against: `governance/performance-baseline.json`
(desktop performance 100, mobile 88, CLS 0.000, mobile LCP ~3.3s).

**Also settles a known unknown:** the hub scores SEO 92 locally, failing the
`canonical` audit, while product domains with a structurally identical tag
score 100. One production run over HTTPS resolves whether that is real.

---

## Rollback

Vercel keeps every previous deployment. Rollback is promoting the last known
good one — 25 days old for `maxpromo-digital`, 44 for `maxpromo-agents`.

Nothing in this release changes a database schema, so a rollback of the code is
a complete rollback.

---

See `PLATFORM-CONSTITUTION.md` §22 for the release process and
`governance/known-risks.md` for what is open.
