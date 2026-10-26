# Database — Neon Postgres

The OS schema lives in version control. There is no migration runner
yet; apply files manually in order.

## Files

```
db/
├── schema.sql                          ← baseline (idempotent)
└── migrations/
    ├── 0001-document-numbering.sql     ← per-year sequences for invoice/angebot
    ├── 0002-angebote-enrichment.sql    ← included_items, payment_terms columns
    ├── 0003-multi-tenancy.sql          ← owner_id columns, os_owners table
    ├── … 0004–0010 (see the files)
    ├── 0011-commercial-core.sql        ← pipeline, activities, follow-ups, payments, recurring,
    │                                      incidents, files, approvals, audit (ADR-0018)
    ├── 0012-channel-gateway.sql        ← WhatsApp conversations on the chat schema: identity,
                                           OS links, takeover, window, lease, outbound ledger (ADR-0019)
    ├── 0013-email-channel.sql          ← governed mail metadata, associations and audit
    └── 0014-hostinger-contract.sql     ← independent delivery/RFC IDs, previews, sealed jobs/assets
    … 0015–0027 (see the files)
    └── 0028-research-calibration.sql   ← Marcel's judgement per research run (ADR-0032); applied to
                                           the evidence database and production 2026-10-26
```

**0012 is applied to the evidence lab only** (2026-10-16). ADR-0019 is accepted, but applying 0012 to
production is a separate owner decision and has not been made.
**0011 was applied to the evidence lab only** (`npm run evidence:migrate -- <file>`, which refuses
any database holding non-evidence invoices). Production: Marcel, by hand, after a Neon backup
branch. It is additive and idempotent and rewrites no existing value.

### Mail production preparation (2026-10-22)

Mail migrations 0013 then 0014 require the existing baseline os_leads/os_clients (id/email),
gen_random_uuid, JSONB, PL/pgSQL and advisory locks. They do not require 0011 or 0012.
Do not apply unrelated commercial/WhatsApp migrations as part of mail preparation.
Fresh PostgreSQL 17 tests apply baseline plus only these two files, ingest a fixture,
replay both over populated data and prove failed transactional DDL/DML rolls back.
The evidence proof also replays both against this run's complete mail/business fixtures.

Read-only Vercel Production catalog verified on 2026-10-22: PostgreSQL17.11, both baseline
id/email pairs, required UUID/hash functions, public schema usage/CRM SELECT and database
CREATE privileges present; mail tables absent. This proves prerequisites, not application
of the migrations or a backup/restore procedure. No business rows were read or changed.

Later owner-authorized locked release applied0013/0014 on2026-10-22 through the Neon SQL
editor in one bounded transaction after recovery branch pre-email-os-20261022
(br-nameless-block-alpbxno2, expires2026-10-29). Post-release structure:9 tables,18 indexes,
2 functions, unchanged public/chat catalog. After separate owner approval on2026-10-23,
exactly one enabled hostinger:info@maxpromo.digital account was inserted. All eight other
mail tables remain empty. No commercial/WhatsApp migration or business-row change ran.
See [release evidence](../../../docs/reports/email-locked-production-2026-10-23.md).

Use the existing reviewed Neon SQL editor/psql procedure, not evidence:migrate against
production. Production application is not included in a code-only deployment approval:
first verify the actual catalog/role privileges and capture a recoverable Neon backup
branch. In one transaction set local lock_timeout='5s' and statement_timeout='60s', apply
0013, then 0014 and commit. With psql use ON_ERROR_STOP=1 and --single-transaction with
the two ordered -f files and local timeout statements. On timeout/error roll back and
investigate; do not keep retrying against busy tables or change production limits blindly.

Both files are additive and create no enabled mailbox. 0014 upgrades an old delivery-ID
type only if it is not already text; replay leaves existing data intact. No commercial
row is rewritten. DDL needs CREATE/schema/table/function privileges and takes table locks.
Existing unrelated historical migrations are not all replay-safe (for example 0007 uses
plain CREATE); do not rerun the entire migration directory based on the older blanket
idempotency statement below. Inspect the actual applied catalog first.

After an authorized migration, provision only the intended account deliberately; never
reuse an evidence account. Receipt additionally requires provider selection, a genuine
webhook secret and the existing session key. Until then POST stays locked before DB access.
If a deployed application is rolled back, retain mail tables/data; no destructive down
migration. A failed transaction leaves no partial schema. Restoring a backup after real
receipt is a separate recovery decision because it can discard later business data.
See [Hostinger activation](../../../docs/deployment/hostinger-activation.md).

## Applying for the first time

Against a **fresh** Neon project:

```bash
# Use the connection string from Vercel / Neon dashboard.
psql "$NEON_DATABASE_URL" -f db/schema.sql
psql "$NEON_DATABASE_URL" -f db/migrations/0001-document-numbering.sql
psql "$NEON_DATABASE_URL" -f db/migrations/0002-angebote-enrichment.sql
psql "$NEON_DATABASE_URL" -f db/migrations/0003-multi-tenancy.sql
```

## Applying to the existing prod database

The baseline `schema.sql` uses `IF NOT EXISTS` everywhere, so running
it against the live DB is safe — it will create only what's missing.
Check each migration before replay. Mail 0013/0014 replay is proven; some older
migrations use plain CREATE and must not be blindly reapplied.

**Apply in this order, one at a time:**

1. `schema.sql` — confirms all baseline tables exist.
2. `0001-document-numbering.sql` — installs `next_invoice_number()` and
   `next_angebot_number()`. Sequences are backfilled from existing
   rows so no duplicate numbers will be issued.
3. `0002-angebote-enrichment.sql` — adds `included_items` and
   `payment_terms` columns. Drop the notes-folding logic in
   `app/os/(protected)/angebote/new/page.tsx` once this is live.
4. `0003-multi-tenancy.sql` — adds `owner_id` to every `os_*` table,
   creates `os_owners`, inserts Marcel as the default owner, and
   backfills existing rows.

After 0003 lands, update OS API routes to filter `WHERE owner_id =
$session.sub`. The session sub is currently the literal string
`"marcel"`; map it to Marcel's owner UUID
(`00000000-0000-0000-0000-000000000001`) until the real auth provider
arrives in Stage 3-real.

## Required env vars

Set these in `.env.local` (dev) and Vercel Project Settings (prod):

| Var                   | Purpose                                            | Required |
| --------------------- | -------------------------------------------------- | :------: |
| `NEON_DATABASE_URL`   | Neon serverless connection string                  |    ✓     |
| `OS_PASSWORD`         | OS login password (≥ 8 chars)                      |    ✓     |
| `OS_SESSION_SECRET`   | HMAC secret for session cookies (≥ 32 random chars)|    ✓     |
| `ANTHROPIC_API_KEY`   | Claude API. Required in production.                |   ✓ *    |
| `OPENAI_API_KEY`      | OpenAI fallback. Either Anthropic OR OpenAI in prod|   ✓ *    |
| `RESEND_API_KEY`      | Email delivery                                     |   prod   |
| `RESEND_FROM_EMAIL`   | Sending address (e.g. `MaxPromo <info@…>`)         |   prod   |
| `CONTACT_EMAIL`       | Where lead notifications land                      |   prod   |
| `PORTFOLIO_PASSWORD`  | Gate for `/portfolio` page                         |  optional|

*One of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` is required in
production — `lib/env.ts` validates this at boot.

To generate a strong session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```
