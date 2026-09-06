# Platform Standards

Every change to this repository must satisfy this document before it merges.
It is enforced in CI, not by memory — see `.github/workflows/verify.yml`.

---

## The one command

```bash
npm run verify
```

**Defined once, in the root `package.json`.** No application defines a script
of that name, and the CI workflow calls it rather than restating its steps —
both checked by `check:governance`, because for a while all three disagreed and
CI was the weakest of them. It runs, in order:

Each row names the script it runs. `check-governance.mjs` matches this table
against the verify chain by that name, so a gate added to one and not the other
fails the build rather than going unnoticed — which is how three gates came to
run on developer machines and never in CI.

| # | Gate | What it catches |
|---|---|---|
| 1 | **Governance audit** `check:governance` | A second definition of `verify`, a CI workflow that restates the gate instead of calling it, or a gate missing from this table. It runs first because it checks that the rest of this table is true |
| 2 | **Domain audit** `check:domains` | A Domain Registry entry the repository cannot honour: a duplicate or unnormalised host key, an origin that disagrees with its host, a language declared for a product that has no copy in it, an OpenGraph image or favicon that is not on disk or is not the dimensions the registry states, and a route allowlist or contact path naming a page that does not exist |
| 3 | **Brand asset audit** `check:brands` | A Brand Registry entry the repository cannot honour: a duplicate or unreachable product, an accent that is a token reference rather than a colour, an accent-as-text form below 4.5:1 on white, an asset that is declared and not on disk or not the dimensions stated, an empty slot with no stated reason, or a product declaring its own typography. It also classifies every asset slot KEEP / REPLACE / CREATE / REMOVE and prints the counts |
| 4 | **Design token audit** `check:tokens` | Hex literals, raw Tailwind palette classes, rgba literals, and the brand accent used as a text colour — directly, through a conditional, aliased to a local name, or bound to a field named as text. Anywhere outside the token package |
| 5 | **Token input audit** `check:token-inputs` | A custom property the token package reads that an application never defines, and any `var()` an application uses that nothing defines at all. An undefined `var()` does not warn: with a fallback it silently uses it, without one the whole declaration is dropped — see ADR-0006. Since v14.0 it also rejects any `var()` written into output that leaves the browser: an email client resolves no custom property, so `var(--space-2)` in an email is no padding at all |
| 6 | **Icon audit** `check:icons` | Any Unicode mark standing in for an icon. Typography (the CTA arrow, the real minus sign, the monospace tree) is allowed and named |
| 7 | **Responsive audit** `check:responsive` | Every grid collapses; no fixed width exceeds a 380px viewport; no section padding outside the three rhythms |
| 8 | **Typography audit** `audit:typography` | Any size below the 10px legibility floor, any sub-pixel size, and weight 700 above the 13px label band |
| 9 | **TypeScript** `typecheck` | `tsc --noEmit` in every workspace |
| 10 | **ESLint** `lint` | Zero errors in every workspace. Warnings are allowed; errors are not |
| 11 | **Production build** `build` | Every application builds |
| 12 | **Performance budgets** `check:budgets` | Shared root JavaScript, total JS and CSS, public-directory weight, largest image and the count over 500 KB — each measured from the production build and compared against `packages/config/budgets.ts`. It runs after `build` because there is nothing to measure before it, and it errors rather than passing when no application has been built |

The static audits run first on purpose: they are the fastest and they catch the
classes of regression this platform has had most often.

### Every check must be able to fail

Six checks in this repository have silently passed — reported success while
examining nothing, or while examining the wrong thing. See **ADR-0004**. The
rules it imposes apply to anything added to `packages/tooling/`:

- Resolve scan targets explicitly and print the count.
- Exit non-zero on zero targets.
- Use `strip-comments.mjs` for comment state. Never a line-by-line flag.
- Demonstrate the rule firing on the real codebase before believing it. This is
  the one that keeps paying: three of the six were found this way, including a
  rule whose pattern contained a literal backspace byte where `` should have
  been, and a second whose escape was eaten by a template literal. Both looked
  correct in the source and matched nothing.

Since v13.0 one audit's demonstration is checked in rather than performed by
hand: `npm run prove:domains` breaks the Domain Registry fourteen ways, one at a
time, and asserts that `check:domains` reports each one. It edits
`packages/config/domains.ts` in place and restores it, so it is deliberately not
part of `verify` — run it on a clean tree.

The reason it exists is that a demonstration nobody can re-run is a claim rather
than evidence. This standard has been honoured by hand since ADR-0004, and in
that time nine rules in this repository's own tooling were found to look correct
and examine nothing — two of them written in the sprint that introduced the
discipline.

---

## Gates that are not automated yet

Judgement, not scripts. Required for any change with a visual or public surface.

**Accessibility.** Contrast against the token pairs, a single `h1` per page, no
heading-level skips, a `main` landmark, visible focus states, labelled form
controls. The measured baseline is 21/21 token pairs passing and 14 pages
audited clean; a change must not regress it.

**Responsive.** Every multi-column grid has a single-column state. No fixed
width at or above 380px. Checked at 390, 768, 1440 and 1920.

**Internal links.** No route added or removed without the sitemap and any
redirect updated in the same change.

**Documentation.** If a decision was made, it goes in `docs/adr/`. If a risk
was found, `docs/governance/known-risks.md`. If something shipped,
`docs/history/change-log.md`. Chat history is not a source of truth.

`docs/PLATFORM-CONSTITUTION.md` is the index for the whole tree and every fact
has one authoritative location there. `audit:docs` enforces the mechanical part
of that: every file a document names exists, every gate count stated beside
`npm run verify` is current, and every document is reachable from another one.
A document nothing references is a document nobody updates.

**Security.** No secret in the repository. No new public API route without a
rate limit and an explicit auth decision recorded. Personal data must not
change region or provider without a legal review — see the open item in
`known-risks.md`.

**Dependency advisories.** `audit:dependencies` classifies every advisory by
severity, by whether the vulnerable package can reach a served request, and by
whether a remediation exists. A CRITICAL advisory reaching production blocks a
release and cannot be excused. A HIGH advisory reaching production blocks unless
`packages/config/security.ts` carries a live acceptance naming it, with the
actual exposure, the mitigation, an owner and a review date. Everything else is
reported, on every run, including what has been accepted — an acceptance is
excluded from blocking and from nothing else.

The rule is shaped this way because "fail on any advisory" would have failed
this platform on four development-only findings in a deprecated transitive of a
migration CLI, and a gate that fires on something nobody can fix is a gate
people route around. `prove:security` exercises the decision against a truth
table, because a gate that has only ever been seen passing is not known to
block.

**Claims.** A number stated publicly about a client outcome is a commitment. It
must agree with itself across every page and both languages, and it must not
hedge where the page presents it as a result. `audit:claims` reports;
a human answers. An AI agent does not decide what was delivered.

**Commitments.** A duration stated publicly — how long the first conversation
runs, how long a build takes, how fast an enquiry is answered — has one value,
and every page inherits it. The framework is
`docs/governance/delivery-commitments.md`; `audit:claims` reports any page that
disagrees with it, in either language.

**Positioning.** Every commercial surface describes the same company. A service
that cannot be placed on the ladder the site already describes — discovery,
assessment, design, build, managed operations, support — does not belong on the
pricing page. See `docs/governance/pricing-alignment-review.md`.

**Naming.** A product has one slug and it is the same string in the product
registry, the Brand Registry and the Domain Registry. Where a fourth surface
needs a different one — the contact page's `?system=` value for RealEstateOS —
it is declared explicitly, never derived, and `check:domains` compares it
against that surface's own list. A name that is derived in one place and typed
in another will diverge.

**Folders.** Shared code lives in `packages/`; an application keeps only what
only it uses. A directory under `components/` is a section family, not a
dumping ground. Route groups carry no URL segment and are used to share a
layout, not to hide a page.

**Components.** A component every page on a surface must wear lives in that
surface's layout, never inside one page's engine. A component renders nothing
rather than a placeholder when its data is absent.

**Styling.** Inline style objects are the platform's convention for one-off
composition; anything reused is a class or a component. No colour, size,
spacing, radius or duration outside the token system, in either form.

**Tokens.** `--brand-*` and `--semantic-*` are separate namespaces and a brand
colour is never a semantic one — including a *product's* brand colour, which
until v14.0 could be `var(--semantic-success)` because nothing looked. Any
surface that cannot resolve a custom property — email, PDF, a web manifest —
reads the TypeScript mirror instead, and `check:token-inputs` fails on a `var()`
that travels there.

**Translations.** A domain declares the languages it has, and serves no others.
Silent field-level fallback is the failure mode: it produces a page in two
languages under one `lang` attribute and leaves no trace to detect afterwards.

**Metadata.** Every domain owns its title, canonical, social card, robots,
sitemap and manifest, resolved from its registry record. Naming the parent
company in a title is a per-domain decision the registry records, not a default.

**Brand assets.** Every asset slot is declared even when empty, and every empty
slot states why. `check:brands` classifies each KEEP / REPLACE / CREATE / REMOVE
and prints the counts, so the asset backlog is a number in a report rather than
something to remember.

**Testing.** There is no unit-test suite, and this is stated rather than
implied. What exists instead: eleven merge gates, five report-only audits, two
harnesses that prove their audits can fail, and a live domain walk
(`audit:domain-experience`). Adding a test framework is an architecture decision
and needs an ADR; adding a gate for a defect class that has recurred does not.

**Certification.** `npm run verify` before any claim that something works;
`npm run certify` before a release. "Should work" is not a state.

**Release.** Per application, per Vercel project, independent rollback. Marcel
approves. No agent approves its own work.

**AI readiness.** Prompts, business rules, assistant policies, memory and
evaluation each have an intended home, mapped in
`docs/architecture/ai-governance-readiness.md`. None of it is built. Until
Track B, no change may alter assistant behaviour, a prompt, or model selection.

---

## Design rules the audit enforces

**Colour.** Components reference `--brand-*` and `--semantic-*` only. Never a
primitive, never a raw value. The allowlist in the token check is narrow and
every entry states a reason; adding to it needs a reason too.

**The accent has three jobs.** Primary action fill, active state, and at most
one emphasis mark per page. It is a fill, not a text colour: on white it
measures 1.51:1. Where an accent text colour is genuinely needed,
`--brand-primary-text` measures 5.00:1. Text on an accent fill is black.

**Brand colours are never semantic colours.** Identity and meaning are separate
namespaces, and success is deliberately blue-shifted so it cannot be read as
the green brand.

**Typography.** One scale, one family, one mono. Hierarchy comes from weight,
size and composition — never from a second typeface. Headings and paragraphs
carry a measure; no call site sets its own. Nothing below 10px. Weight 700
exists for one role — the small uppercase mono label and the numeric, at 10 to
13px, where 600 disappears — and the audit fails on 700 above that band.

**Spacing.** Three section rhythms and no fourth. A clamp-based section padding
that is not one of them fails the responsive audit. Inside a section, spacing
comes from `--space-*`.

**Motion.** Two durations and one curve, from the tokens. Never `transition:
all` — it animates layout and hides what is moving from the reader.

**Interaction.** Every `:hover` has a matching `:focus-visible`. The focus ring
from the reset is not the affordance; it sits on top of it. A state a mouse user
is shown and a keyboard user is not is a defect even when the audit passes.

**Elevation.** Four shadows, from the tokens. No coloured shadow: a glow is the
accent used as light, and the accent is a fill.

**Iconography.** One set, in `@maxpromo/ui`. Stroke only, 1.5px, currentColor,
four sizes. Icons are named at the call site, never typed as a character, and
never carried inside a translation string. See **ADR-0003**.

---

## Never two implementations

If two applications need the same thing, it lives in `packages/` and neither
keeps a copy. This is the rule the platform has broken most expensively:

- two design systems built from one brief, drifted on hover direction and
  container width
- two token files kept in sync by hand
- eleven status maps in one dashboard, differing on which amber failed contrast
- two legal identity modules disagreeing on the tax office name

A shared component that reaches into an application's own modules is not
shared, it is borrowed. Packages depend on `@maxpromo/design-tokens` and on
each other, never on an application.

---

## Deployment

Separate Vercel projects, one repository. Deploy independently, govern
together. Details in `docs/deployment/vercel.md`.

Nothing merges to `main` without `npm run verify` passing. Production deploys
are a human decision, not an automatic consequence of a merge.

---

## The audit suite

Four checks, each answering a question the others cannot.

```bash
npm run verify            # the merge gate. Runs without a server.
npm run certify           # verify + the three audits that need one.
```

`certify` needs both applications running on the ports the audits address:

```bash
npm run dev:web           # :3020
npm run dev:bureau        # :3021
```

Agent Bureau's dev script did not pin its port until v7.0 — it started on
whichever port was free, and the two live audits address `:3021` by name. A
`certify` run after a plain `npm run dev:bureau` therefore could not reach it.

| Command | Answers | In `verify`? |
|---|---|---|
| `check:tokens` | Is any colour defined outside the token package? | yes |
| `check:token-inputs` | Does every application define what the token package reads, and does every `var()` resolve? | yes |
| `check:icons` | Is any Unicode mark standing in for an icon? | yes |
| `check:responsive` | Does every grid collapse? Does anything exceed a 380px viewport? | yes |
| `audit:typography` | Is any type below the legibility floor, on a sub-pixel size, or at weight 700 above the label band? | yes |
| `audit:a11y` | Landmarks, heading order, alt text, accessible names, labels, titles — on rendered output across every public route | needs both apps running |
| `audit:consistency` | Do both applications resolve the same tokens, type scale and component classes? | needs both apps running |
| `audit:platform` | Dead code, unused assets, unused exports, dependency direction | report only |
| `audit:claims` | Does the same figure carry two currencies? Does one commitment carry two values? Is a result stated as an estimate? | report only |

`audit:a11y` and `audit:consistency` read **rendered HTML and emitted CSS**, not
source. That distinction matters: a landmark that exists in a layout but never
wraps the page looks correct in the source and is missing in the output, and
two stylesheets can define the same class name and resolve differently.

`audit:claims` and `audit:platform` report and never edit, and they are in
`certify` rather than `verify` for the same reason: their findings need a human
answer, so putting them in the merge gate would block every commit on a
business question. See **ADR-0007** — resolving a claim requires knowing
something about delivered work that a tool cannot know, and a tool that "fixed"
a currency would be inventing a fact about a client.

`audit:platform` reports and never edits. A tool that deletes what it believes
is unused will eventually be wrong about something that matters — on its first
run it flagged 19 API routes that are a working, secured data layer the
dashboard has simply not been wired to yet.
