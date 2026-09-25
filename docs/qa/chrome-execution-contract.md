# Chrome execution contract

**Status:** CHROME HANDOFF READY · refreshed 2026-09-25 for five new routes

For the browser execution agent. Self-contained: Chrome has no repository
filesystem access and needs none. Everything required is here.

**Division of responsibility.** Chrome observes and captures in the browser. VS
owns repository truth, file placement, ingestion and the proof registry. The
owner is not the screenshot operator and is not the QA operator; he intervenes
only at a genuine authentication, security or publication boundary.

**Before anything, confirm all four:** evidence mode is armed · `/os` is
reachable without a login prompt · the visible client is *Beckmann
Elektrotechnik GmbH* · document numbers begin `EVD-2026-`. If any is false,
stop and report.

---

## 0. The governed baseline

| Record | Number | Status | Amount | Dates |
|---|---|---|---|---|
| Client | — | active | — | Katrin Beckmann · Beckmann Elektrotechnik GmbH |
| Quotation | `EVD-2026-0007` | **draft** | €3.380,00 | created 2026-09-14, valid to 2026-10-12 |
| Invoice | `EVD-2026-0004` | **sent** | €1.180,00 | created 2026-09-02, due 2026-09-16 |
| Invoice | `EVD-2026-0001` | **paid** | €620,00 | created 2026-08-05, paid 2026-08-14 |
| Leads · Jobs · Newsletter | none | | | |

Invented client details: `buchhaltung@beckmann-elektro.example` ·
`+49 201 5550142` · Industriestraße 14, 45899 Musterhausen. `.example` is a
reserved TLD that cannot resolve; Musterhausen is a fictional town.

**The OS interface is German** (`DEFAULT_OS_LOCALE = 'de'`).

**Expect it to feel slow.** The lab is in `us-east-2` and the operator is in
Europe, so queries cross the Atlantic at roughly 1.5 s and `/api/health`
reports `database: degraded`. Known, correct, not a defect. Do not file it.

### Lifecycle truth — already corrected, do not reopen

The invoice list carries **two** states: sent and paid. The draft in this
scenario is a *quotation* and lives on a different list. The proof requirement
formerly said "draft, sent and paid together"; that wording was wrong and was
corrected on 2026-09-24.

**Do not create a third invoice.** Do not edit a status to make a screenshot
symmetrical. Capture the two real states.

---

## 1. The five captures

**Window:** `1456 × 1010` for captures 1–4 (registered aspect 16:10),
`1456 × 920` for capture 5 (16:9). VS crops to exact aspect on ingestion —
get the content right, not the pixel ratio.

**Framing.** Nothing in the captured frame that is not the application: no
devtools, no notification, no bookmarks bar, no extension toolbar, no other
window. **Do not close the operator's existing tabs** — leave them alone.

**The operator's own name will appear.** `Marcel Tabit Akwe` renders in the OS
chrome on every protected page, and `Guten Abend, Marcel` on the dashboard.
That is the proprietor's own name in his own system, not customer data, and it
is **not** disqualifying. Capture normally and report that it is present in
every frame; whether it stays is a publication decision for the owner. Do not
crop it out, blur it, or alter the interface to remove it.

### 1 · `os-source-note` → `01-source-note.png`

**URL** `http://localhost:3020/os/angebote/new` · **Mutates data:** no

1. Navigate. The new-quotation form is empty.
2. Click **`KI-GENERIERUNG`** (lime-tinted).
3. A panel opens titled **`KI-Angebotsgenerator`**, subtitle *`TEXT EINFÜGEN,
   BILD ABLEGEN ODER SCREENSHOT MIT STRG+V`*, with an empty textarea.
4. Paste the source text from §2 exactly.
5. **Stop. Do not click `Mit KI generieren →`.**

**Visible before capture:** panel open and titled, the pasted note visible
(prioritise the three order lines plus the signature if it cannot all fit), the
`Mit KI generieren →` button visible and unused, the form behind still empty.

**Proves** the system accepts real, messy input rather than a clean form.
**Does not prove** extraction is accurate, or that any customer sent this.

### 2 · `os-extraction-result` → `02-extraction-result.png`

Same page, continuing. **Mutates data: no** — and that is the point: extraction
calls only React state setters, and the extraction route contains no `INSERT`.

1. Click **`Mit KI generieren →`**. The button reads **`Extrahiert…`** while
   working. Allow up to 60 s.
2. Capture the structured result.

**Proves** unstructured input becomes structured fields.
**Does not prove** the figures are correct, or that a record was created.

Expected result and arithmetic in §2. **If the actual result differs, capture
what actually happened and report it.** Never edit a field toward the expected
answer.

**If the model call fails:** capture the error, mark this artefact `BLOCKED`
with the visible message and any console error. Captures 3 and 4 are then
blocked too, because they need a form populated *by the extraction*. Say so
rather than hand-filling it.

### 3 · `os-form-before-save` → `03-form-before-save.png` — the hero

Same page, continuing. **Mutates data: no.** Nothing has been written yet.

1. Dismiss the panel so the populated form is visible.
2. Frame the client fields, the three line items, the total **and the
   `Speichern` control** together if the layout allows. If not, prioritise line
   items + total + `Speichern` visible and unused.
3. **Do not click `Speichern` yet.**

**Proves** the single most important fact in the package: the system prepares,
and a person still decides.
**Does not prove** that the operator changed anything.

At this moment no record exists anywhere. The unused save control is what
carries that.

### 4 · `os-draft-record` → `04-draft-record.png`

**⚠ The only capture that writes.**

1. Click **`Speichern`**.
2. Capture the saved quotation on its detail view, status **draft**.

**Proves** a record exists and has not been sent.
**Does not prove** it was ever sent or accepted.

**Expect afterwards:** one additional quotation beside `EVD-2026-0007`, with an
auto-assigned number. Correct and expected — report the actual number. VS
resets to baseline afterwards. Do not delete it, edit it, or send it.

### 5 · `os-lifecycle-list` → `05-lifecycle-list.png`

**URL** `http://localhost:3020/os/invoices` · window `1456 × 920` · no mutation

**Visible:** `EVD-2026-0004` **sent** €1.180,00 and `EVD-2026-0001` **paid**
€620,00.

**Proves** the system carries a document through a lifecycle.
**Does not prove** any volume, value or timing, **and not the full lifecycle on
one screen** — the draft belongs to a quotation on a different list.

---

## 2. Extraction contract

Paste exactly. Invented; no real person or company. It deliberately contains a
greeting, a signature and one sentence about a meeting that is *not* part of the
order — extraction is supposed to discard those, and a sample without them would
prove nothing.

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

The extraction must genuinely invoke the model. Manual entry may never be
presented as extraction.

| Description | Qty | Unit | Line total |
|---|---|---|---|
| Schaltschrank-Umbau Halle 2 | 1 | 2.400,00 | **2.400,00** |
| Prüfung ortsveränderlicher Geräte | 48 | 12,50 | **600,00** |
| Dokumentation und Übergabeprotokoll | 1 | 380,00 | **380,00** |

48 × 12,50 = 600,00 · 2.400,00 + 600,00 + 380,00 = **3.380,00**

If actual differs, record: which items appeared, quantities, prices, the total,
whether the meeting sentence was discarded, and whether greeting or signature
leaked into a field. One genuine discrepancy is worth more than a clean fake.

---

## 3. Evidence safety

A screenshot is not acceptable because it looks clean. It is acceptable only
when its content is **traceable to the governed evidence environment**.

**Positive test — every capture must show at least one:** a document number
beginning `EVD-2026-`, the client `Beckmann Elektrotechnik GmbH` / `Katrin
Beckmann`, or `Musterhausen` / a `.example` domain. None of those present means
not verifiably synthetic — reject it.

**Disqualifying — recapture, never retouch:** any real customer or prospect
data · any credential, key, token or connection string · personal bookmarks,
profile name or avatar, autofill or saved-password prompts · OS notifications,
other application windows, the taskbar · unrelated tab titles · devtools, React
error overlays, the Next dev indicator, terminals · any local filesystem path ·
anything not in §0.

**Never blur, crop over or paint out real information and keep the file.** If
production or unrecognised data appears, **stop immediately** and report a
suspected isolation incident.

---

## 4. Screenshot handoff

Chrome has **no repository filesystem access**, and none is being granted. Do
not attempt to write into the repository and do not claim a path you cannot
verify.

Capture with your own screenshot facility and report, per artefact: the capture
ID, the canonical filename it must take, the storage identifier your tooling
returned, the pixel dimensions, and your safety-inspection result.

**Leaving captures in your tool's storage is correct.** VS ingests from there.

```
01-source-note.png   02-extraction-result.png   03-form-before-save.png
04-draft-record.png  05-lifecycle-list.png
```

Destination, for information only: raw evidence → `docs/evidence/maxpromo-os/`.
**Raw evidence never goes into `public/`.** Public derivatives are created only
after publication review, which has not happened.

**Ingestion is by explicit identifier only.** No "newest file" logic exists
anywhere in this pipeline, and the operator's personal screenshot folder is out
of scope and must not be read. That rule exists because the earlier
take-the-newest-file approach would have copied private personal data into a
committed evidence directory.

---

## 5. Rendered browser QA

No static gate substitutes for rendered observation. `curl`, HTML inspection,
`audit:a11y` and `check:responsive` have all run clean and none of them can see
overflow, clipping, overlap, tap-target size, wrapping, focus rings or dead
space.

### Viewport matrix — exact pairs

```
320 × 568     360 × 640     390 × 844     430 × 932
768 × 1024    899 × 900     901 × 900     1024 × 768
1099 × 900    1101 × 900    1280 × 800    1440 × 900
1456 × 900    1920 × 1080
```

**899/901 and 1099/1101 are not arbitrary.** The stylesheets' real breakpoints
are 420, 640, 720, 760, 768, 860, 900, 1000, 1024, 1100 and 1200 px; **900 px is
used 17 times and 1100 px 5 times**, the two dominant breakpoints in the
codebase. Layout changes there, so defects hide there.

### Routes, both locales

Homepage · What We Do (`/solutions`) · Workflow Automation ·
Custom Applications · Work · Contact · About · localized 404
(`/de/no-such-page-qa`, `/en/no-such-page-qa`)

**Plus every route added on 2026-09-25**, all DE and EN:

```
/friction-check
/resources/what-to-automate-first
/solutions/web-development
/solutions/content-operations
/solutions/product-operations
```

That is five new routes in both locales. All five are server-rendered apart
from the Friction Check, which is interactive end to end and is the one that
most needs rendered observation: six question screens, a progress bar, radio
groups, and two different result shapes.

**Exercise the Friction Check's honest path explicitly.** Answer the first
option on all six questions. The result must say the visitor may not need
Maxpromo. If it names a friction pattern instead, that is a P1 — the page's
whole credibility rests on that outcome being reachable.

**Full matrix on:** Homepage, Workflow Automation, Work, Contact, Friction
Check. Representative coverage (390, 901, 1440) elsewhere, including all three
new capability pages and the guide.

**Two things to look at specifically on the new pages.** The capability pages
carry a reserved `ScreenshotSlot` proof position — confirm it renders as an
intentional placeholder and has not collapsed. And the guide is a long single
column of German prose: check it does not overflow at 320 and that the two
lists stay legible.

Legal pages: navigate to confirm they load and are not visually broken. **Do not
assess their content** — they are locked, and their identical bilingual
`<title>` is deliberate.

### Inspect

Header and navigation · contained hero · heading scale (**flag oversized
headings returning**) · typography consistency · dead space · section rhythm ·
text and **CTA wrapping, especially German at 320–390** · horizontal overflow ·
image placeholders present and not collapsed · diagrams rendering · mobile
stacking · tablet and desktop layout · hover, focus and active states · language
leakage · clipping · overlap · dead controls · **any orange** (retired; emitted
CSS is clean, so orange on screen would be new) · mobile navigation · 200% zoom.

---

## 6. Interaction QA

**Safe, do freely:** navigate every public route · click internal links and
confirm destinations · open and close mobile navigation · switch language and
confirm the route is preserved · open and close modals · `Escape` to close ·
keyboard traversal with `Tab`/`Shift+Tab` · confirm focus visible, order
logical, and trapped inside an open modal · hover states · `Enter` on a focused
link · back/forward · refresh · 200% zoom · **read-only** navigation of `/os`,
`/os/clients`, `/os/angebote`, `/os/invoices`, `/os/jobs`, `/os/leads`,
`/os/newsletter`, `/os/inbox` · open existing `EVD-` detail views · confirm
empty states read sensibly · complete the Friction Check including the
low-friction path, which must say the visitor may not need Maxpromo.

**Evidence workflow, once only:** the Capture 1–4 sequence ending in a single
`Speichern`.

**⛔ Never:** any send control (`Senden →`, `Rechnung senden`) — evidence mode
suppresses delivery, but a suppressed send still flips a record to `sent` and
destroys the lifecycle · submit the public contact form · subscribe to the
newsletter · delete anything · edit `EVD-2026-0007`, `EVD-2026-0004` or
`EVD-2026-0001` · change any status · create anything beyond the single Capture
4 save · trigger `alert`/`confirm`/`prompt`, which block all further browser
events · enter a password · visit any external site except a neutral control
page for tooling diagnosis.

---

## 7. Defect classification

| | |
|---|---|
| **P0** | Security or data exposure · destructive behaviour · isolation failure · unusable authentication |
| **P1** | Core workflow broken · major route unusable · save/create broken · serious mobile failure · persistent 500 |
| **P2** | Real functional or responsive defect with a workaround |
| **P3** | Polish, minor visual inconsistency, non-blocking UX |

Tag each: `FUNCTIONAL` `RESPONSIVE` `VISUAL` `ACCESSIBILITY` `PERFORMANCE`
`NETWORK` `I18N` `EVIDENCE` `SECURITY`.

Every defect carries: route · locale · **exact viewport W × H** · reproduction ·
observed · expected · screenshot reference · reproducibility · **application
defect or browser/tooling defect**.

**A tool failure is not a Maxpromo defect.** Before attributing any hang or
timeout to the application, reproduce it against a neutral third-party page. An
earlier pass found its own failures reproduced on `example.com`, which correctly
cleared the application.

Group by root cause. Do not inflate severity. Do not prescribe code fixes.

---

## 8. QA-02

Previously observed once on the localized 404 page:

```
Uncaught TypeError: Failed to execute 'measure' on 'Performance':
'LocalizedCatchAllPage' cannot have a negative time stamp.
```

Traced to `node_modules/next/dist/client/index.js`. Maxpromo source calls
`performance.measure` nowhere; the catch-all page is four lines calling
`notFound()`.

**Observation only.** Visit both localized 404s, watch the console, report
**`OBSERVED AGAIN`** (with route, viewport, recurrence on reload) or **`NOT
OBSERVED`**. Do not attempt to fix it.

---

## 9. Final report schema

**A.** Browser self-test · **B.** Authenticated environment status and the four
§0 confirmations · **C.** Five captures individually: ID, filename, route,
demonstrated state, PASS/BLOCKED, storage identifier, dimensions, safety result
· **D.** Genuine extraction result: invocation succeeded/failed, actual items,
actual arithmetic, expected vs actual · **E.** Evidence safety per capture and
the marker relied on · **F.** Viewport matrix: one row per viewport × route ×
locale, observed/not observed, result, and **which combinations were not
reached** · **G.** Interaction QA · **H.** Visual findings P0–P3 · **I.** QA-02
verdict · **J.** Browser/tooling failures, separate from application defects,
each with the neutral-page control · **K.** Handoff locations mapped to
canonical filenames · **L.** What VS must do that Chrome cannot · **M.**
Verbatim:

```
NO CODE CHANGED
NOT PUSHED
NOT DEPLOYED
VERCEL UNTOUCHED
NEON CONFIG UNTOUCHED
UNKNOWN-PROVENANCE DB UNTOUCHED
RISK 53 UNTOUCHED
```

---

## Boundaries

No file changes · no push · no deploy · no Vercel · no Neon configuration · no
database access except through the running application · no contact with the
three Risk 53 lead records (there are none in the lab; if any appear, stop and
report) · no proof-requirement transitions · no fabricated screenshot or figure.

**If something cannot be completed, say so and name the reason.** A blocked
artefact honestly reported is worth more than a manufactured one, and a verdict
may not be called green if a core workflow was not testable.
