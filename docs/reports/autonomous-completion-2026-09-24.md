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
