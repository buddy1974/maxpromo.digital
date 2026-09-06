# Engineering Dashboard — Architecture

**Status:** Architecture only. Nothing renders this.

What an internal engineering dashboard for this platform would show, where each
number would come from, and — for most of them — the fact that the number
already exists.

---

## Why this is architecture and not a page

Every section below is either **already measured** or **not measurable yet**,
and the split is the useful part of this document. Building a dashboard whose
panels are half real and half placeholder produces a screen nobody trusts,
which is worse than no screen.

Twelve sections. Nine of them have a real source today.

---

## The principle

**A dashboard reads; it never measures.** Every panel is a view over an artefact
some check already produces — a JSON baseline, a gate's exit code, a registry.
A dashboard that computes its own numbers becomes a second implementation of
every check it displays, and the two drift.

That means the work of building it is mostly **writing the artefacts out**, not
drawing. Today the audits print to a terminal; four of them would need a
`--json` flag. That is the whole gap between this document and a working page.

---

## Sections

### 1. Platform Health

| | |
|---|---|
| **Source** | `GET /api/health` on both applications |
| **Exists** | ✅ |
| **Shows** | per-subsystem `ok` / `degraded` / `down`, response time, release commit |

Seven subsystems on `apps/web`, five on `apps/bureau`. The panel is a direct
render of the JSON; no computation.

*Not yet:* history. The endpoint answers for now, and nothing stores what it
said a minute ago. A trend line needs a collector, which needs a decision.

### 2. Performance

| | |
|---|---|
| **Source** | `docs/governance/performance-baseline.json` · `check:budgets` |
| **Exists** | ✅ |
| **Shows** | Lighthouse category scores per domain × form factor; LCP, CLS, TBT, TTFB against the "good"/"poor" boundaries; every budget as measured / now / limit |

The baseline already carries twenty measurements. A trend needs the baseline
committed on each release, which it will be.

*Not yet:* field data. Lab numbers only — see `observability.md`.

### 3. Accessibility

| | |
|---|---|
| **Source** | `audit:a11y` (36 routes) · the Lighthouse baseline's `accessibility` category |
| **Exists** | ✅ |
| **Shows** | routes audited clean; token-pair contrast; Lighthouse's per-domain score and the specific audits failing |

The two sources disagree productively and the panel should show both: the
in-repo audit checks token pairs and document structure, and Lighthouse found
contrast and target-size failures it does not look at.

### 4. Domains

| | |
|---|---|
| **Source** | `packages/config/domains.ts` · `check:domains` · `audit:domain-experience` |
| **Exists** | ✅ |
| **Shows** | eleven hosts with mode, languages, route count, canonical strategy, crawl policy; the live 175-check walk per domain |

### 5. Brand

| | |
|---|---|
| **Source** | `packages/config/brands.ts` · `check:brands` |
| **Exists** | ✅ |
| **Shows** | twelve brands; accent and accent-as-text with measured contrast; the KEEP / REPLACE / CREATE / REMOVE counts as a backlog |

### 6. Documentation

| | |
|---|---|
| **Source** | `audit:docs` |
| **Exists** | ✅ |
| **Shows** | documents, references resolved, gate-count claims, orphan documents, and the registry-vs-core-memory product disagreement |

### 7. AI

| | |
|---|---|
| **Source** | — |
| **Exists** | ❌ **Track B** |
| **Would show** | prompt versions and the model each was written against; policy decisions applied; evaluation results; per-surface assistant health |

Nothing to render. `architecture/ai-governance-readiness.md` maps where these
would come from. The one number available today is a negative:
`chatIdentity` is declared for every domain and read by nothing.

### 8. SEO

| | |
|---|---|
| **Source** | the Lighthouse baseline's `seo` category · `check:domains` |
| **Exists** | ⚠️ partial |
| **Shows** | per-domain SEO score; canonical, robots and sitemap policy per host |

Partial deliberately: Track C has not begun, so there is no ranking, impression
or coverage data — and there is no Search Console property to draw it from yet.
What the platform can show today is whether each domain is *technically*
addressable, which it is.

### 9. Security

| | |
|---|---|
| **Source** | `audit:dependencies` (`npm audit`) |
| **Exists** | ⚠️ partial |
| **Shows** | open advisories by severity, direct vs indirect, and the fix each needs |

Partial: advisories are the only automated security signal the platform has.
There is no secret scanning, no dependency-pinning policy check, no SAST, and
no runtime security monitoring. Stated rather than implied.

### 10. Builds

| | |
|---|---|
| **Source** | `.next/BUILD_ID` and its mtime · `check:budgets` · CI run history |
| **Exists** | ⚠️ partial |
| **Shows** | current build id and age per application; bundle sizes against budget |

Partial: build *duration* and *history* live in GitHub Actions and Vercel, and
reading them needs an API token — a credential decision.

### 11. Releases

| | |
|---|---|
| **Source** | `release:report --json` |
| **Exists** | ✅ |
| **Shows** | files by class, routes affected, domains affected, bundle delta against baseline, rollback readiness and whether the release contains anything irreversible |

The one panel that should be *generated per release and kept*, not recomputed:
its value is the comparison between releases.

### 12. Technical Debt

| | |
|---|---|
| **Source** | `governance/known-risks.md` · the audits' report-only findings |
| **Exists** | ✅ |
| **Shows** | open risks with owners; the 35 CREATE / 42 REPLACE brand assets; 10 claims findings; 37 unreviewed `catch {}` blocks; 77 unmigrated `console.*` calls; unused dependencies |

Every number here is already produced by something. This panel is a join, not a
measurement.

---

## What building it would actually require

In order, smallest first:

1. **`--json` on four audits.** `check:budgets`, `check:brands`, `audit:docs`
   and `audit:dependencies` print for humans. Each needs a machine-readable
   mode. Half a day.
2. **A place to put the artefacts.** A `reports/` directory written by
   `certify`, committed or uploaded. No new infrastructure.
3. **The page itself.** A route in the internal OS, behind the existing auth
   gate, reading those files. It is a rendering problem, not an engineering one.
4. **History.** The first thing that needs infrastructure: somewhere to keep
   yesterday's numbers. Until then every panel shows *now*, which is most of
   the value and none of the trend.

**What it must not become:** a place where numbers are computed. If a panel
needs a number no check produces, the check is what is missing.

---

## Where it would live

Inside the internal OS (`apps/web/app/os/`), behind the existing session gate.
Not a new application, not a new domain, not a public route — `/os` is already
staff-only, already excluded from every product domain by route isolation, and
already disallowed in `robots.txt`.

---

See `observability.md` for what each source actually measures, and
`PLATFORM-CONSTITUTION.md` §20 for the certification pipeline that produces it.
