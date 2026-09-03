# Maxpromo Platform v4.0 — Progress

Branch: `feature/platform-v4`
Last updated: 2026-09-03

Governing documents: `docs/MAXPROMPO-CORE-MEMORY.md`, `phase-1-audit.md`,
`phase-2-architecture.md`, `phase-2b-design-direction.md`.

---

## You are here

```
Stage 1  Ground clearing        ██████████  B0 done   ·  B1/B2 deferred (see below)
Stage 2  Tokenise               ██████████  B3 B4 B5 B6 done
Stage 3  The flip               ██████████  B9 done
Stage 4  Consolidation          ░░░░░░░░░░  not started
Stage 5  Website / IA           ██░░░░░░░░  hero + problem grid done; IA not started
Stage 6  Close                  ░░░░░░░░░░  not started
```

**The brand migration is complete on every customer-facing surface.** Zero orange
literals remain in the source. What is left is consolidation (the monorepo, the
shared component package), the OS surface migration, and the information
architecture work.

---

## Completed batches

| Batch | What landed | Commit |
|---|---|---|
| — | Pre-existing i18n content work isolated so it could not be confused with migration output | `fb2754d` |
| **B0** | Dead code, scaffold assets, 83 MB of imagery | `3c220a6` |
| **B3** | Token system, typography scale, accent restraint, hero, problem grid | `f800540` |
| **B4** | Showcase engine unified; two-tier brand; VG-01/02/03 retired | `0366756` |
| **B5** | Invoices, quotations, PDFs, email templates tokenised | `c47c117` |
| **B6+B9** | OS accent unified; **orange retired, Brand Lime adopted** | `fae76fc` |

### Verification at each batch
`npx tsc --noEmit` clean · `npx eslint .` 0 errors · `npm run build` passes ·
browser QA on the homepage and a product page at 1440px.

---

## Measured state

| Metric | Before | Now |
|---|---:|---:|
| Orange literals in source | ~430 | **1** (a historical note in a comment) |
| Hex in `lib/documents` + `lib/email` | 158 | **0** |
| Hex in marketing (`app/[locale]`, `components`) | ~250 | 99 |
| Hex in `app/os` | 354 | 235 |
| `var(--brand-*)` uses | 0 | 740 |
| Slash-slash label motif | ~214 | **0** |
| Accent-coloured text elements | 220 | ~6 |
| Inline heading font declarations | 684 | 0 |
| Design token systems | 3 | **1** |
| `public/` weight | 127 MB | **44 MB** |
| Dead components | 14 | 0 |

---

## Deliberately deferred, with reasons

**B1/B2 — version alignment and the monorepo.** Phase 2 sequenced these first.
They were deferred because v4.0's priority is the design transformation, and
the monorepo move is infrastructure with no visible design outcome. Nothing was
lost by the reordering: `design/tokens/` was authored as a standalone,
dependency-free module precisely so that moving it to `packages/tokens/` later
is a file move, not a rewrite. **B1 (Agent Bureau on Next 16 + Tailwind v4)
remains a hard prerequisite for any shared component package.**

**Agent Bureau (B8).** Untouched in this pass. It is a separate repository on
Next 15 / Tailwind v3 and cannot consume the token package until B1 lands. It
is still on the retired orange. **This is the one place where the platform is
currently inconsistent, and it is visible at agents.maxpromo.digital.**

**`app/os` surfaces (D3).** The accent is unified, so the OS flipped to lime
with everything else. Its dark surfaces (235 hex values) are unchanged. The
light migration is a redesign of 13 pages, not a sweep, and coupling it to the
brand change would have made the flip un-reviewable.

---

## Open decisions

**D3 — `app/os` to light.** Recommended in Phase 2 and reaffirmed by v4.0's
platform-consistency list. Not yet done. Confirm before the OS batch starts.

**D5 — the hero.** v4.0 specified the Operations Center concept and it is built.
The original question (which two-column hero the v3.1 brief was describing)
never got an answer; it no longer blocks anything.

**Handover report.** `docs/MAXPROMPO DIGITAL + OPENCLAW HANDOVER REPORT.md` has
been listed as required reading in three consecutive briefs and does not exist
in either repository. All work so far has proceeded on Core Memory plus the
three phase documents. If it contains anything that contradicts what has been
built, it should be supplied before Stage 4.

---

## Next batches, in order

1. **B1** — Agent Bureau to Next 16 + Tailwind v4. Verify NextAuth v4 first; if
   it fails under Next 16, stop and escalate.
2. **B8** — Agent Bureau adopts the token package and the semantic status
   colours. Removes the last orange in the ecosystem.
3. **B-OS** — `app/os` to light surfaces; decompose the 489-line layout onto a
   shared shell.
4. **B2** — monorepo scaffold.
5. **B11–B15** — `packages/ui`: status primitives (kills 10 duplicate severity
   maps), buttons/cards, unified admin shell, shared marketing chrome,
   `packages/config` for legal identity.
6. **B16–B17** — information architecture, then homepage reduction.
7. **B18–B19** — enforcement to error, full validation suite.
