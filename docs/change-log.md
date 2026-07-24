# Change Log

## 2026-07-10 — Public MVP completion sprint (Sonnet implementation)

Full report: see `public-mvp-completion-sprint-report.md` delivered alongside this session (not checked into the repo automatically — copy it into `docs/` if you want it version-controlled).

- Fixed broken homepage pain-card images (`components/homepage/PainCardsClient.tsx`) with a graceful gradient/icon fallback instead of a 404 — no approved photography exists yet for these 6 cards.
- Refactored 7 product pages (`care-os`, `handwerk-os`, `praxis-os`, `printshop`, `publishing-os`, `real-estate-os`, `restaurant-os`) from client-side `useLocale()` to the server `params.locale` pattern already used by `taxkontrol/page.tsx`. Extracted client-only contact forms into standalone components receiving `locale` as a prop.
- Localised `components/systems/ConnectedSystems.tsx` and `components/CookieBanner.tsx` (both were previously English-only / bilingual-simultaneously).
- Fixed "Kühenrouting" → "Küchenrouting" typo on restaurant-os; removed stray UK/auction-specific copy on real-estate-os.
- Added `metadataBase`, `app/sitemap.ts`, `app/robots.ts`, and `generateMetadata` to 12 previously-bare pages (homepage, products index, 8 product pages); added metadata-only `layout.tsx` wrappers for 4 client-component routes (contact, discovery, estimate, portfolio — portfolio is `noindex`).
- Hardened lead-capture API routes: per-channel failure isolation, rate limiting (in-memory, per-IP), input length caps — `audit`, `diagnostic`, `newsletter/subscribe`, `max-agent/submit`, `estimate`, `estimate/send`, `discovery/estimate`, `discovery/send`.
- Security: `portfolio/auth` now rate-limited with constant-time (SHA-256 + `timingSafeEqual`) comparison instead of `===`; `os/login` rate-limited (core session logic untouched); newsletter honeypot added server-side.
- Fixed a mobile grid-overflow bug on `app/[locale]/estimate/page.tsx` below 480px.

No commits/pushes/deploys performed. Build/typecheck/lint could not be run trustworthily in-session — see known-risks entry below.
