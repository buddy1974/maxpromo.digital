-- ────────────────────────────────────────────────────────────────────────
-- MaxPromo Digital — Neon Postgres schema
--
-- This is the source of truth for the OS database. All tables prefixed
-- `os_` are the internal business operating system. Run against a fresh
-- Neon project; safe to re-run thanks to IF NOT EXISTS.
--
-- Migrations live in db/migrations/NNNN-*.sql — apply them in order
-- after this baseline.
-- ────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── os_clients ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  name        TEXT NOT NULL,
  company     TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  postcode    TEXT,
  country     TEXT NOT NULL DEFAULT 'Deutschland',
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_os_clients_email ON os_clients (lower(email));
CREATE INDEX IF NOT EXISTS idx_os_clients_name  ON os_clients (lower(name));

-- ── os_invoices ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_invoices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  invoice_number     TEXT NOT NULL UNIQUE,
  client_id          UUID REFERENCES os_clients (id) ON DELETE SET NULL,
  client_name        TEXT NOT NULL,
  client_email       TEXT,
  client_address     TEXT,
  line_items         JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total              NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'draft',
  -- 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date           DATE,
  paid_date          DATE,
  sent_at            TIMESTAMPTZ,
  notes              TEXT,
  anzahlung          NUMERIC(12, 2) DEFAULT 0,
  anzahlung_date     DATE,
  anzahlung_method   TEXT,
  restbetrag         NUMERIC(12, 2)
);

CREATE INDEX IF NOT EXISTS idx_os_invoices_client_id ON os_invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_os_invoices_status    ON os_invoices (status);

-- ── os_angebote (quotes) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_angebote (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  angebot_number        TEXT NOT NULL UNIQUE,
  client_id             UUID REFERENCES os_clients (id) ON DELETE SET NULL,
  client_name           TEXT NOT NULL,
  client_email          TEXT,
  client_address        TEXT,
  line_items            JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal              NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total                 NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'draft',
  -- 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  valid_until           DATE,
  sent_at               TIMESTAMPTZ,
  notes                 TEXT,
  anzahlung             NUMERIC(12, 2) DEFAULT 0,
  anzahlung_date        DATE,
  anzahlung_method      TEXT,
  converted_to_invoice  BOOLEAN NOT NULL DEFAULT false,
  -- Stage-3 columns (added in 0001-enrich-angebote.sql)
  included_items        JSONB DEFAULT '[]'::jsonb,
  payment_terms         TEXT
);

CREATE INDEX IF NOT EXISTS idx_os_angebote_client_id ON os_angebote (client_id);
CREATE INDEX IF NOT EXISTS idx_os_angebote_status    ON os_angebote (status);

-- ── os_jobs (Kanban) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  title        TEXT NOT NULL,
  client_id    UUID REFERENCES os_clients (id) ON DELETE SET NULL,
  client_name  TEXT,
  description  TEXT,
  stage        TEXT NOT NULL DEFAULT 'lead',
  -- 'lead' | 'qualified' | 'proposal' | 'in_progress' | 'won' | 'lost'
  priority     TEXT NOT NULL DEFAULT 'medium',
  -- 'low' | 'medium' | 'high' | 'urgent'
  value        NUMERIC(12, 2),
  due_date     DATE,
  tags         TEXT[],
  notes        TEXT,
  invoice_id   UUID REFERENCES os_invoices (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_os_jobs_stage     ON os_jobs (stage);
CREATE INDEX IF NOT EXISTS idx_os_jobs_client_id ON os_jobs (client_id);

-- ── os_leads ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  source      TEXT NOT NULL DEFAULT 'manual',
  -- 'manual' | 'contact_form' | 'automation_audit' | 'estimate_tool' | 'discovery'
  category    TEXT,
  summary     TEXT,
  status      TEXT NOT NULL DEFAULT 'new',
  -- 'new' | 'contacted' | 'qualified' | 'converted' | 'archived'
  notes       TEXT,
  converted   BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_os_leads_status ON os_leads (status);
CREATE INDEX IF NOT EXISTS idx_os_leads_source ON os_leads (source);
CREATE INDEX IF NOT EXISTS idx_os_leads_email  ON os_leads (lower(email));

-- ── os_newsletter ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_newsletter (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  -- 'active' | 'unsubscribed' | 'bounced' | 'complained'
  source      TEXT,
  notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_os_newsletter_status ON os_newsletter (status);
