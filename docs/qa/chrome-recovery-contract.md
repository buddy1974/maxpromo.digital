# Chrome recovery contract — Captures 2, 3 and 4

**Status: BLOCKED ON OWNER BILLING. Do not start this run yet.**

Short by design. The full contract in `chrome-execution-contract.md` still
governs everything not restated here; rendered public-site QA is **done** and is
not repeated. This covers three artefacts and nothing else.

---

## Do not start until this is true

The previous run failed because the AI provider account **could not be
charged** — HTTP 400, `invalid_request_error`, *"Your credit balance is too low
to access the Anthropic API"*, identically on every model. The credential is
valid. The account is empty.

**Precondition:** credit added at `console.anthropic.com`.

**One-line check before anything else.** Open `/os/angebote/new`, click
`KI-GENERIERUNG`, paste the source from §2 below, click
`Mit KI generieren →`, and see whether it returns. If it fails again, stop and
report the class — the route now reports one, and the class is the finding.

Captures 1 and 5 are **not** repeated. They passed, and nothing since has
invalidated them.

---

## What changed since the last run

**The route now classifies its failures.** Where it previously answered 502 for
everything, it now returns a `klass` — `CONFIGURATION`, `AUTHENTICATION`,
`BILLING`, `MODEL`, `RATE_LIMIT`, `REQUEST`, `PROVIDER` or `RESPONSE` — and a
billing problem answers **503**, not 502. If extraction fails again, **report
the `klass` and the HTTP status**; that is far more useful than the message.

**Opening the form no longer consumes a quotation number.** It used to: three
page loads took the sequence 010 → 012 → 014. Reading is now a preview.
**The number shown on the blank form is a preview and may differ from the one
the saved document receives.** That is expected. Capture 4 must report the
number the *saved quotation* actually has, not the one the form displayed.

**The evidence lab is back at its canonical baseline:** one Beckmann client,
`EVD-2026-0007` draft, `EVD-2026-0004` sent, `EVD-2026-0001` paid, nothing else.

---

## Preflight

Confirm all four, and stop if any is false:

- evidence mode armed
- `/os` reachable without a login prompt
- visible client is **Beckmann Elektrotechnik GmbH**
- document numbers begin `EVD-2026-`

Window **1456 × 1010** for all three. Nothing in frame but the application. The
operator's own name will appear in the OS chrome; that is expected and is not
disqualifying.

---

## §2 · The source text

Paste exactly. Invented; no real person or company.

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

Expected: 1 × 2.400,00 · 48 × 12,50 = 600,00 · 1 × 380,00 · **total 3.380,00**.

**If the result differs, capture what actually happened and report it.** Never
edit a field toward the expected answer. The extraction must genuinely run;
manual entry may never be presented as extraction.

---

## Capture 2 · `os-extraction-result` → `02-extraction-result.png`

`/os/angebote/new` · **writes nothing**

Click `Mit KI generieren →`, wait (up to 60 s), capture the structured result.

**Proves** unstructured input becomes structured fields.
**Does not prove** the figures are correct, or that a record was created.

## Capture 3 · `os-form-before-save` → `03-form-before-save.png` — the hero

Same page, continuing. **Writes nothing, and that is the point.**

Dismiss the panel. Frame the populated client fields, the three line items, the
total, **and the `Speichern` control, visible and unused**. Do not click it yet.

**Proves** the single most important fact in the package: the system prepares,
and a person still decides. No record exists anywhere at this moment; the
unused save control is what carries that.

## Capture 4 · `os-draft-record` → `04-draft-record.png`

**⚠ The only capture that writes. One save, maximum.**

Click `Speichern` once. Capture the saved quotation on its detail view, status
**draft**. **Report the document number it actually received.**

**Proves** a record exists and has not been sent.
**Does not prove** it was ever sent or accepted.

Afterwards there will be one additional quotation beside `EVD-2026-0007`. That
is correct and expected. VS resets to baseline.

---

## Never, during this run

Any send control · delete or edit `EVD-2026-0007`, `EVD-2026-0004`,
`EVD-2026-0001` · change any status · save more than once · submit the public
contact form · `alert`/`confirm`/`prompt` · enter a password · production ·
the unknown-provenance database · any personal screenshot folder.

---

## Safety inspection, per capture

Every frame must carry at least one: an `EVD-2026-` number, the client
**Beckmann Elektrotechnik GmbH** / **Katrin Beckmann**, or `Musterhausen` / a
`.example` domain. A frame showing none of those is not verifiably synthetic.

Disqualifying: real customer data · any credential or connection string ·
devtools, terminals, error overlays · notifications, other windows, the taskbar
· any local filesystem path. **Never blur and keep.**

---

## Report

Per capture: ID · canonical filename · **PASS or BLOCKED** · tool storage
identifier · dimensions · safety result.

Plus: whether the provider call succeeded · the actual extracted items,
quantities, prices and total · expected versus actual · **the document number
the saved quotation received** · and, if it failed again, the `klass` and HTTP
status the route reported.

Then verbatim:

```
NO CODE CHANGED
NOT PUSHED
NOT DEPLOYED
VERCEL UNTOUCHED
NEON CONFIG UNTOUCHED
UNKNOWN-PROVENANCE DB UNTOUCHED
RISK 53 UNTOUCHED
```

**A blocked artefact honestly reported is worth more than a manufactured one.**
That is why there are only two passes so far instead of five, and it is the
right outcome.
