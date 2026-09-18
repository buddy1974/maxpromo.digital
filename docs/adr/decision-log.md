# Decision Log

## 2026-09-18 — the homepage content reset, and what it exposed in the gate

---

### The CSS budget is route-aware, because the old one measured nobody

**Decision.** `web.total-css` — the sum of every emitted stylesheet, limited to
80 KB — stops being a gate. Two new budgets take its place and both block:
`web.shared-css` at 72 KB, the floor every visitor pays, and `web.route-css` at
88 KB, shared plus the heaviest single route chunk. The old sum stays in the
report, marked *reported, not enforced*, so uncontrolled growth is still
visible. The full reasoning is in `docs/governance/standards.md`.

**Why.** The homepage rebuild put the gate 4 KB over and the easy answers were
both wrong. Cutting approved visuals would have let a broken metric edit the
product; raising 80 to 92 would have fixed today's number and left the flaw for
the next route to hit. The flaw is that the build no longer emits one
stylesheet. It emits four, mutually exclusive by route — proven by reading what
each route requests from a running production server, not inferred. Summing
them describes no visitor, and failing a build on that sum punishes the one
change that makes a payload smaller.

**What it costs, stated plainly.** Route splitting is not free and this was not
a pure win. Before this phase a homepage visitor downloaded one 75 KB
stylesheet. Now a homepage visitor downloads 82 KB and everyone else downloads
68 KB. Most routes got lighter; the homepage got heavier, and it is the page
that carries the scenes, the bench and the transformation. `web.route-css` is
the budget that will make that cost visible the next time it grows.

**What it does not do.** It does not weaken the gate. The enforced ceilings are
new and both sit on numbers a person actually receives; the shared one is below
the old total. `informational: true` exists for measurements that describe no
visitor, not for budgets that have become inconvenient.

---

### The attribution is by provenance, not by filename

**Decision.** `audit-budgets.mjs` identifies the shared chunk by reading the
class names out of the stylesheet the root layout imports and finding the
emitted chunk that carries them. No match, or two equal matches, reports as
unmeasured.

**Why.** Nothing in the build output maps routes to stylesheets —
`build-manifest.json` carries no CSS, and the filenames are content hashes.
Matching on a filename or assuming the largest chunk is shared would be a
naming convention pretending to be a measurement, and this repository has
already had to delete that kind of check once (ADR-0004). Every page renders
inside the root layout, so the chunk carrying the root layout's stylesheet is
the shared one by definition. That is a fact about the build, not a convention.

---

## 2026-09-17 — the mobile pass

Four surfaces, one pass. The decisions that were judgement rather than repair.

---

### The mobile navigations are two presentations of one list

**Decision.** `lib/navigation.ts` holds Agent Bureau's nineteen sections.
`Sidebar` and `MobileNav` both read it, and neither owns it.

**Why.** The drawer needed the same nineteen entries, in the same three groups,
with the same current-page rule. Copying them would have made a fourth place a
section name can go missing — after the sidebar, the page heading and the
catalogue — in the repository whose standards name duplicated definitions as
its most expensive habit. The `isCurrent` rule moved with the list, because
`startsWith("/dashboard")` is true of every route in the product and the
overview's exception is exactly the kind of detail one copy gets and the other
does not.

**What it costs.** A server component can no longer import the list without
pulling in a module that also exports a helper. Nothing does.

---

### The drawer is a drawer, and the conversation is a sheet

**Decision.** Agent Bureau's mobile navigation slides from the left as a
drawer. The Max conversation rises from the bottom as a sheet at 78dvh.

**Why.** The brief asks for the bottom-sheet pattern and then says not to make
every surface one — it is an interaction primitive, not a house style. A bottom
sheet suits a short focused interaction: a conversation, a confirmation, a
choice from a few options. Nineteen destinations in three labelled groups is a
long scrollable list with headings, which is what a drawer is for. Making it a
sheet would have meant either a sheet tall enough to be a full screen, which is
a drawer with extra steps, or a scrollable sheet that hides most of its
contents below the fold.

**What it costs.** Two overlay implementations in two applications rather than
one shared component. They share no markup today; if a third appears, that is
the moment to extract one.

---

### The 16px form-control minimum lives in the shared package as a raw value

**Decision.** `packages/ui/components.css` sets `font-size: 1rem` on mobile
form controls, not a token.

**Why.** No step in the type scale is 16px — it runs 15px (small) then 17px
(body) — and adding one would put a size in the scale that no heading, label or
paragraph will ever use, to satisfy a browser rule rather than a design
intention. 16px here is not a typographic decision; it is a minimum imposed
from outside, which is why it is written as the number it is, once, with the
reason beside it.

**What it costs.** A raw length in a file whose header says it defines no size
of its own. The exception is stated at the call site rather than hidden.

---

### The operating flow was recomposed for mobile rather than scaled

**Decision.** Below 1100px the seven stages put their icon in a left rail with
the text beside it, and the lime route runs down that rail. 1002px becomes
599px at 375px wide.

**Why.** The brief forbids both the easy answers: do not shrink the desktop
diagram until its labels are unreadable, and do not reduce it to plain text.
What was there was the third failure — a desktop row rotated, which kept every
element and every label at full size and cost 1002px of scrolling before the
page made its first argument. Moving the icon beside the text rather than above
it makes a stage one line of reading instead of three, and putting the route
through the icons means the connectors line up with what they connect, which
the centred version did not.

**What is preserved, and was checked.** Seven stages, six connectors, seven
icons, both human-control pills, the order, and the lime route. The approved
desktop composition is unchanged and is still built from the same markup.

---

### `check:responsive` measures against 320px, and names its one exemption

**Decision.** The narrowest supported viewport moves from 380px to 320px.
`apps/web/app/os` is excluded from the inline-width check by name.

**Why.** 380 sat above the smallest phone in use, so the audit had no opinion
about the widths that actually break on one — and it had none about the two
real overflows this pass found at 320. The back office is the one surface in
the repository that is genuinely not used on a phone: one operator, on a
desktop, behind a login, editing quotations whose tables are wide because the
documents are. Squeezing it to 320px would be work nobody asked for and nobody
would use.

**What it costs.** An exemption, which is a thing that can be forgotten. It is
a named constant with the reason above it and a sentence saying that deleting
it is the first step if /os ever becomes a phone surface — rather than a
threshold left loose for everybody so that one surface passes.

---

### The Max conversation ships without quick replies, a score card or a contact step

**Decision.** Those three parts of the brief were not built.

**Why.** None of them has any state behind it. Max is a free-text conversation
against `/api/chat/message`: no quick-reply set, no score, no contact stage, no
branching. The scored guided audit they belong to exists in this repository
only as `/api/max-agent/submit` — an endpoint expecting business, pain, volume,
system, name, phone and a 0–100 score, with a threshold at 80, and **no caller
anywhere in the codebase**. Building the three would mean writing new
conversation branching and a new scoring rule, which the same brief's
no-business-logic-changes section forbids, and which is a product decision
rather than a presentation one.

**What it costs.** Three named items of the brief are not delivered. Reported
in full rather than approximated with a UI that has nothing behind it.

---

### The back office's chrome left the public stylesheet; the budget was not raised

**Decision.** The ten `.os-*` rules move from `app/globals.css` to
`app/os/(protected)/os-layout.css`, imported by the layout that owns them. The
80 KB budget stands unchanged and `web.total-css` measures **79.86 KB**.

**The sequence, because the first answer was wrong.** The mobile pass took the
public payload to 80.23 KB against an 80 KB budget, and the first position
taken was to leave `verify` failing and ask: raising a limit is a decision, and
a budget raised by the author of the work that exceeded it is self-approval.
Marcel chose the third option that had been offered instead — move the
back-office CSS out of the public payload — and it was the right one. The
budget was never the problem. 2.97 KB of what it measured was a sidebar behind
a login being downloaded by every visitor to every public page.

**Why ownership was proved rather than assumed.** A prefix is not evidence.
Each of the ten selectors was traced to its consumers from source and all ten
resolve to one file. The same trace was then run across all 273 classes the
stylesheet declares, looking for back-office rules that carry no `os-` prefix:
there are none. An earlier speculative dead-CSS detector had named
`.hero-panel`, `.ofn` and `.mq` among 209 "candidates" — all plainly in use —
and nothing in this decision rests on it.

**Where the boundary sits.** The protected segment's own layout, not the outer
`/os` one. It is the narrowest segment that covers every one of the ten
selectors, and it keeps `/os/login` — which uses none of them — off the list.
Verified in the served HTML: `/os` requests two stylesheets, a public page
requests one.

**One deletion, and three refusals.** `.footer-link` had no consumer because
the footer was rebuilt around `.site-footer-link`; it was an obsolete leftover
from a rename and it went. `.container-narrow`, `.hint` and `.table-wrap` also
have no consumer and were **kept**: each is half of a documented design-system
pair, and removing capability from the system to win bytes is the thing the
instruction to not "delete CSS randomly until the number becomes green" exists
to prevent.

**What it costs, and what is worth knowing.** A second stylesheet, which the
budget's own note treats as a warning sign ("a second file appearing here… is
the signal that a component has started shipping styles of its own"). Here it
is the opposite signal, and the note should be read with that in mind. More
usefully: `web.total-css` sums every CSS file under `.next/static`, so it still
counts the `/os` chunk nobody public requests — the split shows as −101 bytes
in that number while the public payload fell by 3,473. The metric cannot see
route splitting. That did not need a gate change here and is recorded for the
next one.

---

## 2026-09-17 — Agent Bureau's second language

The durable principle is **ADR-0014**. These are the decisions under it.

---

### The locale is a cookie, not a URL segment

**Decision.** `agents.maxpromo.digital` resolves its language from
`bureau_locale`, and no locale ever appears in a URL.

**Why.** The hub carries `/de` and `/en` because it is a public site with two
complete copies of itself, and a crawler needs two addresses. A product does
not: this one is a single authenticated application behind NextAuth, and a
locale segment would prefix every callback URL, every `callbackUrl` round trip,
every deep link a customer has been sent, and the middleware's one protected
prefix. The Domain Registry already recorded the distinction as
`useLocalePrefix`, so the decision was to honour a rule that already existed
rather than to invent one.

**What it costs.** No shareable per-language link. Nobody has asked for one,
and a person who wants to send a colleague an English page can tell them which
button to press — which is what the switcher is for.

---

### Switching language is a navigation, not client state

**Decision.** `GET /language?to=<locale>&next=<path>` sets the cookie and
redirects back.

**Why.** The locale is read on the server, so a client-side toggle would
re-render nothing. A navigation works before hydration, works with JavaScript
off, can be opened in a new tab, and — the part that matters on a signed-in
product — never touches the session. `next` is honoured only as a same-origin
absolute path; an open redirect on a product people sign into is a phishing
primitive, and the check is three lines.

---

### Structure lives in code; words live in the catalogue

**Decision.** The operating model, the playbooks, the agent hierarchy and the
agent registry keep ids, order, relationships and counts. Every sentence they
used to hold is keyed by the record's own id.

**Why it is more than tidiness.** An agent's blocked-action list is a statement
about what it may not do without asking. Left as prose in a data file, a
translation that dropped one entry would make the English product claim a
narrower supervision contract than the German one, and no review would catch
it. The count now lives in structure and `check:i18n` asserts the catalogue
against it, so that particular mistake fails the build.

---

### Records are not translated, and the demo fixtures behave like records

**Decision.** Customer names, client files, the text of a customer's message
and the consultant's notes stay in the language they were written in — in the
demo fixtures exactly as they will with real data. Product *voice* inside those
fixtures is translated.

**Why.** No product translates its data. An English-speaking operator of a
German business reads German customer records, and a fixture that pretended
otherwise would be teaching the wrong expectation about the real thing. The
line is drawn in `lib/mock/ai-governance.ts` and repeated in
`architecture/localisation.md`, because it is the one judgement in this pass
that somebody could reasonably disagree with.

---

### The legal pages stay German

**Decision.** `/impressum` and `/datenschutz` keep their German body. The
chrome around them is localised, and an English reader gets one sentence, in
English, saying the page is authoritative in German.

**Why.** Those pages discharge obligations under German law to German
authorities and German data subjects. A translation is not a translation: it is
a second legal text, and producing one is a lawyer's deliverable. The governing
instruction for this pass said so, and it was right to.

---

### The English catalogue surfaced two defects in `audit:claims`, which were fixed in the rule

**Decision.** The hedge matcher matches whole words, and the product namespaces
are excluded from the commitment comparison.

**Why not change the copy.** "2 tasks overdue" is not an estimate and "a
meeting within the next 24 hours" is not a promise about the first
conversation. Both findings were the rule reading letters rather than words —
the German said "24h" and slipped through the unit pattern, the English said
"24 hours" and did not. Editing the copy to satisfy a rule that is wrong is how
an audit stops meaning anything. The `\b` is applied only where the hedge's own
edge is a word character, so "ca." still matches; the same seven pre-existing
findings stand.

## 2026-09-17 — MVP release: capability discovery, the demonstration room, and what was deliberately left undone

---

### Two taxonomies, on purpose, with one of them always first

**Decision.** `lib/capabilities.ts` (five concrete capabilities) and
`lib/solutions.ts` (three operating families) both stay, and neither is derived
from the other.

**Why this is not the duplication rule being broken.** Two implementations of
one thing is the mistake this platform has paid for most often. This is one
thing described at two depths for two different readers: what the work is
called when a business asks for it, and how it is grouped once somebody
understands the company. They would compete if either were given the other's
job, so the order is fixed everywhere — the concrete five are the door, the
three families are the room behind it — and the families' section exists to
answer why the five are one practice rather than five businesses.

**What would make this wrong.** If a capability's copy ever starts restating a
family's claim, or a family page starts listing capability names as its own
services, they have stopped being two depths and become two catalogues. That is
the signal to collapse them.

---

### The demonstration room ships locked, empty, and real

**Decision.** Build the whole Work → request → grant → room path now, ship it
with `DEMOS` and `GRANTS` empty and no `DEMO_ACCESS_SECRET` set, so every path
denies until Marcel deliberately opens it.

**Why not one shared password.** Marcel ruled that out, and it is the wrong
shape anyway: a shared secret cannot be revoked for one recipient, cannot
expire per recipient, and cannot be scoped to one demonstration. Access is a
per-person grant naming the demonstrations it opens and the date it stops.

**Why a registry file rather than a table.** A grant is the same shape of fact
as a Domain Registry or Brand Registry entry: rare, deliberate, decided by
Marcel, checked by a gate. A table would have meant a schema change and a new
writable surface to secure in a release where the owner is away and nobody can
review the migration. The seam for automating grant creation later is open —
none of the access logic reads the file directly.

**Why authorisation is re-resolved on every request.** The cookie carries an
identity and nothing else. Revocation and expiry therefore take effect on the
next request rather than when a session happens to end, and a grant that nobody
has got round to editing still stops working on its own date.

**What was refused.** No real client data, no production credentials, no real
invoices, no customer records, no production admin access, and none of the
protected operating systems listed as a demonstration. Those are marketed on
their own domains; putting one in a demo inventory is a product-exposure
decision, not a presentation one.

---

### `lookup` is a parameter on three authorisation functions, and that is a trade

**Decision.** `verifyDemoToken`, `resolveDemoSession` and `sessionAuthorises`
take an optional grant lookup that defaults to the real registry.

**Why.** The registry ships empty, so the proof harness has no live grant to
exercise and would otherwise have to edit the registry to run — proving
something about a file it had just changed. The parameter is the same device
`grantIsUsable` already uses for `now`.

**Why it is safe.** It cannot widen access: whatever it returns still has to
survive `grantIsUsable`, and for a specific demonstration `grantAuthorises`.
Every call site in the application uses the default. If a caller ever passes
one in production code, that is the thing to reject in review.

---

### A commitment with two values was removed, not chosen

**Decision.** The "45 minutes" in the About call to action is gone; the home
page's "30 minutes" stands alone.

**Why not pick one.** How long Marcel's first conversation runs is a fact about
how he works and a promise to a customer. Choosing between two numbers on his
behalf would have invented one. Subtraction leaves one stated value and no
false one — the same move this repository made when two different build
durations were found on the home page.

---

### The CSS budget was not raised

**Decision.** `web.total-css` came in at 81 KB against an 80 KB budget; the
budget stayed at 80 KB and the stylesheet came down to 78 KB.

**Why.** The budget's own note says a step up is the signal that a component
has started shipping styles of its own. Here the signal was true in a different
way: the sheet was carrying rules for a pricing page that does not exist and
components that had been deleted. Raising the limit would have hidden a real
finding behind a number that is easy to move.

## 2026-09-16 — Global footer, legacy content governance, and the hero panel

Two locked directives from Marcel, applied inside the public rebuild.

---

### The §19 UStG clause left the global footer, and this contradicts a standing rule

**Decision (Marcel's).** Marcel's personal name, the tax number, the tax office
and the §19 UStG Kleinunternehmer clause are removed from the repeated global
footer on every page of `maxpromo.digital`. Their authoritative public location
is the Impressum. The footer's legal strip is now one line:
`© {year} Maxpromo Digital`, with the year derived rather than hardcoded.

**This overrode an older instruction, and the older instruction has now been
corrected.** The rule said the §19 clause was required on "every commercial
surface". It was left standing at first, deliberately: amending a governance
document to match a change made in the same pass, by the agent that made it, is
how a rule quietly becomes whatever was built last. Marcel then reviewed the
conflict and directed the correction, which was made as its own task.

The rule now distinguishes three surfaces rather than one — commercial
documents, legal and disclosure pages, and repeated website chrome — in
`CLAUDE.md`, `PLATFORM-CONSTITUTION.md` §27 and `docs/governance/standards.md`,
which had carried no guidance on it at all. "VAT is never calculated or
displayed" is unchanged and unqualified. Closed in
`governance/known-risks.md`, where the original entry is kept beside the
resolution, including the fact that it named the wrong second file.

**What the decision is not.** §19 UStG is a statement about invoicing. It still
appears, untouched, on:

- every invoice and quotation this platform generates
  (`components/documents/`, `api/os/send-invoice`)
- `/impressum`, where German disclosure law actually wants it
- `/agb` §5, where the document's own fees clause requires it

Verified in the browser after the change: **zero** occurrences of the personal
name, tax number, tax office or §19 wording in the footer of any of nine
routes; the Impressum still carries all five required items (legal name,
address, tax number, tax office, §19 clause) in both locales; the AGB still
carries the clause inside its fees section.

`apps/bureau` was not touched. It is a different application on a different
domain and its footer never carried any of this.

**Also removed from the footer:** the descriptor sentence, which restated what
the company does directly beneath a page that had just spent eight sections
saying it. The registered address and the contact address stay: they are
company facts rather than tax status, and the directive did not name them.

---

### Joomla is demoted, not deleted

**Decision (Marcel's), now explicit content governance.** No article deleted,
no URL changed, no redirect added, nothing removed from search. What changed is
prominence.

Measured in the browser after the change, counting occurrences of Joomla,
WordPress, Drupal and TYPO3 in the rendered body:

| Surface | Before this pass | Now |
|---|---:|---:|
| Homepage | present (a five-card section led with it) | **0** |
| About | present (the story opened with the platform list) | **0** |
| Solutions | present (a top-level solution) | **0** |
| Industries | — | **0** |
| Resources overview | 6 | 4 |
| Written work index | 13 | 10 |

Two changes produced the remaining reduction, and both are legitimate rather
than cosmetic. Resources now shows **one piece from each area** instead of the
five most recent, because a straight recency list put four legacy pieces on the
company's overview page, which is an accident of when things were written. And
the written-work index no longer repeats each article's category beside every
row, under a theme heading that already said it.

**The floor is honest and it is stated.** Two mentions remain in the first
screen of `/blog`: the title of a delivered Joomla migration project, filed
under "Delivered work" because that is what it is. Moving it to the legacy
theme would empty the delivered theme and would be recategorising an article to
improve a number. It was left where it belongs.

---

### The hero is a contained panel, and the Operations Center is deleted

**Decision (Marcel's).** The mock product interface in the hero is rejected and
gone: named systems, "running · 3 locations", an approval queue and a
`maxpromo.os` chrome bar. `components/ui/OperationsCenter.tsx` is deleted
rather than left unused. A company arguing that it will tell you the truth
about your operation should not open with a screenshot of a system nobody is
running.

**The hero is now a dark rounded panel inset on a white page**, carrying the
seven-stage operating flow. Measured at 1745px: 48px between the navigation and
the panel, 96px between the panel and the next section, 12px radius
(`--radius-xl`), 1216px panel on a 1745px viewport with a visible white
perimeter. At 375px: 44px gutter, 32px top gap, same radius.

The reason is structural rather than decorative. The navigation bar is black; a
full-bleed black hero beneath it merges into one dark mass and the page appears
to begin halfway down. This establishes the rhythm the rest of the site follows
— bar, pause, statement, pause, content — and it is what makes the white on
this site negative space rather than emptiness.

**The flow moved into the hero, so the homepage's separate operating-model
section was deleted.** The same diagram twice on one page is the same diagram
twice on one page. The homepage went from eight sections to seven.

**Human control** is marked on Decisions and Oversight with a hairline accent
edge and one small label, not a badge. `check:tokens` rejected the first
attempt, which coloured that label with the accent: lime on black measures
about 14:1 and would have been perfectly legible, but the accent is a fill and
never a text colour, and a rule that holds only where somebody checked the
surface is not a rule. The label is inverted text with a small lime fill beside
it.

**Mobile keeps the route.** Below 1024px the flow becomes a vertical sequence
with connectors and chevrons drawn between the stages, not seven stacked cards.
The return line is removed there rather than squashed, because it would be
describing a shape the layout no longer has; the caption carries the same fact
at every width.

**Owner:** Marcel. Nothing here is approved by the agent that made it.

## 2026-09-16 — Public site rebuild: decisions below ADR level

Continues the entry below it, which covered the homepage only. The two ADRs
produced by this programme are ADR-0012 (the accent is not chrome) and
ADR-0013 (a diagram is built, not generated). The rest is here.

**The positioning change is Marcel's, not the agent's.** "Stop defining
Maxpromo primarily as a software consultancy" was an explicit instruction. It
was applied to the root metadata, the OpenGraph and Twitter descriptions, the
footer descriptor and the homepage description. The phrase is not banned: it
remains available where a legal or contractual context wants it. It is no
longer the company's public definition.

**Four surfaces, chosen by meaning.** `surface-authority` (black),
`surface-plain` (white), `surface-operational` (off-white),
`surface-evidence` (pale green). The rule is that a background change tells the
reader what kind of section they have entered. Alternating them by position
would be decoration, and that is what the previous white-page-after-white-page
rhythm effectively was. Evidence is the narrowest: pale green is only for
sections making a measured claim, which on the public site is the homepage
proof band.

**Websites and legacy systems was demoted, not removed.** It is now an example
inside the Business operating systems family on `/solutions`. Its own page,
its URL, its copy and its place in the sitemap are unchanged. Website
modernisation is an implementation capability; presenting it as one sixth of
the company's identity is what made the site read as a web agency.

**The writing archive was regrouped, never edited.** Nine of thirteen articles
are legacy web topics. No article was retitled, recategorised, unpublished or
deleted, no URL changed and nothing was invented. What changed is that the
index is grouped by theme, the themes are ordered by where the company is now,
and the legacy theme carries a note stating what it is. Marcel's instruction
was explicit: demote from the brand narrative, do not destroy the content
asset. The SEO and topical-cluster question is a later track.

**Article thumbnails are hidden, not deleted.** `featuredImage` is untouched on
every post and still serves the article page and the social card. Only the
editorial index stopped displaying them.

**The contact form kept its backend contract.** `/api/contact` requires name,
email, company, message and a valid `preferredContactMethod`, and treats
`painPoints` as an optional array whose members must come from
`CONTACT_PAIN_POINTS`. The five broad choices that replaced the fifteen
checkboxes are all existing members of that list, sent as a single-element
array. No API change, no enum change, no migration, and rows already stored
stay valid. The mapping from label to stored slug is written out explicitly
rather than derived, per the naming standard.

**Industry cells are derived, not authored.** Each of the eighteen matrix cells
is a distillation of that sector's own `problem` text in `lib/industries.ts`.
No sector expertise is claimed that the repository did not already carry.

**Case study "before" and "system" columns are likewise derived** from each
case's existing `Challenge` and `Solution` prose, both already published on
that page. Every figure, result line, timeline and the NDA statement are the
existing strings. The £14,000 stays in pounds on the case studies page, which
is the page that states the currency.

**Agent Bureau was aligned, not rebuilt.** Its hero moved to the authority
surface, "AI OFFICE" left the eyebrow, the lede leads with what the system does
rather than what it is, and the CTA language matches the rest of the site. Its
workflow panel, module grid, comparison and approval-gate design are untouched:
it had the best information design on the site and the brief was to learn from
it, not to flatten it.

**Legal pages: presentation only, and proved.** Three locally defined card
components became one shared `LegalSection`. Every string on all three pages
was extracted before and after and compared: 183 strings, zero added, zero
removed. No wording, obligation, disclosure, retention statement, liability
term, payment term or jurisdiction clause was touched.

**Dead CSS removed.** `.industry-row` and `.link-list` were the flat directory
pattern that solutions, industries and resources all used. All three now have
a structure of their own, so both rule sets have no consumers and were deleted.

**A contrast checker was written for this pass** and run over 23 page and
locale combinations. It resolves each element's true backdrop by compositing
translucent layers rather than skipping them, which the first version did — and
that version invented four failures on tinted backgrounds before it was fixed.
It is a session tool, not a committed gate: adding a gate is a change to the
frozen tooling and needs an ADR first. The failures it found are in the change
log, and two of them predate this work.

**Owner:** Marcel. Nothing here is approved by the agent that made it.

## 2026-09-16 — Homepage presentation pass: what was decided below ADR level

**Decision:** The hub homepage was rebuilt as a presentation pass with Marcel's
explicit creative authority. Fourteen sections became seven. The decisions with
platform-wide consequence are ADR-0012 (the accent is not chrome) and ADR-0013
(a diagram is built, not generated). The rest are recorded here.

**Removed, with the destination for each:**

| Removed | Where that content lives |
|---|---|
| Legacy modernisation, five cards | `/solutions/websites-platforms`, which states it better and at length |
| Latest insights, three cards with generated images | `/blog` and `/resources` |
| Rotating "pain slider" | nowhere — a four-second carousel of six one-liners, and client JavaScript for a decoration |
| Six pain cards | rewritten as three ruled columns in prose |
| FAQ accordion | `/pricing` carries the commercial answers |
| Why Maxpromo · Team trust · Philosophy · Five-step process | merged into one "How we work" section |
| Agent Bureau orbit diagram | deleted; the section stays — see ADR-0013 for why the diagram was broken |

**Why the legacy section had to go from the homepage specifically:** it was the
fourth block on the page and it led with Joomla and WordPress. A visitor who
read the homepage top to bottom was told this is a web agency, which
`openclaw/core-memory.md` says the company is explicitly not. The capability is
real and is sold — on its own page, reached from Solutions.

**Agent Bureau was kept, deliberately.** It is the one product the hub markets
publicly (`architecture/platform.md` §1); the operating systems are protected
products on their own domains. Removing it would have been a product-exposure
decision, which is outside a presentation brief. It was compressed from 700px
to 468px and lost its diagram, not its place.

**Two public claims were changed by subtraction, never by substitution:**

1. *Build and go live.* The process panels stated **1–4 weeks**; the FAQ four
   sections below stated **2–6 weeks**. Both were on the homepage and a reader
   going top to bottom saw both. Both are gone with the panels and the
   accordion. `delivery-commitments.md` lists this as one of two conflicts
   needing Marcel's answer — it is now absent from the homepage rather than
   answered, because choosing a value is a commercial decision.

2. *The €14k/mo proof figure.* `home.proof.p2Value` said **€14k/mo saved** for
   a project whose own case study (`caseStudies.cs2`) states **£14,000/month**.
   Which symbol is right is a fact about a client that no agent can establish —
   see ADR-0007. The homepage now states a different documented result from the
   same project: **94% of invoices processed without human intervention**
   (`cs2Result3`). `audit:claims` findings went from 10 to 8 as a result.

**Still open and deliberately untouched:** the first conversation is 30 minutes
on the homepage and 45 minutes on `/about` and the six industry pages. The
homepage keeps 30, unchanged. `delivery-commitments.md` says Marcel decides;
removing the homepage's number would have silently chosen 45.

**Also removed as an unsupported claim:** the homepage FAQ's *"Maintenance,
adjustments and improvements are included, not billed as extras"*, which
`delivery-commitments.md` records as contradicting the three monthly plans on
`/pricing`. The replacement principle says only *"Maintenance and change are
part of operating the system"* and makes no claim about billing.

**Two defects found and fixed in passing:**

- The homepage rendered its own `<main>` inside the locale layout's
  `<main id="content">`. Every page of the hub had two nested main landmarks.
  The page's wrapper is gone.
- `.site-footer` carried `margin-top: var(--space-16)` on top of its own
  `--section-y` top padding. Invisible on a page ending in white; a 96px white
  band on any page ending on the subtle surface, which the rebuilt homepage
  does. Removed.

**Brand treatment.** The wordmark and navigation labels are now uppercase, set
small and held open by tracking rather than by size or weight. The change is
typography and colour in `globals.css`, not markup, so it applies to every page
of the hub — chrome that differed by route would be two implementations of one
bar. The navigation architecture is unchanged.

**Measured, before → after** (dev build, cookie banner dismissed):

| | before | after | |
|---|---:|---:|---|
| Page height at 1440px | 10,576px | 6,675px | −37% |
| Page height at 375px | 16,911px | 10,052px | −41% |
| Sections | 14 | 7 | −50% |
| Bordered containers | 23 | 13 | −43%, and 8 of the 13 are diagram nodes |
| Accent-bearing elements | 7 | 3 | two CTAs and the approval gate |

The brief asked for roughly 40–50% and said to use editorial judgement rather
than treat it as a quota. Desktop landed at 37% because the three section
rhythms are a frozen foundation and were not touched; the section count and the
container count moved further than the pixel height did.

**Owner:** Marcel. Nothing here is approved by the agent that made it; the two
ADRs are Proposed pending his visual review.

## 2026-07-10 — Build on existing uncommitted product-page WIP rather than discard it

**Decision:** The 7 generic product pages and `messages/*.json` had pre-existing uncommitted changes using a client-side `useLocale()` pattern flagged as architecturally wrong by the sprint brief. Rather than `git stash` and rewrite from scratch, the existing bilingual copy was kept and the pages were refactored in place to the server `params.locale` pattern (matching the TaxKontrol page, since retired — those routes are now served by the LandingEngine from the product registry).
**Why:** Marcel confirmed this explicitly when asked. The copy itself was high quality; only the locale-threading mechanism was wrong.
**Owner:** Marcel (confirmed via clarifying question at sprint start).

## 2026-07-10 — Proceeded without further AI-Operating-System repo onboarding

**Decision:** `maxpromo.digital` has never had its `repo-docs/` charter instantiated from `C:\Users\loneb\Documents\AI-OPERATING-SYSTEM\repo-docs\` templates (no repository-map, no lifecycle-stage declaration). Rather than pausing the sprint to fully onboard the repo into that governance system, the sprint proceeded using the sprint brief + this repo's `CLAUDE.md` + the real architecture docs at `docs/architecture/sprint-correction/*.md` as the operative spec, and used this session to backfill `decision-log.md`, `known-risks.md`, and `change-log.md` per this repo's own memory rule.
**Why:** The sprint was a bounded, well-specified production-hardening task, not a repository bootstrap. Full onboarding (declaring lifecycle stage/class, instantiating all charter docs) is a separate, larger piece of work.
**How to apply:** If a future session needs the full charter (product-brief.md, repository-map.md, architecture.md, workflow-map.md, data-ownership.md, production-readiness.md), that's still outstanding and should be done as its own task, ideally with Marcel's input on lifecycle stage/class rather than an AI guessing it.

## 2026-09-03 - ADR-003: VG-01, VG-02 and VG-03 retired; ADR-002 re-scoped

**Decision:** The showcase governance rules are superseded. VG-03 held the CTA
colour at the literal hex #F97316 and stated it was "intentionally NOT a CSS
variable" so it would "render identically on every product". VG-01 made a dark
#080808 background the default with light as a per-product exception. VG-02
reserved the accent for headline marks. ADR-002 (in the Agent Bureau repo)
adopted the orange light system.
**Why:** VG-03 in particular was the exact mechanism that would have re-applied
the retired orange after the brand migration - a future session reading the word
"locked" would have been correct to restore it. Retiring the colour without
retiring the rule guarantees regression.
**Applied in:** components/landing/showcaseTokens.ts,
components/landing/LandingThemeProvider.tsx, commit 0366756.

## 2026-09-03 - Two-tier brand: hub always Maxpromo, product accents on their own domains only

**Decision:** maxpromo.digital - including every /systems/* page - renders in
the Maxpromo accent without exception. The eleven per-product accents survive
only on the dedicated product domains (restaurant-os.de, superhandwerk.de and
the rest), where exactly one token varies.
**Why:** A visitor on maxpromo.digital is a Maxpromo prospect and must see one
company; a product page rendering green-on-black inside Maxpromo's own
navigation was the most direct contradiction of that. A visitor on
restaurant-os.de is buying RestaurantOS, so product identity is legitimate there.
**How it works:** lib/host/HOST_MAP.ts and middleware.ts were already
classifying every request as hub or showcase and stamping x-mp-mode; the
mechanism existed and had never been used for colour. LandingThemeProvider now
reads it. Roughly fifteen lines.

## 2026-09-03 - Sweep to tokens first, change the brand last, in one file

**Decision:** Tokenisation (B3-B6) deliberately kept the accent at the retiring
orange. The brand change (B9) is the deletion of a single transitional block.
**Why:** Verification asymmetry. "Did anything change?" is the cheapest possible
QA question and it is the question every sweep batch answers; "did everything
change correctly?" is the most expensive, and it is asked once. It also means
production never showed a half-migrated brand, and the flip is revertible with
one git revert.

## 2026-09-03 - The five brand colours extended with a derived ramp

**Decision:** Brand Black, Brand Lime, Dark Green, Light Surface and White are
unchanged and remain the brand. A derived ramp was added around them.
**Why:** The five alone cannot express an accessible interface. Brand Lime as
text on white measures 1.51:1; white text on Brand Lime measures the same, so a
white-on-lime button - the pattern this codebase used everywhere - is illegible.
Black on lime is 12.62:1, so --brand-on-primary is black. Dark Green on white is
3.08:1 and fails AA for body text, so #4D7C0F (5.00:1) was added as the accent
text colour used by links, labels and invoice figures.

## 2026-09-03 - Semantic colours named --semantic-*, and success blue-shifted

**Decision:** Status colours are --semantic-success/warning/danger/info, never
--brand-*. Success is emerald #047857, not a green from the brand ramp.
**Why:** The v3.1 ruling is that brand colours are never semantic colours.
Naming them in a separate namespace enforces that by construction rather than by
convention. Success still has to read as green, so it is blue-shifted far enough
from the yellow-green brand to be unmistakable at badge size. Specifying warning
at amber-700 also fixed an existing AA failure - text-amber-600 measures ~3.1:1
and appears in 19 Agent Bureau components.

## 2026-09-03 - Space Grotesk retired in favour of a single neutral grotesque

**Decision:** Headings and body both use Inter; hierarchy comes from weight and
size, not from a second typeface. Mono is demoted to code, data tables and
document reference numbers.
**Why:** A geometric display face reads as a 2022-24 AI-startup landing page,
which is the precise impression v3.1 and v4.0 exist to remove - arguably a
larger factor than the palette. Every reference company named in the brief
(Stripe, Linear, GitHub, Atlassian, Notion, Vercel, Basecamp, Thoughtworks) uses
one neutral grotesque this way.
**Reversibility:** One token. Restore the Space_Grotesk import in
app/layout.tsx and repoint --brand-font-heading in design/tokens/brand.css.
Implemented under the v4.0 autonomous mandate and flagged for veto.

## 2026-09-03 - backgroundDark removed from the product registry

**Decision:** The per-product backgroundDark flag is deleted from
lib/registry/products.ts, its types and both adapters.
**Why:** It was a design decision living in product data. Nine of eleven
products carried true, which is what made the showcase pages dark while the
marketing site was light - two design languages, sourced from a content file.
Surface choice belongs to the token layer.

## 2026-09-04 - ADR-0005: the legacy alias namespace retired

**Decision:** The twenty-four `--color-*` / `--font-*` / `--radius-card` aliases
in `apps/web/app/globals.css` are deleted and all 507 call sites migrated to the
token names. `@theme` keeps only the three font keys whose Tailwind utilities
are actually used.
**Why:** The block was written in v4.0 to spare a large find-and-replace, with a
comment saying it would shrink over time. It grew instead, from an estimated
1100 references to 507 live ones, and both names resolved so nothing marked
either as wrong. Fifteen contrast failures had been hiding behind an alias named
for a colour retired two brand generations earlier.
**How to apply:** A migration that leaves the old name working is not a
migration. Rename and rewrite the call sites in the same change, or do not
rename.

## 2026-09-04 - ADR-0006: a package declares the variables it reads

**Decision:** `check-token-inputs.mjs` derives the set of custom properties the
token package references but does not define, and fails the build if any
application does not supply them. Wired into `npm run verify` as gate 2.
**Why:** `@maxpromo/design-tokens` is dependency-free and cannot load a webfont,
so it names one. Agent Bureau never defined `--font-inter` or
`--font-roboto-mono`, an undefined `var()` falls through silently, and the two
applications rendered in different typefaces for a year without a single check,
audit or review noticing.
**How to apply:** Any package naming a variable it cannot provide has declared
an input. Inputs are checked, not assumed.

## 2026-09-04 - The type scale gains its two bottom steps

**Decision:** `--text-label` (11px) and `--text-label-dense` (10px) are added to
the scale, with a stated role - interface chrome, uppercase mono, never prose -
and 649 raw declarations moved onto them and the existing steps at identical
computed values.
**Why:** The audit found 927 size declarations of which 476, fifty-one per cent,
sat at 10px or 11px, and neither had a name. The scale described the marketing
site while the product ran on two sizes it did not contain, so nothing could
reference them and nothing could check them. Same finding as `--weight-bold`:
the scale was incomplete, not the call sites wrong.
**Not decided:** The mid-band consolidation - 12, 14, 16, 18, 20, 22, 26, 28,
30, 42, 48 - is a real visual change of about one pixel each across dense
internal screens and is left for a human pass. See known-risks 23.

## 2026-09-04 - Section rhythm is enforced rather than documented

**Decision:** The eighteen ad-hoc section paddings on the public site move onto
`--section-y` and `--section-y-feature`, and `audit-responsive` fails on a
clamp-based section padding that is not one of the three rhythms.
**Why:** "Exactly three section rhythms; a section not using one fails review"
was written in three documents and checked in none. The site shipped five
ad-hoc values and used a token in one place, with two of them adjacent on the
homepage at 140px above and 112px below - which no single screenshot shows.
**Visual effect:** Desktop section padding moves from 140px to 112px on ten
sections. That is the documented value, and it sits inside the 96-128px band the
reference companies use; 140px was above it.

## 2026-09-04 - v7.1: the scales gain the steps the product actually uses

**Decision:** `--radius-xs` (2px) and `--shadow-overlay` are added to the token
package; 164 radius declarations, 41 transitions and 575 spacing declarations
move onto tokens.
**Why:** Three times now the same finding: the published scale describes the
marketing site, the product runs on a step the scale does not contain, and the
call sites therefore write raw values. It was 10px and 11px type in v7.0, and
weight 700 before that. Here it is the 2px corner every data surface in the OS
is drawn at - 73 declarations, the most used radius in the platform, unnamed -
and the elevation a floating element needs, which three components had each
invented, two of them out of the accent.
**How to apply:** When a raw value appears more often than the token it should
be, check whether the scale is missing a step before changing the call sites.

## 2026-09-04 - Every hover state gets a matching focus state

**Decision:** Sixteen classes with a `:hover` and no `:focus-visible` now have
both. Interaction that lived in `onMouseEnter` moved to CSS.
**Why:** The global focus ring meant this was never an audit failure - it is
that a mouse user was told what was interactive and a keyboard user was told
only where they were. The affordance and the ring are different things.

## 2026-09-04 - Eight data tables were clipping rather than scrolling

**Decision:** Wrappers with `overflow: hidden` around full-width tables become
scroll containers.
**Why:** On a narrow viewport the far columns were unreachable, not merely
off-screen. The responsive audit looks for fixed widths and collapsing grids
and finds neither in a table of auto-width columns, and `.table-wrap {
overflow-x: auto }` had been sitting unused in the stylesheet the whole time -
the third "orphan" in this repository that was a gap rather than dead code.

## 2026-09-04 - v8.0: the homepage introduces, the page educates

**Decision:** The homepage Agent Bureau section drops the six-step lifecycle
and the six capability panels that /agent-bureau already carries (405 lines to
234), and the philosophy section drops the five-step list that "Five steps.
Then it runs." states two sections later with durations attached.
**Why:** The homepage told a reader how the work runs four times in four
consecutive sections, and reproduced a dedicated page inside itself. A section
earns its place by answering a question no other section answers.
**How to apply:** Before adding a section to the homepage, name the business
question it answers and check no other section answers it.

## 2026-09-04 - One dominant call to action, and secondaries that go elsewhere

**Decision:** A secondary CTA must have a different destination from the
primary. Two pages carried a second name for the same action pointing at the
same page; both are now single actions.
**Why:** "Contact us" beside "Talk to Maxpromo", both to /contact, asks the
reader to work out whether they differ. The site now shows one dominant label
(15 uses per language), plus contextual actions that carry real context - a
pricing tier, a product demo with ?system=.

## 2026-09-04 - Business before technology, in the headline as well as the body

**Decision:** Three headlines that led with the technology now lead with the
outcome: the hub's Agent Bureau page H1, the homepage section H2, and the
Agent Bureau site's H1.
**Why:** The core memory's permanent rule is "never sell AI, sell business
outcomes", and in every one of the three the sentence directly underneath
already led with the outcome - the order was inverted, not the content wrong.
The Agent Bureau site made it plainest: an H1 selling KI, three sections above
an H2 reading "Wir verkaufen keine KI. Wir verkaufen Ergebnisse."

## 2026-09-04 - Two claims escalated rather than corrected

**Decision:** The currency contradiction in the case study, and the two
framings of the proof numbers, are recorded as known-risks 33 and 34 and left
in place.
**Why:** Both are public commercial claims. Picking a currency changes a
stated client saving by seventeen per cent; deciding whether the figures are
"results" or "examples" states something about delivered work. Neither is a
formatting fix, and CLAUDE.md makes a public claim the infrastructure does not
support a stop-and-escalate condition.

## 2026-09-04 - ADR-0007: claims are audited, never auto-corrected

**Decision:** `audit:claims` reports currency disagreement and results stated
as estimates, in `certify` rather than `verify`, and never rewrites.
**Why:** The case-studies page promises "where a number appears, it came from
the system rather than from an estimate", and two things were wrong underneath
it that no single string reveals - the same client saving in two currencies,
and two results carrying hedges. Correcting either means knowing what was
delivered; a tool that guessed would invent a fact about a client.

## 2026-09-04 - v9.0: seven findings flagged rather than fixed

**Decision:** The pricing page's marketing retainer, "full account team", the
build-duration disagreement, the two meeting lengths, the maintenance wording,
the three orphaned content sets and the invisible engineering discipline are
recorded as known-risks 38-44 and left in place.
**Why:** Every one of them is a statement about what the company sells,
promises or does. CLAUDE.md makes a public claim the infrastructure does not
support a stop-and-escalate condition, and v9's own brief says to flag rather
than rewrite where confirmation is required.
**How to apply:** The test is whether correcting the finding requires knowing a
business fact. Two names for one CTA does not; what maintenance costs does.

## 2026-09-04 - v9.5: a commitment is a claim, and gets the same treatment

**Decision:** `audit:claims` gains a third rule - one commitment, one value. It
groups durations by what they commit to and reports any commitment carrying
more than one value, in either language.
**Why:** A duration stated publicly is a promise a buyer plans around, and the
site stated two of them twice: the first conversation as 30 and 45 minutes, and
building and going live as 1-4 and 2-6 weeks. Neither is visible from one page.
**Method:** Three attempts at "which keys describe the same thing" - key stem
found two of three conflicts, whole-parent found all three plus a case study's
invoice-processing time read as a meeting length, shared-prefix is what shipped.
Then two at German morphology: plurals in -n/-en, and "und" as a range
separator. Both failures are recorded in the file, because a rule that reports
the English half of a translated pair looks correct in every English review.

## 2026-09-04 - Case-study timelines are evidence, not commitments

**Decision:** `audit:claims` excludes `caseStudies.*` from the commitments rule.
**Why:** "Delivered in 8 weeks" describes one project. Comparing it with "1-4
weeks" on the process section compares what happened once with what is promised
generally, and a script should not draw that conclusion. A human should, and
did - known-risk 40 records that all three published projects took longer than
the process section promises.

## 2026-09-04 - Copy that renders nowhere is removed; copy that renders is not

**Decision:** `proof.*`, `roi.*` and `faq.*` deleted - 49 strings per locale.
`pricing.ctaSecondary` with them.
**Why:** v9 recorded them rather than removing them, on the grounds they looked
planned rather than retired. v9.5's instruction is to resolve everything that
can be resolved without changing a business fact, and copy no component reads
makes no public promise. Two carried claims - a customer quote and a "60-90
days payback" - that one wire-up would have published unevidenced. Git keeps
them.

## 2026-09-04 - v9.6: public pricing retired (Marcel's decision)

**Decision:** The website no longer displays prices. Maxpromo does not sell
predefined packages; every engagement begins with understanding the business.
The page, its route, its 64 strings per locale, its nav and footer links and
its sitemap entry are removed. `/pricing` redirects permanently to `/contact`.
**Why:** Marcel's, on the commercial question v9.5 put to him. It resolves
known-risks 38, 39, 42 and 45 in one decision.
**How to apply:** There is no price list, so nothing may quote one - including
the surfaces that are not pages.

## 2026-09-04 - A conversational surface is a publishing surface

**Decision:** The chat agent, its offline fallback, the shared prompt module
and the internal OS assistant are treated as public commercial copy.
**Why:** Retiring the page found four price models nothing had ever reviewed.
Max's system prompt carried "Starter from GBP 2,500, Growth from GBP 6,500,
payment plans over GBP 3,000" and the instruction "Give specific numbers. Do
not be vague." lib/ai.ts repeated it offline, lib/prompts.ts held a third copy
and the OS assistant a fourth at EUR 799-6,000+. Pounds sterling, on a
German-market site, none of it matching the published page, none of it visible
to any page audit. The agent also linked to two retired routes, offered an ROI
calculator that does not exist and quoted a 60-90 day payback nothing
evidences.
**How to apply:** A prompt that speaks to prospects is copy. It is reviewed
when copy is reviewed.

## 2026-09-04 - audit:claims reads articles

**Decision:** The currency rule scans content/**/*.mdx as well as the message
catalogues.
**Why:** ADR-0007 recorded copy outside the catalogues as a known limit. It was
hiding three currency conflicts in one published article, which gives a
migration's hosting cost in pounds in English and euros in German, four lines
above the sentence "those are documented outcomes from a real project".

## 2026-09-04 - v10.0: a shared abstraction the caller cannot consume is unadopted

**Decision:** `@maxpromo/ui` exports `TONE_VARS` - the same six tones as CSS
custom properties - and the internal OS's nine status maps are migrated onto
it. ADR-0002 is amended.
**Why:** ADR-0002 replaced eleven status maps in Agent Bureau with a tone
system, and its general lesson was that an abstraction callers ignore is wrong.
The OS then accumulated nine of its own, because TONE_TEXT and TONE_BADGE are
Tailwind class strings and the OS styles with inline custom properties. It
could not adopt them physically, which is the same outcome as ignoring them.
The drift arrived on schedule: the dashboard coloured a new lead lime, the
leads page amber.
**How to apply:** When extracting a shared abstraction, check the call sites
can consume the form you chose, not only that they share the idea.

## 2026-09-04 - The showcase heading scale is deleted, not documented as moved

**Decision:** `HEADING_SIZE` is removed from the showcase engine.
**Why:** Its own file header had said the heading scale "has moved to the
platform type scale - showcase headings are the same headings" for a release
while the constant sat below it with five entries, two unused and one holding
the 4rem display size the design system retired by name. Documentation that
describes a removal is not a removal.
**Also found:** two showcase sections had no heading element at all - their
headings were paragraphs sized from that constant.

## 2026-09-05 - The merge gate has one definition, and it is checked

**Decision:** `verify` is defined once, in the root package.json. No workspace
redefines it, CI calls it rather than restating its steps, and
`check:governance` - the first gate in the chain - fails the build if any of
those three stops being true.
**Why:** Three things claimed to be the merge gate. The root ran eight gates,
each application defined a four-gate script under the same name, and the CI
workflow enumerated six steps by hand. The workflow enumerated them for a good
reason - a named failing check is legible without opening a log - and the cost
was that every gate added afterwards had to be remembered in a second place.
Three were not: `check:token-inputs`, `check:icons` and `audit:typography` were
in the developer's gate and had never run in CI. **The workflow that exists to
enforce the standard was enforcing a stale subset of it and reporting green.**
**How to apply:** Anything that describes the gate calls it or is compared
against it. The standards table now names each gate's script so the comparison
is exact rather than a guess at prose.

## 2026-09-05 - A rule that cannot fail is not a rule

**Decision:** Recorded as method, not policy: every rule in
`check-governance.mjs` was watched failing on a reintroduced defect before the
check was believed.
**Why:** It needed the discipline. Rule 2 searched the whole workflow file for
`npm run verify`, and the file explains at length why it calls it - so the rule
was satisfied by a comment about the rule, and would have passed a workflow
that had stopped calling the gate. Rule 3 searched the whole standards
document, and the script names also appear in the audit-suite table further
down, so removing a gate from the gate table still passed. Both looked correct.
Both were verified only by deliberately breaking the thing they check.

## 2026-09-05 - A product has one identity, and empty slots are declared

**Decision:** ADR-0009. One brand record per product in
`packages/config/brands.ts`: names, accent, accent-as-text, theme colours, and
every asset slot — declared even when empty, with the reason it is empty.
**Why:** Identity was spread across four files and none of them held it. Two
products had a *semantic* token as their brand accent, which the design system
forbids and no check could see. Four of eleven accents fail contrast as text and
two components colour text with them — the platform has enforced exactly that
rule for its own accent since v3, and product accents were never in scope
because the check knows one token name.
**How to apply:** `check:brands` is gate 3 and holds the registry to the
repository. A slot that is not `own` and has no note is a finding: an empty slot
with no reason is indistinguishable from an oversight, which is what the audit
found in its own registry on its first run.

## 2026-09-05 - A custom property that travels is as undefined as one that does not

**Decision:** No `var()` in output read outside the browser. `lib/email.ts` and
`lib/documents/emailHtml.ts` use the token package's TypeScript mirror; the rule
is in `check:token-inputs`.
**Why:** Ninety-five custom properties were written into transactional email
markup — seventy-one spacing values in `email.ts` and twenty-four colours in
`emailHtml.ts`, including the company name on the invoice letterhead set to
`var(--brand-surface)` on a near-black band. Email clients implement no custom
properties, so each resolves to nothing with the same silence as an undefined
one. ADR-0006's check could not see them: they are all correctly defined by the
web application. They simply travel somewhere that cannot read them.
**How to apply:** The mirror (`token`, `space`, `type`) exists for exactly these
surfaces. `printCss.ts` is deliberately exempt — it renders in a browser page.

## 2026-09-05 - The documentation tree has one index and one authority per fact

**Decision:** `docs/PLATFORM-CONSTITUTION.md` indexes the tree and restates none
of it. `audit:docs` enforces the mechanical part: named files exist, gate counts
beside `npm run verify` are current, every document is reachable.
**Why:** `design-system.md` said the merge gate had eight gates while it ran
ten — correct when written, which is why nobody re-read it. Thirteen documents
named files that had moved or been deleted. Twenty-six had no inbound reference
at all.
**How to apply:** Two of the audit's own rules were wrong before they were
right, and both failures are recorded in the file: the first draft checked
Markdown links in a repository that uses none, and reported clean on zero
targets; the second matched historical narration and reported five findings
against documentation that was correct. A rule that fires on the wrong thing is
as useless as one that fires on nothing.

## 2026-09-05 - A domain is an identity, not a routing hint

**Decision:** ADR-0008. One record per public host in
`packages/config/domains.ts`; metadata, route availability, languages, legal
chrome, robots and sitemap are all derived from it. `apps/web/lib/host/` is
deleted.
**Why:** A host resolved to four facts, and everything else about a domain was
decided downstream by code written when there was only one site. RC1 measured
the result: nine product domains served the consultancy's title, social card
and canonical URL; their robots.txt named the consultancy as their host; all
fifteen consultancy pages answered 200 on every one of them, chrome-less, with
the contact form that collects personal data carrying no Impressum link and no
links at all; and two domains served English product copy inside German page
furniture. Five symptoms, one missing concept.
**How to apply:** Nothing outside the registry names a domain. `check:domains`
is gate 2 and checks the registry against the repository, because a registry
that can lie is worse than no registry.

## 2026-09-05 - The registry declares the languages a domain has, not the ones it wants

**Decision:** `languages` on a domain record is the set the middleware will
serve. `publishers24.org` and `drive24.live` declare `['en']`; `/de` redirects
to `/`, the locale switcher does not render, and no hreflang is published for a
language the domain redirects away from.
**Why:** `pickLocale` returns the English value whenever the German one is
absent, silently, field by field. PublishingOS has German for 1 of 16 localised
fields and Drive24 for none. There is no point after rendering at which a
mixed-language page can be detected — the fallback leaves no trace — so the only
place to prevent one is before it is built.
**How to apply:** When the German copy is written, add `'de'` to one array. The
domain audit fails the build if that array claims a language the product does
not have.

## 2026-09-05 - Chrome belongs to the domain, not to one page on it

**Decision:** ProductNav and ProductFooter moved out of `LandingEngine` into
`ShowcaseChrome`, rendered from `app/[locale]/layout.tsx`.
**Why:** They lived inside the landing page, which renders only at the domain's
root, while the locale layout suppressed all Maxpromo chrome on a showcase
host. Every other page a product domain served therefore had no navigation and
no footer — including `/contact`, the destination of every call to action,
which collected a name, a company, an email address and a telephone number and
contained no links whatsoever. §5 DDG and Article 13 GDPR both attach at the
point of collection.
**How to apply:** Anything every page on a domain must wear lives in the layout,
not in a page component.

## 2026-09-06 - Nothing fails silently

**Decision:** ADR-0010. One logging standard, error boundaries at both levels
in both applications, a correlation id on every response, `/api/health` in one
shape, performance budgets with a gate, and a Lighthouse baseline across every
public domain.
**Why:** The platform's most common way of failing was to say nothing. No error
boundary anywhere; 77 `console.*` calls with no shared shape; 37 `catch {}`
blocks that swallow; no health endpoint on the application serving ten domains;
eight security advisories surfaced by nothing.
**How to apply:** A check that cannot see something must say so rather than
report clean — the dependency audit prints ADVISORIES: UNKNOWN when it cannot
run `npm audit`, and the Lighthouse harness refuses a dev server rather than
recording a meaningless score.

## 2026-09-06 - A number nobody can defend is not a budget

**Decision:** Every entry in `packages/config/budgets.ts` carries three numbers
and a sentence: what it measured when written, what it may become, and what it
protects. `measured` is never edited to make a check pass; raising a `limit` is
a decision for the change log.
**Why:** A budget pinned to today's value fails on the next legitimate change
and gets raised without thought, which is how a budget becomes a formality. The
headroom is the space a real change may take; crossing it should be a decision.
**How to apply:** The Lighthouse floors were set to industry norms and six
domains fall below them on mobile. That gap is the finding — lowering the floor
would have made the check incapable of saying anything, which is ADR-0004's
definition of a rule that cannot fail.

## 2026-09-06 - An advisory is blocked or accepted, never ignored

**Decision:** ADR-0011. `audit:dependencies` blocks a release on a CRITICAL
advisory reaching production, and on a HIGH one unless
`packages/config/security.ts` carries a live acceptance naming the exposure, the
mitigation, an owner and a review date.
**Why:** "Fail on any advisory" would have blocked this platform on four
development-only findings in a deprecated transitive of a migration CLI, whose
only published fix is a downgrade. A gate that fires on something nobody can fix
is a gate people route around, and that converts a real signal into a habit of
ignoring one.
**How to apply:** Reach is computed by walking npm's `effects` graph up to the
direct dependency and reading *its* section — the vulnerable package has none of
its own. A root that cannot be identified counts as production.

## 2026-09-06 - The smallest secure version is not always the one to ship

**Decision:** `next` went to 16.3.4, not to 16.3.0, and the reason is written
down. 16.3.0 is the smallest version clearing all three HIGH findings — it is
where the pinned postcss becomes 8.5.23 and sharp becomes ^0.35.3. 16.3.4 is the
same minor with four patch releases of fixes and no additional feature surface.
**Why:** Shipping the `.0` of a minor to ten production domains is the larger
risk. "Smallest secure" should not be read as "least tested".
**How to apply:** State the security minimum and the shipped version separately,
so the gap is a decision someone can disagree with rather than a number nobody
questioned.

## 2026-09-06 - Track A is certified at a tag, and closed only by production

**Decision:** `track-a-foundation-v15.1` records the certified foundation.
Track A's *status* is CERTIFIED, NOT CLOSED, until the release is verified in
production.
**Why:** A foundation that has only ever run on a laptop is not a foundation
anything should be built on. Production is four sprints behind and still serves
the two RC1 blockers this release fixes; calling Track A closed before that
changes would be recording an outcome that has not happened.
**How to apply:** The freeze rules (constitution §24c) take effect at closure.
Until then the tag is the checkpoint and `deployment/track-a-release.md` is the
path.

## 2026-09-06 - Four sprints, one commit, and the reason said out loud

**Decision:** v13.0 through v15.1 are recorded as a single commit rather than
reconstructed into four.
**Why:** They were developed as one uncommitted stream. Splitting them
afterwards would produce intermediate commits that never existed and were never
individually certified — traceability that reads better and is less true.
**How to apply:** Commit at the end of a sprint. Four sprints of uncommitted
work is how a repository ends up unable to describe its own history honestly.


---

## 2026-09-06 — Merge a release branch to `main` with `--no-ff`

**Decision:** Track A was merged to `main` as a merge commit, not fast-forwarded.

**Why:** `apps/web/vercel.json` gates the build on
`git diff --quiet HEAD^ HEAD -- ../../apps/web ../../packages`. The certified
commit is docs-only, so after a fast-forward that diff is empty and Vercel
skips the production build — leaving production on the old commit while the
merge reports success. A merge commit's first parent is the previous production
commit, so the diff spans the whole release.

Verified before merging by simulating both diffs, and confirmed independently:
the git-triggered preview of the docs-only commit was recorded `CANCELED`.

**How to apply:** Any release whose final commit touches only `docs/` must be
merged with `--no-ff`, or the pipeline will skip it. Check
`main^{tree}` against the release tag's tree afterwards — a `--no-ff` merge
must change no content.

---

## 2026-09-06 — Scan history for secrets before a first push to a public remote

**Decision:** Before pushing 78 previously-unpublished commits to the public
`buddy1974/maxpromo.digital`, every object in the push was scanned for secret
material — 2,312 blobs, 80.5 MB, ten patterns.

**Why:** History contained 1,007 committed `.next` build blobs. Build output can
carry inlined configuration, and a push to a public repository cannot be taken
back. The scan self-tests every pattern against canary input first and refuses
to report clean if it read nothing — a secret scanner that matches nothing
because its patterns are broken is worse than no scanner, because it grants
confidence.

**Result:** the only matches were the Neon driver's own error-message template
and `.env.example` placeholders. Nothing real.

**How to apply:** Any first push of accumulated history to a public remote gets
this treatment. `git log` is not evidence about what is in the objects.

---

## 2026-09-07 — Trigger a project's first deployment from a new repository explicitly

**Decision:** The Agent Bureau's first production deployment from the monorepo
was triggered explicitly rather than by a push to `main`.

**Why:** `apps/bureau/vercel.json` gates the build on
`git diff --quiet HEAD^ HEAD -- ../../apps/bureau ../../packages`. `main`'s
head is a docs-only commit, so that diff is empty — a git-driven deploy would
have exited 0, been skipped, and left the July build serving while the
deployment reported success. The same rule had already skipped a
`maxpromo-digital` deployment the day before, which is how the behaviour was
confirmed rather than assumed.

The ignore command answers "did anything this project cares about change since
the last commit". It cannot answer "has this project ever built from this
repository", which was the actual question on the day a project is repointed.

**How to apply:** When a Vercel project is connected to a different repository,
its first deployment needs an explicit trigger. Verify provenance instead of
trusting the trigger: the working tree matched `origin/main` exactly, the
`apps/bureau` and `packages` trees hashed identically to the web release, and
the deployed artefact was made to report its own commit through `/api/health`.

**Do not** relax the ignore command to force the build. It is correct; it was
being asked a question it does not answer.

---

## 2026-09-07 - A contact destination is a property, not a path

**Decision:** `DomainEntry` gains `contactStrategy: 'self' | 'hub'`, and
`contactUrl(domain, locale)` resolves it. `agents.maxpromo.digital` declares
`contactPath: '/contact'` with `contactStrategy: 'hub'`.

**Why:** `contactPath` was typed as a path and documented as "the path every
call to action on this domain arrives at" - same-origin by construction. The
Agent Bureau's calls to action have always gone to the consultancy, so the
registry had no way to say what was true and said something false instead:
`/kontakt`, a page that application has never served. Meanwhile the real
destination lived as a hardcoded absolute URL in the bureau's footer.

Three answers to one question, and the registry held the only wrong one.

**Alternatives considered.** Creating a `/kontakt` page in `apps/bureau` would
have satisfied the field and built a second contact desk for a product that
deliberately routes its conversations to the consultancy - a product decision
smuggled in as a lint fix. Allowing `contactPath` to hold an absolute URL would
have made the type stringly and left "whose path is this?" unanswerable without
parsing.

`contactStrategy` mirrors `canonicalStrategy`, which already solves exactly this
shape for canonical URLs. Same vocabulary, same resolver shape, nothing new to
learn.

**How to apply:** Read the destination with `contactUrl()`, never `contactPath`
alone. The bureau footer now does, so the declaration is load-bearing - a field
nothing reads is a field that drifts, which is how this one came to be wrong
for four sprints without a single failing check.

---

## 2026-09-07 - The correlation id is a platform contract, so it is gated

**Decision:** `apps/bureau` stamps `x-mp-trace` using the shared
`TRACE_HEADER`/`newTrace` from `@maxpromo/observability`, and a new merge gate
`check:trace` enforces that every application with a middleware does the same.

**Why:** v15.0 built the observability package and wired it into `apps/web`
only. Nothing said so, and the platform was described as observable. Production
verification found `agents.maxpromo.digital` returning no correlation id on a
served page or a 404.

**The middleware change is the part that needed care.** The old matcher was
`["/dashboard/:path*"]` passed straight to `withAuth`, so every matched path
was an authenticated path. Widening that matcher would have put the landing
page, `/login` and the two legally required pages behind a session - a redirect
loop on the login page, and a German legal requirement made unreachable.

So `withAuth` is no longer the exported middleware. It is constructed once and
invoked only for `/dashboard/**`; every other matched path is stamped and
passed through. The authenticated set is now decided by an explicit
`startsWith`, not by the matcher, and it is the same set as before - verified
against a local production build before deployment: `/`, `/login`,
`/impressum`, `/datenschutz` all 200; every `/dashboard/*` still 307 to
`/login?callbackUrl=...`; `/api/*` still outside the matcher entirely.

**How to apply:** Never widen a matcher that is passed directly to an auth
helper. Separate "which requests this middleware sees" from "which requests it
authenticates" first, then widen the former.

**On the gate itself:** its own first run reported the middleware that
satisfies the contract as violating it, because the doc comment explaining the
contract names the header. It reads comment-stripped source now, the way the
standards have required since ADR-0004 - the same defect `check-token-inputs`
had, found the same way.

---

## 2026-09-16 — Track A is closed on observed rows, not on a green status code

**Decision:** Track A is closed and the foundation frozen, on the strength of an
authenticated read-only pass over the five Drizzle-backed Agent Bureau routes in
which **all five returned persisted production rows**. The correlated runtime
log — clean of `[db/queries] read failed:` and of every Drizzle, SQL, Neon,
schema, relation and connection error — is recorded as corroboration, not as the
verdict.

**Why:** `safeRead` catches, logs and returns a fallback, so a total database
failure and an empty workspace produce the identical HTTP response. Any closure
resting on `200` or on `{"ok":true}` would have been a check with no failing
case. Rows cannot be fabricated by a fallback; that is the only evidence
available that distinguishes the two states, and it is the evidence used. The
verification was attempted three times from an isolated browser profile and
correctly reported **incomplete** each time rather than inferring success from a
redirect to `/login` — the first two attempts produced clean logs too, and clean
logs from an anonymous session prove nothing.

**Also decided:** closure is recorded as an *engineering* verdict. The
EU-hosting claim on `agents.maxpromo.digital` and the unset Upstash credentials
remain open and are not settled by a frozen foundation. Constitution §24d exists
so the two are never read as one.

**How to apply:** When a resilience layer makes a failure invisible, do not
verify through it. Find the observation the fallback cannot imitate, and say out
loud which half of the evidence carries the verdict and which half only agrees
with it.
