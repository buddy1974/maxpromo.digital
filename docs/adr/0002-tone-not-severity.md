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
critical | info | accent` — and style maps keyed on it: `TONE_TEXT` and
`TONE_BADGE` as Tailwind class strings, and `TONE_VARS` as CSS custom
properties.

> **2026-09-04.** This record originally named a third map, `TONE_RULE`, which
> was never implemented — a documented export that did not exist. `TONE_VARS`
> is real and was added in v10.0 for the reason below. A typed helper, `toneMap<T>()`, lets each component
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

## It happened again, in the other application

**2026-09-04.** The internal OS had **nine** status maps of its own — the
dashboard, quotations and invoices in both list and detail form, leads, job
priority, inbox log type and a document-scan confidence badge. Same finding as
this record describes: different vocabularies, identical style values.

They could not adopt `TONE_TEXT` or `TONE_BADGE` because those are Tailwind
class strings and the OS styles with inline `style` objects and custom
properties. **A shared abstraction the caller cannot physically consume is as
unadopted as one it ignores**, and the consequence was the same drift: the
dashboard coloured a new lead with the brand accent while the leads page
coloured it amber — one status, two colours, two screens.

Five of the nine used `--brand-primary` as a status colour, which this platform
forbids twice over: brand colours are never semantic colours, and Brand Lime as
text measures 1.51:1. Four carried a hex alpha pair appended to a `var()`
reference — `${color}20` — which is not a colour, so those backgrounds never
rendered.

`TONE_VARS` is the same six tones in the form the OS can consume. All nine maps
now use it.

## The general lesson

A shared abstraction that callers ignore is not under-adopted; it is wrong.
Before extracting a package, check what the call sites actually have in common
— it is often one level lower than it first appears. And check they can consume
the form you chose: the OS ignored the tone system for a year because it was
shipped as class names to an application that does not use classes.
