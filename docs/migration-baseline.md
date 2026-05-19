# Maxpromo Digital — Migration Baseline

**Snapshot date:** 2026-05-19  
**Git tag:** `ecosystem-baseline-v1`  
**Commit:** `13c73f3b75a2c7fbab5abff8641d2c914f403ee6`  
**Branch:** `main`

> Rollback: `git checkout ecosystem-baseline-v1`

---

## Build Status

| Check | Result |
|---|---|
| TypeScript | ✓ No errors |
| Build | ✓ Compiled successfully (7.2s) |
| Static pages generated | 91 pages |
| Locale parity (EN/DE) | ✓ 673 keys each |
| Next.js version | 16.1.6 (Turbopack) |
| React version | 19.2.3 |
| next-intl | ^4.12.0 |
| framer-motion | ^12.38.0 |
| TypeScript | ^5 |

---

## Bundle Size

| Asset | Size |
|---|---|
| Total `.next/` output | 18.63 MB |
| Static assets | 1.78 MB |
| Server output | 15.84 MB |

---

## Known Warnings at Baseline

- `middleware` file convention deprecated → should migrate to `proxy` convention
- Multiple lockfiles detected (workspace root ambiguity)
- No Turbopack `root` set in `next.config.js`

> These warnings do not affect function. Document them so they are not mistaken for new regressions introduced by the migration.

---

## Current Route Table (67 routes)

### Public routes (localized under `/[locale]/`)

| Route | Type | Notes |
|---|---|---|
| `/[locale]` | Dynamic | Homepage — 12 sections, 3 hardcoded product arrays |
| `/[locale]/about` | Dynamic | Rebuilt Phase 10 — translation-driven |
| `/[locale]/agb` | Dynamic | Legal — static |
| `/[locale]/ai-websites` | Dynamic | No nav link — scope unclear |
| `/[locale]/automation-audit` | Dynamic | Uses AuditForm component, EN metadata hardcoded |
| `/[locale]/automation-lab` | Dynamic | Nav label "Reference" |
| `/[locale]/blog` | Dynamic | "Coming soon" placeholder, EN only |
| `/[locale]/case-studies` | Dynamic | Footer link — content unknown |
| `/[locale]/contact` | Dynamic | Translation-driven form |
| `/[locale]/data-deletion` | Dynamic | Legal — static |
| `/[locale]/discovery` | Dynamic | Multi-step form, AI enhancement |
| `/[locale]/estimate` | Dynamic | Referenced from PricingSection plan1 |
| `/[locale]/impressum` | Dynamic | Legal — static |
| `/[locale]/portfolio` | Dynamic | Private — gated by /api/portfolio/auth |
| `/[locale]/pricing` | Dynamic | Translation-driven |
| `/[locale]/privacy` | Dynamic | Legal — static |
| `/[locale]/products` | Dynamic | SYSTEMS[] hardcoded (7 items), `use client` |
| `/[locale]/products/care-os` | Dynamic | 458 lines hardcoded — **TO DELETE Week 4** |
| `/[locale]/products/handwerk-os` | Dynamic | 689 lines hardcoded — **TO DELETE Week 4** |
| `/[locale]/products/praxis-os` | Dynamic | 460 lines hardcoded — **TO DELETE Week 4** |
| `/[locale]/products/printshop` | Dynamic | 633 lines hardcoded — **TO DELETE Week 4** |
| `/[locale]/products/publishing-os` | Dynamic | 458 lines hardcoded — **TO DELETE Week 4** |
| `/[locale]/products/real-estate-os` | Dynamic | 458 lines hardcoded — **TO DELETE Week 4** |
| `/[locale]/products/restaurant-os` | Dynamic | 656 lines hardcoded — **TO DELETE Week 4** |
| `/[locale]/services` | Dynamic | LAYER_REFS with product hrefs |
| `/[locale]/systems` | Dynamic | APP_REFS[] hardcoded (7 items), architecture sections |

**Products missing from all routes at baseline:**
- `/[locale]/products/drive24` — does not exist
- `/[locale]/products/taxkontrol` — does not exist

### OS routes

| Route | Auth | Notes |
|---|---|---|
| `/os` | ✓ Protected | Dashboard — business metrics |
| `/os/angebote` | ✓ Protected | Quotes list |
| `/os/angebote/[id]` | ✓ Protected | Quote detail |
| `/os/angebote/[id]/edit` | ✓ Protected | Quote edit |
| `/os/angebote/[id]/print` | ⚠ **UNPROTECTED** | Print view outside (protected) group |
| `/os/angebote/new` | ✓ Protected | New quote |
| `/os/clients` | ✓ Protected | Client CRM |
| `/os/inbox` | ✓ Protected | Inbox |
| `/os/invoices` | ✓ Protected | Invoice list |
| `/os/invoices/[id]` | ✓ Protected | Invoice detail |
| `/os/invoices/[id]/print` | ⚠ **UNPROTECTED** | Print view outside (protected) group |
| `/os/invoices/new` | ✓ Protected | New invoice |
| `/os/jobs` | ✓ Protected | Kanban pipeline |
| `/os/leads` | ✓ Protected | Lead list |
| `/os/login` | Public | Login form |
| `/os/newsletter` | ✓ Protected | Newsletter management |

**OS routes missing at baseline (to be added):**
- `/os/systems` — ecosystem product registry
- `/os/analytics` — cross-product event analytics
- `/os/health` — domain health monitoring
- `/os/media` — asset library (Phase 3)
- `/os/deployments` — Vercel status (Phase 4)

### API routes

| Route | Auth | Purpose |
|---|---|---|
| `/api/audit` | Public | Automation audit logic |
| `/api/chat` | Public | ChatAgent (Max) — Claude |
| `/api/contact` | Public | Contact form → email only (no DB write at baseline) |
| `/api/discovery/estimate` | Public | Discovery form estimate step |
| `/api/discovery/send` | Public | Discovery form email |
| `/api/estimate` | Public | Cost estimate calculation |
| `/api/estimate/send` | Public | Estimate email |
| `/api/newsletter/subscribe` | Public | Newsletter signup |
| `/api/portfolio/auth` | Public | Unknown — portfolio auth |
| `/api/os/ai` | Protected | AI chat |
| `/api/os/ai/enhance` | Protected | Quick Scan extractor |
| `/api/os/ai/generate-invoice` | Protected | AI invoice generator |
| `/api/os/ai/scan-client` | Protected | Contact card scanner |
| `/api/os/ai/scan-invoice` | Protected | Invoice scanner |
| `/api/os/angebote` | Protected | Quotes CRUD |
| `/api/os/clients` | Protected | Clients CRUD |
| `/api/os/clients/auto-save` | Protected | Client auto-save |
| `/api/os/invoices` | Protected | Invoices CRUD |
| `/api/os/jobs` | Protected | Jobs CRUD |
| `/api/os/leads` | Protected | Leads CRUD |
| `/api/os/login` | Public | Session creation |
| `/api/os/logout` | Protected | Session destruction |
| `/api/os/newsletter` | Protected | Subscriber management |
| `/api/os/send-angebot` | Protected | Quote email |
| `/api/os/send-invoice` | Protected | Invoice email |

**API routes missing at baseline (to be added):**
- `/api/track` — event tracking endpoint
- `/api/health` — system health cron endpoint

---

## Hardcoded Product Arrays at Baseline

Three independent definitions of the same product list. All three deleted in Week 2–4.

| File | Array name | Items | Fields |
|---|---|---|---|
| `app/[locale]/page.tsx` | `SYSTEM_REFS` | 7 | id, status, href |
| `app/[locale]/systems/page.tsx` | `APP_REFS` | 7 | id, featureKeys, tags, productPage, contactSlug, publicDemo |
| `app/[locale]/products/page.tsx` | `SYSTEMS` | 7 | label, status, name, desc, features, href, demo |

---

## Product Pages at Baseline

| Page | Lines | Status |
|---|---|---|
| `products/restaurant-os/page.tsx` | 656 | Hardcoded, TO DELETE Week 4 |
| `products/handwerk-os/page.tsx` | 689 | Hardcoded, TO DELETE Week 4 |
| `products/printshop/page.tsx` | 633 | Hardcoded, TO DELETE Week 4 |
| `products/praxis-os/page.tsx` | 460 | Hardcoded, TO DELETE Week 4 |
| `products/care-os/page.tsx` | 458 | Hardcoded, TO DELETE Week 4 |
| `products/real-estate-os/page.tsx` | 458 | Hardcoded, TO DELETE Week 4 |
| `products/publishing-os/page.tsx` | 458 | Hardcoded, TO DELETE Week 4 |
| **Total** | **3,812** | Collapsed into 1 dynamic route in Week 4 |

---

## Locale Files at Baseline

| File | Keys | Namespaces |
|---|---|---|
| `messages/en.json` | 673 | nav, localeSwitcher, hero, footer, home, proof, roi, pricingSection, faq, newsletter, services, systems, about, pricing, contact |
| `messages/de.json` | 673 | (same) |
| Parity | ✓ PASS | — |

**Namespaces to be modified during migration:**
- `home.ourSystems` (s1–s7) → deleted, replaced by registry
- `systems.apps` (a1–a7, positional) → deleted, replaced by slug-based keys

---

## Demo URLs at Baseline

| Product | Demo URL | Status at snapshot |
|---|---|---|
| RestaurantOS | https://restaurant-os-one.vercel.app | Confirm live |
| HandwerkOS | https://handwerkos.vercel.app | Confirm live |
| PrintShopOS | https://printshop.maxpromo.digital | Confirm live |
| PraxisOS | [confirm] | — |
| CareOS | [confirm] | — |
| RealEstateOS | [confirm] | — |
| PublishingOS | [confirm] | — |
| Drive24 | [confirm] | — |
| TaxKontrol | [confirm] | — |

---

## Known Bugs at Baseline

| Bug | File | Severity | Fix scheduled |
|---|---|---|---|
| ROICalculator uses £ (GBP) | `components/ROICalculator.tsx` | Medium | Week 0 Step 0.5 |
| Print routes not auth-protected | `/os/angebote/[id]/print`, `/os/invoices/[id]/print` | High | Week 0 Step 0.6 |
| Blog page hardcoded EN only | `app/[locale]/blog/page.tsx` | Low | Translation sweep |
| automation-audit EN metadata hardcoded | `app/[locale]/automation-audit/page.tsx` | Low | Translation sweep |
| Drive24 missing from all pages | — | High | Week 2 (registry) |
| TaxKontrol missing from all pages | — | High | Week 2 (registry) |

---

## Screenshots Required (capture manually before Week 1)

> Claude Code cannot take browser screenshots. Capture these using browser DevTools or a screenshot tool before beginning Week 1.

| Page | URL | Notes |
|---|---|---|
| Homepage | /de/ | Full page, desktop + mobile |
| Systems page | /de/systems | Full page |
| Products index | /de/products | Full page |
| RestaurantOS | /de/products/restaurant-os | Full page |
| HandwerkOS | /de/products/handwerk-os | Full page |
| OS Dashboard | /os | Full page |
| OS Sidebar | /os | Sidebar only |
| OS Leads | /os/leads | Full page |

**Save to:** `docs/screenshots/baseline/[page-name]-desktop.png`

---

## Lighthouse Scores Required (capture manually before Week 1)

> Run via Chrome DevTools or `npx lighthouse [url]` against local dev server.

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Homepage (de) | — | — | — | — |
| Systems page | — | — | — | — |
| RestaurantOS | — | — | — | — |

**Update this table after running Lighthouse before Week 1.**

---

## Rollback Procedure

If Week 1 introduces a build-breaking change:

```bash
# Hard rollback to baseline
git checkout ecosystem-baseline-v1

# Verify build passes
npm run build

# Push to origin if needed (force — use only in emergency)
git push origin main --force-with-lease
```

If only a specific file is broken:

```bash
# Restore single file from baseline
git checkout ecosystem-baseline-v1 -- path/to/file.tsx
```

---

## What Changes in Week 1

Week 1 creates new files only. No existing files are modified.

New files created:
- `lib/registry/types.ts`
- `lib/registry/products.ts`
- `lib/registry/categories.ts`
- `lib/analytics/events.ts`
- `lib/analytics/track.ts`
- `components/systems/SystemCard.tsx` (stub)
- `components/systems/SystemCardCompact.tsx` (stub)
- `components/systems/SystemGrid.tsx` (stub)
- `components/products/ProductHero.tsx` (stub)
- `components/products/ProductBeforeAfter.tsx` (stub)
- `components/products/ProductFeatures.tsx` (stub)
- `components/products/ProductWorkflow.tsx` (stub)
- `components/products/ProductContactForm.tsx` (stub)
- `components/products/ProductCTA.tsx` (stub)

No existing file is modified in Week 1. If Week 1 breaks the build, the cause is in a new file — delete it and rebuild.
