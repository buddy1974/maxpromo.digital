# Maxpromo Platform — Repository Governance

One repository. Three applications. One design system, one component library,
one documentation tree, one set of standards.

```
apps/web      maxpromo.digital + 9 product showcase domains + the internal OS
apps/bureau   agents.maxpromo.digital
packages/     design-tokens · ui · config · tooling
docs/         architecture · adr · governance · deployment · brand · openclaw
```

---

## Before doing anything

1. `docs/architecture/platform.md` — how the platform is put together
2. `docs/governance/standards.md` — what every change must satisfy
3. `docs/openclaw/core-memory.md` — the company's operating memory
4. `docs/adr/` — why things are the way they are

Do not code before understanding the repository. Do not repeat work that
`packages/` already does.

---

## The one command

```bash
npm run verify        # token audit → typecheck → lint → build, all workspaces
npm run dev:web       # maxpromo.digital on :3020
npm run dev:bureau    # Agent Bureau
```

Never say "should work". Only say **passed** after `npm run verify` has
actually run. For anything with live behaviour — login, a deploy, a generated
document — "done" means it was demonstrated, not that files were written.

---

## Rules that are not negotiable

**Never two implementations.** If two applications need the same thing it goes
in `packages/` and neither keeps a copy. This is the rule this platform has
broken most expensively: two design systems from one brief, two token files
synced by hand, eleven status maps in one dashboard, two legal identity modules
disagreeing on the tax office.

**No hardcoded colours.** Components use `--brand-*` and `--semantic-*` only.
The build enforces it.

**The accent is a fill.** Brand Lime as text is 1.51:1. Text on it is black.
Brand colours are never semantic colours.

**Legal identity is locked.** `@maxpromo/config`. The §19 UStG clause is
required on every commercial surface and VAT is never calculated or displayed.

**Protected products stay protected.** The operating systems are marketed on
their own domains, never from the consultancy site.

---

## Stop and escalate

- A legal or compliance question, including any public claim the infrastructure
  does not support
- A production data operation, or moving personal data between regions
- An architecture change not already recorded in an ADR
- Anything requiring a security control to be bypassed
- Documentation that contradicts the code

AI agents do not approve their own work, releases, security exceptions,
architecture changes, or production deploys. Marcel does.

---

## Before ending a session

Update `docs/adr/` if a decision was made · `docs/governance/known-risks.md` if
a risk was found · `docs/history/change-log.md` if something shipped.

Chat history is not a source of truth.

_Maxpromo Digital — Gemäß §19 UStG wird keine Umsatzsteuer berechnet._
