# Pricing alignment review

Date: 2026-09-04 · v9.5 · **Recommendation only. Nothing here has been
implemented.**

The brief for this review was explicit: *compare every pricing item against the
approved company identity, classify it, and recommend — do not redesign
pricing.* That is what this is. Every line below is a proposal for Marcel to
accept, reject or amend; the pricing page is unchanged.

---

## The problem in one paragraph

`/pricing` sells three monthly plans — **Digital Starter Care €149**,
**Digital Growth Care €249**, **Digital Full Care €399**. Their contents are
website maintenance, a Google Business profile, four to twelve social posts a
month, review responses, a monthly newsletter, Google Ads management,
competitor monitoring and an account team.

That is a digital marketing retainer. It is offered on the page where a buyer
goes to learn what the commercial relationship actually is, by a company whose
every other page says it builds the systems a business runs on, whose About
page says *"most businesses do not need another website"*, and whose core
memory carries a permanent rule against being positioned as a website or
marketing agency.

A visitor who reads `/about` and then `/pricing` does not conclude that the
company does both. They conclude that `/about` is aspirational and `/pricing`
is what is actually for sale.

This is not a wording problem and it cannot be fixed by editing copy.

---

## Item by item

| Item | Plan | Classification | Why |
|---|---|---|---|
| Website maintenance & updates | Starter+ | **KEEP** | Maintaining what was built is the company's stated differentiator — *"we stay after it ships"*. It is the one item here that the rest of the site already promises. |
| Monthly short report | Starter+ | **KEEP** | Reporting on a system you run is operations, not marketing. |
| Email support | Starter+ | **KEEP** | Belongs to a support agreement. |
| Phone support · Priority response | Growth+ | **KEEP** | Same — these are support tiers, and support tiers are how systems companies price. |
| Google Business profile kept current | Starter+ | **MOVE** | A real service, but a marketing one. If it stays, it belongs to a separate marketing offer with its own page and its own name, not inside the systems company's price list. |
| 4 / 8 / 12+ social posts per month | all three | **RETIRE** or **MOVE** | Nothing on the site prepares a buyer for this. It is the single clearest signal that the pricing page belongs to a different company from the one the rest of the site describes. |
| Review responses | Starter+ | **MOVE** | There is a genuine systems version of this — *review collection as a workflow* — and `/solutions/reviews` already describes it. Writing the responses is agency work; installing the system that collects and routes them is not. |
| Monthly email newsletter | Growth+ | **MOVE** | Same distinction. `/blog/internal-newsletter-system` describes building a client their own newsletter system. Writing their newsletter each month is a different business. |
| Google Ads management | Full | **RETIRE** | No page on the site mentions advertising. There is no system being built or maintained here. |
| Competitor monitoring | Full | **RETIRE** | Same. |
| 1 / up to 3 automation workflows | Growth+ | **RESTRUCTURE** | The right idea in the wrong unit. Counting workflows prices the artefact rather than the outcome, and it caps a system that is supposed to grow with the business — which contradicts *"start with one system, add more as the business grows"* on the homepage. |
| Monthly strategy calls | Full | **KEEP** | Consultative, and consistent with the positioning. |
| WhatsApp support | Full | **KEEP** | A support channel. |
| **"Full account team"** | Full | **REWRITE** | The Impressum, the footer and the §19 UStG clause on the same site all state a single-person business. A buyer who reads both has found a discrepancy in the first minute. This one is not a positioning question — it is a claim that the site's own legal page contradicts. |
| Build work from €999, quoted after seeing the process | — | **KEEP** | Exactly right, and well written: *"Anyone quoting before that is guessing, and the guess is always low."* |

---

## What a systems company's price list looks like

The brief names the shape it should support. Mapped onto what already exists on
the site, with nothing invented:

| Stage | Already described at | Currently priced? |
|---|---|---|
| **Discovery** — the business check | homepage process step 1, every industry page | Free, and said so. Good. |
| **Business assessment** — workflows documented, what is manual and where it leaks | homepage process step 2 (*1–2 days*) | No |
| **Architecture and system design** — scope, tools, integrations, what gets built | homepage process step 3 (*2–3 days*) | No |
| **Business systems** — the build | homepage process step 4, six solution pages | From €999, quoted |
| **AI workforce** — supervised agents | `/agent-bureau`, Agent Bureau's own site | No |
| **Managed operations** — running the system that was built | homepage process step 5 (*ongoing*), *"we stay after it ships"* | **This is what the Care plans should be** |
| **Support agreements** — response times, channels, escalation | the support lines inside the Care plans | Partly |

**The site already describes this ladder in full.** The homepage walks a
visitor up it — thirty minutes, then one to two days, then two to three days,
then the build, then ongoing. Every rung has a page. Only one rung has a price,
and the monthly plans that should price the last rung price something else
instead.

The recommendation is therefore not to invent a pricing model. It is to price
the model the site already describes.

---

## Two things to decide first

**1. Is the marketing work a real line of business?** If Maxpromo genuinely
sells social posts and Google Ads to existing clients, that is a legitimate
business and the answer is not to hide it — it is to give it its own name and
its own page, so the systems company is not introduced through its retainer.
If it is legacy from an earlier positioning, retiring it is the single highest-
leverage change available to this platform.

**2. What replaces the Care plans on `/pricing`?** A buyer needs a number
before they will start a conversation, which is why the page exists and why
*"from €999"* works. Managed operations needs the same treatment: a floor, an
honest statement that scope decides the rest, and no counted workflows.

---

## Related

- `docs/governance/known-risks.md` — risks 38, 39, 42
- `docs/openclaw/core-memory.md` — positioning, and the permanent rule this
  review measures against
- `docs/adr/0007-a-claim-is-checked-like-a-token.md` — why the numbers on this
  page are audited but never corrected automatically
