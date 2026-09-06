# ADR-0008 — A domain is an identity, and presentation inherits from it

**Status:** Accepted
**Date:** 2026-09-05

---

## Context

One deployment serves ten public domains. Until v13.0 a host resolved to four
facts:

```ts
{ mode, slug, defaultLocale, useLocalePrefix }
```

That was enough for the page body. `app/[locale]/page.tsx` read `x-mp-mode` and
rendered the product instead of the consultancy home page, and it did so
correctly on all nine product domains. Everything else about a domain was
decided somewhere downstream, by code written when there was only one site.

RC1 measured what "somewhere downstream" produced.

**The head belonged to the consultancy.** `generateMetadata` had no showcase
branch, and the root layout exported a single static `metadata` object with
`metadataBase`, `applicationName`, `og:site_name` and a
`%s | Maxpromo Digital` title template. So restaurant-os.de rendered
RestaurantOS under `<title>Business-Systeme aus Essen | Maxpromo Digital</title>`,
with the Maxpromo social card, and `rel=canonical` pointing at
`https://www.maxpromo.digital/de` — which asks a search engine to treat the
product domain as a duplicate and show the consultancy in its place. All nine
did this.

**robots.txt named the wrong host.** One hardcoded `SITE_URL`, ten domains
serving the result: `restaurant-os.de/robots.txt` declared
`Host: https://www.maxpromo.digital` and pointed crawlers at the consultancy's
62-URL sitemap.

**Every consultancy page answered on every product domain.** The middleware
suppressed Maxpromo chrome on a showcase host but did not restrict which routes
existed there. All sixteen public routes returned 200 on restaurant-os.de;
fifteen rendered consultancy content stripped of the navigation and footer that
carry the legal links. `restaurant-os.de/contact` — the destination of every
call to action on the domain, collecting a full name, a company, an email
address and a telephone number — contained no links at all. No Impressum, no
Datenschutzerklärung, no way back.

**Two domains served a language they did not have.** `pickLocale` returns
`field.en` whenever `field.de` is absent, silently, field by field. PublishingOS
has German for 1 of its 16 localised fields and Drive24 for none, so
publishers24.org/de rendered German section headings around English product
copy under `<html lang="de">` — and a visitor sending no `Accept-Language` was
redirected there by default, because the host's declared `defaultLocale: 'en'`
was only honoured on hosts without a locale prefix.

None of these are separate bugs. They are one missing idea. A domain was a
routing hint rather than an identity, so every surface that needed to know
which property it was serving invented its own answer — and every one of them
invented the same wrong answer, the one that was true when there was only one
site.

## Decision

**A domain is an identity. Everything else inherits from it.**

```
Host → DomainEntry → metadata, routes, languages, legal, robots, sitemap, chrome
```

`packages/config/domains.ts` holds one record per public host. It lives in the
shared package, not in `apps/web`, because `agents.maxpromo.digital` is served
by `apps/bureau` — a registry only one application could see would be the same
duplication one level down. Both applications read the same eleven records.

Four consequences follow, and each closes one of the failures above.

**Metadata is built from the record.** `generateMetadata` in the root layout
resolves the domain and returns that domain's `metadataBase`, site name, title
template and social card. The product home page adds its own title, description
and a canonical that is the product's own address. Nothing anywhere hardcodes
`https://www.maxpromo.digital`.

**Routes are an allowlist, and a path outside it is redirected rather than
404'd.** A product domain serves its product, the conversation about it, and the
operator's legal pages. `restaurant-os.de/about` now answers `308` to
`https://www.maxpromo.digital/de/about`: the page exists and is worth reading,
it is simply not this domain's page, and redirecting keeps every inbound link
alive. The same rule takes `/os` off the nine product domains — `/api/os` is
answered `404` rather than redirected, because a POSTed login that crosses an
origin arrives without its body.

**Chrome belongs to the domain, not to one page on it.** ProductNav and
ProductFooter moved out of `LandingEngine` and into the locale layout, so every
page a product domain serves wears them. The footer links to that domain's own
Impressum and Datenschutz rather than to the hub's, and the cookie notice the
hub showed and the product domains did not now renders on both.

**A domain declares the languages it has, and serves no others.** This is the
whole of the language rule, and it is the only place a mixed-language page can
be prevented — the fallback that produces one is silent by construction, so it
cannot be caught after the fact. `publishers24.org` and `drive24.live` declare
`['en']`. The middleware redirects `/de` to `/`, the locale switcher does not
render, and the sitemap advertises no hreflang the domain would redirect away
from. When the German copy is written, adding `'de'` to one array is the whole
of the change.

## Consequences

**The registry can now lie.** An entry may declare a language the product has
no copy for, an OpenGraph image that is not on disk, a route allowlist naming a
page that does not exist, or a product slug matching nothing. Every one of those
is silent, and every one undoes exactly the failure the registry was built to
prevent. So `packages/tooling/audit-domains.mjs` checks the registry against the
repository rather than trusting it, and runs as gate 2 of `verify`.

Per ADR-0004, all thirteen of its rules were demonstrated failing against a
deliberately broken registry before any of them was believed. The first draft
of the asset rule skipped a domain whose application had no public directory —
and `apps/bureau` had none, so `agents.maxpromo.digital` was the one host the
rule never examined. It reported clean by not looking. That is the ninth time
this repository has found that shape in its own tooling; a missing public
directory is now a finding, and the bureau has a public directory.

**Marketing copy stays out of the registry.** A product's headline and
description live once, in `apps/web/lib/registry/products.ts`. The registry
declares *where* a domain's metadata comes from, not what it says, and the
metadata builder reads the copy from the product entry. The alternative was a
second copy of every product's headline, which is the rule this repository has
broken most expensively.

**Two things the registry declares are not yet wired up.** `analyticsId` and
`chatIdentity` name what each property reports and what context Max is given.
Analytics does not exist yet. Max's context does — and does not arrive: the
middleware matcher excludes `/api/*` except `/api/os`, so the chat routes never
receive `x-mp-slug` and record `productSlug: null` on every session. That is
RC1-08 and belongs to Track B; the registry names the identity Track B will
read, and changes nothing about the assistant.

**Content gaps are counted, not closed.** Nine domains share the company
favicon and use a 1536×1024 product card where a 1.91:1 social card belongs.
Both are asset work rather than code, and the audit reports each one every run
so the number is visible rather than remembered.

## Alternatives considered

**404 unknown routes on a product domain instead of redirecting.** Cleaner as a
statement of isolation, worse for anyone holding a link. A redirect says the
same thing to a crawler — this content lives over there — and says something
useful to a person.

**Keep the four-field host map and fix each surface.** This is what the previous
four sprints did, one surface at a time, and it is why the same defect appeared
in metadata, robots, sitemap, route availability and language independently.
Fixing five symptoms of one missing concept produces five places to forget.

**Give each product domain its own Impressum content.** Rejected: the operating
entity is Maxpromo Digital for every product in the registry, and a second legal
text would be a second thing to keep true. The pages are the operator's,
rendered on the product's domain and under the product's chrome, which is both
accurate and continuous for the visitor.
