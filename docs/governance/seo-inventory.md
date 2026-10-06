# SEO and GEO inventory

**Created 2026-09-25, revised 2026-10-06 for the launch candidate.** The canonical route/indexability record. There is one of
these; if a second appears, one of them is wrong.

Local engineering only. Nothing here has been submitted to a search engine, and
nothing can be until the site is deployed.

---

## 1. Indexability by route

Twenty-five public route files exist after the 2026-10-06 consolidation. Every one has a decision, and
`prove:route-governance` fails the build if a route acquires neither a sitemap
entry nor a written exclusion.

### INDEX — the commercial and useful surfaces

| Route | Family | Why it earns indexing |
|---|---|---|
| `/` | company | the entity page |
| `/solutions` | company | what we do, and the hub the five capabilities hang from |
| `/solutions/workflow-automation` | capability | distinct problem, distinct intent |
| `/solutions/custom-applications` | capability | distinct problem — **was missing from the sitemap entirely until today** |
| `/solutions/web-development` | capability | new, Phase E |
| `/solutions/content-operations` | capability | new, Phase E |
| `/solutions/product-operations` | capability | new, Phase E |
| `/industries` + six slugs | industry | genuinely sector-specific reasoning, audited today |
| `/work` | work | the proof surface |
| `/work/maxpromo-os` | work | the flagship proof story: our own system, one quotation, five stages |
| `/about` | company | founder accountability and the company's position |
| `/contact` | company | the conversion page — **had no metadata at all until today** |
| `/friction-check` | resource | the acquisition asset; the one page built to be found |
| `/resources` | resource | the knowledge hub |
| `/resources/what-to-automate-first` | guide | the first guide; citation-ready by design |
| `/blog` + `/blog/[slug]` | resource | the legacy-modernisation archive, see §4 |
| `/agent-bureau` | company | the product's own surface |

### ARCHIVE / DISCOVERABLE — indexed, deliberately not promoted

`/blog` and its slugs. The archive leans heavily on Joomla and legacy
modernisation. It is real work, it holds real search value, and its URLs stay.
What it must not do is define the first impression, which is why Resources
leads with Guides and describes the archive as one of four things rather than
as the page's purpose.

**Not noindexed.** Demoting something from primary positioning is an
information-architecture decision. Removing it from the index would throw away
accumulated value to solve a problem navigation already solves.

### NOINDEX / excluded from the sitemap — with reasons

| Route | Decision | Reason |
|---|---|---|
| `/ai-websites` | REDIRECT | 308 to `/solutions/web-development` |
| `/case-studies` | REDIRECT | 308 to `/work`; rendered figures the claims registry marks unevidenced, one contradicted (decision-log 2026-10-06) |
| `/automation-lab` | REDIRECT | 308 to `/solutions/workflow-automation`; claimed eighteen runtimes with nothing behind the number |
| `/solutions/customer-inquiries`, `/solutions/ai-agents` | REDIRECT | 308 to `/solutions/workflow-automation` |
| `/solutions/websites-platforms` | REDIRECT | 308 to `/solutions/web-development` |
| `/solutions/reviews`, `/solutions/social-media` | REDIRECT | 308 to `/solutions/content-operations` |
| `/services/*` | REDIRECT | 308 straight to the final capability page, no second hop |
| `/portfolio` | NOINDEX | disallowed in robots.txt, superseded by `/work` |
| `/data-deletion` | NOINDEX | disallowed in robots.txt; a compliance endpoint, not a page to find |
| `/[...rest]` | n/a | the localised catch-all; renders 404 and has no URL |
| `/impressum`, `/privacy`, `/agb` | INDEX, low priority | legal pages are in the sitemap and are not touched otherwise |

### OWNER REVIEW

None open. `/case-studies` was resolved on 2026-10-06 by retiring it (see the
REDIRECT table and the decision log).

---

## 2. Technical SEO — what was found and fixed today

| Item | Before | After |
|---|---|---|
| `/contact` metadata | **none at all** — a client component cannot export `generateMetadata` | full block via a segment layout |
| `/friction-check` metadata | **none at all**, same cause | full block via a segment layout |
| Homepage `og:locale` | missing — the hand-rolled block omitted it, despite its own comment warning that setting any of `openGraph` sets all of it | complete, via the shared helper |
| Open Graph coverage | 4 routes of 28 | every adopted route, via `pageMetadata()` |
| OG image | one static PNG for the whole site | generated per page from the page's own title |
| Sitemap | `/contact`, `/impressum`, `/privacy` **duplicated**; `/solutions/custom-applications` **absent** | deduplicated, complete, gated |
| hreflang | present on newer pages, absent on several older ones | emitted by the shared helper wherever it is adopted |

**2026-10-06:** every public commercial route now uses `pageMetadata()` —
About, the six industry pages, Agent Bureau (whose canonical pointed at a
redirecting URL), the blog index, What We Do and Work were migrated. Still
hand-rolled, deliberately: the blog articles (their own `article` Open Graph
block and per-post hreflang logic, which is correct) and the legal pages,
which this build does not touch.

### Schema

The root layout emits `Organization` and `WebSite`, read from
`@maxpromo/config` since 2026-10-06 so they cannot drift from the Impressum,
with the founder as a `Person` and `@id` links between them. The guide
carries `Article` (first published 2026-09-25, author and publisher by
`@id`).

**Nothing further was added, on purpose.** No `FAQPage`, because the site has no
FAQ section any more. No `Review` or `AggregateRating`, because there are no
reviews. No `LocalBusiness` beyond the Organization address, because the
business is one person and a postal address, and richer local markup would
imply premises and opening hours that do not exist. Schema that does not match
the page is worse than no schema.

---

## 3. GEO and citation readiness

The test applied: strip the design, and can a reader determine what this
company is, what the page is about, where humans stay responsible, and what to
do next?

The capability pages and the guide do well on this — they are prose with
headings, the argument is in the text rather than in the layout, and each one
states its own limits ("most businesses do not need a new website"). The
Friction Check does not, because it is an interactive tool and its content only
exists after six answers. That is correct for what it is.

**No Q&A sections were manufactured for extraction.** No "AI" was stuffed
anywhere. Writing for a model at the expense of a reader produces pages that
neither trusts.

---

## 4. German search positioning

Applied where it was already true rather than inserted. The capability and
industry pages describe businesses that already own software whose tools do not
talk to each other — `Insellösung` and `Systemintegration` describe that
honestly where the text reaches for them, and neither is repeated for its own
sake.

**No tool is named.** Not DATEV, not Lexware, not sevDesk, not any shop or ERP.
The repository has no evidence of a delivered integration with any of them, and
naming one to catch its search traffic would be claiming experience the
evidence registry does not support.

No city pages. The company is in Essen and the Impressum says so; that is the
truthful local signal, and "KI Agentur Essen" is not what this company is.

---

## 5. llms.txt — NOT ADOPTED

**Decision: not implemented. 2026-09-25.**

The reasoning, which is the same as the competitive research reached earlier
and has not been overturned by anything in the repository:

`llms.txt` is a proposal for a file describing a site to language models. It is
not a standard, it is not documented as consumed by any major model provider's
crawler, and no measurable retrieval benefit has been demonstrated. Adding it
would be adding a file nobody reads and then maintaining it.

What actually makes a page usable by a model is the same thing that makes it
usable by a person who arrives from search: crawlable prose, a clear entity,
stable URLs, provenance, internal links that explain relationships, and claims
that are either evidenced or absent. All of that is engineering already being
done for its own sake, and all of it pays off whether or not this file ever
becomes a standard.

**Revisit when:** a major provider documents that its crawler reads the file,
or a measured retrieval difference is published. Not before.

---

## 6. What needs the owner or an external account

- **Search Console and Bing Webmaster** — verification, sitemap submission,
  coverage monitoring. Requires deployment and the owner's accounts.
- **Facebook / LinkedIn re-scrape** — the old static card is cached at those
  platforms and will persist until the new one is fetched. That needs a live
  URL and the platform's own debugger.

None of those is engineering work, and none is possible locally.
