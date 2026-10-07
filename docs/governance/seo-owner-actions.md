# SEO and discovery — owner actions

**Created 2026-10-06, completed 2026-10-07 (Iteration 2A).** Only what
engineering cannot do: account access, DNS, external platforms after
deployment, and business or legal facts that cannot be inferred. Every
engineering decision has already been made and implemented
(`seo-inventory.md`). No verification token, key or password is ever pasted
into chat, committed, or put in production as a placeholder.

All of these come **after** the Iteration 2A deployment, except 6 and 7, which
can be decided at any time.

| # | Action | Exact steps | Engineering follow-up |
|---|---|---|---|
| 1 | **Google Search Console — Domain property** | search.google.com/search-console → Add property → **Domain** → `maxpromo.digital` → copy the TXT record → add it at the DNS provider for `maxpromo.digital` → back in Search Console, **Verify** (DNS can take a few hours) | none — DNS verification needs no code |
| 2 | **Submit the sitemap** | Search Console → Sitemaps → enter `https://www.maxpromo.digital/sitemap.xml` → Submit. Expect 64 URLs discovered | none |
| 3 | **Inspect representative URLs** | URL Inspection → test live and request indexing for: `https://www.maxpromo.digital/de`, `/en`, `/de/solutions/workflow-automation`, `/de/industries/construction`, `/de/work/maxpromo-os`, `/de/resources/what-to-automate-first`. Check "User-declared canonical" equals the URL | report anything unexpected |
| 4 | **Monitor** | weekly for the first month: Pages (indexing) report for excluded URLs; Enhancements for Breadcrumbs; Performance for the first real queries | review `search-intent-map.md` against real queries after ~3 months |
| 5 | **Bing Webmaster Tools** | bing.com/webmasters → sign in → **Import from Google Search Console** → select `maxpromo.digital`. The sitemap comes with it | none |
| 6 | **Google Business Profile** | follow `google-business-profile-draft.md`: service-area business, address hidden, categories picked from Google's list, description and services as written. Supply the two OWNER FACTs: verification address, service area | add the service area to the About page and markup; add the profile URL to `sameAs` |
| 7 | **Maxpromoprint profile** | decide keep / close / rename (draft §8), in Google's interface, before verifying the new profile | none |
| 8 | **Legal address** | decide, ideally with a lawyer, whether the Impressum, privacy notice, AGB and documents keep the current address or use a business-address service (ladungsfähige Anschrift) | one change in `@maxpromo/config`; every legal page, document and email follows |
| 9 | **Refresh share previews** after the deploy | Facebook: developers.facebook.com/tools/debug → `https://www.maxpromo.digital/de` → **Scrape Again**; repeat for `/en` and `/de/work/maxpromo-os`. LinkedIn: linkedin.com/post-inspector → same URLs. WhatsApp refreshes on its own within days | none |
