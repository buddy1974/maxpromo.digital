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
    └── 0003-multi-tenancy.sql          ← owner_id columns, os_owners table
```

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
The migrations are also idempotent.

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
