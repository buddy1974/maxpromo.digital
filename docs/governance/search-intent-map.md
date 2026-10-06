# Search-intent map

**Created 2026-10-06 (Iteration 2A).** Which page answers which search. One
primary destination per intent, so two of our own pages never compete for the
same query, and a page is never written for a search it cannot honestly answer.

Companion to `seo-inventory.md` (the governed SEO record).

**What this is not.** No search-volume figures appear here. None were measured,
and an invented volume would be a statistic. The seed concepts are the words
the business and its clients actually use, taken from the pages as they stand.
Measured demand arrives with Search Console (`seo-owner-actions.md`); when it
does, this map is reviewed against real queries, not before.

---

## 1. Intent classes

| Class | The searcher is… | What the destination must do |
|---|---|---|
| **PROBLEM** | describing a symptom ("same data typed twice", "inbox chaos") | name the problem in their words, then show the way out |
| **SOLUTION** | naming a kind of fix ("Prozessautomatisierung", "custom internal tool") | explain the fix, its limits, where people stay responsible |
| **COMMERCIAL** | looking for someone to do it | say who we are, how we work, how to start |
| **EDUCATIONAL** | wanting to understand before buying | teach without selling; link onward once |
| **PROOF** | checking whether we have done it | show real work, honestly bounded |
| **BRAND** | searching for Maxpromo Digital by name | the entity page and the facts about the company |

---

## 2. The map — one primary destination per intent

Seed concepts are given in German first (primary market), then English.

| Intent | Seed concepts (DE / EN) | Primary destination | Supporting pages |
|---|---|---|---|
| BRAND | Maxpromo Digital, Maxpromo Essen / Maxpromo Digital | `/` | `/about`, `/contact` |
| COMMERCIAL | Business-Systeme, Systeme für Betriebe, Digitalisierung kleiner Betriebe / business systems, systems for small businesses | `/` | `/solutions`, `/contact` |
| COMMERCIAL | Leistungen, was macht Maxpromo / services, what Maxpromo does | `/solutions` | the five capability pages |
| SOLUTION | Prozessautomatisierung, Workflow-Automatisierung, Abläufe automatisieren / workflow automation, automate business processes | `/solutions/workflow-automation` | `/resources/what-to-automate-first` |
| SOLUTION | individuelle Software, interne Anwendung, Kundenportal, Excel ersetzen / custom application, internal tool, client portal, replace spreadsheets | `/solutions/custom-applications` | `/work/maxpromo-os` |
| SOLUTION | Webentwicklung, Website mit Anfrageformular, Website die Anfragen verarbeitet / web development, website that handles enquiries | `/solutions/web-development` | blog modernisation archive |
| SOLUTION | Content-Abläufe, Social-Media-Prozess, Freigabeprozess Inhalte / content operations, social media workflow, content approval | `/solutions/content-operations` | — |
| SOLUTION | Produktdaten pflegen, Shop-Abläufe, Produktkatalog / product data operations, commerce operations, product catalogue | `/solutions/product-operations` | blog: old shop modernisation |
| PROBLEM | Daten doppelt eingeben, Insellösungen, Tools reden nicht miteinander, zu viel Handarbeit / retyping data, disconnected tools, too much manual work | `/friction-check` | `/resources/what-to-automate-first`, `/solutions/workflow-automation` |
| PROBLEM | Branche + Ablaufproblem (Praxis, Bau, Hausverwaltung, Gastronomie, Verlag, Kanzlei) / sector + process problem | `/industries/<sector>` (six) | the matching capability page |
| EDUCATIONAL | was zuerst automatisieren, Automatisierung Kleinbetrieb Einstieg / what to automate first | `/resources/what-to-automate-first` | `/friction-check` |
| EDUCATIONAL | Joomla, WordPress, Legacy-CMS modernisieren / Joomla, WordPress, legacy CMS modernisation | the matching `/blog/<slug>` | `/solutions/web-development` |
| PROOF | Angebot automatisch erstellen, KI Angebotserstellung mit Prüfung / quotation from email, AI-assisted quotation with review | `/work/maxpromo-os` | `/work`, `/solutions/custom-applications` |
| PROOF | Referenzen, Arbeiten / work, examples | `/work` | `/work/maxpromo-os` |

**Rules that come with the map**

- A new page needs an intent this table does not already give to another page.
  If the intent is taken, improve that page instead.
- No location pages. The company is in Essen and says so; one city per page
  across Germany would be thin pages and an implied presence that does not
  exist. A service area is stated only when the owner states it.
- No tool-name pages (DATEV, Lexware, HubSpot and so on) without a delivered
  integration on record (`seo-inventory.md` §4, known risk 66).
- "KI" and "AI" are used where the page describes AI doing something specific
  and reviewed — not as a keyword.

---

## 3. Content clusters

Each cluster has one hub and the pages that hang from it. Internal links run
hub → spoke and spoke → hub, plus at most one sideways link where a reader
would genuinely want it next.

| Cluster | Hub | Spokes |
|---|---|---|
| **Systems for the business** (commercial) | `/solutions` | five capability pages |
| **Where to start** (problem / educational) | `/resources` | `/friction-check`, `/resources/what-to-automate-first` |
| **Sectors** (problem) | `/industries` | six sector pages (today they link to the OS story and to each other, not yet to a capability — see below) |
| **Proof** | `/work` | `/work/maxpromo-os` |
| **Modernising an old website** (archive) | `/blog` | Joomla and WordPress posts → `/solutions/web-development` |

Internal-link audit (2A, crawled from the rendered pages): every sitemap URL
has at least one inbound link from another page — no orphans. Every capability
page links back to `/solutions`; the OS story links back to `/work`; the guide
links to `/resources` and `/friction-check`; every blog post links to `/blog`
and to three capability pages.

**One gap, recorded rather than patched:** the six industry pages link to the
OS story and to the other sectors, but to **no capability page**, so the
problem → solution path a sector reader needs stops there. Which capability
each sector leads to is an editorial judgement (healthcare → custom
applications? workflow automation?) and the industry copy is approved, so the
mapping goes to the owner (backlog item 6) instead of being guessed here.

---

## 4. Editorial backlog — owner decides, nothing is generated

Ideas for real pieces, in priority order. Each one is written by a person, from
real work, when there is something true to say. **No article batch is
generated, and none of these is started without the owner.**

| # | Piece | Intent | Cluster | Precondition |
|---|---|---|---|---|
| 1 | Second guide: "When a custom application beats a spreadsheet — and when it does not" | EDUCATIONAL | Where to start | none — reasoning, no figures |
| 2 | How the quotation system checks its own extraction (the review step, in plain words) | PROOF / EDUCATIONAL | Proof | taken from the existing OS story and evidence; no new claims |
| 3 | Sector notes, one per industry page, from a real conversation | PROBLEM | Sectors | a real conversation to draw on; anonymised with permission |
| 4 | Shorten the 12 blog headlines that run past ~65 characters in results | — | Archive | editorial approval; the URLs stay |
| 5 | A second proof story | PROOF | Proof | a client project with written permission and real evidence |
| 6 | Link each industry page to the one or two capability pages its reader needs next | — | Sectors | the owner names the mapping; one sentence and link per page |

Rejected, with reasons: city landing pages (thin, implied presence); "best
automation agency" comparison pages (unprovable); FAQ blocks written for
extraction (§3 of `seo-inventory.md`); translated copies of German pages under
English URLs without an English reader in mind.
