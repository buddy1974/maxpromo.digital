# Walkaround Architecture

**Status:** Defined — pre-implementation (Phase 5)
**Scope:** Intermediate layer between landing page and demo on all product domains

---

## What the Walkaround Is

An **interactive guided preview** that sits between the landing page and the
live demo. It answers: *"What will I be doing inside this system?"*

It is not a demo. The demo requires login and real or seeded data.
The walkaround requires neither.

| | Walkaround | Demo |
|---|---|---|
| Purpose | Understand what exists | Experience the product |
| Login required | No | Sometimes |
| Data | Guided simulation | Real or seeded |
| Duration | 3–5 min | Self-paced |
| Entry | After landing | After walkaround |
| Exit CTA | Enter demo / talk to Max | Book setup |

---

## Position in Funnel

```
Landing → Walkaround → See In Action → Demo → Conversion
```

Walkaround must be completed (or skipped by intent) before the demo
CTA is surfaced. A visitor who clicks demo without walkaround context
converts at roughly half the rate. The architecture enforces the sequence.

---

## Module Structure per Product

Each product domain defines a set of **modules** — the core operating
areas of the system. The walkaround presents each as a self-contained
guided preview.

Each module preview answers:
1. What triggers this module
2. What the system does automatically
3. What the operator sees / acts on
4. What the customer or staff experiences

**RestaurantOS modules:**
Bookings · Orders · Staff · Customer messages · Reviews

**HandwerkOS modules:**
Jobs · Quotes · Time tracking · Invoices · XRechnung

**PraxisOS modules:**
Appointments · Patient portal · Referrals · Lab results · Billing

**PrintShopOS modules:**
Order intake · AI file check · Production queue · Delivery · Customer portal

**CareOS modules:**
Client intake · Caregiver matching · Visit planning · Documentation · Family portal

**RealEstateOS modules:**
Lead capture · Qualification · Viewing booking · Follow-up · Portfolio match

**PublishingOS modules:**
Topic discovery · Content generation · Publishing · Distribution · Analytics

**TaxKontrol modules:**
Income tracking · Expense logging · Tax reserve · Deadline alerts · ELSTER export

**Drive24 modules:**
Booking · Driver matching · Live tracking · Payment · Agent dashboard

---

## See In Action — Workflow Storytelling

"See In Action" sections must tell stories. Not screenshots. Not image
galleries. Outcome-led narratives showing a real cause → effect chain
across actors.

### Story structure

Every product's "See In Action" section defines:

1. **Trigger** — what initiates the sequence
2. **Chain** — 4–6 steps, each naming actor + system response + outcome
3. **End state** — what is different in the business

### Example — RestaurantOS

```
Customer books table via website
  → AI confirms instantly, no staff involved
    → CRM entry created, dietary notes captured
      → Staff notified 30 min before arrival
        → Visit ends: review request fires automatically
          → Review received, operator notified in inbox
```

### Required actors per step
`customer` · `system` · `operator` · `staff` · `AI`

### Registry extension (Phase 5)

Each `ProductEntry` gains `storySequence: StoryStep[]`:

```typescript
interface StoryStep {
  actor:   'customer' | 'system' | 'operator' | 'staff' | 'AI'
  label:   string   // "Books table"
  outcome: string   // "AI confirms, CRM entry created"
}
```

---

## Implementation Path

Phase 5 implementation target:

- `components/landing/walkaround/` — section family
- story renderer — planned as `SeeInAction.tsx`, never built under that name;
  the V2 engine renders `seeInAction` data through
  `components/landing/sections/ProductGallery.tsx` and
  `components/landing/sections/UseCases.tsx`
- `lib/registry/types.ts` — `walkaround`, `storySequence` fields added to `ProductEntry`
- `lib/registry/adapters/landing.adapter.ts` — `WalkaroundData`, `StoryData` in `LandingData`
