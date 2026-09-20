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
| 6 | **Trace contract** `check:trace` | Every application with a middleware imports `TRACE_HEADER` and `newTrace` from `@maxpromo/observability`, actually sets the header on a response, and declares a matcher with a catch-all entry so a public page and a 404 both carry a correlation id. No application may hardcode the header name or mint its own trace id. Added 2026-09-07 after production verification found `apps/bureau` stamping nothing for four sprints while the platform was described as observable — a contract that held in one of two applications. Proven by `prove:trace` |
| 7 | **Icon audit** `check:icons` | Any Unicode mark standing in for an icon. Typography (the CTA arrow, the real minus sign, the monospace tree) is allowed and named |
| 8 | **Capability catalogue** `check:capabilities` | A capability whose scene icons and scene labels disagree in length — in either locale, since German and English carry separate label arrays — a scene naming an icon the set does not have, a `humanAt` index past the end of its scene, or a missing capability message key. The five capability families are the commercial doorway: the home page rail, the /solutions anchors and the contact context all read one catalogue, and every failure it catches renders as a broken diagram on a public page rather than as an error |
| 9 | **Localisation audit** `check:i18n` | A supported language that is not complete. It compares both applications' message catalogues key by key — a key present in one locale and absent in the other, an empty value, a value left as its own key, a list that lost an item in one language, and a string copied verbatim into both files where it should have been translated. It also scans `apps/bureau` for German written straight into a component, which is how that product came to have German navigation beside "Operating Model" and "Approval Desk". Exemptions are full key paths or an `i18n-exempt` comment beside the code it excuses, never a silence. Proven by `prove:i18n` |
| 10 | **Responsive audit** `check:responsive` | Every grid collapses; no fixed width exceeds a 380px viewport; no section padding outside the three rhythms |
| 11 | **Typography audit** `audit:typography` | Any size below the 10px legibility floor, any sub-pixel size, and weight 700 above the 13px label band |
| 12 | **TypeScript** `typecheck` | `tsc --noEmit` in every workspace |
| 13 | **ESLint** `lint` | Zero errors in every workspace. Warnings are allowed; errors are not |
| 14 | **Production build** `build` | Every application builds |
| 16 | **Claim registry** `check:claims` | An unsupported quantitative claim may not be used to persuade. Status lives in `packages/config/claims.ts`; the check reads every commercial route source and its component and lib modules, and fails when one reaches a claim the registry places below `VERIFIED`. A second pass fails on any `caseStudies` string carrying a quantity that no claim record classifies, so a figure nobody has ruled on cannot reach a commercial page by being overlooked. Commercial surfaces are derived from the route, so a new page is covered the day it exists. See *Two claims checks, and why one blocks* |
| 18 | **Proof packages** `check:proof` | A proof package may not claim more than its evidence and its permissions allow. Enforces the mechanical failures: a quantity published without a measurement, a permission left unknown treated as consent, a basis named with no source, a statement public on a `historical-claim` or `unknown` basis, and media marked public while admitting it carries customer data. See *The proof engine* |
| 17 | **Evidence isolation** `prove:evidence-isolation` | Proves the synthetic evidence environment cannot reach production, cannot read a production row, cannot delete a row it did not write, and cannot send. Twenty-three properties, each set up as a violation that must be refused. Verified to fail when the outbound guard is removed |
| 15 | **Performance budgets** `check:budgets` | Shared root JavaScript, total JS, shared CSS, route-delivered CSS, public-directory weight, largest image and the count over 500 KB — each measured from the production build and compared against `packages/config/budgets.ts`. It runs after `build` because there is nothing to measure before it, and it errors rather than passing when no application has been built. One row, total CSS, is reported and never enforced — see *The CSS budget is three numbers* |

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

`npm run prove:i18n` stages seven regressions against the localisation audit —
a key missing from each locale in turn, an empty value, a value left as its own
key, a German string copied into the English file, a list that lost an item,
and German written straight into a component — and requires the audit to catch
each one *and* to name it. It then asserts that the `i18n-exempt` marker
silences exactly the block it introduces, that every file it edited is
byte-identical again, and that the audit passes on the restored tree. Like
`prove:domains` it writes to real files and puts them back, so it is not part
of `verify`; run it on a clean tree.

`npm run prove:demo-access` is the same discipline applied to an access
boundary rather than to an audit. The private demonstration room ships empty and
shut, so the one thing nobody can learn by looking at it is whether its lock
works. The harness puts fifty cases through the real module — no cookie, a
forged one, a tampered payload, an expired session, a rotated secret, a revoked
grant, a grant past its own date, a valid grant reaching for a demonstration it
was not granted — and requires every one of them to be refused, and the one
correct case to be allowed, because a lock that refuses everybody is a wall.
It is not in `verify`: it needs no clean tree, but it is a release step, run
before the room is ever opened. Its grants are fixtures passed through the
`lookup` parameter the module accepts for exactly this reason; the registry is
never edited to make the harness run.

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

**Legal identity and the §19 UStG clause.** Legal identity comes from
`@maxpromo/config` and is never retyped. VAT is never calculated or displayed,
anywhere, without exception.

Where the §19 clause is *printed* is a different question, and it has three
answers rather than one. This document previously carried no guidance on it and
the rule stated elsewhere said "every commercial surface", which a reader could
correctly take to include the website footer. It does not.

| Surface | §19 clause | Personal name, tax number, tax office |
|---|---|---|
| Commercial documents — invoices, quotations, anything stating money owed | **Required.** This is where §19 does its work | Required as the document's issuer details |
| Impressum | **Required.** Authoritative public location | **Required** |
| Any other legal document whose own substance relies on it, such as a fees clause | **Kept.** Never removed for consistency with the footer | As the document requires |
| Repeated website chrome — global footer, navigation, anything printed on every page | **Absent** | **Absent** |

The public website footer carries `© {year} Maxpromo Digital` and nothing
further. The Impressum is one click from every page, which is what German
disclosure law asks for.

Marcel's decision of 2026-09-16. The reasoning, and what it deliberately does
not change, are in `adr/decision-log.md`. A future change that restores tax
wording to the footer is reversing an owner decision, not enforcing this rule.

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
rather than an empty shell when its **data** is absent: a list with no items,
a metric with no figure, a section with nothing to say. That rule is about
data, and it does not extend to an **asset that is coming**. See *Placeholders*
below, which governs the other case and takes precedence where the two could
both be read to apply.

**Styling.** Inline style objects are the platform's convention for one-off
composition; anything reused is a class or a component. No colour, size,
spacing, radius or duration outside the token system, in either form.

**Tokens.** `--brand-*` and `--semantic-*` are separate namespaces and a brand
colour is never a semantic one — including a *product's* brand colour, which
until v14.0 could be `var(--semantic-success)` because nothing looked. Any
surface that cannot resolve a custom property — email, PDF, a web manifest —
reads the TypeScript mirror instead.

`check:token-inputs` enforces that for email by computing the set rather than
listing it: it locates the mail transport by behaviour, takes everything that
reaches it through local imports in both directions, and fails on a `var()` in
any of those files that contains markup. A new email surface is protected the
moment it is written. `TOKEN_INPUTS_LIST=1 npm run check:token-inputs` prints
the covered set, because a derived set cannot be audited by reading the code
that derives it.

This sentence used to promise that protection while the check enforced it on
two hard-coded filenames, and thirty-eight unresolved custom properties shipped
in invoice, quotation and newsletter email underneath it. **ADR-0015.** PDF
output is not covered by this mechanism and does not currently need to be: the
document CSS is injected into a browser page, where custom properties resolve.

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

**Placeholders.** A placeholder is not a missing design. It is a reserved
position for an asset that has been decided on and not yet supplied, and it
survives implementation.

A missing final asset is never permission to remove the visual area, collapse
the layout, substitute stock photography, generate a person, generate generic
artwork, or redesign the section around the absence. The container, its aspect
ratio, its responsive behaviour and the composition around it are built to
their final specification, and the real asset is later dropped into the slot
without a second layout pass. That is the whole point: a slot that has to be
redesigned when the photograph arrives was not a slot.

The placeholder state is restrained and branded, reuses the same box as the
real asset, and says what is coming in plain words that a visitor could read
without embarrassment: PHOTO COMING, SYSTEM SCREENSHOT, WORKFLOW IMAGE,
CASE STUDY IMAGE, VIDEO THUMBNAIL. Never a developer filename, a TODO, a
dimension string or an implementation note. Every placeholder is also
identifiable in source so the asset backlog can be counted.

Three categories carry their own constraint:

- **Founder imagery.** A real photograph of Marcel or the reserved slot. Never
  a generated likeness, never a stock person. The slot stays until he supplies
  the photograph.
- **Project and work imagery.** Real screenshots, real interfaces, real
  workflow diagrams, controlled product captures. A client system or a client
  result is never fabricated, and this is the image half of G8.
- **Industry imagery.** Wait for approved imagery. A generic stock photograph
  added to stop a page looking incomplete makes it look like every other
  agency page, which is the specific outcome the design system exists to avoid.

The reference implementation is the homepage founder slot,
`components/home/FounderNote.tsx`: the pending state carries the same
`.founder-photo` class as the real image, so it holds the same 4:5 box, and
`public/images/homepage/founder.jpg` appearing on disk is the entire migration.

The shared primitive is `components/ui/ScreenshotSlot.tsx`. Its default for a
missing `src` is now to reserve the slot; both states share one style object,
so the reserved box is the real box rather than a second set of numbers kept in
step by hand.

**Surfaces that predate this rule, and are deliberately not being retrofitted.**
Marcel's decision, 2026-09-19: the rule governs new work, rewritten pages and
pages entering a planned rebuild. A page that currently collapses a missing
image does not start showing a reserved slot merely because governance changed,
and none of these is a defect to be fixed in passing:

| Surface | Today | Adopts the rule |
|---|---|---|
| `components/landing/sections/ProductGallery.tsx` | renders nothing until one screenshot exists | when product pages are rebuilt |
| `components/landing/sections/ProblemSolution.tsx` | `painImages` optional, conditional | when product pages are rebuilt |
| `app/[locale]/blog/[slug]/page.tsx` | cover image conditional | when the article surface is rebuilt |

**Assets Phase A is waiting for.** Every position below is built, reserved and
labelled; none of them blocks anything. Replacing a placeholder means putting
the file in place, not changing a layout.

| Page | Section | Asset | Ratio | Must show | Priority |
|---|---|---|---|---|---|
| `/solutions/workflow-automation` | proof | real system screenshot | 16:10 | work moving through an actual system, no customer records | HIGH |
| `/solutions/custom-applications` | proof | real interface screenshot | 16:10 | a focused internal screen, not a dashboard mock | HIGH |
| `/work` | entry: operations | workflow diagram | 16:9 | how the document pipeline routes and where a person approves | MEDIUM |
| `/work` | entry: logistics | workflow diagram | 16:9 | the sources feeding one invoice draft | MEDIUM |
| `/work` | entry (either) | short screen recording | 16:9 | a run through the real system, client-approved | LOW |
| homepage | founder | photograph of Marcel | 4:5 | him, real, no generated likeness | HIGH |

ProductGallery is the one case with a standing instruction of its own. Its
header records Marcel's direction of 2026-07-25, stated twice, that a product
page must show no empty frame and no "screens coming soon" message, and it
satisfies that at the section level by rendering nothing at all. That stays
until the surface is rebuilt, at which point the two rules need reconciling
rather than one quietly overriding the other. `whenMissing="collapse"` exists
on the primitive for that narrow case, is not the default, and goes away when
its last caller does.

**Testing.** There is no unit-test suite, and this is stated rather than
implied. What exists instead: eighteen merge gates, five report-only audits, two
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
| `check:capabilities` | Do the five capability scenes have as many labels as icons, in both locales, naming icons that exist? | yes |
| `check:i18n` | Is every supported language complete, in both applications, with nothing user-visible hardcoded in a component? | yes |
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

### The proof engine

**Evidence is recorded once; publication is a projection of it.** The record is
`docs/adr/0017-evidence-is-recorded-once-publication-is-a-projection.md`.

`packages/config/proof.ts` holds one record per delivered project: what the
system does, what establishes each statement, what the company does not know,
what media would have to be captured, and what anyone has agreed to. Three
things it keeps apart, because confusing them is how a code fact becomes a
business result:

| | |
|---|---|
| **Kind** | system fact · process fact · qualitative outcome · quantitative outcome · customer attribution · testimonial · media |
| **Basis** | repository · artefact · system-data · owner-attested · client-attested · measured · historical-claim · unknown |
| **Permission** | eight separate grants, defaulting to `unknown` |

`mayPublish()` combines them, once, so no page decides for itself. A system fact
is public when the repository proves it. A quantitative outcome is public only
when the basis is `measured`. Permission is checked before evidence, and
`unknown` is treated exactly as `denied`.

There is no score, no percentage and no maturity level. A number attached to a
belief is a way of avoiding writing down what is actually known.

**Two migration contracts are open, and both are deliberate.**

*Work does not consume proof packages yet.* `apps/web/lib/work-entries.ts` reads
message keys and the page reads it. That works, it is accepted, and rewriting a
live commercial page to prove an architectural point is the wrong trade. When it
moves, a package gains an approved public projection and Work reads that; the
message keys stay where they are for the historical entries.

*Historical case studies stay historical.* The three in the i18n catalogue
record what the company said, including claims the registry marks unresolved,
and that is their value. Future evidence-backed case studies derive from
packages. Two categories, one boundary: a case study written from a package
carries statement ids, one written before the engine existed does not.

---

### Two claims checks, and why one blocks

`audit:claims` discovers. It reads the message catalogues looking for problems
nobody has noticed: the same magnitude carrying two currencies, a hedge word
inside a string whose key presents it as a result. It reports and never
rewrites, and it sits in `certify` rather than `verify`, because resolving what
it finds means knowing something about delivered work that a tool does not know.
Choosing a currency states a fact about a client. **ADR-0007.**

`check:claims` enforces. `packages/config/claims.ts` records decisions already
made about what each figure is worth as evidence, and this check fails the build
when one of them appears on a commercial page. That needs no judgement and the
fix is always the same: take it off the page. So it blocks.

They are not two implementations of one thing. One asks whether something is
wrong; the other asks whether a decision already taken is being obeyed.

**The rule itself:** *an unsupported quantitative claim may not be used to
persuade.* Marcel's decision, 2026-09-20, and deliberately broader than the
distinction it replaced. An earlier version separated a result from a
before-state, on the reasoning that a number describing the problem a client
arrived with says nothing about delivered work. ADR-0007 makes that distinction
and it is defensible. It is not the rule this company runs: a figure with no
evidence behind it does the same persuading whichever end of the story it sits
at. The rule applies to a quantity describing a before state, an after state, a
result, a saving, a time, a percentage, a volume, a performance, an improvement
or a duration.

A counting word doing grammatical work is not a claim. "Into one pipeline"
asserts nothing about an outcome. The test is whether removing the number
changes what the sentence claims.

**By status**, stated once so no page decides for itself:

| Status | May appear on |
|---|---|
| `VERIFIED` | commercial pages and the archive |
| `SOURCE_EXISTS_NEEDS_REVIEW` | the archive only |
| `CONTRADICTED` | the archive only |
| `HEDGED` | the archive only |

The archive is the case studies and the blog: pages that record what was said.
Nothing is deleted when a status drops. A claim that cannot appear on a page
that persuades keeps its place where the company's history stays readable, which
is the same rule that governs `docs/history/`.

Status is a business decision. It is never edited so that a build goes green.

---

### The CSS budget is three numbers, and only two of them block

There was one CSS budget: the sum of every stylesheet the build emits, limited
to 80 KB. It was an honest measure of what a visitor downloads for exactly as
long as the build emitted one stylesheet, because the sum and the payload were
the same file.

They are not the same thing any more. The web application now emits four CSS
chunks and they are **mutually exclusive by route**. Read from a running
production server, by looking at which stylesheets each route actually asks
for:

| Route | Stylesheets requested |
|---|---|
| `/de`, `/en` | shared + homepage |
| `/de/solutions`, `/de/resources`, `/de/work`, `/de/contact`, `/de/blog` | shared |
| `/de/impressum` | shared + legal |
| `/os/*` | shared + back office |

Nobody downloads all four. Failing a build on their sum penalises the one
change that makes a visitor's payload *smaller* — moving route-specific rules
off the shared path — and that is not a governance rule, it is a bug in the
measurement. When the homepage was rebuilt the sum went up while the stylesheet
every other page loads went **down**.

So the one number became three:

| Budget | Limit | Blocks? | What it protects |
|---|---|---|---|
| `web.shared-css` | 72 KB | yes | The floor every visitor pays before anything specific to the page they asked for. It grows when something route-specific is written into the global stylesheet, which is the mistake the split exists to prevent. Headroom is tight on purpose: this one should be going down |
| `web.route-css` | 88 KB | yes | What the worst-served visitor downloads: shared plus the heaviest single route chunk. A route-scoped stylesheet is not free, and this is where its cost is charged |
| `web.total-css` | 120 KB | **no** | Kept visible so a sudden jump anywhere is still seen in every report. It cannot be the number that blocks a release, because it does not describe any visitor |

This is **stricter** than what it replaces, not weaker. The shared ceiling sits
below the old total, and no route may exceed the delivered ceiling. Nothing was
raised to make a red number green: the enforced numbers are new, and they are
measured against what a person receives.

`informational: true` in `packages/config/budgets.ts` is what makes a row
report without enforcing. Use it only where the measurement genuinely does not
correspond to something a person downloads. It is not an escape hatch for a
budget that has become inconvenient — a budget that is merely inconvenient gets
a raise recorded in the change log, or the code gets smaller.

**How the audit knows which chunk is which.** Nothing in the build output maps
a route to its stylesheets: `build-manifest.json` carries no CSS at all, and
the emitted filenames are content hashes that say nothing about provenance.
Attribution by filename would be a naming convention pretending to be a
measurement, which is the class of check this repository has had to delete
before (**ADR-0004**). Instead `audit-budgets.mjs` reads the class names out of
the stylesheet the **root layout** imports and finds the emitted chunk that
carries them; every page renders inside that layout, so that chunk is the
shared one by definition. The rest are route-scoped by elimination. If no chunk
matches confidently, or two match equally, the split reports as *unmeasured*
rather than as clean.

Agent Bureau still emits a single stylesheet, so `bureau.total-css` remains an
honest measure of a visitor's payload and stays as it is. It gets the same
treatment on the day it emits a second chunk, and not before.

Decision: Marcel, 2026-09-18. Reasoning in `docs/adr/decision-log.md`.
