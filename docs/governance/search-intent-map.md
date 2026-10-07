# Search-intent map

**Created 2026-10-06, completed 2026-10-07 (Iteration 2A).** Which page
answers which search. One primary destination per intent, so two of our own
pages never compete for the same query, and no page is written for a search it
cannot honestly answer.

Companion to `seo-inventory.md` (the governed SEO record).

**What this is not.** No search-volume figures appear here. None were measured,
and an invented volume would be a statistic. The seed concepts are how a
business describes the problem and the fix, and the words the pages already
use. They are concepts, not phrases to repeat. Measured demand arrives with
Search Console (`seo-owner-actions.md`); when it does, this map is reviewed
against real queries.

**The identity this map serves.** Maxpromo Digital removes operational friction
by improving how people, processes and technology work together, and builds the
systems that do it. It is not an AI agency, a chatbot company, an n8n agency, a
website agency or an automation freelancer — those are tools or single
capabilities. Every primary destination below starts from the business problem
and its outcome, not from a technology.

---

## 1. Intent classes

| Class | The searcher is… | What the destination must do |
|---|---|---|
| **PROBLEM** | describing a symptom ("same data typed twice", "quotes take too long") | name the problem in their words, then show the way out |
| **SOLUTION** | naming a kind of fix ("Prozessautomatisierung", "internal software") | explain the fix, its limits, where people stay responsible |
| **COMMERCIAL** | looking for someone to do it | say who we are, how we work, how to start |
| **EDUCATIONAL** | wanting to understand before buying | teach without selling; link onward once |
| **PROOF** | checking whether we have done it | show real work, honestly bounded |
| **BRAND** | searching for Maxpromo Digital by name | the entity page and the facts about the company |

---

## 2. The map — one primary destination per intent

German first (primary market), then English.

| Intent | Concepts (DE / EN) | Primary destination | Supporting pages |
|---|---|---|---|
| BRAND | Maxpromo Digital, Maxpromo Essen / Maxpromo Digital | `/` | `/about`, `/contact` |
| COMMERCIAL | Business-Systeme, Systeme für Betriebe, Automatisierung Mittelstand, Prozesse digitalisieren / business systems Germany, systems for small businesses | `/` | `/solutions`, `/contact` |
| COMMERCIAL | Leistungen, was macht Maxpromo / services, what Maxpromo does | `/solutions` | the five capability pages |
| SOLUTION | Prozessautomatisierung, Workflow Automatisierung, Geschäftsprozesse automatisieren, Büroprozesse automatisieren, manuelle Prozesse automatisieren, Kundenanfragen automatisieren / workflow automation Germany, business process automation, business workflow automation, operations automation | `/solutions/workflow-automation` | `/resources/what-to-automate-first`, `/friction-check` |
| SOLUTION | individuelle Software Unternehmen, individuelle Business Software, interne Software entwickeln, Geschäftssoftware entwickeln lassen, Excel ersetzen / custom business software Germany, custom applications for business, internal tools | `/solutions/custom-applications` | `/work/maxpromo-os` |
| SOLUTION | Dokumentenverarbeitung automatisieren, Angebote automatisch erstellen / document automation, quotation from email | `/solutions/workflow-automation` (the capability) | `/work/maxpromo-os` (the proof) |
| SOLUTION | Webentwicklung, Website mit Anfrageformular, Website die Anfragen verarbeitet / web development, website that handles enquiries | `/solutions/web-development` | blog modernisation archive |
| SOLUTION | Content-Abläufe, Social-Media-Prozess, Freigabeprozess Inhalte, Bewertungen beantworten / content operations, social media workflow, content approval | `/solutions/content-operations` | `/industries/hospitality`, `/industries/publishing` |
| SOLUTION | Produktdaten pflegen, Shop-Abläufe, Produktkatalog / product data operations, commerce operations, product catalogue | `/solutions/product-operations` | blog: old shop modernisation (draft) |
| PROBLEM | Daten doppelt eingeben, Insellösungen, Tools reden nicht miteinander, zu viel Handarbeit / retyping data, disconnected tools, too much manual work | `/friction-check` | `/resources/what-to-automate-first`, `/solutions/workflow-automation` |
| PROBLEM | sector + process problem (Praxis, Handwerk, Hausverwaltung, Gastronomie, Verlag, Kanzlei) | `/industries/<sector>` (six) | the one or two capability pages each sector links to |
| EDUCATIONAL | was zuerst automatisieren, Automatisierung Einstieg, KI für Unternehmen — wo sie hilft / what to automate first, where AI helps a business | `/resources/what-to-automate-first` | `/friction-check` |
| EDUCATIONAL | Joomla, WordPress, Legacy-CMS modernisieren / Joomla, WordPress, legacy CMS modernisation | the matching `/blog/<slug>` | `/solutions/web-development` |
| PROOF | Angebot aus E-Mail, KI-gestützte Angebotserstellung mit Prüfung / AI-assisted quotation with human review | `/work/maxpromo-os` | `/work`, `/solutions/custom-applications` |
| PROOF | Referenzen, Arbeiten / work, examples | `/work` | `/work/maxpromo-os` |

**Decisions recorded with the map**

- **"Document automation" has no page of its own.** It is workflow automation
  applied to documents, and its best evidence is the OS story. A separate page
  would compete with both and say less than either.
- **"KI für Unternehmen" goes to the guide, not to a capability.** The honest
  answer to that search is where AI helps and where it does not, which is what
  the guide says; AI is a tool inside every capability, not a capability.
- **Agent Bureau** (`/agent-bureau`) is a product surface with its own
  intents, outside this map.

**Rules that come with the map**

- A new page needs an intent this table does not already give to another page.
  If the intent is taken, improve that page instead.
- No location pages. The company is in Essen and says so, and works at its
  clients' premises; one page per city would be thin pages and an implied
  presence that does not exist. A service area is stated only when the owner
  states it (`seo-owner-actions.md`).
- No tool-name pages (DATEV, Lexware, HubSpot and so on) without a delivered
  integration on record (`seo-inventory.md` §4, known risk 66).
- "KI" and "AI" appear where a page describes AI doing something specific and
  reviewed — never as a keyword.

### Gaps — recorded, not filled with thin pages

| Gap | Why it stays a gap for now | What would close it |
|---|---|---|
| No page explains document automation as a problem (incoming invoices, delivery notes, forms) | The capability page and the OS story cover it as a fix; a problem page needs a real second example | backlog item 2 |
| No English-language proof beyond the OS story | One documented system; client work needs permission | backlog item 5 |
| Sector pages have no sector evidence | No client story per sector is evidenced | backlog item 3 |

---

## 3. Content clusters

Each cluster has one hub; spokes link to the hub and the hub to its spokes,
plus at most one sideways link where a reader would want it next.

| Cluster | Hub | Spokes today | Next real piece (backlog) |
|---|---|---|---|
| **Business process and workflow automation** | `/solutions/workflow-automation` | `/resources/what-to-automate-first`, `/friction-check`, industries healthcare, property, hospitality, professional services | 1, 2 |
| **Custom business software** | `/solutions/custom-applications` | `/work/maxpromo-os`, industries construction, publishing | 4 |
| **Document automation** | `/work/maxpromo-os` (proof) | `/solutions/workflow-automation` | 2 |
| **Operational systems by sector** | `/industries` | six sector pages → their capabilities → the OS story → contact | 3 |
| **Website operations** | `/solutions/web-development` | the Joomla and WordPress archive (`/blog`) | — |
| **AI and agents in business** | `/resources/what-to-automate-first` | `/agent-bureau` (product), capability pages where AI is a step | 1 |
| **Proof** | `/work` | `/work/maxpromo-os` | 5 |

**Internal-link audit (crawled from the production build, 2026-10-07):** every
sitemap URL has at least one inbound link from another page — no orphans.
Every capability page links back to `/solutions`; the OS story to `/work`; the
guide to `/resources` and `/friction-check`; every blog post to `/blog` and to
three capability pages. Since 2A, **every industry page links to the one or
two capabilities its own approach describes** (`lib/industries.ts`,
`capabilities`), in the same "spec" style as its "Meant for" line, so the
path is sector problem → capability → proof (OS story) → conversation:

| Sector | Capabilities, most relevant first | Why, from the sector's own approach text |
|---|---|---|
| Healthcare | workflow automation, custom applications | enquiries from every channel into one view with prepared answers; documentation where the work happens |
| Construction and trades | custom applications, workflow automation | capture on a phone, quote from the job, invoice from the quote |
| Property | workflow automation, custom applications | portal enquiries, an immediate qualifying reply, prospects kept on file |
| Hospitality | workflow automation, content operations | reservations and enquiries across channels; review replies drafted for approval |
| Publishing and media | custom applications, content operations | title status, owner and next step; recorded approvals |
| Professional services | workflow automation, custom applications | structured document requests, time capture, proposals from components |

---

## 4. Editorial backlog — real pieces only, nothing generated

Written by a person, from real work, when there is something true to say. No
article batch is generated, and no piece below is published without the owner.

| # | Piece | Intent | Cluster | Precondition |
|---|---|---|---|---|
| 1 | "Where AI helps a small business, and where it should not decide" | EDUCATIONAL | AI in business; automation | none — reasoning, no figures |
| 2 | "From an email to a document: what document automation actually involves" — the OS review step in plain words | PROBLEM / PROOF | Document automation | taken from the existing OS story and evidence; no new claims |
| 3 | One sector note per industry page, from a real conversation | PROBLEM | Sectors | a real conversation; anonymised with permission |
| 4 | "When a custom application beats a spreadsheet — and when it does not" | EDUCATIONAL | Custom business software | none |
| 5 | A second proof story | PROOF | Proof | a client project with written permission and real evidence |

Rejected, with reasons: city landing pages (thin; implied presence); "best
automation agency" comparison pages (unprovable); FAQ blocks written for
extraction (`seo-inventory.md` §3); English copies of German pages without an
English reader in mind; tool-name landing pages (no delivered-integration
record).
