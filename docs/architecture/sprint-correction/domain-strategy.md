# Domain Strategy

**Status:** Active — governs all product domain decisions
**Scope:** maxpromo.digital hub + all 9 product domains

---

## maxpromo.digital Is a Gateway

maxpromo.digital has one job: **position, build trust, route**.

It shows what exists. It earns confidence. It sends visitors to the right
product domain. It never demonstrates a product.

```
maxpromo.digital
  ├── positions the Maxpromo ecosystem
  ├── surfaces product cards (name, headline, entry CTA)
  ├── routes to product domains
  └── never hosts a product demo
```

**What maxpromo.digital is not:**
- A demo environment
- A product landing page
- A lead-closing surface
- A feature showcase

---

## Product Domains Close Independently

Every product domain must close without the visitor ever visiting
maxpromo.digital first.

**The test:**
Someone receives `taxkontrol.de` via a WhatsApp message. They have no
prior knowledge of Maxpromo. Before taking any action they must understand:

- What pain this solves
- Why it keeps happening
- What the system does
- What changes in their business
- What proof exists
- What the next step is

If any of those are unclear, the domain is not ready to close.

---

## Funnel Sequence (enforced)

The required journey on every product domain:

```
1. Landing
   Pain + Reality + System + Result
   No shortcutting to demo from here.

2. Walkaround
   Interactive guided module preview.
   Shows what exists before the visitor commits to a demo.

3. See In Action
   Workflow storytelling — not screenshots.
   Outcome-led narrative (see walkaround-architecture.md).

4. Demo
   Actual product experience.
   Gated or open, product-specific.

5. Conversion
   Max chat → qualification → specialist handover.
```

Skipping steps is a visitor choice. The architecture never skips steps by
default. The demo CTA is not the primary CTA on the landing page.

---

## Hub vs Domain Responsibilities

| Concern | Hub (maxpromo.digital) | Product domain |
|---------|----------------------|---------------|
| Ecosystem story | ✓ | — |
| Product card | ✓ | — |
| Entry CTA | ✓ | — |
| Pain narrative | — | ✓ |
| Walkaround | — | ✓ |
| Demo | — | ✓ |
| Conversion / lead close | — | ✓ |
| Proof / testimonials | ✓ (brief) | ✓ (deep) |
| Max chat | ✓ (hub mode) | ✓ (product mode) |
| Blog / SEO articles | ✓ | — |
| Case studies | ✓ | ✓ (linked) |
| Impressum / Datenschutz | ✓ | ✓ (operator's, on the product's domain) |

Since v13.0 this table is enforced rather than described: a product domain's
`routes` allowlist in the Domain Registry is `/`, `/contact`, `/impressum` and
`/privacy`, and the middleware redirects everything else to the hub. The
version of this table written before that was accurate about the intent and
silent about the fact that all fifteen consultancy routes answered on every
product domain.

---

## Host Resolution (superseded by ADR-0008 — v13.0)

Each host resolves to a record in the **Domain Registry**,
`packages/config/domains.ts`. The middleware stamps `x-mp-domain`, `x-mp-mode`,
`x-mp-slug`, `x-mp-default-locale` and `x-mp-locale`; server components read
the registry key and look the full record up.

The four-field host map this section originally described
(`lib/host/HOST_MAP.ts`) is deleted. It resolved enough to dispatch the page
body and nothing else, so metadata, route availability, languages, robots and
sitemap each decided for themselves and each decided wrong — see ADR-0008 and
the RC1 report.

Showcase hosts render `LandingEngine` inside `ShowcaseChrome`, which supplies
the navigation, footer and legal links every page on the domain wears. Hub host
renders the hub homepage. Max is mounted in both.

---

## One Max System

There is one Max. It adapts by mode and context — it does not split into
product-specific chatbots.

Max on `restaurant-os.de` is *intended* to know it is in the RestaurantOS
context via the `x-mp-slug` header, and to use that context in its system
prompt without becoming a different agent.

**It does not receive it.** The middleware matcher excludes `/api/*` except
`/api/os`, so the chat routes never see the header and record
`productSlug: null` on every session. Recorded in
`docs/governance/known-risks.md`; owned by Track B, the Chat Assistant Forensic
Audit. The Domain Registry names the identity each domain reports under
(`chatIdentity`) so Track B has one place to read it from.

See `lead-flow-architecture.md` for how lead context is tracked.
See `walkaround-architecture.md` for how Max escalates post-walkaround.
