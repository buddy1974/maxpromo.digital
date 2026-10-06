# SEO and GEO inventory

**Created 2026-09-25, revised 2026-10-06 for the launch candidate, extended
2026-10-06 by Iteration 2A (§7–§14).** The governed SEO record: indexability,
metadata, structured data, sharing, discovery. There is one of these; if a
second appears, one of them is wrong.

Companion documents: `search-intent-map.md` (which page answers which search,
content clusters, editorial backlog), `google-business-profile-draft.md`
(OWNER REVIEW), `seo-owner-actions.md` (everything that needs Marcel's
accounts). The rendered head of every sitemap URL is checked by
`npm run audit:seo` (§14).

The site is live on https://www.maxpromo.digital since Iteration 1. Nothing
has been submitted to a search console yet (§13).

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

Superseded by §9 (Iteration 2A): one entity graph, no street address.

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

Moved to `seo-owner-actions.md`, which is the one list.

---

# Iteration 2A — search, discovery and sharing (2026-10-06)

Audit first, then decisions, then changes. The audit read the rendered head of
all 64 sitemap URLs (`audit-seo.mjs`). Structural SEO was already sound on
every non-legal page: self-referencing canonicals, reciprocal hreflang, complete
Open Graph and Twitter blocks, share images answering 200, no duplicate titles
or descriptions. What it found is below, with what was done about each.

## 7. Canonical host, redirects, language architecture

Verified on production, read-only, 2026-10-06:

| Request | Result |
|---|---|
| `http://maxpromo.digital/` | 308 → `https://maxpromo.digital/` → 308 → `https://www.maxpromo.digital/` (two hops; acceptable, Vercel domain configuration) |
| `http://www.maxpromo.digital/` | 308 → `https://www.maxpromo.digital/` |
| `https://www.maxpromo.digital/` | 307 → `/de` (locale negotiation; temporary on purpose) |
| trailing slash, e.g. `/de/about/` | 308 → `/de/about` |
| unknown path | 404 |

- **Canonical host:** `https://www.maxpromo.digital`, no trailing slash. Every
  canonical, og:url, hreflang, sitemap `<loc>` and JSON-LD URL uses it.
- **Languages:** `/de/...` and `/en/...`, same path in both. Each page declares
  `de`, `en` and, since 2A, **`x-default` → the German page**: German is the
  default locale and the primary market. Blog posts declare a pair only when
  the same slug is published in both languages.
- **Bare `/`** is not in the sitemap; it negotiates and redirects.
- **robots.txt** allows everything except `/os`, `/api/`, `/demo`,
  `/portfolio`, `/data-deletion`, and names the canonical sitemap.
- **Sitemap `lastmod`:** removed from static routes in 2A. It was the request
  time, so every page claimed to have changed on every fetch — a signal search
  engines learn to distrust for the whole file. Blog entries keep their real
  publication date.

## 8. Titles and descriptions

Rules: one deliberate title per page; the brand once (the template adds
`| Maxpromo Digital`, so a metaTitle must not); a description that says what
the page does for the reader in roughly 70–170 characters; no keyword lists.

Changed in 2A:

| Page | Change | Why |
|---|---|---|
| `/blog/internal-newsletter-system` (DE, EN) | the title no longer ends in the brand twice | the metaTitle carried the brand and the template added it again; `audit:seo` now fails on it |
| `/solutions` | title "What we do" → "What we do: automation, applications, web" / "Leistungen: Automatisierung, Anwendungen, Web"; the card keeps "What we do" | the old title carried no subject a searcher types |
| `/solutions`, `/work/maxpromo-os`, `/friction-check`, `/de/resources`, EN newsletter post | descriptions shortened to ≤170 | they were cut off in results mid-sentence; meaning and the "controlled test environment" qualifier kept |

Left as warnings, deliberately: blog article titles of 71–96 characters (the
archive's own headlines; rewriting them is an editorial decision, listed in the
backlog in `search-intent-map.md`), and `/de/work` at 66.

## 9. Structured data — one entity graph

The locale layout emits one `@graph` on every hub page:

| Node | `@id` | Contents |
|---|---|---|
| Organization | `https://www.maxpromo.digital/#organization` | name, url, logo (`/logo.png`, from the brand registry), description, **addressLocality Essen and addressCountry DE only**, email, contactPoint (the published business phone and email, German/English), founder by `@id` |
| Person | `/#founder` | Marcel Akwe, Founder/Gründer, About-page URL, the published founder portrait, worksFor by `@id` |
| WebSite | `/#website` | name, url, languages, publisher by `@id` |

Below it, built in `apps/web/lib/seo/schema.ts` and always pointing at the
graph by `@id` rather than restating the company:

| Page | Markup |
|---|---|
| five capability pages | `Service` (name and description are the page's own title and meta description; provider `#organization`) + `BreadcrumbList` |
| six industry pages | `BreadcrumbList` |
| `/work/maxpromo-os` | `BreadcrumbList` (the page shows the "Work" crumb visibly) |
| `/resources/what-to-automate-first` | `Article` (2026-09-25, author `#founder`) + `BreadcrumbList` |
| blog posts | `BlogPosting` (date from the post; author and publisher `#organization`, because every post is signed "Maxpromo Digital") + `BreadcrumbList` |

**Deliberately absent:**

- **Street address and postcode.** Maxpromo Digital is a service-area business:
  clients are not invited to premises. The street address appears only where
  the law requires it — see §11.
- **LocalBusiness, geo, openingHours.** No storefront, no published hours, no
  coordinates. Organization is the truthful type. Revisit only if a public,
  staffed business address exists and the owner decides to publish it.
- **areaServed.** The site states no service area; markup may not say more than
  the page. Owner decision (`seo-owner-actions.md`).
- **sameAs.** No public profile has been confirmed as the company's. Add only
  real, owner-confirmed URLs.
- **SearchAction.** The site has no search.
- **Offers, prices, Review, AggregateRating, FAQPage.** Nothing on the site
  supports them. `audit:seo` fails on any offer, price or rating.

## 10. Social and messenger previews

Hierarchy, most specific first:

1. **A page-specific approved image** — `pageMetadata({ image })`.
   - Home → the approved corporate card `/images/seo/maxpromo-digital-og.png`,
     read from the brand registry (`COMPANY_BRAND.openGraphImage`).
   - `/work/maxpromo-os` → the public, redacted proof derivative
     `02-extraction-result.png` (1311×752), alt text from the story.
   - Blog posts → their editorial photograph (`featuredImage`).
2. **The section's generated card** — `/og?title=…&family=…`, from the page
   title and family (capability, industry, work, resource, guide, company).
3. **The approved fallback** — the root layout's corporate card, for any page
   that sets nothing.

**Canonical sharing law:** a shared link resolves to its canonical URL; og:url
equals the canonical; images are absolute on the canonical host; no
`localhost`, preview host or local path appears in any head. `audit:seo` fails
on each of these. Blog posts now declare `og:site_name` and `en_GB`, matching
the rest of the site.

**Checking a preview:** `npm run audit:seo` proves every og:image answers 200
with an image. What a platform actually displays can only be checked against
the live URL in that platform's own debugger — owner action after deployment.

## 11. The street address

Removed in 2A from: the global footer (now "Essen · Deutschland/Germany"), the
About page company details (city and country), the Organization JSON-LD, and
proof images 01 and 02 (the sender block of the quotation preview), through
`DERIVATIVES.json` and `evidence:derive` — originals untouched, redactions
checked by eye, alt texts say what is covered.

Still present, **correctly**: the Impressum (§ 5 DDG requires a serviceable
address), the privacy notice (Art. 13 GDPR, controller identity), the AGB
(contracting party), and transactional emails — none of them part of the
repeated chrome. Whether that address should be replaced by a business-address
service is a legal decision for the owner (`seo-owner-actions.md`), not an
engineering one.

`audit:seo` fails if the street appears on any rendered page outside those
three legal pages.

## 12. Known, recorded, not fixed: legal-page metadata

`/impressum`, `/privacy` and `/agb` (DE and EN) render **no canonical, no
hreflang, and og:url = the homepage**, because they set no metadata of their
own and inherit the root layout's. Classified **low severity** (the pages are
indexable and in the sitemap; Google self-canonicalises; legal notices are not
shared) and **frozen** — legal pages change only on explicit authorisation. The
fix is one `pageMetadata()` call per page and touches no legal copy; it waits
for that authorisation. `audit:seo` reports these as warnings on every run so
they stay visible.

## 13. Search Console, Bing, IndexNow, AI discovery

- **Google Search Console:** not verified. No verification token exists in the
  repository and none will be invented. Recommended: a **Domain property
  verified by DNS TXT record** (covers www, apex, http and https at once), done
  by the owner at the DNS provider. Then submit
  `https://www.maxpromo.digital/sitemap.xml`.
- **Bing Webmaster Tools:** not verified. Simplest path: import the verified
  Search Console property.
- **IndexNow — evaluated, not implemented.** It needs a key file served from
  the site root and a ping on every publish. Google does not use it; Bing and
  Yandex do, and Bing also reads the sitemap. With a few pages changing a
  month, the sitemap plus Bing Webmaster covers the need without a key to
  manage. **Revisit when** publishing reaches several pieces a week, or Bing
  Webmaster reports slow discovery. If adopted, the owner generates the key, it
  is served as a static file, and the ping runs from the deploy, never from the
  browser.
- **AI and generative discovery:** no hacks. No `llms.txt` (§5 stands), no
  hidden text for models, no Q&A blocks manufactured for extraction. What helps
  is already here: server-rendered prose, one clear entity graph, stable URLs,
  honest dates, internal links that explain relationships. AI crawlers are not
  blocked in robots.txt; allowing or blocking them by name is an owner policy
  decision, not made here.

## 14. Gate

`npm run audit:seo` (`packages/tooling/audit-seo.mjs`), part of `certify`.
Needs a running server, like `audit:a11y`. It reads the rendered HTML of every
sitemap URL and fails on: a missing title, description, canonical, Open Graph or
Twitter field; a canonical or og:url that is not the page; duplicate titles or
descriptions within a language; a title carrying the brand twice; hreflang that
is missing, unpublished or not reciprocal, or an x-default that is not the
German page; an og:image that is not an image or not on the canonical host;
JSON-LD that does not parse, a second Organization, an Organization without
`#organization`, a breadcrumb not ending at the page, a Service without the
Organization as provider, any offer, price or rating; localhost, preview hosts
or local paths in the head; the street address outside the legal pages; a
private route in the sitemap; a sitemap URL that is not 200 or is noindex; and
robots.txt missing its disallows or its sitemap line. Legal-page metadata
defects (§12) and lengths are warnings.
