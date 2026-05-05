# Architecture — MaxPromo Digital

This document describes how the codebase is wired today and the path it
should follow to become a real multi-tenant SaaS. It supersedes parts
of `CLAUDE.md` that have drifted from the code (`Supabase` → in fact
Neon; `Syne / IBM Plex Mono / DM Sans` → in fact Space Grotesk / Inter /
Roboto Mono).

## Two products in one repo

The Next.js app hosts two surfaces with very different threat models:

**Public marketing site** (`app/*`, excluding `app/os/*`).
Anonymous traffic. Funnels visitors into three lead-capture flows:

- `/automation-audit` → `/api/audit` (LLM-generated automation
  opportunities + Resend email + `os_leads` row).
- `/discovery` → `/api/contact` (raw-brief enhancer + lead capture).
- `/contact` and `/estimate` → `/api/contact` and `/api/estimate/send`.

All public lead endpoints are rate-limited via `lib/rate-limit.ts`
(in-memory sliding window, swap to Upstash when traffic justifies it).

**Maxpromo OS** (`app/os/(protected)/*`).
Marcel's business operating system: clients, invoices (`MP-2026-NNN`),
Angebote (`ANG-2026-NNN`), jobs/Kanban, leads, newsletter, inbox, AI
assistant. Single-tenant today, but every table now carries `owner_id`
so multi-tenancy is a thin refactor away.

## Auth model

- Cookie-based session, signed with HMAC-SHA-256 via Web Crypto. No
  external auth provider. Implemented in `lib/auth.ts`.
- `OS_PASSWORD` lives only on the server. Never in client bundles.
- `OS_SESSION_SECRET` (32+ chars) signs the cookie.
- `middleware.ts` gates `/os/*` (HTML redirect to `/os/login`) and
  `/api/os/*` (JSON 401). The login + logout routes are explicitly
  allowed through.
- `withAuth(handler)` wraps individual route handlers as
  defence-in-depth and provides `session` to handler bodies for the
  upcoming per-owner row filtering.

When we onboard a second user, swap `OS_PASSWORD` for either:

1. Clerk + a `users` table — fastest, gives signup/SSO/2FA out of the
   box, minimal code change in `lib/auth.ts` (replace `verifySession`
   with Clerk's session check).
2. NextAuth (Auth.js) with a Postgres adapter — open-source, more code,
   no vendor.

## AI surface

`lib/ai.ts` is the provider abstraction (Anthropic primary, OpenAI
fallback, mock fallback). The mock fallback was a footgun in
production: it now refuses to start if neither key is set in
`NODE_ENV=production` (see `lib/env.ts`).

`/api/os/ai/enhance` is the single endpoint for raw-text → structured
data extraction across the OS. It uses Anthropic **tool-use** (not
"return JSON" prompts) so the schema is enforced by the model, not by
fragile string parsing. Three kinds:

- `kind: 'angebot'` → `BUSINESS_DOC_SCHEMA` (line items, included
  items, payment terms, Anzahlung, declared total → reconciled
  server-side against line-item sum, warnings if mismatched).
- `kind: 'rechnung'` → same schema, surfaced as an invoice.
- `kind: 'client'` → `CLIENT_SCHEMA` (name, company, phones, address
  parts, confidence).

Legacy endpoints (`scan-client`, `scan-invoice`, `generate-invoice`)
remain for backwards compatibility but are no longer called from the
UI. They can be deleted in a follow-up PR once we've confirmed nothing
external relies on them.

## Database

Neon serverless Postgres. Schema source-of-truth lives in `db/`:

- `db/schema.sql` — baseline. Idempotent; safe to re-run.
- `db/migrations/0001-document-numbering.sql` — replaces SELECT-MAX
  numbering with per-year sequences (`next_invoice_number()`,
  `next_angebot_number()`). Backfills sequences from existing rows.
- `db/migrations/0002-angebote-enrichment.sql` — adds `included_items`
  jsonb and `payment_terms` columns so the enhancer's output has
  proper homes.
- `db/migrations/0003-multi-tenancy.sql` — adds `owner_id` to every
  `os_*` table, default-backfilled to Marcel.

Apply against Neon in order. There is no migration runner yet — long
term, Drizzle + `drizzle-kit migrate` is the right move.

## The path to multi-tenant SaaS

Stage 1 (auth) and Stage 2 (hardening) are landed. Stage 3 is the
meaningful product shift: **the OS itself becomes the SaaS product**,
verticalised per industry (the existing `/products/{vertical}-os`
pages signal this intent).

Concretely, Stage 3 needs:

1. Replace `os_owners` with a real `organizations` + `memberships`
   model — owner_id becomes org_id (or both, with row-level Postgres
   policies enforcing the boundary so a forgotten `WHERE` cannot leak
   data cross-tenant).
2. Wire Clerk (or NextAuth + email) for signup + onboarding. Drop
   `OS_PASSWORD`.
3. Bound contexts under `lib/`: `billing/` (invoices + Angebote +
   numbering), `crm/` (clients + leads + jobs), `messaging/`
   (newsletter + transactional), `ai/` (the existing enhancer +
   provider abstraction). Routes become thin adapters over service
   functions.
4. Stripe Checkout for paid plans, webhook handler at
   `/api/stripe/webhook` updating `org.plan`. Gate OS routes by plan.
5. Background queue for newsletter blast — current implementation
   times out at ~50 subscribers. Inngest or QStash with per-recipient
   idempotency keys.
6. Resend webhook to flip `os_newsletter.status` to `bounced` /
   `complained` automatically.

None of this is necessary today. It's the destination.

## Conventions

- TypeScript only. `any` is forbidden; use `unknown` + narrowing.
- Server components by default; `'use client'` only when interactivity
  is required.
- Prefer Tailwind utility classes for marketing components. The OS
  uses inline styles (legacy) — convert to Tailwind opportunistically.
- All secrets via `process.env`, validated at boot through `lib/env.ts`.
- Public endpoints rate-limit; OS endpoints sit behind middleware +
  `withAuth`.
- Errors: log with route prefix in brackets (`[/api/...]`); return JSON
  errors with `{ error, detail? }`.

## Open work (not in this pass)

- Sentry / structured logging.
- Drizzle generation so `as { ... }` casts disappear.
- Background queue (Inngest / QStash) for newsletter and any future
  long-running flows.
- Stripe + plan gating.
- Tests + CI gate.
- Resend bounce webhook.
