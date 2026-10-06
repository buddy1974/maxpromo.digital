# SEO and discovery — owner actions

**Created 2026-10-06 (Iteration 2A).** Everything search, discovery and sharing
need that only Marcel can do: accounts, DNS, legal decisions, editorial
decisions. Engineering cannot do these and must not pretend to. No
verification token, key or account detail is ever pasted into chat or committed
as a placeholder.

| # | Action | Where | Unblocks | Engineering follow-up |
|---|---|---|---|---|
| 1 | **Verify Google Search Console** as a *Domain property* by DNS TXT record | DNS provider + search.google.com/search-console | coverage reports, real query data, the search-intent review | none — DNS verification needs no code. If an HTML-tag method is chosen instead, the token goes in an environment variable, never in source |
| 2 | **Submit the sitemap** `https://www.maxpromo.digital/sitemap.xml` | Search Console → Sitemaps | faster discovery of all 64 URLs | none |
| 3 | **Bing Webmaster Tools** — import the verified Search Console property | bing.com/webmasters | Bing and Copilot discovery | none |
| 4 | **Google Business Profile** — review `google-business-profile-draft.md`, then create it as a service-area business with the address hidden | Google's interface | local and brand results | add the profile URL to `sameAs` once live |
| 5 | **Old Maxpromoprint profile** — decide: keep, close, or ask Google support | Google's interface | avoids a duplicate-profile flag | none |
| 6 | **Impressum / privacy / AGB address** — decide whether the street address stays, or a business-address service (ladungsfähige Anschrift) replaces it. Legal advice recommended | lawyer / owner | removes the last public street address | a config change in `@maxpromo/config`, on explicit authorisation |
| 7 | **Authorise the legal-page metadata fix** (canonical, hreflang, og:url; no copy change) | reply in chat | clears the 24 recorded warnings in `audit:seo` | three `pageMetadata()` calls |
| 8 | **Service area** — state it (city, region or country) | reply in chat | GBP service area, About page, `areaServed` in markup | add to About and markup together |
| 9 | **Public profiles** — confirm any real company profile URLs (LinkedIn, etc.) | reply in chat | `sameAs` in the Organization markup | one line |
| 10 | **Re-scrape share previews** after the next deploy: Facebook Sharing Debugger, LinkedIn Post Inspector; WhatsApp refreshes on its own over time | the platforms' debuggers | the new home card and OS-story image replace cached ones | none |
| 11 | **AI crawler policy** — decide whether any AI crawler should be blocked by name | reply in chat | — | robots.txt lines, if decided |
| 12 | **Industry → capability mapping** (backlog item 6 in `search-intent-map.md`) | reply in chat | completes the sector → solution path | one link per industry page |
| 13 | **Long blog headlines** — approve shortening 12 titles past ~65 characters | reply in chat | clean result snippets | metaTitle edits only; URLs unchanged |
| 14 | **Integration rail** (known risk 66) — confirm the tool list | reply in chat | — | remove any tool not confirmed |
