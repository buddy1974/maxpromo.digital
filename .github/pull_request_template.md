## What changed

<!-- One or two sentences. What a reviewer needs to know before reading the diff. -->

## Why

<!-- The problem this solves. If it is a decision, link the ADR. -->

## Governance

`npm run verify` passes locally.

Tick what applies; delete what does not. An unticked box that should be ticked
is a reason not to merge.

- [ ] **Accessibility** — contrast, one `h1`, no heading skips, focus states, labelled controls
- [ ] **Responsive** — checked at 390 / 768 / 1440; no grid without a single-column state
- [ ] **Internal links** — sitemap and redirects updated for any route added or removed
- [ ] **Documentation** — decision in `docs/adr/`, risk in `docs/governance/known-risks.md`, change in `docs/history/change-log.md`
- [ ] **Security** — no secrets; any new public route has a rate limit and a recorded auth decision
- [ ] **No duplication** — nothing added that already exists in `packages/`

## Anything a reviewer should push back on

<!-- Say it here rather than letting them find it. -->
