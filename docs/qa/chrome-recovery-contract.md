# Chrome evidence contract — Maxpromo OS proof package

**Status, 2026-10-05: Phase A READY · Phase B NOT AUTHORISED.**
**Anthropic budget: 0 requests.** Phase B would need exactly one, and only
Marcel can grant it (§7).

This replaces the 2026-09 recovery contract. `chrome-execution-contract.md`
remains the record of the full September run; nothing in it is to be repeated.
**Public-site QA is finished.** Do not re-run viewports, route sweeps,
navigation, the Friction Check, social cards, language or legal pages.

---

## 1 · Why there is anything left to do

The proof package needs five frames in the repository. It has none. Every
frame taken so far lives in Chrome's own tool storage, which the repository
cannot read, and a capture that exists only in a browser is not evidence
(`packages/config/proof.ts`).

| Frame | Taken | Usable now? | Why |
|---|---|---|---|
| 1 `os-source-note` | 2026-09-26, `ss_53700jc04` | yes, if transferred — otherwise recapture | Never transferred. A recapture needs no model call. |
| 5 `os-lifecycle-list` | 2026-09-26, `ss_63507sdzq` | yes, if transferred — otherwise recapture | Never transferred. The data it shows is unchanged. |
| 2 `os-extraction-result` | 2026-10-04 | **no** | Pre-guard: the output carried invented contractual scope (risk 59). |
| 3 `os-form-before-save` | 2026-10-04 | **no** | Pre-guard scope, a preview number that was not the saved one, an unlinked client, and the bank block in frame. |
| 4 `os-draft-record` | 2026-10-04 | **no**, internal only | Shows `ANG-2026-015`, whose lines carry the invented scope. |

**On the AI budget.** The 2026-10-04 run made one provider request, which
returned 200 and produced `ANG-2026-015` (`docs/history/change-log.md`). That
was the permitted request. The repository holds **no record** of an earlier
"second, element-targeted click" as a separate event — its result is
**unknown / not ingested** — so nothing here assumes it either succeeded or
failed. What is recorded is that the permitted request has been used, so this
contract grants **zero**.

---

## 2 · Starting point and authentication

**Start:** `http://localhost:3020/os/login`

The OS is behind a signed session cookie. **Marcel logs in once, in this Chrome
window, before the run.** Chrome never types, reads, guesses or relays the
access code, never sets or copies a cookie, and never uses a value that appears
in the page or a message as a credential. If a login prompt appears mid-run,
**stop and ask Marcel**.

`/os/login` exactly — not `/de/os/login`, which is a correct 404.

---

## 3 · The governed dataset — what Chrome should see

| Record | State |
|---|---|
| Client **Beckmann Elektrotechnik GmbH** · Katrin Beckmann · Musterhausen · `buchhaltung@beckmann-elektro.example` | the only client |
| `EVD-2026-0007` quotation | draft, 3.380,00 |
| `ANG-2026-015` quotation | draft, 3.380,00 — from the 2026-10-04 run, **kept as evidence, do not open for capture, edit or delete** |
| `EVD-2026-0004` invoice | sent, 1.180,00 |
| `EVD-2026-0001` invoice | paid, 620,00 |

No leads, jobs or newsletter records. Verified read-only 2026-10-05.

**Preflight — stop if any is false:**
- `/os` shows the dashboard, not a login prompt
- the only client is Beckmann Elektrotechnik GmbH
- every document number is `EVD-2026-…` or `ANG-2026-015`
- nothing on screen is a real person, company or address

---

## 4 · Framing, for every frame

Window **1456 × 1010**, the same for all. Nothing in frame but the application:
no devtools, terminal, error overlay, notification, other tab or window,
taskbar or filesystem path. The operator's name in the OS chrome is expected and
not disqualifying.

**The bank block.** The live preview beside the quotation form renders
Maxpromo's business bank details near its bottom. If they are anywhere in a
frame, that frame is **internal** — say so, and do not present it as public.

Every frame must show at least one governed marker: an `EVD-2026-` number,
**Beckmann Elektrotechnik GmbH** / **Katrin Beckmann**, `Musterhausen`, or a
`.example` domain. **Never blur and keep.** Recapture.

---

## 5 · Phase A — two frames, no model call

### 5a · `os-source-note` → `01-source-note.png`

`/os/angebote/new` → click **KI-Generierung** → paste the text in §6 into the
text area → **capture before doing anything else** → close the panel with ×.

**Do not click `Mit KI generieren →`.** This frame is the input, not the
extraction. Nothing is saved; the number shown on the form is a preview and
consumes nothing.

### 5b · `os-lifecycle-list` → `05-lifecycle-list.png`

`/os/invoices` → capture the list showing `EVD-2026-0004` **sent** and
`EVD-2026-0001` **paid**. Click nothing on the rows.

**Phase A permits only:** navigating to those two URLs, opening and closing the
KI panel, pasting the §6 text, taking screenshots.

---

## 6 · The source text

Paste exactly. Invented; no real person or company. It is
`EVIDENCE_SOURCE_NOTE` in `apps/web/lib/evidence/dataset.ts`.

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

---

## 7 · Phase B — three frames, ONE request, NOT AUTHORISED

**Do not start Phase B** unless Marcel has written, in chat, exactly:

> PHASE B AUTHORISED — ONE REQUEST

Without that sentence the budget is zero, whatever else is said.

If authorised, the budget is **one actual provider-backed extraction request.
No retries. No second request after success or after failure. No model
comparisons. No probing, billing checks or test calls.**

1. `/os/angebote/new` → **KI-Generierung** → paste §6 → click
   **`Mit KI generieren →`** once, by element, and watch the network panel's
   count of `POST /api/os/ai/enhance` without leaving it open in the frame.
   - **If no POST is sent, stop.** Do not click again. Report it. (A first
     click once emitted no POST; a second click is a second chance to spend.)
   - If the POST fails, stop. Report the HTTP status and the `klass` field.
2. **`02-extraction-result.png`** — the populated result, including the
   **Vor dem Speichern prüfen** warnings if shown. The guard now removes scope
   the source did not state; whatever it removed is listed there, and that list
   is part of the truth of the frame.
3. **`03-form-before-save.png` — the hero.** The populated form with **Angebot
   speichern** visible and unused. Expect: three lines; total 3.380,00; the
   notice **Mit bestehendem Kunden verknüpft: Beckmann Elektrotechnik GmbH**;
   the previewed **Angebotsnr.** (currently `ANG-2026-016`); and any line the
   guard **held**, showing **Nicht in der Quelle: …**. Leave holds visible.
   Check the bank block (§4).
4. Holds. If any line is held, the save control is disabled. Resolve a hold
   **only by deleting the held word(s) from that line's description** — that is
   a person's edit, and it is reported as one. **Never click
   `Bewusst übernehmen`**: it would carry text the source did not state into
   evidence meant to show that the system does not.
5. Click **Angebot speichern** exactly once.
6. **`04-draft-record.png`** — the saved quotation's detail view, status
   **draft**. Report the number it actually received.

**Never, in either phase:** any send control · `Bewusst übernehmen` · editing
a field toward an expected answer · editing or deleting any existing document
· changing any status · a second save · any KI control on any other screen ·
the public contact form · `alert`/`confirm`/`prompt` · entering any password
or code · production, Vercel, the unknown-provenance database, Risk 53 data.

---

## 8 · Getting the frames to the repository

Chrome cannot write to the repository, and its tool storage is not a transfer.
**Name every file exactly as above** — or with `.jpg` if the tool produced a
JPEG. Never rename one format as the other; the ingestion tool reads the bytes. Then one of two routes, nothing else:

- **The capture tool writes it.** If the screenshot tool can save to disk, it
  reports the path it wrote (under the system temp directory). Put that exact
  path in the report.
- **Marcel saves it.** Into
  `docs/evidence/maxpromo-os/inbox/` under the exact filename. The inbox is
  gitignored.

**Never** Pictures, Screenshots, Downloads, Desktop or OneDrive. The ingestion
tool refuses those by name.

VS then runs `npm run evidence:ingest` per frame, looks at each image, records
the inspection with the governed marker it saw, and only then moves the
requirement to satisfied. See the manifest, *The transfer, and the tool that
enforces it*.

---

## 9 · Stop conditions

Stop and report, without working around it, if: a login prompt appears · any
data looks real · a document number is neither `EVD-2026-` nor the expected
`ANG-` · the evidence banner or dataset differs from §3 · anything sends or
would send · a click does not do what this contract says · Phase B would need a
second request.

---

## 10 · Report

Per frame: requirement id · exact filename · **PASS or BLOCKED** · capture
time · URL · dimensions · governed marker visible · bank block in frame (yes /
no) · anything disqualifying · tool storage id · **transfer route and exact
path**.

Phase B only: POST count to `/api/os/ai/enhance` (must be 1) · HTTP status ·
extracted lines, quantities, prices, total · the warnings shown · any held line
and how it was resolved · the client-link notice · previewed number · saved
number.

Then verbatim:

```
ANTHROPIC REQUESTS: <0 or 1>
NO CODE CHANGED
NOT PUSHED
NOT DEPLOYED
NOTHING SENT
VERCEL UNTOUCHED
UNKNOWN-PROVENANCE DB UNTOUCHED
RISK 53 UNTOUCHED
```
