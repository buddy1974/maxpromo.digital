# ADR-0002 — Status styling is a tone, not a severity

Date: 2026-09-03
Status: **Accepted**

---

## Context

Eleven components in the Agent Bureau dashboard each declared their own status
lookup table — `RiskBadge`, `DocumentRiskBadge`, `StatusBadge`,
`GovernanceRiskCard`, `AuditFindingCard`, `TaskList`, `WaitingCustomerCard`,
`DataSensitivityMatrix`, `PolicyChecklist`, and the projects and
client-implementation pages.

Eleven copies of one idea produced the drift you would expect: some used
`amber-600` (3.1:1 on white, failing WCAG AA) and others `amber-700`.

A first attempt at fixing this added a shared `SEVERITY_TEXT` / `SEVERITY_BADGE`
map keyed on `low | medium | high | critical`. **Every one of the eleven
ignored it.** That is the useful part of this record: the abstraction was
wrong, not merely unadopted.

## The reason it was ignored

The components do not share a vocabulary. `AgentRiskLevel`,
`DocumentRiskLevel`, `AgentStatus`, `TaskPriority`, `DataSensitivity`,
`IntegrationStatus` and `ProjectHealth` are genuinely different domains with
genuinely different members. A shared map keyed on one of them could not
express the others, so each component kept its own.

What they *did* share, character for character, was the style strings.

## Decision

**The shared abstraction is the tone, not the vocabulary.**

`@maxpromo/ui` exports a `Tone` union — `neutral | positive | caution |
critical | info | accent` — and three style maps keyed on it: `TONE_TEXT`,
`TONE_BADGE`, `TONE_RULE`. A typed helper, `toneMap<T>()`, lets each component
map its own domain union onto a tone:

```ts
const RISK_TONE = toneMap<AgentRiskLevel>({
  low: 'positive', medium: 'caution', high: 'critical', critical: 'critical',
})
<span className={TONE_BADGE[RISK_TONE(level)]} />
```

Domain typing is preserved. The styling is defined once.

## Consequences

- Zero inline status style strings remain in Agent Bureau.
- A contrast fix now happens in one place instead of eleven.
- Tones resolve to `--semantic-*`, outside the brand namespace, so the rule
  that brand colours are never semantic colours holds by construction.
- `accent` is in the union for active and selected states. It is not a status,
  and using it as one is a review comment.

## The general lesson

A shared abstraction that callers ignore is not under-adopted; it is wrong.
Before extracting a package, check what the call sites actually have in common
— it is often one level lower than it first appears.
