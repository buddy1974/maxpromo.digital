# Track A Release — runbook and outcome

**Release candidate:** tag `track-a-foundation-v15.1`, commit `0337f2d`
**Merged to `main` as:** `a44a563` (`--no-ff`), tree identical to the tag
**Closure patch:** `5ea0b02` — both projects redeployed 2026-09-07, both `READY`
**Status:** released. All eleven registered hosts run `5ea0b02`.
**Verification:** 16 of 16 rules pass on 11 of 11 hosts.
**Track A:** not closed. Both foundation defects are fixed and gated; one
Marcel-only verification remains — see *Still Marcel-only* below.

---

## Outcome — 2026-09-06

**`maxpromo-digital`: released and verified.** All ten web domains pass all
fourteen production verification rules. RC1-01 and RC1-02 are closed in
production. `/api/health` reports `state: ok` with `release.commit: a44a563`,
which is how the deployed artefact was matched to the certified release rather
than assumed from a green deployment.

**`maxpromo-agents`: released 2026-09-07.** Marcel reconnected the project to
`buddy1974/maxpromo.digital`; the Agent Bureau then deployed from the monorepo
for the first time. `agents.maxpromo.digital` serves `release.commit: 9263ac2`
with `database: ok`. All eleven registered hosts now run this release.

**Consequence:** Track A is **still not closed** and the foundation freeze is
**not active** — but for different and much smaller reasons than before. The
release itself is complete. Two pre-existing gaps in the certified foundation,
both found *by* this production verification and neither caused by it, are
recorded in `governance/known-risks.md`:

- `agents.maxpromo.digital` declares `contactPath: '/kontakt'`, a route it does
  not serve — and the gate that would catch it skips non-web apps.
- `apps/bureau` does not stamp `x-mp-trace`, so the correlation-id contract
  holds on one application rather than on the platform.

One verification also remains **Marcel-only**: the drizzle-orm 0.45.2 check
needs an authenticated Agent Bureau session.

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

## Agent Bureau production release — 2026-09-07

### Why the first deployment had to be triggered explicitly

`apps/bureau/vercel.json`'s ignore command is
`git diff --quiet HEAD^ HEAD -- ../../apps/bureau ../../packages`. Between
`a44a563` and `main` at `9263ac2` those paths are unchanged, so a git-driven
deploy of `main` would have exited 0 and been **skipped** — leaving the July
build live while the deployment reported success. Simulated before deploying,
and already demonstrated once: the docs-only commit `9263ac2` was recorded
`CANCELED` on `maxpromo-digital` for exactly this reason.

The ignore command cannot express *"this project has never built from this
repository"*, which was true for the bureau until today. So the first
deployment was triggered explicitly, through the same project and the same
build settings — Root Directory `apps/bureau`, files-outside-root enabled.
Every later bureau change touches `apps/bureau` or `packages/` and will build
normally.

**Provenance was checked rather than assumed:** the working tree was byte
identical to `origin/main`, and `apps/bureau` (`004e4e4`) and `packages`
(`5590d34`) hashed identically at `HEAD` and at the web release `a44a563`.
Because both projects now point at the same repository, the deployment carried
git metadata, and the deployed artefact reports `release.commit: 9263ac2`
itself.

### Verified

| | |
|---|---|
| built from | `apps/bureau` — 50 routes, including `/api/health`, which the July build had not got |
| framework | Next.js 16.3.4, read from the build log |
| dependency posture | the four accepted `@esbuild-kit` development-only moderates, unchanged from v15.1 |
| alias | `agents.maxpromo.digital`, `READY` |
| identity | `https://agents.maxpromo.digital`, ok |
| database | **ok** — 6–33 ms warm; one 778 ms first call, which is a cold Neon start |
| authentication secret | present |
| legal routes | `/impressum` 200 · `/datenschutz` 200 |
| robots · sitemap · manifest | all 200, all naming its own origin |
| authenticated API routes | still 401 to an anonymous caller |
| `ai-provider` | `degraded` — no key is configured in either environment; non-critical, so the surface reports 200 |

### Eleven-host verification, after the bureau release

Fifteen rules. **Twelve pass on all eleven hosts**, including every identity,
canonical, robots, sitemap, manifest, legal, 404 and health rule, and the new
rule that the deployed artefact must report an expected release commit.

Three fail, all on `agents.maxpromo.digital`, all pre-existing and recorded:
the declared `/kontakt` path (one rule) and the missing `x-mp-trace` (two).

**One of those three was my harness, not the platform.** The contact rule
hardcoded `/contact` while the registry declares the bureau's path as
`/kontakt`; it was asking the wrong question of that host. Corrected to read
`contactPath` from the registry — at which point it still fails, because
`/kontakt` genuinely does not exist. The finding survived the fix to the
finder, which is the only reason it is reported.

### Closure patch — 2026-09-07, commit `5ea0b02`

Both defects fixed rather than accepted. Deployed to both projects: the diff
touched `packages/config`, so both ignore commands correctly triggered a build —
determined from the diff, not assumed.

| | |
|---|---|
| web | `dpl_3ay7p3xwYfhDbeSrbRDdmup6eRJ6` — READY |
| bureau | `dpl_GBQQxp3gz5tm9qwg4bReHqnRgBqU` — READY, git-triggered from `main` |

**Eleven-host production verification: 16 of 16 rules pass on 11 of 11 hosts.**
Every artefact reports `release.commit: 5ea0b02`. `x-mp-trace` is now present on
a served page and on a 404 across all eleven. The contact contract resolves to a
served page on all eleven — hub-bound off-domain, self-bound on-domain.

Agent Bureau specifics: repository `buddy1974/maxpromo.digital`, Root Directory
`apps/bureau`, Next.js 16.3.4, `database: ok` at 7–59 ms, `authentication: ok`,
`/dashboard/*` still 307 to `/login?callbackUrl=…`, every Drizzle-backed API
route still 401 to an anonymous caller, and `/`, `/login`, `/impressum`,
`/datenschutz` all 200. No old standalone-repository artefact holds any alias.

### Still Marcel-only: drizzle-orm 0.45.2

`/api/health` proves the database is reachable — but it uses
`@neondatabase/serverless` directly (`select 1`). **It does not exercise
Drizzle**, and must not be read as if it did.

Every route that does read through Drizzle — `/api/dashboard/summary`,
`/api/agents`, `/api/audit`, `/api/demo/status`, `/api/activity`,
`/api/approvals`, `/api/documents`, `/api/leads`, `/api/playbooks`,
`/api/waiting-room` — returns 401 to an anonymous caller. That is correct
behaviour and it is why this check cannot be automated from here.

**And an HTTP check of it cannot fail.** Every query module wraps its reads in
`safeRead`, which catches, logs `[db/queries] read failed:` and returns a
fallback; `dashboard.ts` composes those and states that it *"never throws"*. So
a total database failure and an empty workspace both render as 200,
`{"ok":true,...}` with empty arrays. Telling anyone to "open the endpoint and
look for `ok:true`" would be handing them a check with no failing case —
recorded at the top of `governance/known-risks.md`.

**Two things can actually distinguish the cases**, and the procedure uses both:

1. **Rows rendering.** A fallback cannot fabricate data. If real agents,
   proposals, activity or audit rows appear, Drizzle 0.45.2 executed those
   queries against Neon successfully.
2. **The runtime log.** `[db/queries] read failed:` is written on every
   swallowed failure. Its absence, while reads are being exercised, is the
   evidence an empty screen cannot give — and it is readable without any
   credential, so that half does not need Marcel.

The click-by-click procedure is in the release report.

No migration was run. No schema was modified. The ORM version moved; the
schema did not.

---

See `PLATFORM-CONSTITUTION.md` §22 for the release process and
`governance/known-risks.md` for what is open.
