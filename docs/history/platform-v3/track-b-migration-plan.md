# Track B — Platform Unification: Migration Plan

Status: **Awaiting approval. No code has been moved.**
Date: 2026-09-03
Scope: `maxpromo.digital` + `maxpromo-agent-bureau` → one repository

All figures below were measured today, not carried over from the Phase 1 audit.
Much of what that audit found has since been fixed, and the plan reflects the
repositories as they actually are now.

---

## 0. Blocking items — read before anything else

### 0.1 🔴 LEGAL — a public EU-hosting claim contradicted by the database region

`agents.maxpromo.digital` states publicly, in its hero:

> **"DSGVO-konform, in der EU gehostet, gebaut in Essen."**
> (GDPR-compliant, hosted in the EU, built in Essen.)

Its database is a Neon instance in **`us-east-1`** (Virginia, United States).
`maxpromo.digital`'s database is in `eu-central-1`, which is consistent with its
claims. Agent Bureau's is not.

The tables in that US-region database include `contacts`, `leads`,
`waiting_room_items`, `memory_entries` and `document_intake_items` — personal
data of German business contacts.

This is a factual mismatch between a public statement and the deployed
infrastructure, with GDPR Chapter V (third-country transfer) implications. **I
am not resolving it on my own initiative**, because both available actions are
yours to take:

- Changing the copy would remove the claim rather than the discrepancy, and
  would quietly erase evidence of it.
- Moving the database is a production data migration on live customer records.

**Disclosure:** the sentence in its current form was written by me during the
v5.1 rewrite. The claim itself predates that — it existed as the trust badge
"EU-gehostet" — but I carried it forward without verifying it, and I should
have checked. Flagging it now.

**This blocks Track B**, because the consolidation decides which database
connections live where and it would be wrong to bake this in.

### 0.2 Vercel reconfiguration is required and will break deploys until done

The migration changes each app's root directory. Until the Vercel projects are
updated, deploys from the merged repository will fail. Details and the exact
settings are in §5. This needs you in the Vercel dashboard; I cannot do it.

### 0.3 The handover report still does not exist

`docs/MAXPROMPO DIGITAL + OPENCLAW HANDOVER REPORT.md` has been listed as
required reading in six consecutive briefs and is not in either repository. All
work has proceeded on Core Memory plus the phase documents. If it contains
anything that contradicts this plan, it should be supplied before approval.

---

## 1. Current repository boundaries

| | `maxpromo.digital` | `maxpromo-agent-bureau` |
|---|---|---|
| GitHub | `buddy1974/maxpromo.digital` | `buddy1974/maxpromo-agent-bureau` |
| Commits | **197** (from 2026-03-05) | **32** (from 2026-05-29) |
| Tracked files | 371 | 204 |
| `.git` size | **188 MB** | 3.2 MB |
| Working tree | 47 MB (44 MB of it `public/`) | 1.7 MB |
| Components | 50 | 46 |
| Domains served | **11** (hub + 9 showcase + localhost) | 1 |
| Vercel project | not linked in-tree | `prj_3OWjluaJPD4Rcrnupylmpwq1Vgqf` |
| Database | Neon, **`eu-central-1`** | Neon, **`us-east-1`** |
| Auth | signed httpOnly cookie | NextAuth v4 + argon2 |
| ORM | raw SQL | drizzle (+ migrations) |
| i18n | next-intl, DE/EN | none (German only) |

Three applications live inside these two repositories:

1. **Marketing site** — `maxpromo.digital`, `app/[locale]`
2. **Showcase engine** — the same codebase serving nine product domains from
   their own roots, selected by `lib/host/HOST_MAP.ts`
3. **Internal OS** — `os.maxpromo.digital`, `app/os`
4. **Agent Bureau** — `agents.maxpromo.digital`, the second repository

The showcase engine matters more than it looks: **one Vercel project already
serves ten public domains.** Any change to that project's build settings affects
all ten at once.

---

## 2. Duplication audit

### 2.1 Literal duplication — small, and precisely known

**Four byte-identical file pairs, 26 KB total.** That is the entire literal
overlap between the repositories today.

| File | Size | Note |
|---|---:|---|
| `design/tokens/brand.css` | 13.4 KB | the design system |
| `scripts/check-design-tokens.mjs` | 6.8 KB | the enforcement check |
| `design/tokens/index.ts` | 3.9 KB | token mirror for email/PDF |
| `CLAUDE.md` | 2.0 KB | generic governance boilerplate |

The token copy is deliberate and marked — its own header says it is a
synchronised copy pending this consolidation and must not be edited in place.
It is the single clearest justification for `packages/`.

### 2.2 Duplicated component definitions

Five CSS component classes are defined independently in both stylesheets:
**`.btn`, `.btn-primary`, `.btn-secondary`, `.card`, `.section-label`.**

They currently produce identical output, because I wrote the second copy from
the first. Nothing enforces that. This is exactly how the two Tailwind configs
drifted — same brief, hand-matched values, and `accent-hover` ended up lighter
in one and darker in the other.

At the React level there is **no shared component code at all**. The overlap is
conceptual:

| Concept | Web | Bureau |
|---|---|---|
| Marketing footer | `components/Footer.tsx` (colophon) | `components/marketing/Footer.tsx` |
| Marketing hero | `components/Hero.tsx` | `components/marketing/Hero.tsx` |
| Before/after | `landing/sections/BeforeAfter.tsx` | `marketing/BeforeAfter.tsx` |
| Section header | `ui/SectionHeader.tsx` | *(none — inline)* |
| Severity styling | *(none)* | `lib/ui/severity.ts` |
| App shell | `app/os/(protected)/layout.tsx`, 489 lines | `dashboard/{DashboardShell,Sidebar,Topbar}`, 129 lines |

Note the last two rows: each repository has solved something the other has not.
Consolidation is a two-way exchange, not one repository absorbing the other.

### 2.3 Duplicated utilities — mostly NOT duplicates

This is the most important correction to the Phase 1 picture. These pairs share
a name and a topic but not an API:

| Concern | Web | Bureau | Reality |
|---|---|---|---|
| Rate limiting | `rateLimit`, `enforceRateLimit` | `checkRateLimit`, `getClientIp`, 4 named limits | Two designs. Bureau's is per-route configured; web's is generic. |
| Env | `env` (validated config object) | `getAIConfig`, `hasAnthropicConfig`… | **Not the same thing at all.** Bureau's `config/env.ts` is AI provider selection. |
| AI | `callAI` (single entry) | `generateWithAnthropic` (one provider of two) | Bureau has a provider abstraction; web calls the SDK. |
| Auth | 12 exports, cookie + middleware guard | 3 exports, NextAuth wrapper | Different mechanisms entirely. |
| Telegram | 5 typed message builders | `notifyTelegram` (generic) | Web's is richer. |
| Legal identity | `lib/legal.ts` | `config/legal.ts` | **Genuinely two sources of one truth.** Values differ: finanzamt is "Essen-NordOst" vs "FA Essen-NordOst"; web has phone/postal code, bureau has a `product` field. |

**Consequence for the plan:** only `legal.ts` can be merged mechanically. The
rest require choosing a standard and migrating call sites, which is design work
and must not be smuggled into a file-move commit.

### 2.4 Duplicated design tokens

One duplicate: the token package, described above. There are no longer competing
token *systems* — the `--brand-*` / `--showcase-*` split was resolved in v4.0,
and both repositories now report **zero hardcoded colours** under the enforced
check.

### 2.5 Duplicated documentation

| Document | Web | Bureau | Status |
|---|---|---|---|
| `visual-facelift-v2.1.md` | 117 lines | 179 lines | **Forked.** Bureau's carries a conflict warning and ADR-002 note the web copy lacks. Both describe a system that has since been superseded twice. |
| `decision-log.md` | 98 lines | 583 lines | Two logs, one company |
| `known-risks.md` | 73 lines | 64 lines | Two registers |
| `CLAUDE.md` | identical | identical | Generic; names neither repository |
| `README.md` | 49 | 116 | Per-app, legitimately |
| Empty required docs | 4 (`product-brief`, `workflow-map`, `release-checklist`, `security-checklist`) | — | Still 0 bytes |

### 2.6 Dependency divergence

12 shared dependencies, **all 12 with mismatched version specifiers** — though
after the v5.0 alignment they resolve compatibly (`next 16.1.6` vs `^16.1.6`).
A workspace install will hoist and normalise these, which is a real benefit:
today nothing prevents them drifting apart again.

- Web only (11): MDX stack, next-intl, framer-motion, Anthropic SDK, qrcode…
- Bureau only (5): drizzle, drizzle-kit, next-auth, argon2, zod

---

## 3. Target architecture

```
maxpromo-platform/                    ← the existing maxpromo.digital repo, renamed
├─ package.json                       workspaces root; no app code
├─ packages/
│  ├─ tokens/                         design system. Zero dependencies.
│  │  ├─ brand.css                    the CSS custom properties
│  │  └─ index.ts                     the TS mirror for email / PDF / SVG
│  ├─ ui/                             shared React. Depends on tokens only.
│  │  ├─ primitives/                  Button, Card, Badge, Input, SectionHeader
│  │  ├─ status/                      severity + run-state (from bureau)
│  │  └─ shell/                       AppShell, Sidebar, Topbar (from bureau)
│  ├─ config/                         legal identity, shared constants
│  └─ tooling/                        the token check, shared eslint + tsconfig
├─ apps/
│  ├─ web/                            maxpromo.digital + 9 showcase domains + /os
│  └─ bureau/                         agents.maxpromo.digital
└─ docs/                              one decision log, one risk register
```

**`apps/os` is deliberately not created yet.** The internal OS shares `lib/db`,
`lib/documents` and `lib/email` with the marketing site. Extracting it is a
separate piece of work and must not ride along with a repository move.

### What "no distinction between the three" can and cannot mean

The brief asks that `maxpromo.digital`, `agents.maxpromo.digital` and
`os.maxpromo.digital` feel like modules of one platform. Achievable and planned:

- one design system, one component library, one interface language
- one repository, one install, one lint and type configuration
- one documentation standard, one decision log

Not achievable, and I want this stated plainly before approval rather than
discovered afterwards:

- **One database.** They are two Neon instances in two regions with two
  unrelated schemas (`os_*` tables vs 30 drizzle tables). Merging them is a
  data migration, not a repository change, and §0.1 must be settled first.
- **One auth session.** Cookie sessions and NextAuth JWTs are different
  mechanisms. A single sign-on across all three is a genuine feature with its
  own design; it is not a consequence of sharing a repository.
- **One Vercel deployment.** See §5.

---

## 4. Migration sequence

Each step is independently revertible and independently verifiable. Nothing
after B2 depends on Vercel being reconfigured, so the risky step is isolated
and early.

| # | Step | Risk | Verification |
|---|---|---|---|
| **B0** | Land the pending branches. `feature/platform-v4` (13 commits) and `feature/platform-v5` (4 commits) merge to their own `main`s first, so the consolidation starts from a released baseline rather than from two feature branches. | Low | Both `main`s build; production deploys unchanged |
| **B1** | Restructure `maxpromo.digital` in place: move app code to `apps/web/`, add the workspace root. Repository renamed to `maxpromo-platform`. **No bureau code yet.** | **Medium** — Vercel breaks here | `apps/web` builds; Vercel updated per §5; production verified |
| **B2** | Bring Agent Bureau in as `apps/bureau` via `git subtree add`, preserving its 32 commits. | Low | `apps/bureau` builds; its Vercel project updated |
| **B3** | Extract `packages/tokens`. Both apps import it; the two synchronised copies are deleted. **This is the change that pays for the whole exercise.** | Low | Token check clean in both; zero visual diff |
| **B4** | Extract `packages/tooling`: the token check, shared tsconfig, shared eslint. | Low | `npm run verify` passes from the root for both apps |
| **B5** | Extract `packages/config`: legal identity merged from the two variants (values reconciled — see §2.3). | Low | Impressum, invoices and emails render identical values |
| **B6** | Extract `packages/ui` **status + shell**: bureau's severity map and dashboard shell become shared; the 489-line OS layout is decomposed onto it. | Medium | Both dashboards render; visual QA on each |
| **B7** | Extract `packages/ui` **primitives**: Button, Card, Input, Badge, SectionHeader. The five duplicated CSS classes collapse to one definition. | Medium | Zero visual diff on both apps |
| **B8** | Documentation consolidation: one decision log, one risk register, one architecture doc. The forked v2.1 spec is archived, not merged — it describes a superseded system. | Low | — |
| **B9** | Platform standards: choose one rate-limiter, one AI access layer, one validation library. **Design work, quoted separately** — not a file move. | Medium | Per-change |

### The `@/*` alias collision

Both repositories map `@/*` → `./*`. In one workspace those resolve
differently per app, which works, but `@/lib/legal` would mean two different
files depending on which app you are in. Resolved in B1 by keeping `@/*`
app-local and giving packages explicit names (`@maxpromo/tokens`,
`@maxpromo/ui`), so an import states which side of the boundary it crosses.

---

## 5. Deployment and Vercel impact

### What changes

Today each repository is a Vercel project whose root is the repository root.
After B1/B2 both apps sit one level down.

**Required in the Vercel dashboard, by you:**

| Project | Setting | From | To |
|---|---|---|---|
| maxpromo.digital | Git repository | `maxpromo.digital` | `maxpromo-platform` |
| maxpromo.digital | Root Directory | *(empty)* | `apps/web` |
| maxpromo-agent-bureau | Git repository | `maxpromo-agent-bureau` | `maxpromo-platform` |
| maxpromo-agent-bureau | Root Directory | *(empty)* | `apps/bureau` |
| both | Include files outside root | off | **on** (needed to reach `packages/`) |

Environment variables do not move. They stay per-project, which is what keeps
the two databases separate.

### Two Vercel projects, not one

"One deployment pipeline" is satisfied by one repository, one CI configuration
and one verify command. It does not mean one Vercel project, and it should not:

- The web project serves **ten public domains**; a bad deploy there is a
  ten-domain outage. Agent Bureau should not be able to cause that.
- The two apps hold **different `DATABASE_URL` values pointing at different
  Neon instances in different regions.** One project cannot hold both.
- Independent rollback per app is worth more than a merged pipeline.

Recommended: keep two projects, add `ignoreCommand` to each so a commit
touching only the other app does not trigger a rebuild.

### Deployment risk window

B1 is the only step that can take production down, and only if merged before
Vercel is reconfigured. Mitigation: **B1 lands on a branch, the Vercel change is
made against a preview deployment, and only then is it merged.** Preview URLs
confirm the new root directory works before `main` moves.

---

## 6. Git history impact

**Recommendation: keep `maxpromo.digital` as the root repository and rename it.**

- Its 197 commits and all blame history survive untouched. No rewrite.
- `git mv` into `apps/web/` preserves history; `--follow` traces across it.
- Agent Bureau comes in via `git subtree add --prefix=apps/bureau`, which
  preserves its 32 commits as real history rather than a squashed import.

**The `.git` directory is 188 MB, of which most is image history** — 250 objects
under `public/images`, including the pre-optimisation 2.5 MB PNGs that the v4.0
work replaced. That weight is pre-existing and the merge does not add to it.

I am **not** proposing a history rewrite (`filter-repo`) to shrink it. It would
invalidate every existing clone and every commit SHA referenced in the decision
log, in exchange for clone speed. If that trade is ever wanted it should be its
own decision, taken deliberately, not folded into a consolidation.

**What is lost:** the two repositories' issue/PR histories on GitHub stay with
their original repos. Agent Bureau's repository would be archived, not deleted,
so its issues remain readable.

---

## 7. Rollback strategy

Layered, so the cheapest applicable rollback is always available.

| Layer | Mechanism | Recovers from | Time |
|---|---|---|---|
| 1 | **Vercel instant rollback** to the previous deployment | any bad deploy | seconds |
| 2 | `git revert` of a single step's merge commit | one bad step | minutes |
| 3 | **Tag `pre-track-b` on both `main`s before B0.** Both original repositories stay in place, untouched and deployable, until Track B is signed off. | the whole exercise | one Vercel setting change |
| 4 | Agent Bureau's original repository is **archived, not deleted**, for at least one release cycle | needing the old repo back | — |

Preconditions before B1:
- both `main`s tagged `pre-track-b`
- both Vercel projects have a known-good production deployment to roll back to
- the current working branches merged or explicitly parked (both trees are
  clean; 13 and 4 commits pending)

**Rollback trigger:** any step whose verification fails and is not fixed within
that step. Steps are not stacked on unverified predecessors.

---

## 8. Decisions required before I proceed

1. **§0.1 — the EU-hosting claim.** Move the database to an EU region, or change
   the public claim. This is a legal question and it is yours. Track B should not
   start until it is answered, because the consolidation fixes where database
   configuration lives.
2. **Approve the target architecture** in §3, including that the three surfaces
   share a design system and a repository but keep separate databases, separate
   auth and separate Vercel projects.
3. **Approve the merge direction** in §6: `maxpromo.digital` becomes
   `maxpromo-platform`, Agent Bureau enters as a subtree, no history rewrite.
4. **Confirm you will make the Vercel changes** in §5 when B1 reaches preview,
   and that a short window with `main` behind the branch is acceptable.
5. **Confirm the repository rename** on GitHub (`maxpromo.digital` →
   `maxpromo-platform`), or say you would rather keep the current name.

On approval I will start at B0 and work through the sequence, verifying and
committing each step, and stopping at B9 — which is design work needing its own
scope.
