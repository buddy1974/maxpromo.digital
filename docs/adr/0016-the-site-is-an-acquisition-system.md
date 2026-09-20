# ADR-0016 — The public site is an acquisition system, and it is built in that order

**Status:** accepted · 2026-09-20 · Marcel
**Supersedes:** the assumption that the five capability pages are the next
build. **Related:** ADR-0012 (the accent is not chrome), the Placeholders rule
in `docs/governance/standards.md`, and the research this decides on,
`docs/research/competitive-intelligence-2026.md`.

---

## Context

`maxpromo.digital` was treated as a company website: a set of pages describing
what the company does. The homepage content reset changed the voice but not
that assumption, and the plan after it was to rebuild all five capability
pages, in order, because they were the next pages in the sitemap.

The competitive research found that ordering backwards. Capability pages are
the surface with the least discovery value in the whole architecture: nobody
searches "workflow automation" who is not already shopping for a supplier, and
that visitor is rare and late. It also found the company had no way for a
stranger to arrive at all, and a proof surface that could not support the pages
meant to point at it.

The research is input, not a plan. This record is the plan.

---

## Decision

**The site is an acquisition system.** Its job is to move the right business
owner from discovery to a conversation, and to turn delivered work back into
the material that causes the next discovery:

```
DISCOVERY            search, social, outreach, referral, future resources
   ↓
USEFUL SURFACE       a problem guide, a capability page, a system breakdown,
                     a case study, a useful tool
   ↓
RECOGNITION          "that is my Tuesday"
   ↓
UNDERSTANDING        what is happening, why work sticks, what kind of system
                     helps, where people stay involved
   ↓
PROOF                screenshots, workflow diagrams, verified results,
                     the founder's history, human-control evidence
   ↓
NEXT STEP            an action sized to how ready the visitor is
   ↓
CONVERSATION → UNDERSTAND → SIMPLIFY → DESIGN → BUILD → RESULT
   ↓
NEW PROOF + KNOWLEDGE  ──────────────→ feeds DISCOVERY
```

The loop at the bottom is the part that makes this survivable for a company
this size. Maxpromo has no content team and will not have one. The only content
strategy that holds is the one where **delivering a project produces the
marketing material as a by-product**. Everything else requires someone to
invent things to say.

**None of this vocabulary appears on the website.** The visitor experiences the
system; they never read about it.

### The audience this is built for

German small and mid-sized businesses with operational friction: information
typed twice, follow-ups missed, work spread across tools that do not talk,
documents handled by hand, spreadsheets used past their useful life. Not people
interested in AI, not developers, not hobbyists. Technology is downstream of
the problem, on every page.

### The entry point

Not an abstract audit. "Tell us what is slowing the business down." Maxpromo
decides afterwards whether the answer is simplification, integration,
automation, an application, a web workflow, an agent, or improving what the
business already pays for.

### Build order

The order follows what a visitor needs to exist, not what the sitemap lists.

| Phase | What | Why this position |
|---|---|---|
| **A** | What We Do, Workflow Automation, Custom Applications, Work, Contact | The commercial foundation. Two capability pages, not five, because each needs real work to point at and only two can be supported honestly today |
| **B** | The proof engine | Capability pages are worth little until the thing they link to is worth reading |
| **C** | Business Friction Check, "what should I automate first", cost calculator | Acquisition assets, once there is proof behind them |
| **D** | Knowledge and search | Guides earn their place once the systems they describe are published |
| **E** | Web Development, Content & Social Operations, Product & Commerce Operations, industries | The remaining commercial surfaces, each waiting for its own proof |
| then | SEO, GEO, social | Last, because optimising surfaces that do not yet exist is wasted work |

---

## What this does not say

**It does not say the other three capabilities are unimportant.** It says a
page about them, today, would have an empty proof section. They remain
reachable at their existing URLs until Phase E, and What We Do links them
honestly rather than pretending they have been rebuilt.

**It does not make the Business Friction Check part of this phase.** Approved
as a future asset, with its shape fixed: five to eight useful questions, an
immediate useful result, email optional and afterwards, no readiness score, no
percentage, no sales theatre.

**It does not start a newsletter.** Later, and only if the work produces enough
to publish. Work creates the publication; the publication never creates work.

**It does not make Marcel the product.** He is visible and he is not the brand.
The company sells and delivers; the founder supplies human trust and expertise.
The real-photograph placeholder stays until he supplies the photograph.

**It does not give away implementation.** Knowledge is free: how to spot
repetitive work, how to map a process, what should stay human. The commercial
value is understanding a specific business and building the thing.

**It is not a shopping list from the research.** The strongest operators were
studied for mechanisms, not identities. Maxpromo does not become Nick Saraev's
blueprint library plus Jeff Su's newsletter plus a German SEO agency. The test
of every addition is whether the site still feels like one company that
understands operations, rather than an assembly of other people's funnels.

---

## Consequences

Phase A ships as one coherent release rather than five pages arriving
separately, because a commercial foundation with two of five surfaces done
reads as a broken site rather than a partial one.

Work becomes the load-bearing page. It stops being a portfolio and becomes the
proof surface that the capability pages, and later the guides, point at. Its
design has to anticipate assets that do not exist yet without fabricating them.

Every claim on Work is re-audited before it appears. Two supportable figures
beat three questionable ones, and the figure withdrawn from the homepage does
not return to fill a grid.

The backlog in `docs/research/competitive-intelligence-2026.md` §23 was written
before this decision and is superseded by the table above. It is kept because
the reasoning behind it is still the evidence for this record.
