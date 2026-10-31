# ADR-0026 — Phone-first Maxpromo OS and the installable app

Date: 2026-10-24 · Status: accepted (product-completion mega-run) · Relates to: ADR-0021 (control planes),
ADR-0023 (Email OS), ADR-0025 (Money)

## Context

Marcel runs Maxpromo from his phone as much as from a desk. The OS was a desktop back office with a
responsive drawer: a 260 px sidebar that slid in, floating "Quick Scan" and "Ask Max" buttons that
covered content (risk 124), `100vh` layouts that broke under mobile browser bars and keyboards, an
Ask Max chat living inline in a 526-line layout, and no installable app.

## Decision

**One tree, two shells, switched by CSS at 900 px.** Desktop keeps the sidebar, the floating controls
and Ask Max as a slide-over. Below 900 px the OS is an app:

| Phone place | Why it is primary |
|---|---|
| **Today** (`/os`) | "What needs Marcel's attention today?" — attention first (whole-row targets), then the briefing, then quiet figures; routine lists hidden |
| **Inbox** | communication is the daily work; badge = conversations waiting for a reply |
| **Money** | owed / overdue / received in seconds; badge = money issues |
| **Max** (`/os/ask`) | the owner's question interface is a destination, not a bubble over content |
| **More** (sheet) | approvals (badge), invoices, quotes, clients, leads, jobs, newsletter, **Agent Bureau**, Quick Scan, language, sign out |

- The Bureau stays its own control plane (agents.maxpromo.digital); the OS links to it from More and
  the sidebar and shows agent results and approvals in Today and Approvals — no duplication.
- **Ask Max** is one conversation in a provider above the routes (since ADR-0029 Universal Max: `components/os/max/MaxProvider.tsx`), so
  moving between tabs keeps it; the panel and the page render the same component.
- **Shell primitives** live in `components/os/shell/`: `Sheet` (dialog semantics, focus in and back,
  Escape, dynamic-viewport height), `PhoneShell` (top bar, bottom nav, badges, banners, app runtime),
  `QuickScan`. Layering scale: sidebar 100 · phone bars 150 · desktop floats 160 · Ask Max panel 200 ·
  sheets 300 · composer 700.
- **Geometry:** one scroll owner (`.os-main`), `100dvh`, `env(safe-area-inset-*)` with
  `viewport-fit=cover`, `interactive-widget=resizes-content` for Android, and `--os-vvh`/`--os-vv-top`
  from `visualViewport` so the composer follows the iOS keyboard; inputs are 16 px (no iOS zoom).
- **Badges** come from `/api/os/shell`: counts only, owner session, `no-store`; refreshed every minute,
  on focus and after any owner action (`os:changed`).
- **Failure:** offline and expired-session banners; Ask Max says when the session ended; nothing shows
  success it did not get.
- **Governed actions on a phone:** invoice actions follow the business state (record payment,
  reminder when overdue, cancel only without money, delete only drafts); Money confirmations are
  written in the screen language (`CapabilityContext.language`); approvals name their impact
  (goes to a customer / moves money / changes data) and the confirm button names the consequence.

## The installable app (PWA)

- `/os/manifest.webmanifest`: id and scope `/os`, start `/os`, standalone, approved brand icons,
  shortcuts to Inbox, Money, Max. The public site's per-domain manifest is unchanged.
- `/os/sw.js` — deliberately conservative: it caches **only** the offline page and answers **only**
  failed `/os` page navigations with it. It never intercepts an API request and never stores an
  email, invoice, payment or any page behind the login. `Service-Worker-Allowed: /os`, never cached.
- The auth gate lets exactly these three paths through without a session: the manifest, the worker
  and the offline page (`PUBLIC_OS_APP_PATHS`, proven by `prove:os-app`).

## Also decided in this run

- `<html lang>` follows the OS language (server from the cookie for authenticated OS requests,
  client on every switch) — risk 118 closed.
- The OS, the OS API and the pay page refuse to be framed (`frame-ancestors 'none'`,
  `X-Frame-Options: DENY`): governed one-tap decisions must not be clickable through a hostile overlay.
- Scheduled send (migration 0023): a confirmed send time is bound to the revision; sweeps (OS while
  open, the daily cron; `/api/cron/mail-schedule` is callable but on no schedule — ADR-0033 A5) claim due drafts once; take-back and refused sends
  return the draft. Minute accuracy whatever the OS is doing needs `CRON_SECRET` and a frequent cron.

## Consequences

- Route CSS budget raised 88 → 96 KB (the OS Inbox is now the heaviest route; the homepage unchanged).
- Verified at 360, 390 and 412 px in desktop Chrome (local runtime framed at those widths) and in
  production on desktop. **Not** verified on a physical Android phone or iPhone, nor as an installed
  standalone app on iOS — owner acceptance (risk 137).
