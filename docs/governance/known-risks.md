# Known Risks — Maxpromo Platform

## OPEN — BLOCKING RELEASE — `maxpromo-agents` is connected to the wrong repository

Found 2026-09-06 during the Track A production release, by reading the Vercel
project record rather than by inferring from a failure.

`ADR-0001` named three settings that the consolidation required: *"root
directory, **repository**, and include files outside root directory"*. Two of
the three were corrected on 2026-09-06. The repository was not.

| Project | Connected repository | Root Directory | Correct? |
|---|---|---|---|
| `maxpromo-digital` | `buddy1974/maxpromo.digital` | `apps/web` | yes |
| `maxpromo-agents` | `buddy1974/maxpromo-agent-bureau` | `apps/bureau` | **no** |

`maxpromo-agent-bureau` is the pre-consolidation standalone repository. Its
Next application sits at its root; it has no `apps/` directory at all
(GitHub contents API returns 404 for both `apps/` and `apps/bureau`). So the
project now watches a repository in which its Root Directory does not exist.

**Two consequences, both live:**

1. Merging the monorepo to `main` deploys `maxpromo-digital` and does not
   touch `maxpromo-agents` — the two projects no longer share a source. That is
   why `agents.maxpromo.digital` is still serving a build from 2026-07-24 and
   fails seven of the fourteen production verification rules: no
   `/api/health`, no manifest, no sitemap, no `x-mp-trace`, no `/contact`, and
   a `robots.txt` naming another host.
2. A push to `maxpromo-agent-bureau` would now fail to build, because
   `apps/bureau` is not there.

**The artefact itself is proven good.** A CLI preview deployed from the
monorepo with the corrected Root Directory built `apps/bureau` cleanly
(Next 16.3.4), served its pages, and answered `/api/health` with `database:
ok` in 7–9 ms against the live Neon database. Only the pipeline linkage is
missing.

**The fix** — Vercel dashboard, `maxpromo-agents` → Settings → Git: disconnect
`buddy1974/maxpromo-agent-bureau`, connect `buddy1974/maxpromo.digital`,
production branch `main`. Root Directory is already `apps/bureau`. Then
redeploy. This changes which repository owns a production surface, so it is
Marcel's decision, not a tool's.

**Owner:** Marcel. **Blocks:** the closure of Track A.

---

## OPEN — The platform logger has no call sites

Found 2026-09-06 while verifying production observability.

`packages/observability/logger.ts` provides five levels, a required `surface`,
`redact()` applied by the logger, and `newTrace()`. Across both applications
there are **zero calls to `log.debug`/`info`/`warn`/`error`/`critical`**. The
only things imported from the package anywhere are `runHealth`,
`healthStatus`, `newTrace` and `TRACE_HEADER`.

The consequence is specific and worth stating plainly: `x-mp-trace` is stamped
on every response, and **no log line anywhere carries it**. A correlation id
that appears in exactly one place correlates nothing — you cannot take a trace
id from a response header and find the request behind it.

`redact()` likewise never runs, because nothing logs.

This qualifies the v15.0 observability claim. The facility is built and
correct; adoption is the part that was never done. It also revises the entry
below which says errors "are structured, redacted and carry a correlation id" —
they would be, if anything called the logger.

**Verified rather than assumed:** production request logs for the deployed
build contain only Vercel's own request records — domain, method, path,
status. No email address, telephone number, name or token appears in any line.
That is a true statement about log hygiene and a weak one about observability,
because the application writes no log lines of its own.

**Owner:** a dedicated change, alongside the 77 `console.*` calls and the 37
silent `catch {}` blocks below — they are the same piece of work.

---

## OPEN — Build output is committed in the repository's history

`apps/web/.next/` was committed in `1b4c73f` (the workspace restructure) and
removed later. **Nothing is tracked at HEAD** — the working tree is clean — but
1,007 build-output blobs, about 24 MB, remain reachable in history and are now
on the public GitHub remote. The packed repository is 180 MiB.

**Scanned before pushing, not after.** Every object in the push (2,312 blobs,
80.5 MB) was checked against ten secret patterns, each demonstrated firing on
canary input first. The only matches were the Neon driver's own error-message
template and `.env.example` placeholders of the form
`postgresql://USER:PASSWORD@HOST...`. **No secret material.**

So this is bloat and clone time, not exposure. Removing it means rewriting
history on a public repository, which is a destructive operation and needs its
own decision.

**Owner:** Marcel, if it is worth doing at all. **Blocks:** nothing.

---

## RESOLVED 2026-09-06 — Vercel projects were configured for the pre-consolidation layout

**Marcel set both projects' Root Directory (`apps/web`, `apps/bureau`) and
enabled "include files outside the root directory" on 2026-09-06.** Confirmed
by reading each project record back from the Vercel API before deploying, and
then proven: the production build at `a44a563` completed and the
`routes-manifest.json` failure below did not recur.

The third setting ADR-0001 named — the **repository** — is still wrong on
`maxpromo-agents`. See the first entry in this file.

The original record follows.

Both Vercel projects had **Root Directory `.`**, set when they were created
before the two repositories merged and the applications moved to `apps/web` and
`apps/bureau`.

`ADR-0001` recorded this as required work at the time of the merge — *"Vercel
needs reconfiguring... this is the one step that requires the dashboard"* — and
it was never done.

**Verified, not inferred.** A preview deployment on 2026-09-06 built both
applications successfully and then failed:

```
Error: The file "/vercel/path0/.next/routes-manifest.json" couldn't be found.
```

The build put its output in `apps/web/.next`; the project looked for `.next` at
the repository root.

**The fix is two settings per project** — Root Directory, and "include files
outside the root directory" so `packages/` is available. There is no CLI for
Root Directory; `vercel project` does not expose it. Exact steps in
`deployment/track-a-release.md`.

**Consequence while it is open:** production runs `main` at `7bd892e`, last
deployed 25 days ago. Everything from v13.0 onward is undeployed, including the
fixes for the two RC1 blockers below.

**Owner:** Marcel. **Blocks:** the Track A production release, and therefore the
closure of Track A.

---

## OPEN — RC1-01 and RC1-02 are live in production

Measured against real production over HTTPS on 2026-09-06, before this release:

| | |
|---|---|
| product domains carrying the Maxpromo `<title>` | **9 of 9** |
| product domains canonicalising to `maxpromo.digital` | **9 of 9** |
| `robots.txt` naming `maxpromo.digital` as `Host` | **9 of 9** |
| consultancy pages served on product domains | **9 of 9** — `taxkontrol.de/about` and `restaurant-os.de/about` both return "Über Maxpromo" |
| domains exposing `/api/health` | **0 of 11** |

These are the RC1 blockers, fixed in v13.0 and certified locally, waiting on the
deployment above. They are not new findings; they are the reason the release
matters.

**RESOLVED 2026-09-06** by the production deployment of `a44a563`. Re-measured
against real production over HTTPS after the deploy, with the same harness:

| | before | after |
|---|---|---|
| product domains carrying the Maxpromo `<title>` | 9 of 9 | **0 of 9** |
| product domains canonicalising to `maxpromo.digital` | 9 of 9 | **0 of 9** |
| `robots.txt` naming another host | 9 of 9 | **0 of 9** |
| consultancy `/about` served on a product domain | 9 of 9 | **0 of 9** |
| web domains exposing `/api/health` | 0 of 10 | **10 of 10** |

Each product domain now serves its own `<title>`, canonicalises to its own
origin, names its own origin in `robots.txt` and `sitemap.xml`, and redirects
`/about` to `www.maxpromo.digital`.

**One correction to the "before" row.** The first production smoke test
reported *"0 consultancy routes leaked"*. It compared the response's final host
against the registry's bare `host` key while production redirects bare → `www`,
so every leaking domain scored as "redirected away". Nine were leaking. The
harness now treats a domain's own hosts as both the registry key and
`new URL(origin).hostname`. A checker that reports clean because it compared
the wrong strings is the failure mode ADR-0004 exists for, and this one was in
the release tooling itself.

**Owner:** closed for the nine product domains and the hub.
`agents.maxpromo.digital` is not covered — it was never deployed. See the first
entry in this file.

---

## OPEN — the Agent Bureau database has not seen the new ORM

`drizzle-orm` moved 0.38.4 → 0.45.2 in v15.1 — seven minor versions of a 0.x
library. Verified by typecheck, lint, production build and `drizzle-kit check`
against the existing migration journal. **Not** verified against a live
database, because this environment has no connection to one and should not.

No migration is required: the schema is unchanged, only the ORM version moved.
Do not run `drizzle-kit push` or `migrate` as part of the release.

The non-destructive verification sequence is in
`deployment/track-a-release.md` — health endpoint, sign-in, dashboard reads,
`/api/demo/status`, then the deployment logs for `DrizzleError`,
`PostgresError` or `relation ... does not exist`.

**Owner:** whoever runs the release. **If it regresses:** roll back; nothing in
this release changes a schema, so a code rollback is complete.

---

## RESOLVED 2026-09-06 (v15.1) — Four HIGH security advisories

All four are remediated. `next` 16.1.6 → 16.3.4 and `drizzle-orm` 0.38.4 →
0.45.2; `postcss` and `sharp` moved with Next, which pinned them.

The v15.0 record understated it: npm collapses `next`'s advisories into one
line, and underneath were **28**, including five Middleware/Proxy bypasses and
an SSRF in rewrites — the exact mechanism this platform's route isolation and
staff gate are built on. One of them names Turbopack with a single locale, which
is `apps/web` and the two English-only product domains precisely.

Verified: typecheck, lint and build on both applications; `drizzle-kit check`
against the existing migration journal; 175/175 multi-domain checks; 20
Lighthouse runs against the v15.0 baseline. See **ADR-0011**.

---

## OPEN — Four MODERATE advisories with no published fix, accepted until 2026-12-06

One chain: `drizzle-kit` → `@esbuild-kit/*` → `esbuild@0.18.20`.

**Exposure is nil in practice.** The advisory is that esbuild's *development
server* answers cross-origin requests; drizzle-kit never starts one, using
esbuild only to transpile `drizzle.config.ts` when invoked. `drizzle-kit` is a
devDependency, in no build output, running on no server. The root `esbuild` is
0.25.12, outside the affected range — only the copy nested under
`@esbuild-kit/core-utils` is 0.18.20.

**There is no fix to take.** `drizzle-kit@0.31.10` is the latest published
version and still depends on the deprecated `@esbuild-kit/esm-loader`. npm
suggests `drizzle-kit@0.18.1`, which is a downgrade three minor versions below
what this schema needs.

Recorded in `packages/config/security.ts` with exposure, mitigation, upgrade
path, owner and review date. The acceptance **expires on 2026-12-06**, after
which `audit:dependencies` blocks on it again.

**Owner:** Marcel. **Resolves when:** drizzle-kit drops `@esbuild-kit`.

---

## RESOLVED 2026-09-06 (v15.1) — the domain proof harness had never run

`prove-domains.mjs` carried a shebang on line four, which is a syntax error in
an ES module. It had not executed since it was written in v13.0, so the
fourteen demonstrations it records were a claim rather than evidence for two
sprints.

Repaired. Five of its cases also pointed at asset declarations that moved to
the Brand Registry in v14.0 — those reported ANCHOR MISSING rather than passing
quietly, which is what that guard is for. Repointed; 14/14 fire.

**Worth keeping in mind:** the proof harnesses are not part of `verify`,
deliberately, because they mutate registry files. Nothing therefore notices when
one stops working. Running all three before a release is now part of the
security-release routine.

---

## OPEN — `/api/health` carries no correlation id

The middleware matcher excludes `/api/*` except `/api/os`, so the health
endpoint — the one a monitor calls — is the one response with no `x-mp-trace`.

Pre-existing rather than a regression: it is the same matcher exclusion that
leaves the chat routes without product context (recorded separately). Noted here
because Phase 6 of v15.1 checked correlation explicitly and this is where it
stops.

**Owner:** whoever next changes the matcher — likely Track B, which has to fix
it for the chat routes anyway.

---

## SUPERSEDED — the v15.0 advisory record

`npm audit` reports 8 advisories across 730 packages: 4 high, 4 moderate.

| Severity | Package | | Fix |
|---|---|---|---|
| HIGH | `next` 16.1.6 | HTTP request smuggling **in rewrites** | `next@16.3.4` — not a major |
| HIGH | `drizzle-orm` 0.38.4 | SQL injection via improperly escaped identifiers | `drizzle-orm@0.45.2` — major |
| HIGH | `postcss` | XSS via unescaped `</style>` in stringify output | carried by `next@16.3.4` |
| HIGH | `sharp` 0.34.5 | inherited libvips CVEs | carried by `next@16.3.4` |
| MODERATE ×4 | `esbuild`, `drizzle-kit`, `@esbuild-kit/*` | dev-server request exposure | `drizzle-kit@0.31.10` — major |

The `next` advisory is the one to read twice: this platform's entire host
architecture is middleware rewrites across ten public domains.

**Not acted on, deliberately.** The v15.0 brief asked for a recommendation;
upgrading the framework that routes ten domains deserves its own change with
its own verification, and `drizzle-orm` and `drizzle-kit` are major versions
with migration surface. `PLATFORM-CONSTITUTION.md` §19 puts security decisions
with Marcel.

**Recommended order:** `next@16.3.4` first — one patch bump closes three of the
four HIGH findings and is the one that matters most here. Then `drizzle-orm`
0.45.2 against the Agent Bureau schema. Then `drizzle-kit`, which is dev-only.

**Owner:** Marcel. `audit:dependencies` prints all eight on every run.

---

## OPEN — Mobile performance is below the floor on six of ten domains

Measured 2026-09-06, Lighthouse against a local production build, every public
domain, desktop and mobile. Recorded in
`docs/governance/performance-baseline.json`.

```
desktop   performance 100 on all nine product domains
mobile    79–90, floor is 85
          below: maxpromo.digital 79 · pflege-care24.de 80
                 super-praxis.de 81 · taxkontrol.de 81
                 publishers24.org 82 · restaurant-os.de 84
mobile    LCP ~3.4s on every domain — above the 2.5s "good" line,
          below the 4.0s "poor" line. Uniform, so structural.
```

CLS is 0.000 everywhere, which is the hard one and it is already right.

The uniformity is the finding: the same hero composition on every domain, so
this is one fix rather than six. Lighthouse names `lcp-discovery-insight`,
`render-blocking-insight` and `image-delivery-insight` on the product pages.

**Not fixed in v15.0:** the brief was to make performance measurable, not to
optimise. Optimising the hero is a change to a page, with a visual consequence,
and it belongs in a change that says so.

**Owner:** a dedicated change. **Blocks:** nothing today.

---

## OPEN — Accessibility findings Lighthouse sees and the in-repo audit does not

`audit:a11y` reports clean across 36 routes. Lighthouse, on the same build,
scores accessibility 93 on the hub and 96 on every product domain, and names:

- `color-contrast` — on the hub and on every product domain
- `target-size` — hub only, touch targets under 24×24 with insufficient spacing
- `label-content-name-mismatch` — a visible text label whose accessible name
  does not match it (WCAG 2.5.3)

Neither tool is wrong. `audit:a11y` checks token pairs and document structure;
Lighthouse renders the page and measures computed styles, which is where these
live. The gap is that the in-repo audit cannot see a contrast failure produced
by composition rather than by a token pair.

**Owner:** a dedicated change. The specific elements need identifying from a
full Lighthouse report before anything is edited.

---

## RESOLVED 2026-09-06 — `best-practices` and one SEO score could not be measured locally

One Lighthouse run against the production deployment over HTTPS, exactly as
this entry predicted would close it. `https://www.maxpromo.digital/de`, mobile,
against `a44a563`:

| | local build | production |
|---|---|---|
| performance | 79 | **90** |
| accessibility | 93 | 93 |
| best-practices | 78 | **100** |
| seo | 92 | **100** |

`is-on-https` and `redirects-http` both pass on Vercel, as expected. The
unexplained SEO 92 was a localhost artefact: the `canonical` audit scores 1 on
production against a structurally identical tag. LCP 2.6 s, CLS 0, TBT 130 ms
— all better than the recorded mobile baseline.

Accessibility is unchanged at 93 and is covered by the entry above; production
reproduces the recorded number exactly rather than revealing anything new.

The original record follows.

## (original) OPEN — `best-practices` and one SEO score cannot be measured locally

Every domain scores `best-practices` 78, and the two failing audits are
`is-on-https` and `redirects-http`. The local harness serves over HTTP; on
Vercel neither can be true. **The real production score is almost certainly
100, and this is recorded rather than corrected** because a number that cannot
be measured where it is measured should say so.

Separately: `maxpromo.digital` scores SEO 92 against 100 on every product
domain, failing the `canonical` audit — while emitting a structurally identical
canonical tag. Unexplained from the local harness.

**What closes both:** one Lighthouse run against the production deployment over
HTTPS. **Owner:** whoever next deploys.

---

## OPEN — Thirty-seven `catch {}` blocks swallow their error

Counted 2026-09-06 across both applications. Each is a place where something
failed and the platform decided not to mention it. Some are deliberate and say
so in a comment; they have never been reviewed as a group.

Now that `@maxpromo/observability` exists, the fix for a non-deliberate one is
a single `log.warn`. The review is the work, not the edit.

Related: 77 `console.*` calls predate the logging standard and have not been
migrated. Mechanical, touches almost every file, belongs in its own change.

**Owner:** a dedicated change.

---

## OPEN — There is no field data, and no destination for anything logged

Every performance number the platform has is a **lab** measurement from
Lighthouse on one machine. What real visitors on real connections experience is
unmeasured, and needs traffic plus a collector.

Nothing is shipped off-platform either: no error reporting service, no log
drain, no uptime monitoring. Errors are structured, redacted and carry a
correlation id — they are ready to be sent somewhere, and nowhere is chosen.

Each option is a paid service and a data-processing relationship, which
`PLATFORM-CONSTITUTION.md` §19 puts with Marcel rather than with a tool.

**Owner:** Marcel. **Blocks:** any claim about real-world performance, and any
response to an error nobody was watching for.

---

## OPEN — No product has a mark of its own

Thirty-five asset slots are empty across twelve brands: eleven product logos,
twelve monochrome logos, twelve Apple touch icons. Forty-two more carry
something that is not right: every product domain shows the company favicon in
the browser tab, and every social card is a 1536×1024 product image where a
1200×630 card belongs.

Nothing is broken — products are identified typographically, which is coherent,
and social platforms crop rather than reject. But a visitor cannot tell one
open tab from another, and a saved iOS home-screen shortcut gets a screenshot of
the page.

`check:brands` prints the KEEP / REPLACE / CREATE / REMOVE counts on every run,
so this is a number rather than a memory. Nothing was invented: an asset that
would look designed is worse than one that is declared absent.

**What closes it:** design work — a mark per product, a monochrome variant, a
180×180 icon, a 1200×630 card. **Owner:** Marcel.

---

## OPEN — The company's memory and its registries name different products

`openclaw/core-memory.md` lists *CreatorOS*, which has no product entry, no
brand record and no domain; and *DriveMe*, which is what the product registry,
the brand record and the live domain all call **Drive24**. It also omits four
products that exist and are live: CareOS, RealEstateOS, PublishingOS and Max
Agent Bureau.

The memory was not rewritten — that document's own rule is that history is
appended to, never deleted — so a note below it names the Brand Registry as the
authority and records the disagreement. `audit:docs` reports it every run.

**Two questions:** is CreatorOS a plan or a lapsed idea, and which name does
Drive24 go to market under? **Owner:** Marcel.

---

## OPEN — There are two AI stacks and only one has a safety layer

`apps/web` and `apps/bureau` each have their own provider abstraction, prompt
file and types. `apps/bureau/lib/ai/safety.ts` bounds input length and raises a
risk floor for tax, finance, invoicing, legal and contract topics. `apps/web`,
which serves the public chat on ten domains, has no equivalent.

The model `claude-sonnet-4-6` is named in ten files, so a model change is a
ten-file edit and a partial one is silent. Nothing checks what an assistant says
about the company — `audit:claims` covers authored copy only.

Mapped in `architecture/ai-governance-readiness.md`. Nothing was changed in
v14.0: the sprint's non-goals forbade touching assistants, prompts and chatbot
behaviour.

**Owner:** Track B, the AI Governance Programme.

---

## OPEN — Next 16 deprecates the `middleware` file convention

The production build warns: *"The `middleware` file convention is deprecated.
Please use `proxy` instead."* `apps/web/middleware.ts` is where host resolution,
route isolation and language governance all live, so the rename is a change to
the platform's most load-bearing file and belongs in its own change with its own
verification, not as a rider.

Not urgent — the convention still works — but it will stop working.

**Owner:** a dedicated change before the next major Next upgrade.

---

## OPEN — Two product domains have no German copy

`publishers24.org` (PublishingOS) and `drive24.live` (Drive24) are declared
English-only in the Domain Registry, because that is the only language they have
copy in: PublishingOS carries German for 1 of its 16 localised fields and
Drive24 for none. Every other product in the registry is complete in both.

Until v13.0 this was invisible and worse: the registry falls back from German to
English field by field with no warning, so both domains served a German route
that rendered English product copy inside German section headings, under
`<html lang="de">` — and a visitor sending no `Accept-Language` was redirected
there by default. The domains now serve English only, `/de` redirects, and the
language switcher does not render.

**What closes it:** German copy for the two products, written by Marcel — 15
fields and 8 fields. Adding `'de'` to one array in `packages/config/domains.ts`
is the whole of the code change, and `check:domains` fails the build if that
array claims a language the product does not have.

**Owner:** Marcel. **Blocks:** German-market launch of those two products only.

---

## OPEN — Nine domains share the company favicon and use product cards as social images

Every product domain declares `/favicon.ico` — the Maxpromo mark — and a
1536×1024 product card where a purpose-built 1.91:1 social card belongs.
Social platforms crop a 3:2 image rather than reject it, so nothing is broken;
the domains simply look less like independent properties than they now are.

`check:domains` reports both counts on every run, so this is a number in a
report rather than something to remember.

**What closes it:** design assets — a mark and a 1200×630 card per product.
**Owner:** Marcel.

---

## OPEN — Agent Bureau names itself differently from every other surface

`agents.maxpromo.digital` titles itself "Max Agent — Ihr KI-Betriebsteam |
Maxpromo Digital". `products.ts`, the hub's homepage section and the Domain
Registry all call the product **Max Agent Bureau**. Three surfaces against one.

Left unchanged deliberately: which name the product goes to market under is a
brand decision, not a drift fix. `audit:domain-experience` reports it on every
run against the bureau.

**Owner:** Marcel.

---

## OPEN — Chat sessions never learn which product the visitor is on

`apps/web/app/api/chat/session/route.ts` and
`apps/web/app/api/chat/message/route.ts` read `x-mp-slug` and
`x-mp-default-locale` to record product context. The middleware matcher excludes
`/api/*` except `/api/os`, so those headers never arrive: `productSlug` is
recorded as `null` on every session and the locale always defaults to `de`. A
chat opened on `drive24.live` is stored as German, with no product.

`docs/architecture/sprint-correction/domain-strategy.md` states that Max knows
it is in the RestaurantOS context "via the `x-mp-slug` header injected by
Phase 1 middleware". It does not receive it.

The Domain Registry now names the identity each domain reports under
(`chatIdentity`). Wiring it up is Track B, the Chat Assistant Forensic Audit,
and was deliberately not touched in v13.0.

**Owner:** Track B.

---

## OPEN — Agent Bureau claims EU hosting; its database is in us-east-1

`agents.maxpromo.digital` states publicly, in its hero: "DSGVO-konform, in der
EU gehostet, gebaut in Essen." Its Neon database is in **us-east-1** (Virginia).
The web application's is correctly in eu-central-1.

The tables in that US instance include `contacts`, `leads`,
`waiting_room_items`, `memory_entries` and `document_intake_items` — personal
data of German business contacts.

This is a factual mismatch between a public statement and deployed
infrastructure, with GDPR Chapter V (third-country transfer) implications.

**Not resolved unilaterally, deliberately.** Both available actions are
Marcel's: changing the copy removes the claim rather than the discrepancy and
erases the evidence of it; moving the database is a production data migration
on live customer records.

**Disclosure:** the sentence in its current wording was written during the v5.1
copy rewrite. The claim predates that as the trust badge "EU-gehostet", but it
was carried forward without being checked against the infrastructure.

**Owner:** Marcel. **Blocks:** onboarding further personal data into Agent
Bureau.

---

## 2026-07-10 — Build/typecheck/lint unverified after public MVP sprint (BLOCKING)

The Cowork session's sandboxed shell had a stale page-cache bug on this repo's mount: content of files edited during the session was served from an old cached copy (confirmed via `stat` mtimes up to a month stale) even though every file was correctly written to the real Windows filesystem. As a result, `npm run build`, `npx tsc --noEmit`, and `npm run lint` could not be run trustworthily from inside that session. Every changed file was manually re-verified structurally sound (balanced JSX, no truncation) by reading it directly, but this is not a substitute for a real build.
**Action required: run `npm run build`, `npx tsc --noEmit`, and `npm run lint` locally before the next deploy.**

## 2026-07-10 — In-memory rate limiting won't survive multi-instance/serverless scale

Rate limiting added this sprint (`newsletter/subscribe`, `estimate`, `estimate/send`, `discovery/estimate`, `discovery/send`, `portfolio/auth`, `os/login`) uses an in-memory, per-process, per-IP sliding window (`lib/rate-limit.ts`) — no Redis/Upstash dependency exists in this repo. Fine at current traffic; will not hold once the app runs across multiple serverless instances or survives cold starts reliably. Revisit with a shared store if traffic or deployment topology changes.

## 2026-07-10 — Newsletter honeypot is backend-only

A honeypot field check was added to `app/api/newsletter/subscribe/route.ts`, but no frontend form currently sends a hidden `website`/`company_url` field, so it's currently a no-op. Needs whichever component renders the newsletter form updated with a hidden field to activate; there is no dedicated NewsletterSignup component today.

## 2026-07-10 — Open Graph image is an interim fallback

`app/layout.tsx` now points OpenGraph/Twitter `images` at `/logo.png` (square logo) so shared links never render blank, but this is not a proper 1200×630 social-preview asset. Produce a dedicated OG image.

## 2026-07-10 — Homepage pain cards and 5 service-page hero photos still missing

`public/images/homepage/pain/` and 5 `public/images/services/{slug}/hero.jpg` paths have no approved photography. Both currently degrade gracefully (no broken images), but the visual is incomplete until real photography is dropped in — shot lists exist in `public/images/homepage/README.md` and `public/images/services/README.md`.

## 2026-07-10 — Unverified locale-leak claims from the release audit

`/de/automation-audit`, `/de/discovery`, `/de/portfolio`, `/de/automation-lab`, `/de/data-deletion` were flagged in a prior audit as rendering English content on German routes. This was not independently re-checked in the 2026-07-10 sprint — status unknown, needs verification.

## 2026-07-10 — Sandbox-only orphan files (non-blocking, cosmetic)

Six `.fuse_hidden########` files and one `.tsc_out.txt` were left in the working tree by the sandbox's FUSE mount during concurrent file writes this session. They are untracked, contain no useful content (old pre-edit copies), and could not be deleted from the sandbox (`Operation not permitted`). Safe to delete by hand if still present.

## 2026-09-03 - Agent Bureau is still on the retired orange (VISIBLE)

maxpromo-agent-bureau was not touched in the v4.0 pass. It is a separate
repository on Next 15 / Tailwind v3 and cannot consume design/tokens until it is
aligned to Next 16 / Tailwind v4 (batch B1). Until then agents.maxpromo.digital
renders in the retired orange while maxpromo.digital renders in Brand Lime.
**This is the one place the ecosystem is currently visibly inconsistent.**
Prioritise B1 then B8.

## 2026-09-03 - app/os surfaces remain dark; 235 hardcoded values

The OS accent was unified so it flipped to lime with everything else, but its
dark surfaces are untouched. The marketing site is light and the internal OS is
dark - still two visual languages, now sharing one accent. The light migration
is a redesign of 13 pages plus decomposition of a 489-line layout component, and
was deliberately not coupled to the brand change. Decision D3 is still open.

## 2026-09-03 - No mechanical enforcement of the no-hardcoded-colour rule yet

Phase 2 section 4.4 specified a CI check failing the build on hex literals
outside the token package, plus a lint rule banning raw Tailwind palette
classes, introduced warn-only and promoted to error at the end. Neither is
implemented yet. The v2.1 system was specified in August, implemented twice, and
still left 1252 hardcoded values - writing the rule in a document has already
been tried and has already failed. Without the check, drift will resume.

## 2026-09-03 - Responsive and accessibility QA incomplete

Browser QA covered the homepage and a product page at 1440px, plus
computed-style verification of token resolution. Not yet done: mobile and tablet
breakpoints across the full page set, keyboard navigation, focus-state audit,
ARIA review, and a systematic contrast audit of every rendered pair. The token
values were contrast-checked at design time; the rendered result has not been.

## 2026-09-03 - Showcase product imagery is off-brand marketing collage

The product pages (for example /systems/handwerk-os) carry large promotional
composites containing their own green branding, their own typography and their
own layout. v4.0 requires that every image teach something and that decorative
marketing imagery be removed. These are content assets, not code, and need
replacing with real product screenshots, workflow diagrams or architecture
illustrations.

## OPEN — the Agent Bureau dashboard renders from mock data

Every page under `/dashboard` reads from `lib/mock/*` (14 files). The 19 API
routes behind them query the real database, are correctly guarded and, where
they mutate, rate limited — but nothing calls them.

This is not dead code and must not be deleted: it is a working, secured data
layer that the interface has not been wired to. The v6.0 platform audit
reported those routes as uncalled, and deleting them on that signal would have
destroyed the layer.

**Consequence:** the dashboard looks finished and is not. Anyone demonstrating
it should know the figures are fixtures.

**Owner:** Marcel. **Next step:** wire the pages to the queries, page by page,
verifying tenant scoping on each.

---

## Technical debt — recorded 2026-09-03

- **Tenant ownership is checked inline per route**, not through a shared
  helper. Every new route that reads tenant-scoped data must remember to derive
  `businessId` from the session and compare. The reasoning and the pattern are
  in `docs/architecture/agent-bureau-route-protection.md`.
- **Most Agent Bureau API routes have no rate limit.** Only `/api/leads`,
  `/api/ai/generate` and `/api/approvals/[id]` do. The others are
  authentication-gated, so the exposure is bounded, but an authenticated client
  can call them without limit.
- **`apps/os` is not extracted.** The internal OS still lives inside
  `apps/web`, sharing `lib/db` and `lib/email`. Extraction needs
  `packages/shared` first, plus its own domain and Vercel project.
- **No automated test suite.** Verification is types, lint, build and four
  audits. There are no unit or integration tests; correctness of business logic
  — invoice totals, VAT handling, document numbering — rests on review.

---

---

# Agent Bureau — risks carried over

These were recorded in the Agent Bureau repository's own known-risks document
before the repositories merged; that repository is archived. They are reproduced verbatim; nothing has been re-assessed.

Last updated: 2026-09-04 (v7.0 — enterprise polish)

---

## P0 — Critical (block real client data)

| # | Risk | Detail |
|---|------|--------|
| 1 | ~~Dashboard routes are public~~ | **RESOLVED — Auth-2 complete.** `middleware.ts` with `withAuth` protects `/dashboard/:path*`. Unauthenticated requests redirect to `/login?callbackUrl=<path>`. |
| 2 | ~~`/api/ai/generate` is a public cost surface~~ | **RESOLVED — Auth-3 complete.** `requireApiBusinessId()` guard added. Unauthenticated requests receive 401. Rate limiting still pending (Auth-4). |
| 3 | ~~`/api/approvals/[id]` is mutable without auth~~ | **RESOLVED — Auth-3 complete.** 401 if no session; businessId ownership check returns 404 (IDOR-safe); actorName sourced from session. |
| 4 | ~~No tenant isolation~~ | **RESOLVED — Auth-5 complete.** All read queries now accept `businessId: string` sourced from `session.user.businessId`. `getDemoBusinessId()` removed from all route paths; retained in `_shared.ts` for seed scripts only. |
| 5 | ~~No rate limiting~~ | **RESOLVED — Auth-4 complete.** Fixed-window rate limiting added to `/api/leads` (5/60s IP), `/api/ai/generate` (10/60s user), `/api/approvals/[id]` (20/60s user), login (10/900s email). Upstash Redis in production; in-memory fallback for local dev. |

**Rule:** Do not onboard real client data until Auth-1 through Auth-5 are complete.

> ✅ Auth-1 through Auth-5 are now complete. Tenant isolation is enforced. Real client onboarding is unblocked.

---

## P1 — High (must resolve before scaling)

| # | Risk | Detail |
|---|------|--------|
| 6 | ~~Drizzle migration baseline/journal reconciled~~ | **RESOLVED — Auth-0 complete.** Baseline `0000_burly_black_bird.sql` is DO-NOT-APPLY. `0001_auth_user_columns.sql` generated for review. Neon apply pending Marcel + Opus approval. |
| 7 | Real client data must not enter the system before Auth-1 to Auth-4 complete | The current demo state contains seeded test data only. Real business data requires tenant isolation and ownership checks first. |
| 8 | Datenschutz must be updated before scaling paid traffic or handling real client dashboard data | Current privacy policy may not reflect actual data flows once client tenants are active. |
| 9 | Telegram lead notifications carry lead PII | Lead name and email are sent to a Telegram bot on every form submission. This is documented and intentional but must remain auditable and disclosed in Datenschutz. |
| 10 | OpenAI usage has no cost logging | No per-request cost tracking. Usage cannot be attributed to a tenant, audited, or capped. |

---

## P2 — Medium (acceptable during concierge phase)

| # | Risk | Detail |
|---|------|--------|
| 11 | Manual password reset only | During concierge onboarding, password reset will be manual (Maxpromo-operator action). Self-serve reset deferred. Acceptable while user count is small. |
| 12 | No MFA | Single-factor auth only in Auth-1. MFA deferred. |
| 13 | ~~Demo workspace depends on name lookup at runtime~~ | **RESOLVED — Auth-5 complete.** `getDemoBusinessId()` removed from all route query calls. Session `businessId` used throughout. |
| 14 | Some dashboard pages still use config/mock data | Dashboard modules sourced from static config or mock queries. Must be verified against live Neon data before client onboarding. |
| 15 | Mobile dashboard nav needs improvement | Current sidebar/nav layout has known mobile UX gaps. Not a security risk, but noted for pre-launch readiness. |

---

## P1 — Documentation / governance gaps (from 2026-08-11 preflight)

| # | Risk | Detail |
|---|------|--------|
| 16 | ~~Design direction conflict, unresolved~~ | **RESOLVED — 2026-08-11.** Product Owner confirmed full supersession via explicit execution plan; ADR-002 updated. Phases 1–6 (tokens, Nav/Footer/forms, homepage, Agent Bureau, remaining marketing pages, dashboard) are all implemented. `PLAN.md` §7–8 lock language still needs a follow-up edit so it stops contradicting `decision-log.md` (tracked, not yet done — see risk 19). Phases 7–8 (content/copy review, final QA sign-off) remain open. |
| 18 | ~~Phase 1 not verified against a full project build~~ | **RESOLVED for Phases 1–6 — 2026-08-11.** `npx tsc --noEmit` and `npm run build` both ran clean (21/21 routes compiled and prerendered) in this session. Live-browser visual QA could **not** be completed — this machine has an unrelated project already bound to ports 3000/3001, and a local networking layer routes `localhost` traffic on those ports to that project's dev server regardless of which process owns the socket (confirmed via `netstat` + direct `curl` to both `127.0.0.1` and `[::1]`). This is a local machine/networking issue, not a code defect. **Marcel: run `npm run dev` locally (or free up ports 3000/3001) and do a visual pass against `docs/brand/visual-facelift-v2.1-superseded.md` before treating this as fully verified.** |
| 17 | ~~Governance docs incomplete~~ | **RESOLVED — 2026-09-05 (v14.0).** `docs/PLATFORM-CONSTITUTION.md` is now the single highest-level document and indexes the whole tree; `docs/README.md` maps every directory. The July required-reading list named six documents that were only partially present — `decision-log.md` and `known-risks.md` exist, the other five do not. The AI Operating System template source (`C:\Users\loneb\Documents\AI-OPERATING-SYSTEM\MASTER-AI-OPERATING-SYSTEM.md`) is outside the folders connected to this session, so templates couldn't be pulled. |
| 19 | ~~`PLAN.md` §7–8 still states the old dark-premium lock~~ | **RESOLVED — 2026-08-11.** `PLAN.md` §7 and §8 now carry a superseded-note pointing to `docs/brand/visual-facelift-v2.1-superseded.md` / ADR-002; historical text struck through, not deleted. |
| 20 | Visual Facelift Phases 7–8 (content/copy review, final QA sign-off) not started | Phases 1–6 are implemented and build-clean; nobody has done a content/copy pass (v2.1 §15 "remove every vibe-coded signal" applies to copy too, not just visuals) or a final cross-page QA sweep. Recommend Marcel do a visual pass locally first (this also closes risk 18), then decide if a dedicated content-review phase is still wanted. |

---

## P2 — Platform debt recorded during v7.0 (2026-09-04)

| # | Risk | Detail |
|---|------|--------|
| 21 | `middleware.ts` uses a convention Next 16 deprecates | Next 16 warns on every build that the `middleware` file convention is deprecated in favour of `proxy`. **Not migrated, deliberately.** Both files are the authentication enforcement layer: `apps/web/middleware.ts` gates `/os/*` and `/api/os/*` on a signed cookie, and `apps/bureau/middleware.ts` is a NextAuth v4 `withAuth` default export guarding `/dashboard/*`. NextAuth v4's helper is written against the middleware convention and its behaviour under `proxy` is unverified; a wrong guess here silently opens a dashboard rather than breaking a build. **Action:** migrate deliberately, against a preview deployment, verifying that an unauthenticated request to `/os` and to `/dashboard` still redirects. Do not treat as a mechanical rename. |
| 22 | The icon set is bundled as one module | `packages/ui/primitives/Icon.tsx` keys every path off one object, so any client component importing `Icon` pulls the whole set. Measured cost: apps/web client JS went from 1055 KB to 1087 KB (+32 KB uncompressed, roughly 8 KB gzipped). Acceptable at ~45 icons; if the set passes roughly fifty, either split into per-icon modules or adopt a licensed set — see ADR-0003. |
| 23 | 255 of 825 type sizes, and 718 spacing declarations, are still raw | **Type:** was 906 of 927; the scale gained its two bottom steps and 649 declarations moved on at identical values, 2% to 69%. What is left must move about a pixel to reach a step. **Spacing:** 575 declarations moved onto `--space-*` at identical values; 718 did not, because at least one part of the shorthand is off the scale. The scale steps in eights above 16px and the product is built at a granularity of two — 10px (189), 14px (106), 20px (105) and 6px (79) account for most of it, and 657 of 1,030 raw parts do not land on a 4px grid. Neither is wrong; they do not describe each other. **Action:** one design pass that decides, per band, whether the scale gains steps or the call sites move. Not a script — every option is a visible change on dense screens. |
| 24 | 10px uppercase mono remains at the edge of legibility | Unchanged, and now named: `--text-label-dense`. 265 declarations sit on it, on form labels, table headers and status badges in uppercase mono at 0.2em tracking. The 1px step up from 9px was chosen over a larger one because 91 sites across dense tables could not be visually verified in-session and a 22% jump risks wrapping column headers that currently fit. **Action:** a human should look at the OS tables and decide whether those labels belong at 11px (`--text-label`). |
| 25 | 19 Agent Bureau API routes are a secured data layer nothing calls | Carried forward. The dashboard renders from `lib/mock/*` while the routes exist, are authenticated, and are unreferenced. They are not dead code to delete; they are unfinished wiring. |
| 26 | ~~The showcase engine keeps a second heading scale~~ | `apps/web/components/landing/showcaseTokens.ts` exports `HEADING_SIZE` — five clamp values (`display`, `cta`, `section`, `compact`, `narrative`) parallel to `--text-h1/h2/h3`. It is documented as the two-tier brand rather than an accident, and the ten showcase domains are a different surface from the consultancy site. But it is a second type scale in a repository whose first governance rule is "never two implementations", and nothing checks that the two stay in proportion. **Action:** decide whether the showcase tier is a deliberate second scale (then say so in an ADR and check it) or drift (then fold it into the platform scale). **Resolved 2026-09-04 (v10.0).** It was mostly already gone: the file's own header said the heading scale had moved to the platform, while the constant survived that sentence by a release with five entries, two of which had no consumers and one of which was the 4rem display size the design system retired by name. Two live consumers were paragraphs used as section headings — so two showcase sections had no heading in the outline at all. One is now an `h2`, the other joins the scale, and the constant is deleted. |
| 27 | `audit-consistency` compares declarations, not resolutions | It fetches both applications' emitted CSS and compares token values as text. That is what let the typeface divergence of ADR-0006 pass: both applications declared `--brand-font-sans: var(--font-inter), ...` character for character, and only one of them defined `--font-inter`. `check-token-inputs` closes that specific hole. The general one — a value that reads identically and resolves differently — is still open, and closing it means running a real browser and reading `getComputedStyle`. **Action:** consider driving the two apps through a headless browser in `certify`. |
| 28 | ~~The internal OS keeps its own status colour map~~ | `apps/web/app/os/(protected)/leads/page.tsx` declares a local `STATUS_COLOR`. ADR-0002 replaced eleven such maps in Agent Bureau with the shared tone system, but the OS uses inline styles with CSS custom properties while `TONE_TEXT` / `TONE_BADGE` export Tailwind class strings, so it cannot consume them. One of its five entries was the brand accent used as a status, which v7.0 corrected to `--semantic-warning`. **Action:** either add a CSS-custom-property form of the tone maps to `@maxpromo/ui`, or move the OS onto classes. **Resolved 2026-09-04 (v10.0):** the first of those. `TONE_VARS` is the same six tones as custom properties. It was nine maps, not one — five colouring a status with the brand accent, and four appending a hex alpha pair to a `var()` reference, which is not a colour and never rendered. See ADR-0002, amended. |
| 29 | The two applications answer "nothing here" differently | Agent Bureau has an `EmptyState` component — icon, title, hint, on the shared `.empty-state` panel. The internal OS renders one line of muted 13px text inside a table cell, at twelve sites. Neither is wrong and they are not duplicates of each other, which is why no rule catches it; they are two different answers to the same question in one platform. The OS variant sits inside `<td colSpan>`, so adopting the panel is a real change to the table design rather than a swap. **Action:** decide whether the line is the deliberate dense-table variant (then name it in `@maxpromo/ui` alongside the panel) or an omission (then move `EmptyState` into the package and adopt it). |
| 30 | `.btn-ghost` has no consumers | Declared in `packages/ui/components.css` with focus and disabled states, referenced by neither application. It is part of a coherent button set rather than an accident, so it is recorded rather than deleted — but a variant nothing uses has never been seen, and its hover treatment is unverified. |
| 31 | The showcase engine's scroll reveal runs on one page | `components/ui/Reveal.tsx` fades content up on scroll and is used by `agent-bureau` and nowhere else, so one page of the site has a motion language the other twenty do not. It is well built — SSR renders it visible, it respects reduced motion — but it also sets `opacity: 0` after hydration, so an element already on screen when the effect runs is hidden and re-shown for at least a frame. **Action:** decide whether scroll reveal is the platform's motion language or none of it is, and either adopt it or remove it; if it stays, skip elements already in the viewport at mount. **Half resolved 2026-09-04 (v10.0):** an element already on screen when the effect runs is now left alone, so nothing is hidden and re-shown. Whether scroll reveal is the platform's motion language or none of it is remains open. |
| 32 | The type scale has no step between 13px and 15px, and the product wants 14 | 14px is used 43 times for type and 106 times for spacing. It is the clearest single gap left in the scale and is bundled into the risk-23 design pass rather than decided here. |
| 33 | **The same case study is quoted in two currencies** | The homepage proof strip says `€14k/mo`; the case-studies page says `£14,000/month` — both in both languages, on a site selling to German SMEs from Essen. `npm run audit:claims` reports it (ADR-0007). **A second problem sits behind the first:** the case study states three people spent two days a month each on reconciliation — six person-days — and claims £14,000/month saved, which is about £2,300 per person-day. The figure does not follow from the inputs the same paragraph gives. **Not corrected here.** Which currency, and whether the figure is right, are both statements about delivered work. |
| 34 | **The proof numbers are framed two ways in the same section** | The homepage strip introduces the three figures as "Examples of operational outcomes our systems are **designed to improve**" and closes them with "**Results from live production systems.** Client details withheld under NDA." One is aspirational, the other is a factual claim about delivered work, and they sit four lines apart. The Resources page raises the stakes: it describes case studies as "Specific projects… **without numbers we cannot evidence**". A reader who notices stops trusting the figures, and the site has stated the standard it is failing. **Not corrected here** — resolving it means deciding whether the numbers are evidenced, which is Marcel's to state. |
| 35 | Agent Bureau is German-only, and the hub is bilingual | `agents.maxpromo.digital` has no locale routing — `/en` is a 404 and `<html lang="de">` is fixed. An English visitor reads the English hub, follows the English Agent Bureau page, clicks "View system" and lands in German. Building the English site is new scope, deliberately out of bounds for a refinement pass. **Action:** decide whether Agent Bureau is a German-market product (then say so on the hub before the link) or a bilingual one (then it needs the locale work the hub already has). |
| 36 | Eight of thirteen articles are written and unpublished | `content/blog/*` holds 13 posts; 5 are `status: published`. One of the drafts is complete enough that two other articles linked to it, which is how a published article came to point at a 404. **Action:** an editorial pass — publish, cut, or mark them clearly as a backlog. Resources build authority only once they are readable. |
| 37 | No resolver for translated strings nothing renders | 160 strings across four homepage sections were maintained in both languages and rendered by nothing; they were found by reading which namespaces the page actually calls. Keys are often built dynamically (`t(\`${id}Title\`)`), so a naive scan reports hundreds of false positives and cannot be trusted to delete. **Action:** a resolver that understands the dynamic-key patterns, or a convention that forbids them. |
| 38 | ~~**The pricing page sells a marketing retainer**~~ | Three monthly plans — Digital Starter / Growth / Full Care, €149 / €249 / €399 — whose contents are website maintenance, a Google Business profile, 4 to 12 **social posts per month**, review responses, a newsletter, **Google Ads management** and **competitor monitoring**. That is a digital marketing agency retainer, offered on the page where a buyer goes to understand the commercial relationship. Every other page says the opposite: "we design and build the systems companies run on", "most businesses do not need another website", "we do not start from a technology". The core memory's permanent rule is that Maxpromo is never positioned as a website or marketing agency. A reader who visits /about and then /pricing concludes /about is aspirational. **Not rewritten** — a company's commercial offer is Marcel's to define. Item-by-item classification in `docs/governance/pricing-alignment-review.md`. **Resolved 2026-09-04 (v9.6):** Marcel retired public pricing entirely. The page, its route, its 64 strings per locale, the nav and footer links and the sitemap entry are gone; `/pricing` redirects to `/contact`. |
| 39 | ~~"Full account team" for a one-person legal entity~~ | `pricing.tiers.t3I8`. The Impressum, the footer and the tax clause all state a single-person business under §19 UStG. A buyer comparing the two has found a discrepancy in the first minute. **Resolved 2026-09-04 (v9.6)** — removed with the page. |
| 40 | **The site disagrees with itself about how long a build takes** | The homepage process section commits to **1–4 weeks** for "Build and go live". Four sections below, the FAQ says installation takes **2 to 6 weeks**. And the three case studies on the site were delivered in **4, 6 and 8 weeks** — every one of them outside the process commitment, two outside the FAQ's. The evidence on the site contradicts the promise on the site. `audit:claims` reports the 1–4 / 2–6 conflict in both locales; framework and inheritance list in `docs/governance/delivery-commitments.md`. |
| 41 | Two lengths for the same first meeting | The homepage says **30 minutes** twice; /about and all six industry pages say **around 45 minutes**. Same meeting, two commitments — the two sentences end with an identical clause. `audit:claims` reports it in both locales; see `docs/governance/delivery-commitments.md`. |
| 42 | ~~**Maintenance is described as included and sold as a subscription**~~ | The homepage FAQ answers "What happens after launch?" with "We stay on. Maintenance, adjustments and improvements are **included, not billed as extras**." The pricing page sells maintenance as three monthly plans. "Included" plausibly means "included in your plan", but a prospect reads it as free, and that is the kind of ambiguity that becomes a dispute after signature. **Resolved 2026-09-04 (v9.6):** there is no subscription to contradict. The FAQ answer stands on its own. |
| 43 | ~~Three complete content sets exist for features that do not~~ | **Resolved 2026-09-04.** `proof.*`, `roi.*` and `faq.*` removed — 49 strings per locale, rendered by nothing. Two carried claims: a customer quote and an ROI payback of "60–90 days" that nothing evidenced and one wire-up would have published. Removing copy that renders nowhere changes no public promise, and git keeps it. It also cleaned the claims audit, which had been reporting a build duration from a dead string as though the site published it. |
| 44 | The engineering discipline is invisible to buyers | The platform runs eight merge gates, keeps seven decision records, audits accessibility across 38 rendered routes and cross-application consistency against two running apps, and refuses to merge without all of it passing. A business buying a mission-critical system asks exactly this, and no public page mentions any of it. It is the strongest available trust signal and the site does not make it. **Not written** — I can verify this platform is built that way; I cannot verify client systems are, and a claim about delivery practice has to come from Marcel. |
| 46 | **The chat agent quoted prices the site never published** | Max's system prompt carried a full price list — *Starter from £2,500, Growth from £6,500, payment plans over £3,000* — with the instruction **"Give specific numbers. Do not be vague."** The offline fallback in `lib/ai.ts` repeated it, `lib/prompts.ts` carried a third copy, and the internal OS assistant a fourth model at €799–€6,000+. Four price models, one of them in pounds, on a German-market site, none matching the published page and none visible to a page audit. It also pointed at `/services` and `/pricing`, both retired routes, and offered an ROI calculator that does not exist and a "60–90 day payback" that nothing evidences. **Resolved 2026-09-04 (v9.6).** The lesson is the general one: a conversational surface is a publishing surface, and nothing was auditing it. |
| 47 | An article quotes the same project's costs in two currencies | `still-running-joomla-2026` gives a migration's hosting cost as "from **£**89/month to **£**19/month" in English and "von 89 **Euro**/Monat auf 19 **Euro**/Monat" in German, four lines above "those are documented outcomes from a real project". Update cost is "£50–£200" and "50–200 Euro". The figures agree; the currency does not. Same class as risk 33 and the same reason for not correcting it: one of the two is wrong and only Marcel knows which. `audit:claims` now reads article content and reports all three. |
| 48 | The chat agent is told to say yes | *"Almost always yes — be confident. Never say we can't do something without being certain."* An instruction to assert capability, on a surface that speaks to prospects unsupervised. Out of scope for the pricing retirement, and recorded because the same prompt has now been shown to carry commercial commitments nobody was reviewing. |
| 49 | ~~Three definitions of the merge gate~~ | **Resolved 2026-09-05.** The root ran eight gates; each application defined a four-gate script of the same name; CI enumerated six steps by hand and had never run `check:token-inputs`, `check:icons` or `audit:typography`. One definition now, called by CI, compared against the standards table by `check:governance`. |
| 50 | The platform has no formatter | No Prettier, no Biome, no `.editorconfig`. Style is whatever each editor does, and it shows — the two PostCSS configs had drifted to different quote conventions while being functionally identical. **Deliberately not added before the freeze:** introducing a formatter now reformats the entire repository, which is the largest possible diff at the moment the objective is to stop changing things. It is the first thing to do after the freeze lifts, in its own commit, touching nothing else. |
| 51 | Hand-drawn SVG icons remain in two components | `AgentBureauSection`'s orbit diagram draws six icons inline, at a stroke weight belonging to no set. ADR-0003 says one icon set; `check:icons` enforces it for Unicode marks and cannot see hand-rolled SVG. The chat bubble had the same problem and was fixed in v7.1. Replacing these changes a diagram's appearance, which a freeze sprint should not do. |
| 45 | ~~`pricing.faq.a2` is classified as a build duration~~ | *"After your business check, we typically start within one week"* commits to a **time to start**, not a build duration, and `audit:claims` reports it under *building and going live* because the two share a key group. Listed rather than silenced: a rule that quietly drops what it cannot classify is the failure ADR-0004 exists to prevent. **Action:** either give time-to-start its own commitment kind, or reword the answer so it does not read as a delivery estimate. **Resolved 2026-09-04 (v9.6)** — the pricing FAQ went with the page. |

---

## Resolution path

Risks 1–5 are resolved by Auth-1 through Auth-4.
Risk 6 is resolved by Auth-0.
Risks 7–10 require process and documentation steps alongside Auth implementation.
Risks 11–15 are acceptable during concierge phase and tracked for later sprints.

