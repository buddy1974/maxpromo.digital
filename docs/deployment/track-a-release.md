# Track A Release — runbook and outcome

**Release candidate:** tag `track-a-foundation-v15.1`, commit `0337f2d`
**Merged to `main` as:** `a44a563` (`--no-ff`), tree identical to the tag
**Deployed:** 2026-09-06 — `maxpromo-digital` production, `READY`
**Status:** the web platform is released and verified. **Agent Bureau is not.**

---

## Outcome — 2026-09-06

**`maxpromo-digital`: released and verified.** All ten web domains pass all
fourteen production verification rules. RC1-01 and RC1-02 are closed in
production. `/api/health` reports `state: ok` with `release.commit: a44a563`,
which is how the deployed artefact was matched to the certified release rather
than assumed from a green deployment.

**`maxpromo-agents`: not released.** The project is connected to
`buddy1974/maxpromo-agent-bureau`, the pre-consolidation repository, so merging
the monorepo to `main` does not reach it. `agents.maxpromo.digital` still
serves its 2026-07-24 build. Recorded as the first entry in
`governance/known-risks.md`; the fix is Marcel's, because it changes which
repository owns a production surface.

**Consequence:** Track A is **not closed** and the foundation freeze is **not
active**. The brief's condition was that all required production verification
pass; one registered production surface was never deployed, and the Agent
Bureau live-database verification below therefore remains unrun.

### Three things this release had to discover before it could ship

1. **The release had never left the machine.** `git ls-remote` showed only
   `refs/heads/main` at `7bd892e`. All 78 commits of the consolidation and the
   tag existed locally and nowhere else. The "two dashboard settings" blocker
   was real but was not the only thing between the tag and production.

2. **A fast-forward merge would have silently skipped the build.** The
   certified commit `0337f2d` changes only `docs/`, and
   `apps/web/vercel.json`'s `ignoreCommand` is
   `git diff --quiet HEAD^ HEAD -- ../../apps/web ../../packages`. After a
   fast-forward, `HEAD^` is `8e700a2` and that diff is empty — exit 0, build
   skipped, production left on `7bd892e` while the merge looked successful.
   Proven twice: once by simulating the diff before merging, and once by the
   git-triggered preview of `feature/track-b`, which Vercel recorded as
   `CANCELED`. The merge was therefore made with `--no-ff`, whose first parent
   is `7bd892e`, so the pipeline sees the whole release. **The merge changed no
   content:** `main^{tree}` and `track-a-foundation-v15.1^{tree}` are both
   `d62a17f`.

3. **The push had to be checked before it was made.** Pushing published 78
   commits to a *public* repository for the first time, and history contains
   1,007 committed `.next` build blobs. Every object in the push — 2,312 blobs,
   80.5 MB — was scanned against ten secret patterns, each demonstrated firing
   on canary input first. Only the Neon driver's own error-message template and
   `.env.example` placeholders matched. No secret material.

---

## Original runbook

**Blocker at the time of writing:** Vercel project configuration. Two dashboard
settings, per project — corrected by Marcel on 2026-09-06.

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

---

## What was actually verified, 2026-09-06

Read-only throughout. No production environment variable, database schema or
Vercel setting was changed by this release.

### Production, all eleven registered hosts

Fourteen rules, run against real HTTPS after the deploy. Every rule prints how
many domains it examined and the run fails if any rule examined none.

| | result |
|---|---|
| every registered domain reachable | 11/11 |
| product domain does **not** inherit the Maxpromo title | 9/9 |
| product domain does **not** canonicalise to maxpromo.digital | 9/9 |
| canonical points at the domain's own origin | 11/11 |
| product domain does **not** serve consultancy `/about` | 9/9 |
| legal route (`/impressum`) served | 11/11 |
| unknown route returns 404 | 11/11 |
| `robots.txt` names its own origin | 10/11 — bureau |
| `sitemap.xml` served, own origin | 10/11 — bureau |
| manifest served | 10/11 — bureau |
| `/contact` served | 10/11 — bureau |
| `/api/health` answers | 10/11 — bureau |
| `x-mp-trace` on a served page | 10/11 — bureau |
| `x-mp-trace` on a 404 | 10/11 — bureau |

**Every failure is `agents.maxpromo.digital`, and every one has the same
cause:** it is running pre-v13.0 code because it was never deployed.

One transient timeout on `taxkontrol.de` initially scored as four failures. It
was re-probed directly and is correct on every count; the harness now retries a
connection-level failure twice before believing it, because a transient scores
identically to a defect.

### Deployed artefact matched to the certified release

- `/api/health` returns `release.commit: a44a563` on the hub and on product
  domains — the deployed code identifies itself, rather than being inferred
  from a successful deployment.
- Production build log: `Detected Next.js version: 16.3.4` — the v15.1
  remediated version, read from the build rather than from the local lockfile.
- `main^{tree}` = `track-a-foundation-v15.1^{tree}` = `d62a17f`.

### Observability

`x-mp-trace` is present on 200s and on 404s across all ten web domains.

**But the correlation id correlates nothing.** There are zero calls to
`log.*` anywhere in either application, so no log line carries the trace id,
and `redact()` never runs. Production request logs contain only Vercel's own
records — domain, method, path, status, no personal data — which is a true
statement about log hygiene and a weak one about observability. Recorded in
`governance/known-risks.md`.

### Performance

Lighthouse against `https://www.maxpromo.digital/de`, mobile, over real HTTPS:
performance **90**, accessibility 93, best-practices **100**, seo **100**;
LCP 2.6 s, CLS 0, TBT 130 ms. Better than the recorded baseline on every axis
except accessibility, which reproduces the recorded 93 exactly. This run closed
the two open questions the baseline could not answer locally.

### Agent Bureau database — still unverified

**Unchanged from the original runbook, and the reason is not the database.**
The bureau was never deployed to production, so none of the five checks below
could run against it.

What *was* proven, on a CLI preview built from the monorepo with the corrected
Root Directory: the application builds (Next 16.3.4), serves its pages, and
`/api/health` reports `database: ok` in 7–9 ms against the live Neon database.
An initial `down` reading was a cold Neon start at 2,508 ms — it was retried
five times rather than reported, and answered in single-digit milliseconds
every time after the first.

Two limits on that, stated rather than glossed:

- The health probe uses `@neondatabase/serverless` directly — `select 1`. It
  proves the database is reachable. **It does not exercise Drizzle**, so it is
  not the drizzle-orm 0.45.2 verification this runbook asked for.
- Every route that does read through Drizzle returns 401 to an unauthenticated
  caller — correct behaviour, and it means the Drizzle verification needs a
  signed-in session. That step belongs to Marcel; an agent does not enter
  credentials.

**No migration was run. No schema was modified.** The ORM version moved; the
schema did not.

---

See `PLATFORM-CONSTITUTION.md` §22 for the release process and
`governance/known-risks.md` for what is open.
