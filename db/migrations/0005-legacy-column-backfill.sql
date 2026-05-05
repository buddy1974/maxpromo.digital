-- 0005-legacy-column-backfill.sql
--
-- Production's os_invoices and os_angebote tables predate the current
-- API code. They're missing the Anzahlung (deposit) trio, the FK link
-- to os_clients, and a couple of timestamp columns the route handlers
-- write to.
--
-- We discovered this when an Angebot save returned 500 with detail:
--   "column anzahlung_method of relation os_angebote does not exist"
--
-- This migration adds every column the route handlers expect, IF NOT
-- EXISTS, so it's safe on any prior version of the schema. Brand-new
-- DBs created from db/schema.sql already have all of these and this
-- migration is a no-op.

-- ── os_angebote ────────────────────────────────────────────────────
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS client_id            UUID REFERENCES os_clients (id) ON DELETE SET NULL;
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS anzahlung            NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS anzahlung_date       DATE;
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS anzahlung_method     TEXT;
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS sent_at              TIMESTAMPTZ;
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS converted_to_invoice BOOLEAN NOT NULL DEFAULT false;

-- ── os_invoices ────────────────────────────────────────────────────
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS client_id            UUID REFERENCES os_clients (id) ON DELETE SET NULL;
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS anzahlung            NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS anzahlung_date       DATE;
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS anzahlung_method     TEXT;
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS restbetrag           NUMERIC(12, 2);
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS sent_at              TIMESTAMPTZ;
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS paid_date            DATE;

-- ── os_jobs ────────────────────────────────────────────────────────
-- The jobs route writes invoice_id when an Angebot converts. Make sure
-- it exists on older databases too.
ALTER TABLE os_jobs ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES os_invoices (id) ON DELETE SET NULL;
ALTER TABLE os_jobs ADD COLUMN IF NOT EXISTS tags       TEXT[];

-- ── os_clients ─────────────────────────────────────────────────────
-- A few columns the schema baseline has but older prod might not.
ALTER TABLE os_clients ADD COLUMN IF NOT EXISTS postcode  TEXT;
ALTER TABLE os_clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── os_leads ───────────────────────────────────────────────────────
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS phone     TEXT;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS category  TEXT;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS converted BOOLEAN NOT NULL DEFAULT false;

-- ── os_newsletter ──────────────────────────────────────────────────
ALTER TABLE os_newsletter ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE os_newsletter ADD COLUMN IF NOT EXISTS notes  TEXT;
