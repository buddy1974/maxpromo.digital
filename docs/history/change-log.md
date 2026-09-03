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

## 2026-09-03 - Platform v4.0: brand migration complete on customer-facing surfaces

Branch feature/platform-v4. Six batches, each independently verified with
tsc --noEmit, eslint, next build and browser QA. Full detail and remaining work
in docs/platform-v3/PROGRESS.md.

**B0 - dead code and assets.** Removed 14 unimported components (1958 lines),
including the seven retired V1 landing sections flagged for cleanup in July and
never deleted. Removed 11 dead public assets, among them the five untouched
create-next-app scaffold SVGs. Removed two page files that had been unreachable
behind permanent redirects. Re-encoded 72 oversized images in place: public/
drops from 127 MB to 44 MB, largest asset from 2.5 MB to 0.86 MB, with no
filename or reference changes.

**B3 - design system.** design/tokens/brand.css (two-layer: primitives and
semantics) plus design/tokens/index.ts (TypeScript mirror for email and PDF,
which cannot resolve custom properties). app/globals.css rewritten - the v2.1
stylesheet carried 26 raw hex values, 12 rules hardcoding the orange, and 22 CSS
classes with no remaining consumers. One typography scale; 684 inline font
declarations removed from 131 headings so they inherit it. 218 accent-coloured
text elements neutralised, 214 instances of the slash-slash label motif retired.
Hero rebuilt as a server component with the new Operations Center panel; the
problem grid rebuilt as a hairline reference grid with no cards, icon tiles or
pills.

**B4 - showcase engine.** The second design system retired: --brand-* in the
landing engine renamed to --showcase-*, and the surfaces unified onto platform
tokens. Two-tier brand implemented. VG-01/02/03 retired in code and comments.

**B5 - documents and email.** 158 hardcoded values across invoices, quotations,
print CSS and every transactional email template moved onto the token module.
Accent-as-text separated from accent-as-fill, without which invoices would have
become illegible at Brand Lime.

**B6/B9 - the brand.** 195 orange literals under app/os unified, then the
transitional block deleted. Every surface moved to Brand Lime from one file.
Primary buttons switched from white to black text automatically, because the
rule lived in the token rather than at the call sites.

**Microcopy.** Site and homepage metadata rewritten from AI-first positioning
("AI Business Systems & Automation Infrastructure") to the consultancy framing
("Business Systems, Built in Essen").

## 2026-09-03 — Track B: platform unification

Two repositories became one. `maxpromo.digital` is now `maxpromo-platform`:
`apps/web`, `apps/bureau`, and four shared packages.

- **B1** Architecture frozen and documented (`docs/architecture/platform.md`).
- **B2** Agent Bureau merged via `git subtree`, preserving its 32 commits.
  Workspace root created; duplicated root configuration removed. Twelve shared
  dependencies aligned to one specifier each, which fixed a duplicate `next`
  install and surfaced eight genuine react-hooks defects, all fixed.
- **B3/B4** `packages/design-tokens`, `tooling`, `config`, `ui`. Legal identity
  merged from two disagreeing copies. Eleven dashboard status maps replaced by
  one tone system.
- **B5** Five component classes declared in both stylesheets moved to
  `@maxpromo/ui/components.css`. Parity verified against computed styles in
  both running applications.
- **B6** One documentation tree. Agent Bureau's separate docs, PLAN.md and
  CLAUDE.md consolidated; risk registers merged.
- **B7** Separate Vercel projects with selective rebuilds; settings documented.
- **B8** CI verify workflow and a pull request template carrying the gates that
  need judgement.
- **B9** Validation: zero duplicate files, tokens, components, docs or orange.

Deferred with reasons: `apps/os` extraction (needs `packages/shared` first, and
its own domain and Vercel project); one database and one auth session (both
separate pieces of work, recorded in ADR-0001).
