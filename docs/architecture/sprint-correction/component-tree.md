# Component Tree

**Status:** Phase 3 implemented — Phase 5 extensions defined
**Scope:** All public-facing components and their relationships

---

## Layout Layer

```
app/[locale]/layout.tsx
  ├── NextIntlClientProvider
  │     ├── [hub mode]
  │     │     ├── Navbar
  │     │     ├── {children}  ← page content
  │     │     ├── Footer
  │     │     ├── CookieBanner
  │     │     └── Max          ← always mounted
  │     │
  │     └── [showcase mode]
  │           ├── {children}  ← LandingEngine output
  │           └── Max          ← always mounted
  │
  └── [os mode — separate layout, not locale-wrapped]
        OS admin surfaces
```

---

## Hub Homepage

```
app/[locale]/page.tsx (hub mode)
  ├── Hero (locked — Phase 0.5)
  │     ├── HeroSlide ×4
  │     ├── AmbientGlow
  │     ├── HeroParticles
  │     ├── OperationalTicker
  │     ├── LiveCard (desktop)
  │     ├── LiveCardMobile
  │     └── HeroSlideNav
  ├── PainSlider
  ├── PainCards → PainCardsClient
  ├── ProofMetrics
  ├── SystemsTabs
  ├── TeamTrust (server)
  ├── FaqAccordion (client)
  └── [blog section — conditional on CMS content]
```

---

## LandingEngine (showcase mode)

```
app/[locale]/page.tsx (showcase mode — dispatches on x-mp-mode)
  └── LandingEngine { data: LandingData, bridge?: boolean }
        └── LandingThemeProvider
              │  (sets --brand-accent, --brand-bg, --brand-fg, --brand-muted)
              │
              ├── HeroWorld
              ├── Pain               [bridge: hidden]
              ├── BeforeAfter        [bridge: hidden]
              ├── HowItWorks         [bridge: hidden]
              ├── Features           [bridge: hidden]
              ├── InAction           [bridge: hidden]
              ├── Walkaround         [Phase 5] [bridge: hidden]
              ├── SeeInAction        [Phase 5, replaces InAction] [bridge: hidden]
              ├── Testimonials       [Phase 5, CMS-gated] [bridge: hidden]
              ├── Faq                [hidden when faq=null]
              └── Conversion         [always — bridge swaps secondary CTA]
```

Bridge mode renders hub product cards at `/products/[slug]`.
Full mode renders on dedicated product domains.

---

## Data Flow (LandingEngine)

```
lib/registry/products.ts (PRODUCTS array)
  ↓
lib/registry/adapters/landing.adapter.ts
  getLandingData(slug, locale) → LandingData
    ↓
  LandingEngine receives LandingData as props
    ↓
  Each section receives a typed subset of LandingData
  No section fetches data independently
```

---

## Max Widget

```
components/max/Max.tsx (client, mounted in layout)
  └── MaxMemoryProvider (context: session, messages, loading)
        ├── MaxBubble        ← visible when panel closed
        └── MaxPanel         ← visible when open
              ├── [header: M avatar, "Max", "// Business Advisor", close]
              ├── [messages scroll area]
              │     ├── MaxMessage ×N  (role-aware bubbles)
              │     └── [typing indicator — 3 dots when isLoading]
              └── MaxComposer
                    ├── textarea (Enter to send, Shift+Enter for newline)
                    └── send button

MaxStateMachine.ts — pure module
  MaxMode: idle | open | composing | awaiting | handover

MaxBranches.ts — pure module
  slug → industry context for system prompt injection
```

---

## API Routes

```
/api/chat/session   GET   → session + last 20 messages (or 204)
/api/chat/message   POST  → run Max turn, persist, return reply

/api/audit          POST  → automation audit (existing)
/api/contact        POST  → contact form (existing)
/api/estimate       POST  → estimate form (existing)
/api/max-agent/submit POST → legacy MaxAgent lead capture
```

---

## OS (Internal)

```
app/os/
  ├── layout → OSLayout (sidebar, hamburger, auth gate)
  ├── /          → dashboard
  ├── /invoices  → InvoiceList, InvoiceDetail, InvoiceNew, InvoicePrint
  ├── /angebote  → AngeboteList, AngebotDetail, AngebotNew, AngebotPrint
  ├── /clients   → ClientList, ClientDetail
  ├── /jobs      → JobsKanban
  ├── /leads     → LeadsInbox
  ├── /newsletter → NewsletterAdmin
  ├── /inbox     → InboxView
  └── /login     → OSLogin
```

---

## Phase 5 Additions

```
components/landing/walkaround/
  ├── WalkaroundSection.tsx    ← main section wrapper
  ├── WalkaroundModule.tsx     ← single module preview card
  └── WalkaroundNav.tsx        ← module tab navigation

components/landing/sections/SeeInAction.tsx
  └── (replaces InAction.tsx — story renderer from StoryStep[])

components/landing/sections/Testimonials.tsx
  └── (CMS-gated — renders only when cms content exists)
```
