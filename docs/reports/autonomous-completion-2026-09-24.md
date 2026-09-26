# Autonomous completion — 2026-09-24

**Deployment readiness: READY FOR OWNER REVIEW.** Nothing pushed, nothing
deployed, working tree clean, twenty merge gates green.

---

## 1. Executive state

Maxpromo has a commercial foundation, a proof engine with a proved storage
boundary, and — as of today — its first acquisition asset that is useful on its
own rather than as a way of collecting an email address.

What it still does not have is **published proof**. The five Maxpromo OS
evidence captures remain blocked, and the reason is unchanged and not
technical: `/os/*` needs an authenticated session, and the agent does not type
passwords into login forms. Everything around that blocker is now ready — lab
seeded, credential working, contract written, browser confirmed operational.

Three things shipped today, and one near-miss was caught.

---

## 2. Starting point

Commit `3e649aa`, working tree clean, five unpushed commits from the evidence
work. Proof package `1 satisfied · 5 blocked · 0 outstanding`. Merge gate at 19.

---

## 3. Work completed

### 3.1 The near-miss, first, because it changed a rule

The plan for ingesting captures was "take the newest file from
`Pictures\Screenshots`". Before relying on it, the folder was inspected. It
contains the owner's **personal screenshots**, including an order confirmation
carrying his home address.

Ingesting by recency would have copied private personal data into a committed
evidence directory, and nothing in the pipeline would have caught it — the
proof gate checks that a named artefact exists, not that it is the right
picture.

The rule is withdrawn and replaced. A capture is ingested only when named
explicitly and confirmed by looking at the image, and it must carry an
`EVD-2026-` number, the fictional client, or a `Musterhausen` / `.example`
marker. Recency, folder position and modification time prove nothing.

No personal data was copied anywhere, and the address is not recorded in this
repository.

### 3.2 Nine icons in Agent Bureau had never rendered

`AgentSystemMap` wrapped each of eight specialist icons and the central Chief
icon in an SVG `<text>` element. An `<svg>` is valid as a child of `<g>` and is
not valid inside `<text>`, so every one of them painted nothing — the circles
and the labels drew, the icons silently did not. The diagram has presumably
looked wrong since it was written.

Fixed by moving each icon into a `<g>` translated half its own size back from
the node centre, taking its colour from the group's `color`, which is what the
icon's `stroke="currentColor"` resolves against. Verified from the rendered
DOM, not from the source: **0** instances of `<text><svg>`, **15** correctly
positioned `<g transform><svg>`.

### 3.3 The stale lifecycle requirement, corrected

`os-lifecycle-list` demanded "the invoice list showing draft, sent and paid
together". The governed dataset cannot produce that, and must not be made to:
the draft in the scenario is a *quotation* and lives on a different list, so
the invoice list carries two states.

The requirement was wrong, not the data. Adding a third invoice so one
screenshot could show three states would have been inventing a business record
to improve a picture. The description now says what the evidence actually
demonstrates, and `doesNotProve` states explicitly that the full lifecycle is
not visible on one screen.

### 3.4 The Business Friction Check — Phase C

Six questions about things that happen in an ordinary week; a result that names
the shape of the friction rather than scoring the business. Live at
`/de/friction-check` and `/en/friction-check`.

Three decisions are the point of it:

**The result comes first and comes free.** No email gate. A diagnostic held
hostage is not a diagnostic, and the rule against persuading with unsupported
numbers applies just as much when the number would be about the visitor.

**There is no score.** `scoreFriction` returns patterns and tallies; the tallies
exist so the page can show its working rather than assert a verdict.

**It can say no.** Answer the low-friction option throughout and it says this
company is probably not what you need right now. That outcome is reachable on
purpose, because a check that always finds a problem is a sales script.

Also deliberate: a pattern needs three points, so one emphatic answer is not a
diagnosis — a single bad Tuesday should not produce one. At most two patterns
are named, because a result that lists everything says nothing.

Supporting decisions: registered in the sitemap in the same change, per the
internal-links standard. The CTA uses `?source=friction-check`, a parameter the
contact form already reads, so nothing changed at the other end. The read-next
link points at Workflow Automation and its label says so — it originally named
a guide that does not exist, and a CTA to a missing page is what the
placeholder law forbids. 78 keys per locale, none identical across the two.

### 3.5 Two gates added, both proved red first

`prove:health-semantics` (19) and `prove:friction-check` (20). The second
protects the two properties that make the Friction Check publishable: the
honest outcome stays reachable, and no score appears in the result object or
the rendered page. Canonical gate counts updated in all four places that claim
one.

### 3.6 The accessibility audit now checks the page it was given

`audit-a11y.mjs`'s route list carries a comment warning that "a new public page
is unchecked until somebody remembers this file". The Friction Check was that
page. Added in both locales in the same change: 41 routes → **43**, both new
ones clean.

---

## 4. Local commits

| Hash | Purpose |
|---|---|
| `fd195c5` | Agent Bureau icons; lifecycle requirement corrected; ingestion rule replaced |
| `5533b36` | The Business Friction Check, gate 20, sitemap, i18n |
| `58dcd22` | Accessibility audit covers the new route |

On top of `b562600 → 3e649aa` from the evidence work. **Nine unpushed commits
total.**

---

## 5. Proof status

`1 satisfied · 5 blocked · 0 outstanding` — unchanged, and correctly so.

| Requirement | State |
|---|---|
| `os-workflow-diagram` | **satisfied** — repository basis, component, rendered by no route |
| `os-source-note` | blocked — no authenticated session |
| `os-extraction-result` | blocked — session only; the credential blocker is closed |
| `os-form-before-save` | blocked — no authenticated session |
| `os-draft-record` | blocked — no authenticated session |
| `os-lifecycle-list` | blocked — no authenticated session; description corrected today |

No requirement was transitioned. Nothing was marked satisfied because a
filename might exist.

---

## 6. Evidence status

The lab is intact and at baseline: `EVD-2026-0007` draft, `EVD-2026-0004` sent,
`EVD-2026-0001` paid, **0** documents without the `EVD-` prefix. Nothing was
written to it today, so no reset was needed.

All of it is synthetic. The fictional business is not a customer and is never
presented as one.

---

## 7. Acquisition system

| Surface | State |
|---|---|
| Homepage, What We Do, Workflow Automation, Custom Applications, Work, Contact | Phase A, shipped, untouched today |
| **Business Friction Check** | **built, DE/EN, accessible, gated** |
| "What should I automate first?" guide | **deferred** — see §14 |
| Manual work cost calculator | **deferred** — see §14 |
| Resources architecture | **deferred** — see §14 |
| Proof surfaces | waiting on evidence |

---

## 8. SEO/GEO foundation

**Deliberately not started.** §24 gates it on the content architecture being
stable, and one new route plus a deferred guide is not stable. Starting a
metadata pass now would mean redoing it after Phases D and E.

The Friction Check ships with a sitemap entry; that is route hygiene, not an
SEO pass.

---

## 9. Social preview foundation

**Not started.** Same reason. It is a page-family system by design, and the
page families are not settled.

---

## 10. QA

| | |
|---|---|
| Merge gate | **exit 0** — 20 gates, the count on 2026-09-24 |
| `npm run certify` | **exit 0** |
| Accessibility | clean across **43** rendered routes |
| i18n | clean, 1632 keys per locale |
| Responsive (static) | clean — 26 grids collapse, 73 media queries, 320px floor |
| Budgets | clean; `web.route-css` 83 KB of 88 KB after the new route |
| Typecheck | clean, both applications |
| Render test | `/de/friction-check` and `/en/friction-check` 200, no leaked keys |
| Friction model | 13 properties proved |

**Rendered visual QA did not happen and is not claimed.** The browser
automation is confirmed operational now, but it was used today only to
establish that; the nine-viewport pass, interaction QA and visual inspection
remain outstanding. Static gates are not a substitute, and this report does not
treat them as one.

---

## 11. Defects

**P0:** none. **P1:** none open — `QA-01` closed yesterday.

**P2 — fixed today:** nine Agent Bureau icons never rendered (§3.2).

**P3 — open:** `QA-02`, a `performance.measure` TypeError on the localized 404
page, attributed to Next.js client instrumentation, not Maxpromo source. Chrome
should report whether it recurs.

**Tooling, not application:** yesterday's screenshot failures reproduced on
`example.com` and are not a Maxpromo defect. Resolved since.

---

## 12. Risks

**Resolved today:** the evidence-ingestion rule that would have copied personal
data (§3.1). Partly resolved: `.btn-ghost` had no consumers (known risk 30) and
now has two.

**Open, unchanged:** risk 52 — evidence boundary proved live, captures
outstanding. Risk 53 — three possibly-genuine inbound leads, untouched by
instruction, still awaiting owner review.

**Accepted:** the evidence lab is in `us-east-2`, so OS queries cross the
Atlantic at ~1.5 s and `/api/health` reports `database: degraded` throughout
evidence work. Correct, not alarming, not worth rebuilding the lab for.

---

## 13. Owner actions

1. **Take the five captures.** One login, then the contract. This is the only
   thing standing between the repository and a complete proof package.
2. **Review risk 53** — the three 8 June leads. Untouched since June.
3. **Decide whether your name stays in published evidence.** `Marcel Tabit
   Akwe` renders in the OS chrome on every capture surface. Not a leak, your own
   name in your own system, but it is a publication decision rather than a
   technical one.
4. Optional: `OS_SESSION_SECRET` is 33 all-digit characters. Long enough,
   almost certainly not random. `openssl rand -base64 32` would be stronger.

---

## 14. Deferred, with reasons

**The "what should I automate first?" guide.** Considered and started; the
Friction Check's read-next slot was written for it. Deferred because a guide
worth circulating independently is a substantial piece of writing in two
languages, and producing a thin one to mark a phase done is precisely what §38
forbids. **Trigger:** next working session; the slot is already there and the
link currently points somewhere honest.

**The manual work cost calculator.** §13 asks whether it adds real value after
the Friction Check exists. Having now built the Check, the answer looks like
no, yet: the Check already tells an owner *what kind* of friction they have and
what to do first, which is more useful than a number multiplied out of
assumptions they supplied. A calculator would also sit one step from the
"€14,000/month" class of claim this repository spent a phase removing.
**Trigger:** evidence that visitors want a quantity, and a defensible basis for
one.

**Resources architecture, knowledge engine, Phase E capability pages, industry
pages.** Each is a multi-session content build. Starting three of them badly is
worse than finishing one well. **Trigger:** the guide lands, then Resources.

**SEO/GEO and social preview.** Gated on content architecture stability by §24
and §25. **Trigger:** Phases D and E coherent.

**Newsletter.** Go conditions not met — fewer than four useful write-ups exist.
Correctly still deferred.

---

## 15. Deployment readiness

**READY FOR OWNER REVIEW.**

Nine local commits, tree clean, verify and certify both green, no secret in any
diff, no production system touched. Not ready for deployment in the sense that
the proof package is incomplete — but nothing in the working tree is unsafe to
ship, and the Friction Check is a complete, tested, self-contained page.

---

## 16. Exact next step

Read the Friction Check first — `/de/friction-check`, and answer honestly
rather than picking the worst option, so you see the result that says you do
not need us. If that result reads wrong for your business, the copy is the
thing to change and it is all in one i18n namespace.

Then the five captures.


---

# Continuation — 2026-09-25

## 0. A correction to this report

The previous section listed **"take the five captures"** under owner actions.
That was wrong, and it is withdrawn.

Chrome is the browser execution layer and has since proved it: navigation,
rendered reading, clicking, screenshots and authenticated `/os` access all
work, against the governed dataset. The captures are an **agent execution
dependency**, not something the owner performs. The owner is not the screenshot
operator and is not the QA operator.

This continuation therefore separates three things the earlier section ran
together:

| | |
|---|---|
| **OWNER ACTION** | a genuine owner decision — consent, publication treatment, deployment approval, a real photograph |
| **AGENT HANDOFF** | ordinary work belonging to another agent — captures, rendered QA |
| **EXTERNAL PLATFORM** | something only a third-party account can do — a social re-scrape, Search Console |

Nothing that is ordinary engineering, screenshots, browser work or repository
work belongs in the first column.

## 1. Work completed today

**The Chrome execution contract is now a governed file** —
`docs/qa/chrome-execution-contract.md`, status **CHROME HANDOFF READY**. It
existed only in a chat message, which made it unrepeatable and unreviewable.
It carries the five captures with exact routes and states, the synthetic source
text, expected arithmetic, the corrected lifecycle truth, evidence-safety and
provenance rules, the operator-name rule, the fourteen-pair viewport matrix
including the 899/901 and 1099/1101 boundaries the stylesheets actually use,
the route matrix, interaction limits, defect classification and the final
report schema. Chrome needs no repository access to execute it.

**The automation guide is built** — `/resources/what-to-automate-first`, DE and
EN, 60 keys per locale, none identical across the two. Three rules, two lists,
an order sorted by certainty of benefit rather than effort, and three mistakes.
Exactly two calls to action, both at the end. No time savings, no percentages,
no "businesses typically see" — this company has no measured figure it may
publish, and the argument stands on reasoning instead. Registered in the
sitemap and added to the accessibility audit in the same change. The Friction
Check's read-next slot now points at it.

**Resources gained a Guides lane**, placed first because it is the only lane a
reader can use without us. Linked straight at the one guide rather than at an
index of one; it becomes an index at three. The hero's "three separate things"
is now four.

**System Breakdowns and Field Notes were deliberately not added.** Both are in
the approved architecture and both have zero entries — System Breakdowns has
nothing until the Maxpromo OS evidence is captured. A lane with no entries
advertises absence.

## 2. A finding worth more than the features: risk 55

While checking the guide for stray figures, the served HTML turned out to
contain them.

`next-intl` serialises the whole message tree into every page. So
`/de/friction-check` — a page with no commercial figures on it — ships
`cs2Headline` and `cs2Result1` carrying **"14.000 £/Monat an Betriebskosten"**,
plus the 78 % and 18-day figures.

That £14,000 figure is the one ADR-0007 records as **CONTRADICTED**: published
simultaneously as €14k/mo and £14,000/month, differing by seventeen per cent,
and resolved by deleting it from the pages. **It was never removed from the
wire.**

`check:claims` is clean because it scans what a page *renders*. This is what a
page *serves*. The two were assumed to be the same thing and are not.

It matters beyond tidiness: anything reading raw HTML — a crawler, a model, a
scraper, a "view source" — sees a withdrawn figure attributed to this company on
a page that deliberately makes no such claim.

**Not fixed here, deliberately.** Both remedies — narrowing the serialised tree
per route, or moving historical case-study strings out of the runtime catalogue
— change how every page loads messages, and verifying that needs rendered QA
this session cannot perform. Recorded with evidence rather than half-changed.

## 3. Verification

Merge gate **exit 0** — 20 gates, the count that morning · certify **exit 0** ·
accessibility **clean across 45 routes** (up from 43; both new pages included in
the same change that created them) · i18n clean at 1692 keys per locale ·
`web.route-css` 83 KB of 88 KB · no secret in any diff.

The four `CLAIMS` findings in certify are the long-standing hedged case-study
strings, reported-not-failed, unchanged.

## 4. Commits added today

| Hash | Purpose |
|---|---|
| `509868a` | The guide, and the Chrome contract as a governed file |
| *(this)* | Resources Guides lane, risk 55, report continuation |

## 5. What remains, and why

**AGENT HANDOFF — Chrome.** The five captures and the full rendered QA pass.
The contract is written and ready; nothing in the repository blocks either.

**Deferred with triggers:**

*Knowledge engine foundation.* Inspected rather than built. The existing
`BlogPost` model already carries locale, status, tags, category, author and
keywords — most of what the loop needs. The three genuine gaps are a
first-class content lane, provenance back to the work that produced the
knowledge, and a relation to a work item. It is **not** built today because the
taxonomy would be designed from a single example: the guide is a hand-built
page, not a `BlogPost`, and that disconnection is itself the useful signal.
**Trigger:** the second guide or the first system breakdown, whichever lands
first, so the shape is informed by two real examples.

*Phase E capability pages* (Web Development, Content & Social Operations,
Product & Commerce Operations), *industry page coherence*, *SEO/GEO
foundation*, *social preview system*. Each is a substantial content build.
Three started badly is worse than one finished well, and §24 of the SEO
directive gates that pass on content architecture being stable — which, with
Phase E outstanding, it is not. **Trigger:** Phase E pages land, then the SEO
and social passes over a settled set of page families.

*Manual work cost calculator.* Remains deferred; the earlier reasoning is
accepted and was not revisited.

*Newsletter.* Go conditions still unmet — fewer than four useful write-ups
exist. One guide is now among them.

## 6. Owner actions — genuinely only these

1. **Risk 53** — the three 8 June leads, untouched since June.
2. **Publication treatment of the proprietor's name**, which renders in the OS
   chrome on every capture surface. Not a leak; a publication decision.
3. **A real founder photograph**, whenever convenient. The slot is preserved
   and no generated or stock substitute has been used.
4. **Risk 55 remedy choice** — narrow the serialised tree, or move the
   historical strings. An architecture decision.
5. Optional: `OS_SESSION_SECRET` is 33 all-digit characters.

## 7. Readiness

**READY FOR OWNER REVIEW**, unchanged in substance and stronger in content:
fifteen local commits, tree clean, verify and certify green, two new public
pages, one governed handoff contract and one architectural finding that the
existing gates could not have caught.


---

# FULL-DAY SHIFT — 2026-09-25

**Started** `28a524c` · **ended** `f43170c` and the commits after it ·
**17+ unpushed commits** · tree clean · verify **exit 0** at 21 gates ·
certify **exit 0** · accessibility **clean across 51 routes**.

## Risk 55 — before and after

**Before.** `<NextIntlClientProvider>` carried no `messages` prop, so next-intl
serialised the entire message tree into every page: 22 namespaces, 66,635 bytes
per locale, every route. `caseStudies` was among them, so pages with no
commercial figures on them served the contradicted £14,000/month claim.

**After.** `apps/web/i18n/client-namespaces.ts` declares the eight namespaces a
client component actually reads — measured, 31 % of the tree — and names
`caseStudies`, `work` and `blog` as never-client rather than merely omitting
them. Omission is silent; a refusal is not.

**Proved, not asserted.** `prove:payload-claims` is gate 21 and has two layers:
source always, and a real payload fetch when a dev server answers. Shown red
against the restored bare provider — 11 of 18 failing, the contradicted figure
plus 78 %, 91 % and 94 % on **seven routes including `/de/impressum`**, a locked
legal page. Then green on 18.

**Measured effect.** `/de/friction-check` 104 KB → **56 KB**. `/de/contact`
112 KB → **64 KB**. The claims left the wire and roughly 45 KB of dead payload
left every route with them.

One detector correction recorded rather than silently fixed: the first
namespace probe searched for `"work":` anywhere and reported a leak that was not
there — `nav` legitimately carries a `work` label, which serialises as a string
while a namespace serialises as an object.

## Architecture decisions

**The client namespace list is written, not derived.** A derived allowlist grows
silently: add `useTranslations('caseStudies')` to a client component and the
derivation quietly starts shipping the claims again. Written down, that same
edit fails a gate and somebody has to decide.

**The payload gate says so loudly when it cannot run.** Only the fetch layer
proves the defect is closed rather than configured, so with no server reachable
it prints a banner and claims nothing.

**Empty lanes are not published.** Resources gained Guides, which has one real
entry. System Breakdowns and Field Notes are in the approved architecture and
were deliberately not surfaced — a lane with no entries advertises absence.

## Routes added

Five, all DE and EN: `/friction-check` (yesterday),
`/resources/what-to-automate-first`, `/solutions/web-development`,
`/solutions/content-operations`, `/solutions/product-operations`.

Every one registered in the sitemap **and** added to the accessibility audit in
the same change — the gap that let the Friction Check ship unchecked has not
recurred.

## Phase E — complete

All three remaining capability pages built, DE and EN, 99 new keys per locale,
none identical across the two. Each follows the established argument shape,
including the caveat before the catalogue:

- **Web Development** — most businesses do not need a new website; they need
  the one they have to do something. No framework names anywhere.
- **Content & Social Operations** — the problem is rarely the writing, it is
  the capturing. Refuses autonomous brand publishing explicitly.
- **Product & Commerce Operations** — rarely a shop problem, a
  question-of-ownership problem. No named platform, ERP or accounting system,
  because the repository has no evidence of an integration with any.

**None of the three carries a figure.** No conversion rates, reach, cadence or
savings. All three reserve the proof position instead.

## Status of everything else

| Item | State |
|---|---|
| Proof package | `1 satisfied · 5 blocked · 0 outstanding` — unchanged, correctly |
| Chrome contract | refreshed for the five new routes, including the Friction Check's honest path as an explicit P1 test |
| Industry coherence | **not done** |
| Founder / About / CTA coherence | **not done** |
| Knowledge engine | **not done** — see below |
| SEO/GEO inventory | **not done** |
| Social preview system | **not done** |
| `llms.txt` | not implemented, no evidence gathered this shift |
| Newsletter | correctly deferred — two useful write-ups now exist against a bar of four |
| Cost calculator | deferred, not revisited |

**The knowledge engine, specifically.** Not built, and the reason is the same
one as yesterday and is still good: `BlogPost` already carries locale, status,
tags, category and author, and the three real gaps are a first-class lane,
provenance, and a work-item relation. Designing that taxonomy from one guide
and one hand-built page would bake in the wrong shape. **Trigger:** the second
guide or the first system breakdown.

## Defects

**P0 · P1:** none open.

**Fixed today:** risk 55 (P2, claim delivery) — proved red then green.

**Open P3:** `QA-02`, the `performance.measure` TypeError on the localized 404,
attributed to Next.js client code, for Chrome to observe.

---

# EVENING REVIEW

## A. What changed today

Three new commercial pages, one new guide, a Guides lane on Resources, and one
real defect closed: withdrawn commercial claims were travelling in the HTML of
every page on the site, including the Impressum, and no longer are.

## B. What to review first

```
http://localhost:3020/de/solutions/web-development
http://localhost:3020/de/solutions/content-operations
http://localhost:3020/de/solutions/product-operations
http://localhost:3020/de/resources/what-to-automate-first
http://localhost:3020/de/resources
http://localhost:3020/de/friction-check      ← answer the first option six times
```

The last one matters most: it should tell you that you probably do not need
Maxpromo. If that reads wrong, the copy is one i18n namespace.

## C. Architecture decisions that matter

The client namespace list, and the fact it is written rather than derived. The
payload gate's two layers. Empty lanes not published.

## D. Defects found

Risk 55, P2, claim delivery. Found while checking the new guide for stray
figures — the figures were in the payload rather than the page.

## E. Defects fixed

Risk 55, proved red against the vulnerable architecture across seven routes,
then green on 18 properties, with the payload reduction measured.

## F. What remains, and why

Industry coherence, founder/CTA coherence, knowledge engine, SEO/GEO inventory
and the social preview system. Each is a substantial build, and the SEO pass is
gated on content architecture being stable — which it now nearly is, with Phase
E done. That is the natural next session.

## G. Owner decisions — only these

1. **Risk 53** — the three 8 June leads, untouched.
2. **Publication treatment of the proprietor's name** in evidence captures.
3. **A real founder photograph.** The slot is preserved; no substitute used.
4. Optional: `OS_SESSION_SECRET` is 33 all-digit characters.

## H. Agent handoffs

**Chrome:** the five OS captures and the full rendered QA pass, now including
five new routes. Contract refreshed and ready. Not owner work.

## I. External platform validation

A Facebook/LinkedIn re-scrape once social metadata exists — it does not yet.
Search Console submission whenever deployment happens. Neither is possible or
needed locally.

## J. Deployment verdict

**READY FOR OWNER REVIEW.** Not ready for deployment in the sense that the
proof package is still incomplete and rendered visual QA has not happened — but
nothing in the tree is unsafe, and the claim leak that *was* shipping is fixed.

## K. Commit range

`28a524c` (yesterday's report) → HEAD. All local.

## L. Rollback

- Before today: `28a524c`
- Before the claim fix: `1559293`
- Before Phase E: `91bb163`

Each is a clean tree with verify green.


---

# FULL-DAY SHIFT CONTINUATION — 2026-09-25

**Started** `2bbe488` · **ended** `91c3263` + the report commit ·
**21 unpushed commits** · tree clean · verify **exit 0** at 22 gates · certify
**exit 0** · accessibility **clean across 57 routes**.

## Defects found and fixed this session

Seven, none of which any existing gate could have caught, and three of which
were in my own work.

**`/contact` and `/friction-check` had no metadata at all.** No title,
description, canonical or hreflang. Both are client components, and a client
component cannot export `generateMetadata`, so both silently inherited the site
defaults. The conversion page every commercial surface points at, and the one
asset built specifically to be found, were the two pages search could not read.

**The homepage omitted `og:locale`.** Its own comment warned that Next replaces
the `openGraph` object rather than merging it — "a page that sets any of it sets
all of it" — and it still missed one field. That is the argument for a helper
rather than a convention.

**`/og` was 307-redirecting.** The locale middleware prefixed it, so every Open
Graph image on the site resolved to a redirect, which is the same as having
none.

**The sitemap had three duplicate entries** and was **missing
`/solutions/custom-applications`** — a live Phase A commercial page.

**The claims gate could not read German.** It examined `en.json` only, on a
German-first site, and knew no German number words at all. Tested before
changing anything: `achtundsiebzig Prozent weniger Arbeit`,
`vierzehntausend Euro im Monat` and even `fifteen years` all passed unseen.

**Construction was the one industry entry with no human decision point**, in
either locale, on a platform whose central claim is that a person decides.

**My own two:** I hardcoded five hex values in the social card and wrote a
comment claiming the token audit exempted it — the audit disagreed, correctly.
Fixing that with `color-mix()` satisfied the audit and *broke the card*, because
satori does not implement it; `/og` stopped responding entirely while every gate
stayed green, since checking that an `og:image` URL is present is not checking
that it returns an image.

## Architecture decisions

**One social card system, not forty PNGs.** `pageMetadata()` returns the whole
head block so a page cannot acquire a canonical without an hreflang or an
`og:title` without an image. The card is generated from the page's own title, so
it cannot drift from the page the day one is renamed. A hand-made folder of
images has the same problem with more maintenance.

**The card obeys the claim rules.** It carries the wordmark, a family label and
the page title. No figure. A social card is a persuasive surface.

**Route governance requires a decision, not a registration.** A route belongs in
the sitemap and the accessibility audit, or in the exclusion list with a reason.
Being forgotten is not one of the options.

**The claims fix widened the locale, not the scope.** Its author restricted it
to `caseStudies` on the grounds that a general numbers-in-copy detector would
flag "five kinds of work" and be switched off within a week. That reasoning
still holds, so both locales are now read and the scope is untouched.

## Industry pass

All six entries audited mechanically, then against the text. **No unsupported
figures, no fabricated sector delivery history, genuine sector specificity** —
healthcare's "practice software is built for billing, not for communication" is
real insight, not a template swap. Verdict: **KEEP all six.**

One correction to my own audit: my detector flagged three entries as missing a
human decision point. Two were false positives — property says *"Bewertet wird
trotzdem von Ihnen"* and professional-services *"geprüft wird von Ihnen"*, which
my pattern could not see. I nearly "fixed" two pages that were already correct.
Checking flagged text before editing it is why that did not happen.

Also fixed: the accessibility audit carried one German industry route and all
six English ones, so five German pages were unchecked.

## About, contact and CTA

**About: audited, no rewrite needed.** Concrete headings, honest positioning
("most businesses do not need another website"), no tax or Finanzamt detail
outside the legal pages, founder placeholder intact. It is not too corporate,
abstract or AI-heavy. Saying so is more useful than churning it.

**CTAs: intent-specific and preserved.** Each capability page carries its own
next action and passes `?capability=` and `?source=`, which the contact form
already reads. The Friction Check passes `?source=friction-check`, the guide
`?source=automation-guide`. Nothing was flattened into "book a call".

## SEO and GEO

`docs/governance/seo-inventory.md` — the canonical record. All 28 routes
classified INDEX / ARCHIVE / NOINDEX / REDIRECT / OWNER REVIEW with reasons.

**No schema was added** beyond the truthful `Organization` and `WebSite` already
present. No `FAQPage` without an FAQ, no `Review` without reviews, no
`LocalBusiness` implying premises that do not exist.

**No tool is named** — not DATEV, Lexware, sevDesk, or any shop or ERP. The
repository has no evidence of an integration with any, and naming one to catch
its search traffic would claim experience the evidence registry does not
support. No city pages.

**`llms.txt`: NOT ADOPTED**, with reasoning and a revisit condition — not a
standard, not documented as consumed by any major crawler, no measured
retrieval benefit. What makes a page usable by a model is what makes it usable
by a reader, and that work pays off either way.

**One item genuinely needs the owner:** `/case-studies` is indexed and carries
the figures the registry marks unresolved and, in one case, contradicted. Those
strings are legitimately there as a record. Whether that page should be what a
search engine shows for "Maxpromo case study" is a commercial judgement.

## Status

| | |
|---|---|
| Gates | 20 → **22** (`prove:route-governance` added; payload gate now 36 properties) |
| Accessibility | 51 → **57 routes**, clean |
| Proof package | `1 satisfied · 5 blocked · 0 outstanding` — **unchanged** |
| Chrome contract | refreshed for the five new routes and the social card |
| Newsletter | still deferred — two useful write-ups against a bar of four |
| Cost calculator | deferred, not revisited |
| Knowledge engine | deferred by accepted reasoning; trigger recorded |

## Remaining

**Agent handoff (Chrome):** the five OS captures and the full rendered QA pass,
now covering five new routes plus the share previews.

**Owner decisions:** Risk 53 · publication treatment of the proprietor's name in
captures · a real founder photograph · `/case-studies` indexability.

**External platform:** Search Console and Bing verification after deployment ·
Facebook and LinkedIn re-scrape, since the old static card is cached there and
will persist until a live URL is fetched.

**Engineering that remains, and is genuinely small:** migrating the twelve
still-hand-rolled metadata blocks onto `pageMetadata()`. Mechanical, and the
gate already covers the routes that matter.

## Verdict

**READY FOR OWNER REVIEW.** Not deployable while the proof package is
incomplete and rendered QA has not happened — but the site now serves correct,
page-specific metadata, no withdrawn claim travels anywhere, and every route is
governed rather than remembered.

**Rollback:** `2bbe488` before this session · `9bf1c64` before SEO and social ·
`91bb163` before Phase E. Each a clean tree with verify green.


---

# POST-CHROME QA / EVIDENCE CLOSURE — 2026-09-26

**Started** `ddac49e` · **ended** `db0464e` + this report · verify **exit 0** at
23 gates · certify **exit 0** · accessibility clean across 57 routes.

## Chrome's result, and why it was the right one

Two captures passed, three are blocked, and Chrome refused to fabricate the
difference. That is the evidence governance working exactly as designed — it
stopped a broken workflow from becoming marketing proof.

| Capture | Status | Where it stands |
|---|---|---|
| 1 `os-source-note` | **PASS** | Chrome storage `ss_53700jc04` — not yet repository evidence |
| 2 `os-extraction-result` | **BLOCKED** | live provider failure, error frame `ss_2957teoi2` |
| 3 `os-form-before-save` | **BLOCKED** | needs a form populated *by* the extraction |
| 4 `os-draft-record` | **BLOCKED** | needs the save that follows Capture 3 |
| 5 `os-lifecycle-list` | **PASS** | Chrome storage `ss_63507sdzq` — not yet repository evidence |

**Proof package unchanged: `1 satisfied · 5 blocked · 0 outstanding`.** A
capture existing in a browser is not evidence this repository may claim. The
two passes are recorded in the registry as *captured, not ingested*, with their
storage identifiers, because Chrome has no filesystem access and the images
have not been seen, cropped or committed here.

## The 502 — root cause

**Not a code defect.** Reproducing the route's exact upstream call:

```
HTTP 400  invalid_request_error
"Your credit balance is too low to access the Anthropic API."
```

Identical on `claude-sonnet-4-6`, `claude-sonnet-5`, `claude-opus-5` and
`claude-haiku-4-5` — so the account, not the model identifier. The credential
authenticates and cannot be charged.

**Risk 56. Owner action: add credit.** Nothing else is required. The model
identifier was left alone: billing fails first, so its validity cannot be
tested, and changing it on a guess would be swapping one unverified thing for
another.

**The code defect it exposed, fixed.** Every cause collapsed into one 502 and
one sentence, so the only way to find out what happened was to reproduce the
call by hand. `lib/ai-failure.ts` now classifies, billing answers 503 rather
than 502, the class goes to the caller and the provider's own message only to
the server log, and the network catch logs `err.message` alone — an error
object from `fetch` can carry the request, and the request carries the key.

## Quotation numbering — root cause and fix

Chrome saw **ANG-2026-010 → 012 → 014** across three loads with no save. Two
compounding causes: the form requested a number on mount and the server
answered with `next_angebot_number()`, which runs `nextval()` and permanently
advances a sequence; and React StrictMode invoked the effect twice per load.

**Loading a blank form did mutate the sequence.** Nothing was saved, so the
series has gaps corresponding to nobody looking at a form.

Reading is now a preview from stored rows, touching no sequence. Saving
allocates once and no longer accepts a number from the client. `ANG-` is the
correct runtime family and `EVD-` remains the seeded evidence family; they were
**not** merged. Gate 23 proves it, red first. The lab sequence was found at
exactly **14** — where Chrome's `ANG-2026-014` left it.

## P3 triage

**Friction Check** — the sales CTA rendered under the low-friction result. We
told someone they probably do not need us, then pitched them. Now conditional.

**Mobile menu** — `aria-controls` added with a matching id.

**Localised 404** — **partially fixed, and the limit is recorded.** Next does
not support `generateMetadata` in `not-found.tsx`, and adding it to the
catch-all does nothing because `notFound()` throws first. The title is set on
the client, so the server-rendered HTML still carries the old one. Chrome
should verify the rendered tab title.

**`overdue`** — investigated, **deliberately not changed**. It is a full
citizen of the interface (filter tab, critical tone, red due-date, and the
Outstanding metric sums `sent` + `overdue`) that no route writes and nothing
derives. *When* an invoice becomes overdue is a business rule this repository
does not contain. Risk 58; owner states the rule, then it derives in three
lines.

**Social previews** — four older routes migrated (`/resources`,
`/industries`, and both original capability pages). Three skipped because their
metadata has a different shape; they still work and were left alone rather than
rewritten blind.

**QA-02** — **OBSERVED AGAIN**, both locales, on reload. Attribution unchanged:
framework code, nothing in this repository to change, no user-visible effect.
Status OBSERVE. No framework upgrade during a closure pass.

## Evidence lab

Reset to canonical baseline via the governed mechanism: one Beckmann client,
`EVD-2026-0007` draft €3.380, `EVD-2026-0004` sent €1.180, `EVD-2026-0001` paid
€620, no leads, jobs or newsletter rows, zero non-`EVD` documents.

## Chrome recovery handoff

`docs/qa/chrome-recovery-contract.md` — Captures 2, 3 and 4 only. Captures 1
and 5 are not repeated. It opens **BLOCKED ON OWNER BILLING** with a one-line
precondition check, and tells Chrome what changed: failures now report a class,
and the number on a blank form is a preview that may differ from the saved
document's.

## Deployment verdict

**ENGINEERING FIX READY · CHROME EVIDENCE RECOVERY REQUIRED · BLOCKED ON OWNER
BILLING.**

Not ready for deployment review. The flagship evidence workflow cannot run, and
the reason is an empty provider account rather than anything in the code.

## Owner actions

1. **Add Anthropic credit** — unblocks Captures 2–4 and the whole package.
2. **State the overdue rule** — risk 58.
3. Risk 53 · founder photograph · publication treatment of the proprietor's
   name · `/case-studies` indexability — all unchanged.
