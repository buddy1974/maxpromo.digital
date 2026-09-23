# Frontend QA pass — 2026-09-23

**Verdict: BLOCKED.**

Not "green with findings". The two things this pass existed to do — capture the
five Maxpromo OS evidence artefacts, and exercise the OS as a user — were both
untestable, for two unrelated reasons. Calling the result green because the
parts that *were* reachable came back clean would misrepresent the coverage.

What was reachable came back clean, and that is worth having. It is not a
frontend QA pass.

---

## 1. Executive summary

| | |
|---|---|
| P0 | 0 |
| P1 | 1 (`QA-01`, blocks one evidence capture) |
| P2 | 0 |
| P3 | 1 (`QA-02`) |
| False positives dismissed | 1 (`QA-FP-01`) |
| Evidence captures passed | 0 of 5 |
| Evidence captures blocked | 5 of 5 |

Two blockers, neither improvisable around:

**The browser automation cannot authenticate.** `/os/*` is gated on a signed
session cookie from `/os/login`. The automation browser does not share the
operator's session — the server log shows the operator's `POST /api/os/login`
succeeding, then the agent's navigation to `/os/angebote` being redirected
straight back to `/os/login?returnTo=%2Fos%2Fangebote`. Confirmed three times.
An agent does not type a password into a login form, and minting the cookie
directly is bypassing an authentication control rather than satisfying one.

**The browser extension's script injection is broken in this session.** Five
attempts across two tabs and three routes: every `screenshot` and
`get_page_text` failed with *"Script injection timed out after 5000ms"*, and
`get_page_text` once waited the full 45s for `document_idle`. Navigation works;
reading the page does not.

That second one was isolated before being reported. It **reproduces on
`https://example.com`**, so it is environmental and is *not* a Maxpromo defect.
No page-hang finding is filed against the application on that basis.

---

## 2. Environment tested

| | |
|---|---|
| Application | `apps/web` dev server, `localhost:3020` |
| Agent Bureau | `localhost:3021`, started only for the accessibility audit, stopped afterwards |
| Evidence mode | armed; resolver selects `EVIDENCE_DATABASE_URL` |
| Database | dedicated Neon evidence project, `us-east-2`, synthetic data only |
| Unknown-provenance database | **not accessed** |
| Build | dev (not a production build) |

Everything below was observed against the dev server. Dev mode matters for
`QA-02`.

---

## 3. Routes tested

Nine paths × two locales = **18 route/locale combinations**, all HTTP 200:

```
/                                  /solutions
/solutions/workflow-automation     /solutions/custom-applications
/work                              /contact
/about                             /impressum          /privacy
```

Plus a 404 probe (`/de/this-route-does-not-exist-qa` → correct 404) and, via the
repository's own audit, **41 rendered routes** across both applications.

`/os/*` — **0 routes tested.** Not reachable without a session.

---

## 4. Viewports tested

**None visually.** This is the largest gap in the pass and the directive asked
for nine widths from 320 to 1920. Viewport testing requires rendering, and
rendering requires the script injection that failed.

What stands in for it, partially and by static analysis rather than observation:
`check:responsive` reports 26 multi-column grids all collapsing, 73 media
queries, and no fixed width exceeding the 320px narrowest supported viewport.
That proves the CSS is written to collapse. It does not prove anything about
overflow, clipping, tap-target size, modal height or German copy breaking a CTA
at 320px — every one of which needs eyes on a rendered page.

---

## 5. Evidence capture results

**0 of 5 captured.** All five remain `blockedBy` in `packages/config/proof.ts`,
and the registry was not touched.

| id | file | state | reason |
|---|---|---|---|
| `os-source-note` | `01-source-note.png` | BLOCKED | no authenticated session |
| `os-extraction-result` | `02-extraction-result.png` | BLOCKED | **invalid model credential** — `QA-01`, independent of the session problem |
| `os-form-before-save` | `03-form-before-save.png` | BLOCKED | no authenticated session |
| `os-draft-record` | `04-draft-record.png` | BLOCKED | no authenticated session |
| `os-lifecycle-list` | `05-lifecycle-list.png` | BLOCKED | no authenticated session |

The sixth artefact, `os-workflow-diagram`, remains `satisfiedBy`
`apps/web/components/proof/OsWorkflowDiagram.tsx` — repository basis, unchanged
by this pass, still rendered by no route.

Four of the five are blocked by one thing that one operator login fixes. The
fifth is blocked by something a login will not fix.

---

## 6. P0 findings

None.

---

## 7. P1 findings

### `QA-01` — the configured Anthropic credential is rejected, so AI extraction cannot be evidenced

| | |
|---|---|
| Severity | P1 |
| Category | EVIDENCE · FUNCTIONAL |
| Route | `POST /api/os/ai/enhance`, and `/api/os/ai` |
| Locale | n/a |
| Viewport | n/a |
| Confidence | **High** — server-side evidence, three occurrences |

**Reproduction.** Open `/os/angebote/new`, click `KI-GENERIERUNG`, paste the
governed fictional enquiry, submit.

**Expected.** Structured extraction: three line items at 2.400,00 / 48 × 12,50 /
380,00, totalling 3.380,00.

**Actual.** The upstream call is rejected. From the dev server log, sanitised:

```
[/api/os/ai/enhance] anthropic error 401
  {"type":"error","error":{"type":"authentication_error",
   "message":"invalid x-api-key"}}
[/api/os/ai] Error: Anthropic API error 401 …
   at apps/web/… line 56: throw new Error(`Anthropic API error ${res.status}: …`)
```

Three occurrences, two endpoints. `/api/health` reports the provider as
`configured; not called` — presence is checked, validity is not, so the health
endpoint reads healthy while every call fails.

**Cause, established independently of the log.** The value configured for
`ANTHROPIC_API_KEY` does not have the shape Anthropic issues. This was flagged
before any call was made and the 401 confirms it.

**Consequence for the proof package.** `os-extraction-result` cannot be captured
truthfully. The blocker is recorded and the requirement stays blocked. The form
was **not** hand-filled and presented as an extraction result — that would be
manufactured evidence, and it is the specific thing the directive forbids.

**Not prescribing a fix.** A valid credential is configuration, not code. Worth
a separate look: whether the health probe should validate the provider rather
than only check presence, since "configured; not called" is indistinguishable
from working until something breaks.

---

## 8. P2 findings

None.

---

## 9. P3 findings

### `QA-02` — uncaught TypeError on the localized catch-all (404) page

| | |
|---|---|
| Severity | P3 |
| Category | FUNCTIONAL · PERFORMANCE |
| Route | the localized catch-all, observed at `/de/<missing>` |
| Confidence | **Low–medium**, deliberately |

**Actual**, relayed to the server log by the browser:

```
[browser] Uncaught TypeError: Failed to execute 'measure' on 'Performance':
          'LocalizedCatchAllPage' cannot have a negative time stamp.
```

**One occurrence**, immediately before `GET /de/does-not-exist-qa 404`, so it
belongs to the 404 render and not to the normal routes.

**Why the confidence is low and should stay low.** This has the shape of a
Next.js dev-mode instrumentation artefact rather than application code:
`performance.measure` with a negative start is what happens when a navigation
mark is missing, which dev-mode remounting causes. It was seen once, in dev, and
never in a production build. The component name carries a zero-width space in
the log, which also points at framework-generated instrumentation.

**Suggested investigation area:** reproduce against `npm run build && npm start`
before spending time on it. If it does not appear in a production build, close
it. Do not refactor the catch-all page on the strength of one dev-mode line.

---

## 10. Accessibility observations

Two independent passes, neither of which is a WCAG claim.

**The repository audit, against rendered routes:** `audit:a11y` — **clean across
41 routes** in both applications, each with exactly one `h1`.

**HTML-level checks written for this pass**, across the 18 route/locale
combinations:

- `<html lang>` matches the locale on every page
- exactly one `<h1>` per page, everywhere
- every `<img>` carries an `alt` attribute
- `<h2>` section counts identical between locales on every page

**Not tested, and needed before any accessibility claim:** keyboard-only
navigation, visible focus, focus order, modal focus trapping, Escape behaviour,
label association, contrast as rendered, 200% zoom, touch target size. Every one
of those requires a rendered page.

---

## 11. Console and network observations

Sanitised; no header, cookie, token or connection string is reproduced here.

| | |
|---|---|
| 5xx | none |
| 4xx | one 404 (deliberate probe) · three 401s upstream from the provider — `QA-01` |
| Uncaught exceptions | one — `QA-02` |
| Hydration errors | none seen |
| Failed resources | none seen |
| Repeated requests | `GET /api/chat/session` returns 204 repeatedly, and `GET /manifest.webmanifest` recurs. Both look like normal widget polling. **Not filed as a finding** — a real request-loop judgement needs the network panel, which was unavailable |

Browser console and network panels were unavailable, so this is drawn from the
dev server log and its `[browser]` relay. Treat it as incomplete rather than
clean.

---

## 12. Responsive observations

See §4. Static analysis only: 26 grids collapse, 73 media queries, nothing
exceeds 320px. No rendered observation at any width.

---

## 13. DE/EN parity observations

Clean at the HTML layer, across all nine paths:

- route parity — every path answers 200 in both locales
- **no raw message key rendered anywhere.** The scan looked for `nav.*`,
  `footer.*`, `home.*`, `common.*`, `work.*`, `contact.*`, `solutions.*`,
  `caseStudies.*`, `forms.*` and `meta.*` patterns in served HTML with scripts
  stripped. Zero hits
- section-count parity — identical `<h2>` counts in both locales on every page
- `<html lang>` correct per locale

Not tested: whether longer German copy breaks a layout, and whether the language
switcher preserves the current route. Both need rendering.

### `QA-FP-01` — dismissed, recorded so nobody chases it

The automated check flagged `/impressum` and `/privacy` for having identical
`<title>` in both locales. **This is deliberate.**
`apps/web/app/[locale]/impressum/page.tsx:5` sets
`title: 'Impressum / Legal Notice'` — one bilingual title, on purpose, on pages
that are locked. The check was naive, not the code. No action.

---

## 14. Public commercial-site smoke test

Reachable and correct at the HTTP layer. Specifically checked, because these
were named as regression risks:

| Check | Result |
|---|---|
| Retired orange in emitted CSS | **none** — confirmed twice: this pass's scan of the 2 served stylesheets (100.1 KB on `/de`), and `audit:consistency`, which reports no retired palette in either application |
| Intentional placeholders still present | **both found** — the workflow-automation system screenshot slot, and the founder photograph placeholder |
| Token consistency across apps | `audit:consistency` clean — 33 tokens and 3 component classes resolve identically |
| Type floor | `audit:typography` clean — no size below the floor, no sub-pixel size |
| 404 | correct |
| Response times | 157–592 ms, dev mode, no outlier |

**Not verified, because it needs eyes:** contained hero, heading scale as
rendered, dead space, diagram rendering, mobile navigation, CTA wrapping, black
and lime application. The named visual regressions can be neither confirmed nor
cleared by this pass.

---

## 15. Maxpromo OS functional test

**Not performed.** Zero of the OS surfaces in Part 2 were reachable: login,
dashboard, clients, quotations, invoices, leads, jobs. No session.

The one thing that *is* established about the OS, from the operator's own
authenticated session earlier in the day: `POST /api/os/login` returned 200 and
the dashboard then loaded `/api/os/clients`, `/api/os/invoices`, `/api/os/jobs`
and `/api/os/leads`, all 200, against the evidence database. So the OS works for
an authenticated operator and is reading the right database. That is one data
point from a log, not a functional test.

---

## 16. Screenshots and evidence index

**No screenshots were produced.** `docs/evidence/maxpromo-os/` holds the capture
manifest and no images. No QA defect screenshots either — neither finding needed
one, and neither could have had one.

Locations remain as defined: source evidence in `docs/evidence/maxpromo-os/`,
public derivatives under `apps/web/public/images/systems/maxpromo-os/` (not
created), QA defect screenshots in a separate local location (not needed).

---

## 17. Blocked tests, and the exact reason

| Blocked | Reason |
|---|---|
| All five evidence captures | no authenticated session for the automation browser; password entry is out of scope for an agent |
| `os-extraction-result` specifically | additionally blocked by `QA-01`, which a login will not fix |
| Entire OS functional suite (Part 2) | same session boundary |
| All interaction testing (Part 3) | script injection broken — no click, type, screenshot or page read |
| All responsive testing (Part 4) | same |
| All visual quality assessment (Part 5) | same |
| Practical accessibility (Part 6) | same |
| Browser console and network panels (Part 7) | same; server log used instead |
| Rendered checks on public surfaces (Part 8) | same; HTTP layer used instead |

---

## 18. Deliberately not tested

- **The unknown-provenance database.** Not connected to, by instruction. The
  three inbound leads under Risk 53 were not read, contacted or modified.
- **Destructive paths.** No delete, no bulk operation.
- **Real outbound sends.** None attempted. Suppression was proved earlier
  against an instrumented `fetch`, not by sending anything.
- **Production build behaviour.** Everything here is dev mode, which is why
  `QA-02` carries low confidence.
- **Vercel, Neon configuration, legal page content, SEO.** Out of scope.

---

## 19. Recommended work packages

**WP-1 — unblock the captures (owner, minutes).** One operator login, then five
screenshots. `docs/evidence/maxpromo-os/CAPTURE-MANIFEST.md` has the URLs, the
paste text, the filenames and the disqualification list. Nothing in the
application needs changing.

**WP-2 — replace the Anthropic credential (owner, configuration).** Closes
`QA-01` and unblocks `os-extraction-result`. Nothing else depends on it.

**WP-3 — decide whether the health probe should validate the provider, not just
its presence (small, code).** `configured; not called` read healthy while every
call 401'd. Genuine but minor, and it is a design decision rather than a bug.

**WP-4 — repeat this pass with working browser automation (QA).** Everything in
§17 is still owed: nine viewports, interaction, visual, practical
accessibility, console and network. Until then the accepted visual direction is
unverified rather than verified.

**WP-5 — investigate `QA-02` only after reproducing it in a production build.**
Likely a dev-mode artefact. Do not refactor on one line.

---

## 20. Final verdict

**BLOCKED.**

Everything reachable was clean: 18 route/locale combinations at 200, 41 routes
accessibility-clean, no leaked message keys, no retired palette, both intentional
placeholders intact, correct 404, one `h1` per page, alt text everywhere, token
consistency across both applications.

One real defect was found, and it matters: `QA-01` blocks an evidence artefact
and would have been discovered during the capture session instead of before it.

But the OS was never reached, nothing was rendered, and no viewport was
observed. The honest verdict is the one the directive names for exactly this
case: a core workflow was not testable, so this is not green.

---

# Remediation follow-up — 2026-09-23, later the same day

The verdict above stands. It was BLOCKED and it remains BLOCKED: no viewport was
observed, no OS surface reached, no screenshot taken. This section records what
the forensic pass established afterwards, and corrects two things this report
got wrong.

## QA-01 — resolved as owner action, not a code defect

Traced from route to provider. All five Anthropic call sites construct the
request identically and correctly: `x-api-key`, `anthropic-version: 2023-06-01`,
no transformation, no `Bearer` prefix, no truncation.

The configured credential was then probed directly, and described without being
disclosed: 31 characters, no leading or trailing whitespace, no newline, no
quotes, no inner space, and not the shape Anthropic issues — theirs begin
`sk-ant-api03-` and run to about a hundred characters. Sent exactly as
configured, the provider answered `401 authentication_error / invalid x-api-key`.
Trimming and unquoting produced no different value, so whitespace corruption is
excluded.

**Cause: the configured value is not an Anthropic API key.** Classification:
**OWNER SECRET ROTATION REQUIRED.** No application logic was changed to
accommodate it — compensating in code for an invalid secret would hide the next
one.

`os-extraction-result` stays blocked until a valid credential exists.

### QA-01 closed — 2026-09-23, 20:44

A valid credential is now configured and the provider accepts it: **HTTP 200**,
against the same request construction that was never at fault. `QA-01` is
closed, and `os-extraction-result` is no longer blocked by it.

Two things worth recording, because they change the exposure picture.

**The value that leaked was never a working credential.** The 31-character
`sixletters_…` string that reached the transcript was not an Anthropic API key
and returned `401 invalid x-api-key` every time it was sent. So the transcript
disclosure, as far as Anthropic is concerned, exposed nothing usable. Two
rotation attempts appeared to change nothing because the same wrong kind of
value was being pasted each time — the diagnosis that unstuck it was structural:
31 characters against an expected 108, and no `sk-ant-` prefix.

**The replacement is genuinely new.** Compared by equality against the key that
has sat in the repository-root `.env.local` since May: they differ. So a new key
was created rather than an existing one copied across, and the old one can be
revoked without affecting anything here.

Rotation status overall: `ANTHROPIC_API_KEY` replaced and verified working;
`OS_PASSWORD` changed; `OS_SESSION_SECRET` changed and meets the minimum, though
it remains an all-digit string and generated output would be stronger;
`EVIDENCE_DATABASE_URL` deliberately unchanged — disposable lab, synthetic data
only, and the lab still connects with its baseline intact.

## QA-02 — attributed, and this report was wrong about it

The original entry guessed "likely a Next.js dev-mode instrumentation artefact"
and suggested it might not appear in a production build. The first half is
right; **the second half was wrong and is withdrawn.**

- Our source calls `performance.measure` and `performance.mark` **nowhere**.
- `LocalizedCatchAllPage` *is* ours — `apps/web/app/[locale]/[...rest]/page.tsx` —
  but it is four lines and calls only `notFound()`. It contains no
  instrumentation, which is why the component name in the message was
  misleading.
- `performance.measure` lives in `node_modules/next/dist/client/index.js`.

So Next's client instrumentation measures a span named after our component, and
the negative timestamp comes from a missing navigation mark. **The correction:**
that file ships in production builds too, so this is not dev-only, as the
original entry implied. It is framework code either way, there is nothing in our
source to change, and the 404 renders correctly.

**Status: NOT REPRODUCED IN OUR CODE / OBSERVE.** No fix, no speculative change.

## The health check — corrected, and it was three places

This report found `/api/health` reporting the AI provider `ok` while every call
401'd. The forensic pass found the same pattern in **three** probes across both
applications, because it had been copied rather than shared: the web provider
probe, the web mail probe, and Agent Bureau's provider probe. Each returned
`{ state: 'ok', note: 'configured; not called' }` on the strength of an
environment variable existing.

The note was honest. The state was not, and a state is what anything automated
reads.

Health was **not** made to call the provider. `health.ts` forbids a check that
costs money, and an endpoint that spends per probe is one nobody can afford to
poll. Instead the shared contract gained a fourth state, `unvalidated`, meaning
configuration is present and nothing was contacted. It deliberately does not
degrade the overall report — otherwise every correctly configured deployment
would sit at `degraded` permanently and the word would stop meaning anything —
and it is served with 200.

Live, after the change:

```
ai-provider   unvalidated   credential present; validity not checked here
```

A new gate, `prove:health-semantics`, protects the class: no probe may return
`ok` from a branch whose only evidence is a third-party credential being
present. It was proved red three ways — reverting the web probe, reverting the
Bureau probe, and removing `unvalidated` from the contract — then green.

**One thing that gate got wrong first, recorded because it matters.** Its initial
detector flagged three further probes: `authentication`, `legal-identity` and
`documents`. Those are entitled to say `ok`. They check *our own* configuration
completeness, and there is nothing remote to contact, so the configuration is a
complete answer and `unvalidated` would be meaningless. Had that version been
accepted, three truthful probes would have been pushed into a wrong state in the
name of honesty. The detector now keys on third-party credentials — API keys and
bot tokens — and excludes this application's own `OS_*` configuration.

Merge gate count: **18 → 19**, updated in all four places that claimed it.

## New observation — the evidence lab is a slow database from here

Not a defect, and worth knowing before the capture session. `/api/health`
reports `database degraded — answered in 1542ms`. The lab is in `us-east-2` and
this machine is in Europe, so every OS query crosses the Atlantic and exceeds the
800ms threshold that turns `ok` into `degraded`.

Consequences: health will read `degraded` for the whole of the evidence work,
which is correct rather than alarming; and the OS will feel slow during capture.
Nothing to fix. If the lab is ever rebuilt, `eu-central-1` would remove it.

## Still owed, unchanged

Everything in §17. Nine viewports, interaction, visual, practical accessibility,
console and network panels, and the five captures. The next visual verdict has
to come from a working browser session.
