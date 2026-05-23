# Landing Engine v2

**Status:** Partially implemented (Phase 2) — v2 additions target Phase 5
**Scope:** Product domain landing pages driven by LandingEngine

---

## Psychology Map (mandatory)

Every product landing page hits six stations in sequence. No station is
optional. Proof cannot precede Pain. Objections must be resolved before
the final CTA.

```
Pain       → What is wrong today (names the problem directly)
Reality    → Why it keeps happening (systemic — not the visitor's fault)
System     → What the product does about it (mechanism)
Result     → What changes concretely (hours, money, calm — specific)
Objection  → What the visitor is silently worried about
Proof      → Evidence that this actually works (real, not fabricated)
```

---

## Section Placement Map

| Section | Station(s) | Notes |
|---------|-----------|-------|
| Hero headline | Pain | 2-line contrast pair. Names the pain in 6 words or fewer. |
| Subline | Reality | "We automate X. You focus on Y." — implies why the pain persists. |
| Pain section | Pain + Reality | 3 cards. Each a specific pain symptom with systemic framing. |
| Before/After | Pain → Result | Direct visual comparison. No filler. |
| How It Works | System | 5-step workflow strip. VG-10. |
| Features | Result | 4 benefit columns. VG-11. Time / quality / revenue / reliability. |
| See In Action | Result + Proof | Workflow story. Outcome-led narrative. |
| Walkaround | System | Module-by-module guided preview. (Phase 5) |
| FAQ | Objection | FAQ questions ARE the objections. Answer them before the CTA. |
| Testimonials | Proof | Phase 5. Real clients. Real metrics. No fabrication. |
| Conversion | Result | Final CTA names the outcome, not the action. |

---

## Section Governance

**Pain must appear in the first viewport.** No exceptions. The visitor
should know what problem this solves before they scroll.

**Proof must be real.** Fabricated numbers, invented testimonials, and
placeholder metrics are rejected. Phase 3 removes all fake data.

**Result language is specific.** "Saves 6–10 hours/week" not "saves time".
"Live in 3 weeks" not "fast setup". Vague results = zero trust.

**FAQ items are pre-sales objections, not FAQ content.** Write the
questions the visitor is silently asking, not the questions a support team
would answer.

---

## LandingEngine — Current Implementation (Phase 2)

Components live at `components/landing/`. Driven by `LandingData` from
`lib/registry/adapters/landing.adapter.ts`.

Current section order:
```
HeroWorld → Pain → BeforeAfter → HowItWorks → Features → InAction → Faq → Conversion
```

Current gaps (v2 targets):
- `Pain` uses registry bullets as placeholder. Phase 5: per-product pain copy in registry.
- `InAction` uses 3 workflow steps as observations. Phase 5: replace with `SeeInAction` story renderer.
- `Walkaround` section does not exist. Phase 5: add between `Features` and `InAction`.
- `Testimonials` section does not exist. Phase 5: add after `InAction`, gated on CMS content.

---

## v2 Target Section Order (Phase 5)

```
HeroWorld
  Pain (per-product copy)
  BeforeAfter
  HowItWorks (5 steps)
  Walkaround (module preview)
  Features (4 columns)
  SeeInAction (story renderer)
  Testimonials (CMS-gated)
  Faq (per-product objections)
  Conversion
```

---

## Bridge Mode

When `bridge=true`, `LandingEngine` renders only `HeroWorld + Conversion`.
This is the compact form used on `maxpromo.digital/products/[slug]`.

Bridge mode is intentionally minimal. The full experience lives on the
product domain. The hub card is a teaser, not a full landing page.
