# Image Architecture — Scene Inventory

**Status:** Active discipline + Phase 5 expansion defined
**Scope:** All product domains — hero, pain, action, and walkaround scenes

---

## Scene Discipline

Three scene tiers exist per product. Each has a defined purpose.
No scene is decorative. Every scene supports a specific psychology station.

| Tier | Purpose | Psychology station |
|------|---------|-------------------|
| Hero scene | Establish context and aspiration | Pain / Result |
| Pain scene | Make the problem visible | Pain / Reality |
| Action scene | Show the system working | System / Result |
| Walkaround scene | Preview a specific module (Phase 5) | System |

---

## Naming Convention

```
/public/images/systems/{slug}/{tier}/{slug}-{scene}-{locale}.png

Examples:
  images/systems/restaurant-os/hero/restaurant-os-booking-de.png
  images/systems/praxis-os/pain/praxis-os-missed-calls-de.png
  images/systems/taxkontrol/action/taxkontrol-reserve-en.png
```

---

## Per-Product Scene Inventory

Required scenes per product. These are **production targets**, not
placeholders. Each scene has a name, psychology station, and brief.

---

### RestaurantOS

**Hero scenes**
- `full-house` — Busy restaurant, guests seated, orders moving without staff panic. *Result.*
- `kitchen-flow` — Kitchen display showing incoming QR orders, zero paper. *System.*

**Pain scenes**
- `booking-pressure` — Staff member on phone while walk-ins wait. *Pain.*
- `review-gap` — Google listing with 3.1 stars and unanswered reviews. *Pain + Reality.*
- `reservation-chaos` — Paper reservation book, crossings-out, double-booking note. *Pain.*

**Action scenes**
- `qr-order` — Guest phone showing menu, order confirmed, kitchen ticket printing. *System.*
- `staff-notify` — Staff member's phone with shift notification. *System.*
- `review-request` — Automated post-visit SMS to guest. *Result.*

---

### HandwerkOS (superhandwerk.de)

**Hero scenes**
- `site-to-invoice` — Tradesperson on site, phone scanning job sheet, invoice ready on screen. *Result.*
- `job-board` — Kanban view of jobs: to-quote / quoted / in-progress / invoiced. *System.*

**Pain scenes**
- `paperwork-pile` — Desk with job sheets, sticky notes, open WhatsApp. *Pain.*
- `late-invoice` — Calendar showing job completed 3 weeks ago, invoice not sent. *Pain + Reality.*

**Action scenes**
- `photo-to-quote` — AI extracting job details from a handwritten note photo. *System.*
- `xrechnung-export` — XRechnung XML file downloading next to invoice view. *Result.*
- `gps-checkin` — Map showing tradesperson check-in at job site with time stamp. *System.*

---

### PraxisOS (super-praxis.de)

**Hero scenes**
- `practitioner-focus` — Doctor with patient — no paperwork visible, clean environment. *Result.*
- `appointment-view` — Day schedule, all confirmed, no gaps, no red. *System.*

**Pain scenes**
- `waiting-room-overload` — Full waiting room, receptionist on phone, stack of paper forms. *Pain.*
- `missed-calls` — Phone showing 4 missed calls and a voicemail. *Pain.*
- `paper-referral` — Fax machine, handwritten referral, manila folder. *Reality.*
- `follow-up-failure` — Lab result sitting in inbox, patient not yet notified. *Pain.*

**Action scenes**
- `digital-check-in` — Patient completing pre-visit form on phone in waiting room. *System.*
- `auto-confirmation` — SMS confirmation sent automatically to patient. *Result.*
- `lab-result-portal` — Lab result visible in patient portal instantly. *Result.*

---

### PrintShopOS (smartprintshop.de)

**Hero scenes**
- `print-floor` — Print shop floor, machines running, zero operator panic. *Result.*
- `file-cleared` — AI preflight check: all green, job moving to production. *System.*

**Pain scenes**
- `reprint-cost` — Operator holding printed sheet with visible error. *Pain.*
- `file-rejection` — Email thread: "your file has wrong DPI" back and forth. *Pain + Reality.*

**Action scenes**
- `ai-preflight` — Automated DPI, bleed, color check results on screen. *System.*
- `production-queue` — Jobs queued by priority, no manual handoff. *System.*
- `customer-status` — Customer portal showing: "Your order is printing." *Result.*

---

### CareOS (pflege-care24.de)

**Hero scenes**
- `caregiver-visit` — Caregiver with client at home, phone showing completed visit log. *Result.*
- `family-update` — Family member's phone showing care plan update notification. *Result.*

**Pain scenes**
- `coordination-chaos` — Staff scheduling board covered in changes and Post-its. *Pain.*
- `paperwork-compliance` — Care worker filling paper forms after visit. *Pain + Reality.*

**Action scenes**
- `client-match` — System suggesting 3 matching caregivers with availability and skills. *System.*
- `visit-log` — Digital care note submitted on mobile, instantly accessible. *System.*
- `family-portal` — Family member viewing care schedule and last visit notes. *Result.*

---

### RealEstateOS (easy-immo24.de)

**Hero scenes**
- `agent-close` — Agent receiving viewing confirmation on phone, calendar auto-updated. *Result.*
- `lead-pipeline` — Kanban: new / qualified / viewing / offer / closed. *System.*

**Pain scenes**
- `lead-loss` — Email enquiry from 48 hours ago, still unread, no reply. *Pain.*
- `manual-follow-up` — Agent manually copying enquiry details into spreadsheet. *Pain + Reality.*

**Action scenes**
- `ai-qualification` — Chat thread showing AI capturing buyer requirements. *System.*
- `auto-viewing` — Calendar invite sent automatically after lead qualifies. *System.*
- `property-match` — 3 matched properties surfaced with scores for the agent. *Result.*

---

### PublishingOS (publishers24.org)

**Hero scenes**
- `content-live` — Dashboard showing article published, shared to 3 channels. *Result.*
- `traffic-graph` — Rising traffic line, article at the source of the spike. *Result.*

**Pain scenes**
- `content-backlog` — Content calendar almost empty, articles overdue. *Pain.*
- `manual-distribution` — Copy-pasting article into Facebook, newsletter, LinkedIn separately. *Pain + Reality.*

**Action scenes**
- `topic-signal` — AI surfacing trending topic with search volume and competition. *System.*
- `draft-ready` — SEO-structured draft generated and ready for review. *System.*
- `multi-channel` — Single article distributing to website + newsletter + social in one action. *Result.*

---

### TaxKontrol (taxkontrol.de)

**Hero scenes**
- `calm-finances` — Freelancer at desk, phone showing tax reserve bar: green, on track. *Result.*
- `elster-ready` — Export file ready, no accountant needed. *Result.*

**Pain scenes**
- `deadline-anxiety` — ELSTER deadline notification with no tracking data. *Pain.*
- `receipt-chaos` — Table with paper receipts, no categorisation. *Pain.*
- `cash-flow-blind` — Bank account balance shown, but no reserve visible. *Pain + Reality.*

**Action scenes**
- `receipt-scan` — Camera scanning receipt, category auto-assigned. *System.*
- `reserve-tracker` — Real-time tax reserve bar alongside safe-to-spend figure. *System.*
- `elster-export` — ELSTER-ready file downloading with zero manual work. *Result.*

---

### Drive24 (drive24.live)

**Hero scenes**
- `booking-moment` — Passenger in Yaoundé selecting destination, driver 3 min away. *Result.*
- `driver-earnings` — Driver's earnings dashboard showing completed trips. *Result.*

**Pain scenes**
- `wait-uncertainty` — Passenger at roadside, no visibility of driver arrival. *Pain.*
- `payment-barrier` — Cash exchange at end of ride, change problem. *Pain + Reality.*

**Action scenes**
- `driver-accept` — Driver app showing ride request with passenger location. *System.*
- `live-track` — Map showing driver route and ETA updating in real time. *System.*
- `momo-payment` — MTN MoMo payment confirmation on passenger's phone. *Result.*

---

## Phase 5 Walkaround Scenes

Each module preview in the Walkaround layer requires one supporting scene
image. These are added per-product when Walkaround section is implemented.
Naming: `images/systems/{slug}/walkaround/{slug}-{module}-{locale}.png`
