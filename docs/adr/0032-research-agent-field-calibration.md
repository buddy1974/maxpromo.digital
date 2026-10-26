# ADR-0032 — Research Agent field calibration: Marcel's judgement as evidence, never as a lever

Date: 2026-10-26
Status: **Accepted (owner brief "Research Agent field calibration"); implemented (`407a676`),
migration 0028 applied to production 2026-10-26.** Builds on ADR-0030 (delegated agent work) and
ADR-0031 (the research result contract). Changes nothing in either.

## Context

ADR-0031 made the Research Agent read real sites and was proven on one real prospect. Whether its
judgement is commercially useful can only be learned by comparing it with Marcel's own on several
genuine prospects he chooses (5–10, mixed website types). The agent must run exactly as deployed while
that evidence is gathered: the ruler is being measured, not adjusted.

## Decisions

1. **One judgement belongs to one research run.** `os_agent_work_review` (migration 0028) references
   `os_agent_work.id`. Only a *completed* research run can be judged. No research data is copied.
2. **Append-only.** Changing his mind adds a row; the newest row is the run's current judgement,
   earlier rows stay. No update, no delete.
3. **Small and fixed.** Verdict `agree | partly | disagree`; optional issues from a fixed list (the
   table's CHECK): missed an important signal, invented or overstated something, misunderstood the
   business, scored too high, scored too low, wrong next step; an optional note (≤ 500 characters).
4. **The run keeps its own record.** A finished run's summary now carries the calibration record —
   business type, pages read, facts with quotes, opportunities, unknowns, limitations — so a later run
   (which replaces the lead's research) cannot change what was judged. Duration is the Bureau's
   reported latency, else the run's timestamps. Runs finished before this ADR show what they kept.
5. **A judgement is evidence, nothing else.** `agentwork.review` (GREEN, owner only, lead screen only,
   not a Max proposal) writes the review and an `os_audit` row. It never touches the run, the lead's
   research, score or stage, a draft, an approval, a message or a basis. Nothing reads the reviews to
   change scoring, prompts, thresholds, page selection, qualification or recommendations.
6. **Counted: real prospects only.** The summary (`/os/leads/calibration`) excludes our own site, test
   recipients and leads named TEST/EVD (shown, marked "test — not counted"). It shows researched,
   judged, agreement, verdict and confidence distributions, average duration, partial or failed reads,
   issue counts and Marcel's notes. **Patterns** (agreement by verdict, confidence, business type,
   readability) appear only from five judged real runs; below that, counts only. No prose conclusions
   are generated.
7. **UI stays secondary.** On the lead screen, below the result: "Was this research useful?" with three
   buttons; tags and note appear only after a choice. Max is unchanged.

## Rejected

- A calibration database or copies of lead/research data — the run already holds the record.
- Automatic retuning from feedback. Marcel decides what the evidence means, after the batch.
- Populating prospects. Marcel chooses them; nothing is discovered, scraped or contacted.

## Consequences

- Proofs: `prove:agent-work` 53 (was 47; 6 calibration properties), new
  `prove:research-calibration-evidence` 23 (evidence database, the brief's points 1–12).
- Risks 177–179 (`docs/governance/known-risks.md`).
