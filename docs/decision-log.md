# Decision Log

## 2026-07-10 — Build on existing uncommitted product-page WIP rather than discard it

**Decision:** The 7 generic product pages and `messages/*.json` had pre-existing uncommitted changes using a client-side `useLocale()` pattern flagged as architecturally wrong by the sprint brief. Rather than `git stash` and rewrite from scratch, the existing bilingual copy was kept and the pages were refactored in place to the server `params.locale` pattern (matching `taxkontrol/page.tsx`).
**Why:** Marcel confirmed this explicitly when asked. The copy itself was high quality; only the locale-threading mechanism was wrong.
**Owner:** Marcel (confirmed via clarifying question at sprint start).

## 2026-07-10 — Proceeded without further AI-Operating-System repo onboarding

**Decision:** `maxpromo.digital` has never had its `repo-docs/` charter instantiated from `C:\Users\loneb\Documents\AI-OPERATING-SYSTEM\repo-docs\` templates (no repository-map, no lifecycle-stage declaration). Rather than pausing the sprint to fully onboard the repo into that governance system, the sprint proceeded using the sprint brief + this repo's `CLAUDE.md` + the real architecture docs at `docs/architecture/sprint-correction/*.md` as the operative spec, and used this session to backfill `decision-log.md`, `known-risks.md`, and `change-log.md` per this repo's own memory rule.
**Why:** The sprint was a bounded, well-specified production-hardening task, not a repository bootstrap. Full onboarding (declaring lifecycle stage/class, instantiating all charter docs) is a separate, larger piece of work.
**How to apply:** If a future session needs the full charter (product-brief.md, repository-map.md, architecture.md, workflow-map.md, data-ownership.md, production-readiness.md), that's still outstanding and should be done as its own task, ideally with Marcel's input on lifecycle stage/class rather than an AI guessing it.
