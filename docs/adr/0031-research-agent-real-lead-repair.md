# ADR-0031 — Research Agent on messy real sites: facts, inferences, opportunities; two dimensions; three verdicts

Date: 2026-10-26
Status: **Accepted (owner brief "Research Agent real-lead forensic repair"); implemented; production
acceptance in `docs/architecture/agent-bureau.md` §10.** Amends ADR-0027 §2 (research and
qualification) and ADR-0030 (the Research Agent's result contract).

## Context — the first real prospect

Marcel identified a real prospect, a surgical practice in Essen (`http://www.mediza-chirurgie.de/`), and
started the Research Agent through Universal Max. Production work `61583a68…` (Bureau `agent_work`,
OS `os_agent_work`, lead `a5a1f417…`) completed in 7.1 s: **28/100, not qualified, confidence low,
recommendation "check it yourself", no evidence shown**. That result is kept as recorded.

### Forensic trace (what production actually did)

| Step | What happened |
|---|---|
| robots.txt | 404 → allowed |
| home page | 200, 1 036 bytes, `text/html` with **no charset**; the page declares `windows-1252` only in `<meta http-equiv>`; last modified 2009 |
| markup | a Microsoft FrontPage 6.0 **frameset**: `head.htm`, `buttons.htm` (navigation), `main-chirurgie.htm` (content), `unten.htm` (footer) |
| text extraction | only the `<noframes>` fallback: "Diese Seite verwendet Frames. Frames werden von Ihrem Browser aber nicht unterst�tzt." (108 characters, umlaut broken — bytes decoded as UTF-8) |
| page discovery | no `<a href>` on the shell → **no further page read**; the frames were never fetched |
| "empty" check | 108 ≥ 80 characters → treated as a read site |
| signals | no mailto, no tel, no viewport, generator FrontPage 6.0, no copyright year (it is in the footer frame) |
| model | `claude-sonnet-4-6` via the OS gateway, 6.7 s; it said, correctly, that the frames hid all content; it proposed 1 claim (rejected: quote not on the page) and an angle "the site is not usable in modern browsers" — **false and unverified, and shown** |
| qualification | fit +15, no booking tool +10, not mobile +8, no HTTPS +5, **no email −10** = 28; caveats no evidence, 1 rejected, one page → confidence low |
| result | verdict "not qualified" next to recommendation "review" — two messages that contradict each other |

What was on the site all along (the frames, decoded properly): the telephone-only rule for
appointments and enquiries (stated on the home frame and on the office-hours page), three named
physicians, the published practice email (a `mailto` on another domain of the medical centre), the
services list, office hours, "© 2009", HTTP only (HTTPS fails at the TLS handshake).

### Where the information disappeared

**At the fetch (B: the extractor never supplied it).** The model did not miss it, verification did not
reject it, the result transformation and the screens did not drop it: it never reached them. Three
further defects compounded it: the scoring treated *not seen* as *absent* ("no email −10", "no booking
+10" over one fallback paragraph); an unverified model sentence (the angle's "why") reached the
screen; and confidence and verdict were one dimension shown twice.

## Decisions

1. **Read messy sites as browsers do, without weakening anything.** Same-site `<frame>`/`<iframe>`
   documents of a frameset home page are read as the home page (at most four, nested once; third-party
   frames never). Bytes are decoded by the declared charset (header, `<meta charset>`,
   `<meta http-equiv>`); undeclared non-UTF-8 bytes as Windows-1252. Source line breaks are spaces.
   Links count when quoted, unquoted or image-map, with their text or image alt. The copyright year
   is read with markup between the sign and the year. Every request still passes the public-host
   check per hop, robots, 8 s, 1.5 MB, HTML only; new: 30 s for the whole read, 40 000 characters.
2. **Pages are chosen by use.** One page each of contact, appointments, services, about — most
   useful first — then the rest; three pages beside the home page as before. The Impressum is read
   besides only when nothing read names a way to reach the business.
3. **HTTPS is checked, not assumed.** A site landing on http gets one request to `https://host/`
   (same host check). The FACT is "served over HTTP; HTTPS did not answer". Any inference ("the web
   infrastructure may be outdated") is the model's, labelled as such; nothing says "unsafe business".
4. **Coverage is recorded.** Pages, frames, characters, the kinds of page read, charsets; `thin` when
   a frameset's frames could not be read or there are under 150 characters in all.
5. **Fact · inference · opportunity · unknown** are separate parts of the research shape (version 2):
   facts carry a verbatim quote and URL and are verified by code; code-read signals are facts with
   ids (`S1…`); inferences and opportunities must cite the ids of kept facts or signals — a citation
   resolves only through the model's own ids, so an inference of a dropped fact never lands on the
   fact that now carries its number (found by the end-to-end evidence run); unknowns are questions.
   The angle is the first grounded opportunity; an ungrounded sentence never becomes it. The OS
   re-checks grounding and injection when the result arrives.
6. **One statement, one fact.** Facts quoting one statement (same text, one inside the other, or the
   same words on the same topic) merge, keeping every page that says it; pain points score once per
   topic.
7. **Two dimensions.** *Score* is commercial opportunity; *confidence* is research confidence.
8. **No evidence is not negative evidence.** "No booking tool", "not mobile", "no email" and "no
   angle" apply only where the place they would be was read; otherwise they score nothing and become
   unknowns. A published address on another domain is a thing to check (±0), no longer "no email −10".
   Verified absence keeps its points (contact page read, no address → −10).
9. **Three verdicts.** `qualified` (score ≥ 50, confidence medium/high) · `review` (confidence low or
   injection: we do not know enough to say no) · `not_qualified` (read enough, does not fit). Low
   confidence never reads as "not qualified". `qualified` stays the stage rule.
10. **Uncertainty becomes a plan.** The recommendation comes with what to check: code unknowns first,
    then the open questions the pages raised.
11. **Business information only.** The task forbids inferring anything about patients, conditions,
    volumes, finances or quality of care, and listing employees.
12. **A rerun never erases the earlier result.** The finished research it replaces is kept on the lead
    as one line of history (`research.site_history`, five at most); the full earlier findings stay in
    the Bureau work record, the OS work summary and the timeline.

## Rejected

- Rules tuned to this prospect (old website +n, HTTP sites, surgeries, Essen). No threshold changed.
  The full read scores 57 under the rules as they were before this ADR (fit, telephone-only pain,
  the angle, no booking, not mobile, no HTTPS, stale, and −10 for the off-domain address).
- Following every link (a crawler). Four frames and three chosen pages.
- A headless browser for legacy sites. HTML frames need no JavaScript; a JavaScript-only site is still
  reported as unreadable.

## Consequences

- Research findings version 2; version 1 records parse and display as they were decided.
- Proofs: lead research 69 (was 35), agent work 47 (was 44), end-to-end evidence 59 (was 57), lead
  workflow evidence 44; the stand-in model answers in the new shape.
- Risks 172–175 (`docs/governance/known-risks.md`).
