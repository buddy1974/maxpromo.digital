# SEO and GEO inventory

**Created 2026-09-25, revised 2026-10-06 for the launch candidate, extended
by Iteration 2A (§7–§14, completed 2026-10-07).** The governed SEO record: indexability,
metadata, structured data, sharing, discovery. There is one of these; if a
second appears, one of them is wrong.

Companion documents: `search-intent-map.md` (which page answers which search,
content clusters, editorial backlog), `google-business-profile-draft.md`
(ready for the owner to enter), `seo-owner-actions.md` (only what needs
Marcel's accounts, DNS or a business fact). The rendered head of every sitemap URL is checked by
`npm run audit:seo` (§14).

The site is live on https://www.maxpromo.digital. Iteration 2A is in
production since 2026-10-07 (`0370ab7`), verified live: `audit:seo` against
production, 64 URLs, 0 failures, 0 warnings. Nothing has been submitted to a
search console yet (§13, `seo-owner-actions.md`).

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
| `/impressum`, `/privacy`, `/agb` | INDEX, low priority | in the sitemap; technical metadata since 2A (§12), document text frozen |

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
block and per-post hreflang logic, which is correct; they share
`documentTitle()` and `pageUrl()` since 2A). The legal pages moved to
`pageMetadata()` in 2A (§12).

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

# Iteration 2A — search, discovery and sharing (2026-10-06, completed 2026-10-07)

Audit first, then decisions, then changes, then an adversarial pass. The audit
reads the rendered head of all 64 sitemap URLs (`audit-seo.mjs`), against a
production build. Final state: **0 failures, 0 warnings** — there are no
warnings any more; every rule either protects an invariant or does not exist
(§14).

## 7. Canonical host, redirects, language architecture

Verified on production, read-only, 2026-10-06:

| Request | Result |
|---|---|
| `http://maxpromo.digital/` | 308 → `https://maxpromo.digital/` → 308 → `https://www.maxpromo.digital/` (two hops; Vercel domain configuration, harmless) |
| `http://www.maxpromo.digital/` | 308 → `https://www.maxpromo.digital/` |
| `https://www.maxpromo.digital/` | **308 → `/de`**, for every client (§7a; until 2026-10-07: 307, negotiated) |
| any unprefixed path, e.g. `/solutions` | **308 → `/de/solutions`**, query kept, for every client (§7a) |
| trailing slash, e.g. `/de/about/` | 308 → `/de/about` |
| unknown path | 404 |

`audit:seo` re-proves the trailing-slash 308 and that a tracking query
(`?utm_source=…`) does not change the canonical, on one page of every route
family, every run.

- **Canonical host:** `https://www.maxpromo.digital`, no trailing slash. Every
  canonical, og:url, hreflang, sitemap `<loc>` and JSON-LD URL uses it, built by
  `pageUrl()` in `lib/seo/schema.ts` or `pageMetadata()` in `lib/seo/og.ts` —
  no page types the host by hand.
- **Languages:** `/de/...` and `/en/...`, same path in both. Every page
  declares `de`, `en` and **`x-default` → the German page** (German is the
  default locale and the primary market). The sitemap declares exactly the same
  alternates, including x-default, and the audit fails if head and sitemap
  disagree. Blog posts declare a pair only when the same slug is published in
  both languages (all six are); an article never borrows the other language's
  metadata.
- **Legal pages** are bilingual documents served at both `/de/…` and `/en/…`.
  Each URL is self-canonical with the de/en/x-default pair, a title and
  description in its own language, and the corporate card; the document text
  is unchanged (§12).
- **Bare `/`** and every other unprefixed path are not pages: they are not in
  the sitemap and answer a permanent redirect to the German URL (§7a).
- **robots.txt** allows everything except `/os`, `/api/`, `/demo`,
  `/portfolio`, `/data-deletion`, and names the canonical sitemap. No `Host:`
  line since 2026-10-07: Google and Bing ignore it, and Search Console
  reported it as ignored. No page in
  the sitemap carries `noindex` or `nofollow`, in a meta tag or a header.
- **Sitemap `lastmod`:** none on static routes — the repository records no
  per-page modification date, and the request time claimed every page changed
  on every fetch. Blog entries carry their real publication date.
- **No `keywords` meta.** The hub's root layout used to declare one, naming
  two protected products (RestaurantOS, PrintShopOS) and the retired Joomla
  positioning. Google ignores the tag, Bing reads a stuffed one as spam, and
  protected products are never marketed from the consultancy site. Removed.

## 7a. One URL, one identity — locale routing law (Iteration 2A.1, 2026-10-07)

**What Search Console found.** Google had chosen `https://www.maxpromo.digital/`
as the canonical of the German home page and filed `/de` as "Duplicate, Google
chose different canonical", while the page declared `/de`.

**Root cause, reproduced before any change.** `next-intl` ran with its
defaults. An unprefixed URL answered a **temporary 307** whose destination
depended on the request: `/de…` without Accept-Language or with German, `/en…`
with English — Googlebot included — and a `NEXT_LOCALE` cookie set on every
response steered later visits. A temporary redirect tells Google the source URL
stays the identity, and a destination that changes with the requester gives it
no single target to consolidate on, so it kept `/`. Separately, `next-intl`
emitted HTTP `Link` alternate headers on every page declaring **x-default as the
unprefixed URL** (`/`, `/solutions`), contradicting the page head and the
sitemap, which say `/de…`. No profile ever received unprefixed content as 200:
the duplicate was an identity problem, not a rendering one.

**The law.**

1. A public page exists only at `/de/…` or `/en/…`. Those URLs answer 200 and
   are their own canonical.
2. An unprefixed URL on the hub answers **308 to the same path under `/de`**,
   query string kept — decided in `middleware.ts` from the path alone, before
   `next-intl`. User agent, Accept-Language and cookies take no part, so
   Googlebot, Bingbot, browsers and curl all receive the same answer. Nobody is
   treated specially.
3. No language negotiation and no locale cookie (`localeDetection: false`,
   `localeCookie: false` in `i18n/routing.ts`). A visitor changes language with
   the switcher, which links to the other prefix.
4. **x-default has one destination: the German URL**, declared in exactly two
   places that must agree — the page head (`pageMetadata()`) and the sitemap.
   `next-intl`'s automatic `Link` header is off (`alternateLinks: false`); a
   third source is how the contradiction arose.
5. Machine routes are outside locale routing and answer themselves:
   `/robots.txt`, `/sitemap.xml`, `/api/*`, `/og`, `/_next/*`, static files.
   Product showcase domains keep their own unprefixed routing (unchanged).

**Protected by** `audit:seo` (420 probes per run: every route family's
unprefixed form and prefixed page, under curl, Googlebot, Googlebot with
`Accept-Language: en`, Bingbot, Chrome DE, Chrome EN and a locale cookie;
plus robots, sitemap, an API route, a static image, the favicon and the card
route) and `prove:seo-audit` (70 properties, 12 for routing). Shown red against
the previous production build: 592 findings.

**Legacy URLs** Search Console still knows (`/services`, `/de/services`,
`/de/systems/*`, `/en/systems/*`, `/de/case-studies`, `/ai-websites`,
`/de/contact?system=…`) end at a live canonical page through one or two
permanent 308s; none returns a temporary redirect. No Removals requests:
recrawling the redirects and canonicals cleans the historical state.

**Sitemap "Couldn't fetch".** Investigated, no technical defect: 200,
`application/xml`, UTF-8 without BOM, Brotli-compressed (supported by Google),
29.6 KB, well-formed, 64 unique `https://www` locations, 192 valid
`xhtml:link` alternates, reachable from `http://` and the apex in one 308,
allowed by robots.txt, served identically to Googlebot. Consistent with a newly
submitted sitemap that Search Console has not processed yet; not resubmitted.

## 8. Titles and descriptions

Rules: one deliberate title per page; the brand at most once; a description
that says what the page does for the reader in 70–170 characters; no keyword
lists; no figure the claims registry would not allow on a persuasive page.

**The title budget.** Results pages cut titles at roughly 65 characters.
`documentTitle()` in `lib/seo/og.ts` keeps the `| Maxpromo Digital` suffix
when the result fits, and drops it — not the page's own words — when it would
only be cut off; og:site_name carries the brand to previews either way. It
applies to every page built with `pageMetadata()` and to blog articles, so no
title can exceed the budget, and `audit:seo` fails one that does.

Changed in 2A: the newsletter post no longer carries the brand twice;
`/solutions` names its subject ("Leistungen: Automatisierung, Anwendungen,
Web"); five descriptions that ran past 170 characters were tightened; the
legal pages got their own titles and descriptions per language; the German
case-study metaTitle was shortened to its subject; two English article
descriptions that opened with unsupported population claims ("Thousands of
businesses…", "Most businesses…") now say "Many businesses", as their German
versions already did. Article headlines and bodies are unchanged — the blog is
a governed archive (decision log, "Joomla is demoted, not deleted").

## 9. Structured data — one entity graph

Built in `apps/web/lib/seo/schema.ts`; no page assembles entity markup by hand.

`siteGraph()`, rendered by the locale layout on every hub page (never on
showcase product domains):

| Node | `@id` | Contents |
|---|---|---|
| Organization | `https://www.maxpromo.digital/#organization` | name, url, logo (`/logo.png` with its true size, from the brand registry), description, **addressLocality Essen and addressCountry DE only**, email, contactPoint (the business phone and email published on the Impressum, German/English), founder by `@id` |
| Person | `/#founder` | the founder's name as the About page states it, Founder/Gründer, About-page URL, the published portrait (`lib/founder.ts`, the same constant the homepage renders), worksFor by `@id` |
| WebSite | `/#website` | name, url, languages, publisher by `@id` |

Below it, always pointing at the graph by `@id`:

| Page | Markup |
|---|---|
| five capability pages | `Service` (name and description are the page's own title and meta description — one `meta()` per page feeds both; URL is the canonical; provider `#organization`; no offers) + `BreadcrumbList` |
| six industry pages | `BreadcrumbList` |
| `/work/maxpromo-os` | `BreadcrumbList` (the page shows the "Work" crumb visibly) |
| `/resources/what-to-automate-first` | `Article` (first published 2026-09-25) + `BreadcrumbList`. Author and publisher are the **Organization**: the page names no person as its author, so the markup does not either |
| blog posts | `BlogPosting` (publication date from the post; no `dateModified`, because none is recorded; author and publisher `#organization`, as every post is signed "Maxpromo Digital") + `BreadcrumbList` |

Breadcrumb names are the visible navigation labels, and every item is a
published page; the last item is always the page itself.

**Deliberately absent:**

- **Street address and postcode** — §11.
- **LocalBusiness, geo, openingHours.** Maxpromo Digital is a service-area
  business: the founder works at clients' premises — observing workflows,
  collecting existing forms, configuring and implementing systems on site,
  training staff — and does not receive clients at premises of its own.
  Organization is the truthful type. **Future hybrid model:** when a staffed,
  public office exists and the owner decides to publish it, it is added to
  `siteGraph()` as the Organization's `location` (a `Place` with that address),
  the Google profile switches to showing the address, and nothing else in the
  graph changes — every page already points at `#organization`.
- **areaServed.** The site states no service area; markup may not say more
  than the page. Added together with the About page sentence when the owner
  states one.
- **sameAs.** No public company profile exists yet. Added when the Google
  Business Profile (or another profile) is live.
- **SearchAction** (the site has no search), **offers, prices, Review,
  AggregateRating, FAQPage** (nothing on the site supports them).

`audit:seo` fails on any of these appearing, on a second Organization, on a
dangling `@id`, and on a Service, breadcrumb or article that describes another
page.

## 10. Social and messenger previews

Every published URL, pasted alone into WhatsApp, Facebook, LinkedIn or
Messenger, shows its own title, its own description and an image that loads.
Hierarchy, most specific first:

1. **A page-specific approved image** — `pageMetadata({ image })`.
   - Home and the legal pages → the approved corporate card
     `/images/seo/maxpromo-digital-og.png` (1200×630), read from the brand
     registry through `corporateCard()`.
   - `/work/maxpromo-os` → the public, redacted proof derivative
     `02-extraction-result.png` (1311×752), alt text from the story.
   - Blog posts → their editorial photograph (`featuredImage`). One of them,
     `newsletter.jpg`, is 643×362: above Facebook's 600×315 large-card
     minimum and WhatsApp's thumbnail threshold, below LinkedIn's 1200×627
     recommendation. Approved photography is not regenerated; recorded here
     instead.
2. **The section's generated card** — `/og?title=…&family=…`, from the page
   title and family (capability, industry, work, resource, guide, company).
3. **The approved fallback** — the root layout's corporate card, for any page
   that sets nothing (today: none in the sitemap).

**Canonical sharing law:** a shared link resolves to its canonical URL; og:url
equals the canonical; og:locale is `de_DE` or `en_GB` to match the page;
og:image and twitter:image are absolute on the canonical host and answer 200
with an image; no `localhost`, preview host or local path appears in any head.
`audit:seo` fails on each. What a platform displays from its own cache can only
be refreshed after deployment, in its own debugger (`seo-owner-actions.md`).

## 11. The street address — four categories, kept apart

| # | Where | State |
|---|---|---|
| 1 | Normal commercial pages, chrome, structured data, public images | **Not present.** Footer and About show "Essen · Deutschland/Germany"; the Organization markup carries city and country only; proof images 01 and 02 are redacted (`DERIVATIVES.json`, `evidence:derive`, originals untouched). `audit:seo` fails if the street appears on any non-legal page |
| 2 | Impressum, privacy notice, AGB | **Present, required** (§ 5 DDG; Art. 13 GDPR; contracting party) |
| 3 | Generated commercial documents and document emails | **Present, required** — invoices and quotations must carry the sender's identity and tax number |
| 4 | Publicly fetchable application assets | **Not present since 2026-10-07.** The back-office document screens used to import the letterhead, bank and MoMo details as constants, which compiled the street address, tax number, IBAN and MoMo number into five public JavaScript chunks. They now live in `lib/documents/identity.ts` (server only) and reach the screens through the authenticated `GET /api/os/document-identity` (`private, no-store`; 401 without a session). `check:public-assets` scans the build output after every build and fails on any of those values. Verified end to end in evidence mode: quotation and invoice detail, both live previews, both print pages and both WhatsApp messages render the complete identity |

Whether category 2 should show a business-address service instead of the
current address is a legal decision for the owner (`seo-owner-actions.md`).

## 12. Legal-page technical metadata (resolved 2026-10-07)

Until 2A, `/impressum`, `/privacy` and `/agb` set a static title and
description and nothing else, so they rendered no canonical, no hreflang, an
og:url pointing at the homepage, and `nofollow`. Technical metadata is not
legal copy: each page now builds its head with `pageMetadata()` — own title and
description per language, self-canonical, de/en/x-default, the corporate card
— and the page-level `nofollow` is gone (it made a page linked from every
footer a crawl dead end and protected nothing). Not one word of the documents
changed.

## 13. Search Console, Bing, IndexNow, AI discovery

Ready to the external boundary: canonical host, sitemap, robots, indexability,
schema and metadata all pass `audit:seo` on a production build. What remains
needs the owner's accounts, and is written as exact steps in
`seo-owner-actions.md`.

- **Google Search Console:** a **Domain property** verified by DNS TXT record
  (covers www, apex, http and https at once). No verification token exists in
  the repository and none will be invented; DNS verification needs no code.
- **Bing Webmaster Tools:** import the verified Search Console property — the
  cleanest route, no second verification.
- **IndexNow — evaluated twice, not implemented.** It needs a key file served
  from the site root and a ping on every publish. Google does not use it; Bing
  and Yandex do, and Bing also reads the sitemap. The site publishes a few
  changes a month, and every change ships by deploy, so the sitemap plus Bing
  Webmaster covers discovery without a key to manage. **Revisit when**
  publishing reaches several pieces a week, or Bing Webmaster reports slow
  discovery; then the key is generated by the owner, served as a static file,
  and pinged from the deploy, never from the browser.
- **AI and generative discovery:** no hacks — no `llms.txt` (§5 stands), no
  hidden text for models, no Q&A blocks manufactured for extraction. What a
  machine needs is consistent evidence, and the graph now gives it one company
  (`#organization`, one description in each language), one founder, one
  website, five services each tied to its page, articles tied to their
  publisher, and breadcrumbs that state the information architecture. The
  important pages answer in their prose what problem they address, what
  Maxpromo does about it, what changes afterwards, how the approach works,
  what evidence exists (the OS story) and what to do next (contact or the
  Friction Check). **AI crawlers are allowed** — the site exists to be found
  and quoted accurately, and it publishes nothing a crawler may not read.

## 14. Gates

| Gate | When | What it protects |
|---|---|---|
| `npm run audit:seo` (`packages/tooling/audit-seo.mjs`) | `certify`; needs the web app running | The rendered head of every sitemap URL: required fields, canonical and og:url, html lang and og:locale, robots meta and header, h1, title budget and double brand, description length, duplicates per language, hreflang and x-default, reciprocity, image reachability, the entity graph and every rule in §9, leaks, the street address, URL variants, sitemap truth, robots.txt, and the locale routing law of §7a under seven request profiles. No warnings |
| `npm run prove:seo-audit` | `verify`, offline | Every rule above passes a correct DE/EN page pair and fails its own defect — 70 properties, 12 of them for routing (§7a). A crawler audit that stopped matching cannot pass silently |
| `npm run check:public-assets` | `verify`, after the build | Category 4 of §11 |

### Warning triage (2A start → end)

The first 2A run reported 40 warnings; every one was classified and none
remains.

| Warnings | Class | Resolution |
|---|---|---|
| 24 — legal pages: missing canonical, missing hreflang, og:url = homepage | A, defect | Fixed (§12); the rule is a failure again |
| 2 — Impressum description 56 characters | A, defect | Fixed: page-specific descriptions |
| 12 — blog titles 67–96 characters | A, defect | Fixed by the title budget (§8); one German metaTitle shortened |
| 2 — `/de/work` 66, `/de/work/maxpromo-os` 69 characters | A, defect | Fixed by the title budget |
| — | D, false positive | None found |
