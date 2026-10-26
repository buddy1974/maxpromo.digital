# Max Agent — Public Offer Page (Sprint 1)

Public, ad-ready landing page for **Max Agent** (Maxpromo Digital ecosystem).
Next.js App Router · TypeScript · Tailwind · Neon Postgres · Drizzle. No waitlist —
the conversion action is a **free Geschäfts-Check (audit) booking**; leads persist
to Neon and (optionally) ping Telegram.

> Architecture, roadmap and decisions live in [`PLAN.md`](./PLAN.md).

## What runs here (ADR-0021, ADR-0030)
- **Intake agent** — site enquiries → Maxpromo OS `lead.intake` (outbox, retried).
- **Research Agent** — work delegated by Maxpromo OS through the work door
  `/api/work/v1/{request,status,cancel}`: reads a lead's public website, model step through the OS gateway
  (`/api/os/agent/v1/model`), verifies quotes, qualifies with `@maxpromo/research`, hands the result back.
- **Dashboard** — runtime, delegated work, the two agents, the OS approvals projection. No sample data; the
  demo seed and mock layer were removed (their old database rows remain, unread).
- **One login** — `/sso` accepts the one-time ticket Maxpromo OS issues to its owner.
- No model key here, by design. See `docs/architecture/agent-bureau.md`.

## Stack
- **Next.js 15** (App Router, RSC)
- **Tailwind 3** — Hybrid design system (dark premium, orange accent) in `tailwind.config.ts`
- **Neon Postgres + Drizzle** — schema in `lib/db/schema`
- **Zod** — one schema (`lib/validation/lead.ts`) shared by form + API

## Local setup
```bash
npm install
cp .env.example .env.local      # fill in values (see below)
npm run db:generate             # generate SQL migration from schema
npm run db:push                 # apply schema to Neon
npm run dev                     # http://localhost:3000
```

## Environment variables
| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes (for lead capture) | Neon pooled connection string, **EU region** (DSGVO) |
| `TELEGRAM_BOT_TOKEN` | no | BotFather token — enables lead notifications |
| `TELEGRAM_CHAT_ID` | no | Chat that receives notifications |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical/OG base URL |

The Telegram notifier is **feature-flagged**: with no token, leads still save and the
page works — the notification is simply skipped.

If `DATABASE_URL` is unset, `POST /api/leads` returns `503 not_configured` and the
form shows an honest fallback (email Marcel) — no fake success.

## Deploy (Vercel)
1. Push this repo to GitHub.
2. Import into Vercel. Framework auto-detected (Next.js).
3. Add the env vars above in **Project → Settings → Environment Variables**.
4. Provision **Neon** (EU/Frankfurt), copy the pooled `DATABASE_URL`, then run
   `npm run db:push` locally (or via a one-off) to create tables.
5. Deploy. Point `agent.maxpromo.digital` (or chosen domain) at it.

## Lead funnel
`LeadForm` (client) → captures UTM/`?ref=`/referrer → `POST /api/leads` →
Zod validate → insert `lead_submissions` (+ `attribution`) → Telegram notify →
typed result. Honeypot field blocks basic bots.

## Project layout
```
app/(marketing)/        landing + impressum + datenschutz
app/dashboard/          supervised Chief of Staff dashboard (Sprint 2, mock data)
app/api/leads/          lead capture route (REAL: Neon + Telegram)
app/api/(dashboard...)/ summary, agents, approvals, tasks, projects,
                        contacts, memory, activity (mock, typed)
lib/db/                 drizzle schema (leads = real; platform = additive skeleton)
lib/validation/         zod (shared)
lib/integrations/       telegram notifier
lib/registry/agents.ts  9 supervised agents
lib/mock/               central mock data layer (dashboard demo)
lib/api/response.ts     consistent API envelope
types/                  shared TypeScript types
components/marketing/    landing sections
components/dashboard/    dashboard shell + cards + badges
config/legal.ts         LOCKED Impressum + §19 UStG
```

## Dashboard (system preview — Sprints 2 & 3)
A typed product skeleton behind the landing page at `/dashboard`. **All dashboard
data is mock** (`lib/mock`); nothing is autonomous and no integrations are wired.
Agents follow a supervised model — Observe → Prepare → Propose → **Human Review**
→ Execute → Log — and all action buttons are non-functional placeholders by design.

The product is organised around the operating-model backbone (`lib/core/`):
**Audit → Diagnose → Design Agent Team → Manual Delivery → Systemize → Install → Maintain**.
The dashboard is only the visible surface; manual/concierge delivery is a
first-class part of the model.

Backbone routes: `/dashboard/operating-model`, `/dashboard/playbooks`,
`/dashboard/client-implementation`. Strategic modules: `/dashboard/audit`,
`/dashboard/waiting-room`, `/dashboard/approvals`, `/dashboard/documents`,
`/dashboard/ai-governance`.

The platform + operating DB schemas (`lib/db/schema/platform.ts`,
`lib/db/schema/operating.ts`) are **additive and not pushed** — review before
`db:push`. No OCR/upload, no real message sending, no AI-tool scanning (all
deferred). See `PLAN.md` → Sprint Log for the real-vs-mock breakdown and the
Version 2 Backlog.

## Legal
`config/legal.ts` holds the locked business identity and the mandatory
`Gemäß §19 UStG wird keine Umsatzsteuer berechnet.` clause. Do not remove.
The Datenschutz page is a baseline — have it reviewed before scaling paid traffic.
