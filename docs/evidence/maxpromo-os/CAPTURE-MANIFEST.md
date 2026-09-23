# Maxpromo OS — evidence capture manifest

**Status:** awaiting five captures · created 2026-09-23 · Phase B3.2

This file is the contract between the running application and
`packages/config/proof.ts`. Every capture below maps to one media requirement
by id. Nothing here may be renamed, merged, or substituted: `check:proof` fails
the build if a requirement claims an artefact that is not on disk, and the
requirement ids are what the proof engine reasons about.

---

## Where the files go, and why it is two places

**Source evidence** — `docs/evidence/maxpromo-os/` (this directory). Raw
captures, exactly as the screen produced them, at full resolution. Committed,
because evidence that only exists on one laptop is not evidence. Not served by
the web application, so it costs nothing against the `web.public-weight`
budget.

**Public derivative** — `apps/web/public/images/systems/maxpromo-os/`.
Optimised copies, created only when a publication decision has been made, in
the shape the existing `images/systems/<system>/` convention already uses.
**This directory does not exist yet and must not be created during B3.** The
source is the record; the derivative is a rendering of it, and conflating them
is how a cropped, compressed, retouched image ends up being treated as the
original.

Relevant budget headroom, measured: `web.largest-image` is at 885 KB against a
1000 KB limit, and `images-over-500kb` is at 25 against a limit of 30. Five
unoptimised screenshots would breach both. That is a problem for the
derivative, not for the source.

---

## Why the operator takes these and not the agent

`/os/*` is gated on a signed session cookie issued by `/os/login`. An agent
does not type a password into a login form, and it does not mint the cookie
directly either, because that is bypassing an authentication control rather
than satisfying it. The browser context available to automation also does not
share the operator's session.

So the operator captures, and the agent inspects: every file is checked for
real identities, credentials, production data, workflow truth and legibility
before its requirement moves from `blockedBy` to `satisfiedBy`. Nothing is
marked satisfied because a capture session happened.

---

## Preconditions

All of these were true when this manifest was written:

- `MAXPROMO_EVIDENCE_MODE=1`, and the resolver selects `EVIDENCE_DATABASE_URL`
- the evidence database holds exactly one fictional client and three documents
- both outbound transports are inert, proved against an instrumented `fetch`
- `/api/health` reports `database: ok` while the mode is armed

If the dataset has drifted, restore it before capturing:

```
node <scratchpad>/run-seed.mjs --reset
```

---

## The five captures

Window: **1456 × 1010**, which gives roughly a 16:10 viewport once browser
chrome is subtracted. Use the same window for all five so the set looks like
one system rather than five screenshots.

Before starting: close other tabs, hide the bookmarks bar, dismiss any
notification, and use a clean profile with no extension toolbars. Nothing in
the frame that is not the application.

### 1 · `os-source-note` → `01-source-note.png`

**URL** `http://localhost:3020/os/angebote/new`

Open the extraction modal and paste the text below into it. Capture **before
submitting**.

```
Hallo Herr Akwe,

wie besprochen hier die Punkte für das Angebot. Der Termin nächste Woche passt
bei uns übrigens gut.

- Schaltschrank-Umbau Halle 2, pauschal 2.400,00
- Prüfung ortsveränderlicher Geräte, 48 Stück à 12,50
- Dokumentation und Übergabeprotokoll, pauschal 380,00

Rechnung bitte wie immer an die Buchhaltung.

Viele Grüße
Katrin Beckmann
Beckmann Elektrotechnik GmbH
Tel. +49 201 5550142
```

That text is `EVIDENCE_SOURCE_NOTE` in `apps/web/lib/evidence/dataset.ts`. It is
invented, and it deliberately contains a greeting, a signature and one sentence
about a meeting that is not part of the order — the extraction is supposed to
discard those, and a sample without them would prove nothing.

**Proves** the system accepts real, messy input rather than a clean form.
**Does not prove** that extraction is accurate, or that any customer sent this.

### 2 · `os-extraction-result` → `02-extraction-result.png`

Submit the note. Capture the structured result the extraction returns.

**Proves** unstructured input becomes structured fields.
**Does not prove** the figures are correct, or that a record was created.

Expected, from the same dataset: three line items at 2.400,00 / 48 × 12,50 /
380,00, totalling **3.380,00**. If the returned figures differ, capture what
actually happened and say so — a screenshot corrected to match the expected
answer is not evidence.

**This is the one capture that can fail for an unrelated reason.** It needs a
working model key. If the call errors, skip this shot; the requirement stays
`blockedBy` with the real cause recorded. Do not hand-fill the form and present
it as an extraction result.

### 3 · `os-form-before-save` → `03-form-before-save.png` — **the hero**

The quotation form populated from the extraction, with **nothing saved yet**.
The Save control must be visible and unused.

**Proves** the single most important fact in the package: the system prepares,
and a person still decides.
**Does not prove** that the operator changed anything.

This is the shot the Workflow Automation page is built around. `applyExtracted`
calls only React state setters and the extraction route contains no `INSERT`, so
at this moment no record exists anywhere. Frame it so that is legible.

### 4 · `os-draft-record` → `04-draft-record.png`

Save, then capture the saved quotation on its detail view, in **draft**.

**Proves** a record exists and has not been sent.
**Does not prove** it was ever sent or accepted.

Expected: `EVD-2026-0007`, status draft, dated 2026-09-14, total 3.380,00.

Saving creates a second quotation for the same fictional client, which is
correct and expected — the seeded `EVD-2026-0007` is the one the dataset
defines, and the new one is what this capture session produced. Reset
afterwards to return to baseline.

### 5 · `os-lifecycle-list` → `05-lifecycle-list.png`

**URL** `http://localhost:3020/os/invoices`

**Proves** the system carries a document through a lifecycle.
**Does not prove** any volume, value or timing.

Expected: `EVD-2026-0004` sent, `EVD-2026-0001` paid.

**Known discrepancy, recorded rather than worked around.** The requirement in
`proof.ts` says "draft, sent and paid together". The governed dataset produces
two invoice states, sent and paid; the draft in the scenario is a *quotation*,
which lives on a different list. Adding a third invoice purely to make one
screenshot show three states would be inventing data to improve a picture. So
capture the two real states, and the requirement text gets corrected in B3.3 to
describe what the dataset actually demonstrates.

---

## What disqualifies a capture

Any of these means recapture, not retouch:

- a real name, address, email, phone number or company
- anything from the production database
- a credential, key, token or connection string
- a terminal, an editor, a debug overlay, a browser notification
- a devtools panel or a React error overlay
- an unsupported quantitative claim rendered on screen
- framing that implies the system created or sent a document on its own

Never blur or paint over real information and keep the file. If production data
appears in a capture, that is an isolation incident: stop and report it.

---

## After the captures

The agent reads each file, inspects it against the list above, and moves each
requirement from `blockedBy` to `satisfiedBy` **individually**, recording the
artefact path, basis and date. Then `check:proof` verifies every named artefact
exists.

Publication is a separate decision and is not part of B3.
