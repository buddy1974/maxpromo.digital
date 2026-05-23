# SEO Architecture + CMS Ownership

**Status:** CMS ownership defined — implementation Phase 6
**Scope:** Content ownership hierarchy, SEO metadata flow, CMS relationship

---

## Ownership Hierarchy

Three layers control content. Each layer owns what it is best placed to own.
Content does not drift between layers without an explicit decision.

---

### CMS Owns (dynamic content — changes after deployment)

```
Blog posts
  title, slug, locale, body_md, body_html, excerpt
  meta_title, meta_desc, tags, cover_image
  publish_at, author, social_text

FAQ
  question, answer, product_scope, locale
  Each FAQ item is an objection — see landing-engine-v2.md

Feature scenes
  name, copy, image_path, product_slug
  Used in Walkaround and See In Action sections

Proof stories
  client_label, metric, outcome, testimonial_quote
  Industry, product slug, locale

Landing copy variants
  Headline tests, sub-copy, CTA label alternatives
  Start in registry — migrate to CMS when A/B testing begins

Case studies
  client (anonymous or named), problem, solution, result, quote
  Metric: hours saved, cost reduction, time to live

Social snippets (Phase 7)
  Derived from blog + story content
  Format variants per platform
  Scheduled publish metadata

Scene descriptions
  image_brief: what the image should show
  alt_text: accessibility-compliant description
  caption: optional visible label
```

---

### Registry Owns (structural — changes require a code deployment)

```
Product slugs
  Canonical identifiers. Route segment. Analytics key.
  Changing a slug requires a redirect and migration.

Domain metadata
  host → slug mapping (HOST_MAP.ts)
  defaultLocale per host
  useLocalePrefix per host

Brand configuration
  brandColor (hex)
  layoutVariant (A / B / C)
  backgroundDark (boolean)

Locale configuration
  which locales a product supports
  fallback locale

Registry headlines and sublines
  These are LOCKED content — editorial voice, not CMS territory
  Changes require code review and registry update

Workflow steps (5 per product)
  Locked. Registry source of truth.
  CMS does NOT override workflow steps.
```

---

### Code Owns (logic — no content ownership)

```
Rendering
  React components
  LandingEngine section order
  Walkaround module display

Routing
  middleware.ts host resolution
  page.tsx showcase dispatch
  next-intl locale routing

Business logic
  Lead scoring calculation
  Session memory and chat turns
  Rate limiting

API routes
  /api/chat/message — Max turns
  /api/chat/session — session hydration
  /api/audit — automation audit
  All /api/os/* — OS admin routes

Auth and security
  OS session gate
  Cookie management
  HMAC signing
```

---

## Content Flow

```
Writer → CMS (/os/content, Phase 6)
  → Stored in Neon (cms.posts, cms.faq, cms.scenes)
    → Fetched at request time by server components
      → Rendered on product domain or hub blog
        → SEO metadata generated from cms.meta_title, cms.meta_desc
          → Social snippets derived for distribution (Phase 7)
```

---

## SEO Metadata Strategy

### Per-page metadata sources

| Page type | title source | description source | og:image source |
|-----------|-------------|-------------------|----------------|
| Hub homepage | next-intl messages | next-intl messages | hero-1.png |
| Product domain `/` | registry headline | registry description | registry card image |
| Blog post | cms.meta_title | cms.meta_desc | cms.cover_image |
| Case study | cms.title | cms.excerpt | cms.cover_image |
| Products index | static | static | — |

### Canonical URL rule

Product domain pages use the product domain as canonical:
`<link rel="canonical" href="https://restaurant-os.de/" />`

Hub product cards (`/products/restaurant-os`) use the hub canonical:
`<link rel="canonical" href="https://maxpromo.digital/products/restaurant-os" />`

These are not in conflict — different URLs, different intent.

---

## What CMS Does Not Control

- Product registry entries — code review required, intentional
- Component layout — code
- Routing structure — code
- Brand color / layout variant — registry
- Workflow step count (must be exactly 5 — VG-10 governance)
- Bullet count (must be exactly 3 — VG-09 governance)

Governance rules are enforced by TypeScript types in `lib/registry/types.ts`.
CMS content cannot override them.
