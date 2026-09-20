# Evidence Inventory

**Date:** 2026-09-20 · **Status:** audit, nothing implemented · **Decides:** nothing
**Scope:** what this repository can actually establish about delivered systems

This is a forensic inventory, not a plan. Nothing here was published, no
placeholder was replaced, no production data was touched and no demo access was
opened. It exists so that the first evidence package is built from something
real rather than from something plausible.

**How to read the classifications.** **CONFIRMED** means the repository holds
the artefact: code, a registry record, a schema, a governed message. **INFERRED**
means a reasonable reading of what is there, and it can be wrong. **UNKNOWN**
means the repository is silent, and silence is never treated as permission or
as proof.

---

## A. Systems discovered

Eleven products are declared in `apps/web/lib/registry/products.ts`. Two exist
as running code in this repository. That gap is the central finding of this
audit, and everything below follows from it.

| System | Registry status | Code in this repo | What that establishes |
|---|---|---|---|
| **Maxpromo OS** | **`live`**, visibility `internal` | **yes** — 16 routes under `app/os/`, 16 API routes, 6 tables | The only product the registry itself calls live, and Maxpromo runs its own business on it |
| **Agent Bureau** | `demo-ready` | **yes** — `apps/bureau`, 22 dashboard routes, governed demo seed | A real, complete system with safe synthetic data already built |
| TaxKontrol | `demo-ready` | no | Marketing surface only, in this repository |
| RestaurantOS | `demo-ready` | no | as above |
| PrintShopOS | `demo-ready` | no | as above |
| HandwerkOS | `demo-ready` | no | as above |
| CareOS | `demo-ready` | no | as above |
| PraxisOS | `demo-ready` | no | as above |
| RealEstateOS | `demo-ready` | no | as above |
| PublishingOS | `demo-ready` | no | as above |
| Drive24 | `demo-ready` | no | as above, founder track |

**CONFIRMED.** Ten of eleven carry `status: 'demo-ready'`. Exactly one carries
`status: 'live'`, and it is Maxpromo OS. The type's own comment says only
`'live'` produces a visible status badge, so the registry is not being coy:
it is stating that the others are not live.

**CONFIRMED.** `apps/web/lib/demo/registry.ts` declares `DEMOS` and `GRANTS`
as empty arrays. The demonstration room has access control, expiry and grant
resolution built, and **nothing configured inside it**. The Work page's "ask to
see this running" therefore routes to a contact form, which is the honest
behaviour and was designed that way, but no demo can currently be granted.

**UNKNOWN.** Whether the nine products without code exist elsewhere. A separate
repository, a hosted instance or a client installation would not be visible
from here. Absence of code in this repository is not evidence of absence.

Two further candidates are not products:

| Candidate | What it is | Evidence |
|---|---|---|
| **Joomla CI/CD migration** | A client project, written up as a published article | `apps/web/content/blog/en/joomla-cicd-case-study.mdx`, 735 words, both locales, `status: published` |
| **cs1 / cs2 / cs3** | Three claimed client projects | `caseStudies` message namespace only. No code, no artefact, no client record |

---

## B. Evidence matrix

| | Maxpromo OS | Agent Bureau | Joomla migration | cs1 / cs2 / cs3 |
|---|---|---|---|---|
| Business problem stated | CONFIRMED | CONFIRMED | CONFIRMED | CONFIRMED (in copy) |
| Before state | INFERRED | INFERRED | CONFIRMED (in article) | CONFIRMED (in copy) |
| System built | **CONFIRMED in code** | **CONFIRMED in code** | INFERRED | UNKNOWN |
| Workflow | **CONFIRMED in code** | **CONFIRMED in code** | INFERRED | UNKNOWN |
| Human control points | **CONFIRMED in code** | **CONFIRMED in code** | UNKNOWN | UNKNOWN |
| Real interface | **yes, running** | **yes, running** | no | no |
| Safe data for capture | **no** — live customer data, no seed | **yes** — governed demo seed | n/a | n/a |
| Claim provenance | n/a — no public figures | n/a | article figures, no artefact | **none in repository** |
| Consent to publish | own system, no third party | own system, no third party | NO EVIDENCE | NO EVIDENCE |

### Maxpromo OS, in detail

**Business problem (CONFIRMED).** The system exists to run a small German
agency's commercial paperwork: quotations, invoices, clients, jobs, leads,
inbox, newsletter. Six tables: `os_angebote`, `os_invoices`, `os_clients`,
`os_jobs`, `os_leads`, `os_newsletter`.

**Before state (INFERRED).** Not recorded anywhere. The system's own shape
implies the usual predecessor, which is a word processor and a spreadsheet, but
the repository does not say so and this must not be written as if it did.

**System built (CONFIRMED).** A Next.js application behind authentication with:

- Quotation and invoice creation, editing, detail and print views
- Client, job, lead and newsletter management
- An inbox
- Five AI endpoints: `ai/enhance`, `ai/scan-invoice`, `ai/scan-client`,
  `ai/generate-invoice`, `ai`
- Two outbound document senders: `send-invoice`, `send-angebot`

**What the AI actually does (CONFIRMED, from the prompts).** `ai/scan-invoice`
accepts "a photo of handwritten notes, a screenshot of a WhatsApp message, a
printed invoice, an email" and extracts client, contact details and line items,
explicitly discarding greetings, signatures, disclaimers and timestamps.
`ai/scan-client` does the same for a business card or email signature.
`ai/enhance` replaced the earlier string-parsing prompts with Anthropic tool use
so the structure is guaranteed by a schema rather than by parsing.

This is the single most useful piece of evidence in the repository, because it
is the Workflow Automation page's central claim, working, in production, on the
company's own business.

### Agent Bureau, in detail

**System built (CONFIRMED).** 22 dashboard routes including approvals, agents,
audit, waiting room, playbooks, documents, operating model, governance, memory,
research, tasks, projects, contacts, leads.

**Safe data (CONFIRMED).** `apps/bureau/lib/seed/run-demo-seed.mjs` with nine
data modules. Its own header states it is idempotent, touches only the demo
business and its child rows, never touches lead tables, performs no schema
change and sends nothing outbound. The synthetic tenant is
`"Maxpromo Demo Operations"`.

That combination — a real system plus governed synthetic data — makes Agent
Bureau the only system in the repository that can be photographed today without
a sanitisation decision.

---

## C. Workflow evidence

### Maxpromo OS: quotation and invoice, evidenced end to end

```
  INPUT        a photo, a screenshot, a pasted email, or typed notes
     |
  CAPTURE      POST /api/os/ai/enhance  (or scan-invoice / scan-client)
     |         structured output guaranteed by a tool schema
     |
  PREPARE      applyExtracted() writes the result into FORM STATE on
     |         angebote/new, invoices/new or the edit pages.
     |         Nothing is committed to a record at this point.
     |
  HUMAN        the person reviews and edits the form, then saves.
     |         The record is created with status 'draft'.
     |
  HUMAN        sending is a separate, deliberate action:
     |         POST /api/os/send-angebot  or  /api/os/send-invoice
     |
  ACTION       the document is emailed to the client
     |
  RECORD       UPDATE os_invoices SET status = 'sent', sent_at = NOW()
     |         lifecycle continues: draft, sent, paid, overdue, accepted
```

**Every step above is CONFIRMED in code**, including the two human steps. The
extraction call sites are `apps/web/app/os/(protected)/angebote/new/page.tsx`,
`apps/web/app/os/(protected)/angebote/[id]/edit/page.tsx`, `apps/web/app/os/(protected)/invoices/new/page.tsx`, and
`apps/web/app/os/(protected)/clients/page.tsx`. The status transition is `apps/web/app/api/os/send-invoice/route.ts`.

This matters because the Workflow Automation page states "capture once, route
correctly, prepare the work, record the outcome, leave the decision with a
person", and this flow evidences four of those five directly. Routing is the
one it does not demonstrate, because a single-operator system has nobody to
route to.

### Agent Bureau: an approval queue

`apps/bureau/app/dashboard/approvals/page.tsx` sorts pending before decided so the queue "reads
naturally", labels pending items `awaitingReview`, and carries `approved` and
`rejected` states. **CONFIRMED.** It is a human-decision surface in the literal
sense, and it runs on seeded synthetic data.

### What cannot be drawn

cs1, cs2 and cs3 have narrative before and after strings in the message
catalogue (`cs1b1..3`, `cs1s1..3` and the same for cs2 and cs3) and nothing
else. A diagram drawn from those would be an illustration of copy, not of a
system. **Do not draw one and present it as a system diagram.**

---

## D. Screenshot candidates

None of these exist yet. All are positions that could be filled truthfully.

| # | Surface | Shows | Customer data | Safe today | Crop / ratio | Supports |
|---|---|---|---|---|---|---|
| 1 | Bureau `dashboard/approvals` | a real approval queue, pending before decided | **no** — seeded demo tenant | **yes** | full panel, 16:10 | Workflow Automation proof slot; human control |
| 2 | Bureau `dashboard/audit` | a recorded trail of what happened | **no** — seeded | **yes** | full panel, 16:10 | Work; "record the outcome" |
| 3 | Bureau `dashboard/waiting-room` | work queued and waiting | **no** — seeded | **yes** | full panel, 16:9 | Workflow Automation |
| 4 | OS `angebote/new` with the AI modal open | a photo becoming a structured quotation | **yes** if real; the modal itself is chrome | only with sanitised input | modal + form, 16:10 | **Workflow Automation proof slot** — the strongest single image available |
| 5 | OS `invoices/[id]` detail | a prepared document awaiting a human send | **yes** | needs a synthetic client | detail panel, 16:10 | Custom Applications proof slot |
| 6 | OS `invoices` list | a lifecycle: draft, sent, paid, overdue | **yes** | needs synthetic rows | table, 16:9 | Work entry |
| 7 | OS `angebote/[id]/print` | a finished German quotation document | **yes** | needs a synthetic client | page, 3:4 | Custom Applications |

**The blocking difference.** Candidates 1 to 3 are safe today because Agent
Bureau has a governed seed. Candidates 4 to 7 are not, because
`apps/web/app/os` has **no seed path** and its tables hold Marcel's real
clients and real invoices. Making them safe needs either a synthetic-data path
for the OS or a manual sanitisation pass, and that is a decision, not a task.

**Never** capture an OS screen containing a real client name, company, address,
email, phone number or amount.

---

## E. Claim and provenance matrix

The four historical figures, investigated specifically as instructed.

| Claim | Where it lives now | Provenance in this repository | Verdict |
|---|---|---|---|
| **78% reduction in manual processing** | `caseStudies.cs1Result1`, and `home.evidence` on the homepage | Entered in `1b4c73f`, a workspace **restructuring** commit. No measurement artefact, no client record, no source document | **SOURCE EXISTS BUT NEEDS REVIEW** |
| **3 days → 4 hours** | `caseStudies.cs3Result1`, and the homepage | Same commit, same absence | **SOURCE EXISTS BUT NEEDS REVIEW** |
| **94% of invoices without human intervention** | `caseStudies.cs2Result3` only. Withdrawn from the homepage on Marcel's instruction | Same commit, same absence | **SOURCE EXISTS BUT NEEDS REVIEW**, and already withdrawn from the commercial surface |
| **£14,000/month saved** | `caseStudies.cs2Headline` and `cs2Result1`, both locales | Same commit. **Additionally: this figure has been published in two different currencies** | **CONTRADICTED** |

### The £14,000 finding, stated carefully

**CONFIRMED, from `docs/adr/0007-a-claim-is-checked-like-a-token.md`:** the same
claimed client saving appeared as **`€14k/mo` on the homepage** and
**`£14,000/month` on the case-studies page**, in both locales. The ADR records
it in those words and notes that "the German page quotes pounds sterling to
German SMEs". Choosing between them, in the ADR's own arithmetic, "changes a
stated client saving by seventeen per cent".

**CONFIRMED:** the euro instance was removed in commit `f75fc50`. Only the
pound version remains, which is why `audit:claims` reports no currency conflict
today. The conflict was resolved by deletion, not by evidence.

**This corrects a statement made during Phase A.** The Phase A change log says
"an earlier note claimed that figure appeared in two currencies. It does not."
That is wrong about history. It did, ADR-0007 records it, and the reason the
audit is quiet now is that one of the two was deleted. A figure that has been
published at two values seventeen per cent apart is weaker evidence than a
figure that has not, and it should be treated as contradicted until Marcel says
which one was true.

### The hedged results

| Claim | Verdict |
|---|---|
| `cs3Result2` "Cash flow improved by approximately 18 days per quarter" | **HEDGED** — reported by `audit:claims`, excluded from the Work page |
| `cs3Result4` "Client satisfaction scores increased significantly" | **HEDGED** — same |

ADR-0007's reasoning stands and is worth repeating: a hedge is fine in a
description of the problem a client arrived with, and is not fine in a result,
because a result is a statement about delivered work.

### The Joomla migration figures

`apps/web/content/blog/en/joomla-cicd-case-study.mdx` states: LCP 5.8s → 0.9s, Core
Web Vitals "Needs Improvement" → "Good" across all three, all top-20 rankings
retained with three pages up 3 to 5 positions in eight weeks, a new services
page going from six weeks to 45 minutes, and zero critical or high findings in
the latest vulnerability scan.

**Verdict: SOURCE EXISTS BUT NEEDS REVIEW**, with a note in its favour. Unlike
cs1 to cs3, these are claims of a kind that *can* be re-evidenced: LCP and Core
Web Vitals are measurable, rankings are checkable, a vulnerability scan produces
a report. The repository holds none of those artefacts, but they are the sort of
thing that plausibly still exists somewhere.

---

## F. Consent and publication status

| Subject | Status | Basis |
|---|---|---|
| Maxpromo OS | **INTERNAL — own system** | Maxpromo's own product and own data. No third party's permission is needed to describe the system. Its *contents* are client data and are a separate matter |
| Agent Bureau | **INTERNAL — own system** | Own product. The demo tenant is synthetic |
| Joomla migration client | **NO EVIDENCE OF CONSENT** | The article describes "a service business" and names nobody. Whether that anonymised account was agreed is not recorded |
| cs1 / cs2 / cs3 clients | **NO EVIDENCE OF CONSENT** | See below |

**CONFIRMED:** `caseStudies.ndaNote` states "These are live production systems.
Client names are withheld under non-disclosure agreement." `work.emptyBody`
states "We only publish work here when we have the client's agreement and can
evidence the outcome."

**CONFIRMED:** the repository contains no agreement, no client record, no
consent artefact and no note of who any of these clients are.

So the site asserts that NDAs exist and that agreement is a precondition, and
the repository cannot corroborate either. Per the rule this audit was given,
that is **NO EVIDENCE OF CONSENT**, not "anonymised so it is fine". The
anonymisation is real and is doing its job; the permission to tell the story at
all is simply not on record here.

---

## G. Private-demo suitability

| System | Could be demonstrated | Must stay hidden | Infrastructure | Safe data |
|---|---|---|---|---|
| **Agent Bureau** | approvals queue, audit trail, waiting room, playbooks, operating model | the real tenant, if one exists | login, dashboard, roles | **yes, seeded** |
| **Maxpromo OS** | the capture-to-document flow, the draft-to-sent lifecycle | every real client name, address, amount; the inbox | login, auth | **no** |
| Nine other products | nothing from this repository | n/a | none here | n/a |

**CONFIRMED and important:** the demonstration room is built and empty.
`DEMOS = []` and `GRANTS = []`. Access control, expiry enforcement and grant
resolution all exist and are tested by `prove:demo-access`. Configuring a demo
is therefore a small, contained task whenever Marcel decides to, and until then
the Work page's demo CTA correctly leads to a conversation rather than a door.

**Recommendation, not an action:** the first demo to configure is Agent Bureau
on the seeded tenant, because it is the only one that needs no data decision.

---

## H. Acquisition reuse map

| Surface | Maxpromo OS | Agent Bureau | Joomla migration | cs1–cs3 |
|---|---|---|---|---|
| Homepage evidence | no public figures yet | no | possible, if re-evidenced | currently used (78%, 3d→4h) |
| What We Do | illustrates all five capabilities | illustrates approvals | illustrates web development | no |
| **Workflow Automation** | **strongest fit** | approvals screenshot | no | narrative only |
| **Custom Applications** | **strongest fit** | good fit | no | no |
| Work entry | yes, as "what we run ourselves" | yes | **yes, as a client project** | already present, two of three |
| Future industry page | no | no | service businesses | operations, logistics |
| Future case study | yes | yes | **already written** | already written |
| System breakdown / guide | **yes, excellent** | yes | yes | no |
| Short video | **yes** — the capture flow is inherently visual | yes | no | no |
| Private demo | after sanitisation | **yes, today** | no | no |

---

## I. Strongest three candidates

Ranked on evidence strength, positioning fit, demonstrable workflow, real
interface, claim provenance, consent safety, human control and commercial
usefulness. Deliberately not ranked on which is most impressive.

### 1. Maxpromo OS — the capture-to-document flow

The only system the registry calls `live`. Every step of its workflow is
confirmed in code, including both human decision points. It demonstrates the
exact claim the Workflow Automation page makes, and it does it on the company's
own business, which removes the consent question entirely and answers the
oldest objection in consulting: *do you use this yourself.*

Its weakness is real and solvable: no synthetic data path, so no screenshot can
be taken today without a sanitisation decision.

### 2. Agent Bureau — the approvals queue

The only system that can be photographed today. A governed, idempotent,
explicitly safe seed already populates a synthetic tenant across nine data
modules. Its approvals screen is a literal human-control surface. It is the
fastest route from this audit to a real image replacing a governed placeholder.

Its weakness is that it is a product rather than a client outcome, and that
`status` is `demo-ready` rather than `live`.

### 3. The Joomla CI/CD migration — a real client project

The only candidate that is unambiguously delivered client work with an outcome.
Already written up in both locales, already published, already anonymised. Its
figures are the only ones in the repository that are re-evidenceable in
principle rather than merely assertable.

Its weakness is that no artefact survives here, and the client is unknown.

**Not ranked:** cs1, cs2 and cs3. They have the best-sounding numbers and the
worst evidence: no code, no artefact, no client, no consent record, one figure
contradicted by its own history. They are not disqualified, they are
un-evidenced, and the difference matters because Marcel may hold the evidence
outside this repository.

---

## J. Recommended first evidence package

**Maxpromo OS, the capture-to-document flow, as a system breakdown.**

Not because it is the most impressive, but because it is the only candidate
where every part of a complete evidence package can be built without asking
anyone's permission:

| Part | Available | Note |
|---|---|---|
| Business problem | yes | quotes and invoices assembled by hand |
| Before and after | partly | the "after" is confirmed; the "before" needs one sentence from Marcel, not invention |
| Workflow diagram | **yes** | drawable from code, not from copy |
| Human control | **yes** | two confirmed decision points |
| Screenshot | after a data decision | the AI modal on `angebote/new` is the single strongest image the company could publish |
| Figures | **no** | and it does not need them; "we run our own business on this" is a claim about capability, not about a client's savings |
| Consent | **not required** | own system, own data |

It supports the Workflow Automation proof slot, the Custom Applications proof
slot, a Work entry, a future system breakdown and a short video, from one piece
of work.

**Sequenced second**, because it is faster and needs no decision: one Agent
Bureau approvals screenshot from the seeded tenant, which can replace a
governed placeholder this week.

---

## K. What only Marcel can supply

Everything below is genuinely outside the repository. None of it can be
inferred, and none of it should be.

1. **The provenance of the four figures.** Where did 78%, 3 days → 4 hours, 94%
   and £14,000 come from? A report, a dashboard export, an invoice, a client
   email. Without this they stay SOURCE EXISTS BUT NEEDS REVIEW and the
   homepage continues to publish two of them on trust.

2. **Which currency was correct for the £14,000 figure**, and whether the
   client saving was euros or pounds. The two published versions differ by
   about seventeen per cent, so at least one of them was wrong in public.

3. **Do cs1, cs2 and cs3 correspond to real, identifiable clients**, and is
   there a written agreement permitting the anonymised account? The site says
   there is. The repository cannot show it.

4. **Who the Joomla migration client was**, and whether the measurements behind
   its figures still exist.

5. **May the OS be seeded with synthetic clients** so its screens can be
   photographed, or should screenshots be sanitised by hand? This is the single
   decision blocking the strongest available image.

6. **Do any of the nine code-less products actually exist** as running systems
   elsewhere, and if so where. The registry says demo-ready; this repository
   cannot confirm or deny it.

7. **One sentence on how quotes and invoices were produced before the OS.**
   Needed so the "before" is recorded rather than assumed.

---

## What was not done

No placeholder was replaced, no case study published, no demo opened, no
production data read or altered, no public page changed, nothing deployed. The
only files this audit changed are this document and a correction to the Phase A
change log, which had recorded the currency history incorrectly.
