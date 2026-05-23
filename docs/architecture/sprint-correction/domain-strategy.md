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

---

## Host Resolution (implemented — Phase 1)

Each product domain resolves to a slug and locale via `lib/host/HOST_MAP.ts`.
The middleware stamps `x-mp-mode`, `x-mp-slug`, `x-mp-default-locale` on
every request. Pages read these headers and dispatch accordingly.

Showcase hosts render `LandingEngine`. Hub host renders the hub homepage.
Max is mounted in both.

---

## One Max System

There is one Max. It adapts by mode and context — it does not split into
product-specific chatbots.

Max on `restaurant-os.de` knows it is in the RestaurantOS context via the
`x-mp-slug` header injected by Phase 1 middleware. It uses that context in
its system prompt. It does not become a different agent.

See `lead-flow-architecture.md` for how lead context is tracked.
See `walkaround-architecture.md` for how Max escalates post-walkaround.
