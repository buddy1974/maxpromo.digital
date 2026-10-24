-- 0019-money-domain.sql
--
-- The Money domain around the one payment ledger (ADR-0025).
--
-- WHAT STAYS THE SOURCE OF TRUTH
--
--   os_invoices   what is owed (the invoice master; numbering, currency, deposit)
--   os_payments   money received that settles an invoice — one row per receipt,
--                 whichever rail it came through
--
-- A payment provider is a RAIL. Its records live in schema `money` and point
-- at the OS records; none of them is a second invoice, customer or payment
-- store. A Stripe charge that settles an invoice IS an os_payments row (with
-- provider='stripe'); the charge row beside it holds only what the rail adds:
-- fee, net, balance transaction, payout.
--
-- LIFECYCLE → TABLE
--
--   quote → accepted → invoice          os_angebote, os_invoices (unchanged)
--   payment request                     money.payment_links   (a stable link per invoice)
--   payment attempt                     money.checkout_sessions
--   payment                             os_payments (+ money.charges for card rail detail)
--   refund / chargeback                 money.reversals       (reduce what was received)
--   dispute                             money.disputes
--   fee, net                            money.charges
--   balance                             derived from money.charges and money.payouts
--   payout → Revolut reconciliation     money.payouts (reconciled_at, bank_reference)
--   every provider event, once          money.provider_events
--
-- Net received on an invoice = receipts − succeeded reversals, computed in ONE
-- place: money.invoice_paid(invoice_id). Every balance query calls it.
--
-- Additive only: no column dropped, no existing row rewritten. The invoice
-- status CHECK is NOT VALID, so it binds new writes and does not touch rows.
-- Safe to run more than once.

CREATE SCHEMA IF NOT EXISTS money;

-- ── os_payments: which rail a receipt came through ──────────────────────
ALTER TABLE os_payments ADD COLUMN IF NOT EXISTS provider     TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE os_payments ADD COLUMN IF NOT EXISTS provider_ref TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'os_payments_provider_check') THEN
    ALTER TABLE os_payments ADD CONSTRAINT os_payments_provider_check CHECK (provider IN ('manual', 'stripe'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'os_payments_provider_ref_check') THEN
    ALTER TABLE os_payments ADD CONSTRAINT os_payments_provider_ref_check CHECK (provider = 'manual' OR provider_ref IS NOT NULL);
  END IF;
  -- Invoice status vocabulary, for new writes. Existing rows are not re-checked.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'os_invoices_status_check') THEN
    ALTER TABLE os_invoices ADD CONSTRAINT os_invoices_status_check
      CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) NOT VALID;
  END IF;
END $$;

-- One receipt per provider payment: a replayed webhook cannot record it twice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_os_payments_provider_ref
  ON os_payments (provider, provider_ref) WHERE provider_ref IS NOT NULL;

-- ── money.reversals: refunds and lost disputes ──────────────────────────
CREATE TABLE IF NOT EXISTS money.reversals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_id    UUID NOT NULL REFERENCES os_payments (id) ON DELETE RESTRICT,
  invoice_id    UUID NOT NULL REFERENCES os_invoices (id) ON DELETE RESTRICT,
  kind          TEXT NOT NULL CHECK (kind IN ('refund', 'chargeback')),
  amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency      TEXT NOT NULL CHECK (currency IN ('EUR', 'GBP')),
  status        TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  provider      TEXT NOT NULL CHECK (provider IN ('manual', 'stripe')),
  provider_ref  TEXT,                       -- re_… / dp_…
  reason        TEXT CHECK (reason IS NULL OR length(reason) <= 300),
  effective_on  DATE,
  actor         TEXT NOT NULL,
  approval_id   UUID,
  CHECK (provider = 'manual' OR provider_ref IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_money_reversals_provider_ref
  ON money.reversals (provider, kind, provider_ref) WHERE provider_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_money_reversals_invoice ON money.reversals (invoice_id);
CREATE INDEX IF NOT EXISTS idx_money_reversals_payment ON money.reversals (payment_id);

-- Net received on one invoice. The single definition; see lib/commercial/money.ts.
CREATE OR REPLACE FUNCTION money.invoice_paid(p_invoice UUID) RETURNS NUMERIC
LANGUAGE sql STABLE AS $$
  SELECT coalesce((SELECT sum(amount) FROM os_payments WHERE invoice_id = p_invoice), 0)
       - coalesce((SELECT sum(amount) FROM money.reversals WHERE invoice_id = p_invoice AND status = 'succeeded'), 0)
$$;

-- ── money.payment_links: the payment request ────────────────────────────
-- One stable link per invoice (maxpromo.digital/<lang>/pay/<token>). It never
-- expires on its own: each click asks for the invoice's CURRENT open balance,
-- so a paid invoice says so and a part-paid one asks for the rest. A GET only
-- shows the page; a checkout is started by an explicit POST.
CREATE TABLE IF NOT EXISTS money.payment_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  invoice_id      UUID NOT NULL REFERENCES os_invoices (id) ON DELETE RESTRICT,
  token           TEXT NOT NULL UNIQUE CHECK (token ~ '^[A-Za-z0-9_-]{32,64}$'),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_by      TEXT NOT NULL,
  revoked_at      TIMESTAMPTZ,
  revoked_by      TEXT,
  opened_count    INTEGER NOT NULL DEFAULT 0,
  last_opened_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_money_payment_links_active
  ON money.payment_links (invoice_id) WHERE status = 'active';

-- ── money.checkout_sessions: payment attempts ───────────────────────────
-- The row exists before the provider is called, with the idempotency key the
-- call uses, so an unanswered call is retried under the same key and finds
-- the same session instead of opening a second one.
CREATE TABLE IF NOT EXISTS money.checkout_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  link_id           UUID REFERENCES money.payment_links (id) ON DELETE RESTRICT,
  invoice_id        UUID NOT NULL REFERENCES os_invoices (id) ON DELETE RESTRICT,
  provider          TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe')),
  provider_session  TEXT UNIQUE,            -- cs_…
  payment_intent    TEXT UNIQUE,            -- pi_…
  url               TEXT CHECK (url IS NULL OR url LIKE 'https://%'),
  amount            NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency          TEXT NOT NULL CHECK (currency IN ('EUR', 'GBP')),
  livemode          BOOLEAN NOT NULL,
  idempotency_key   TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'creating'
                    CHECK (status IN ('creating', 'open', 'processing', 'paid', 'failed', 'expired', 'cancelled', 'uncertain')),
  expires_at        TIMESTAMPTZ,
  method_type       TEXT,
  failure_code      TEXT
);
CREATE INDEX IF NOT EXISTS idx_money_sessions_invoice ON money.checkout_sessions (invoice_id, created_at DESC);
-- One session being created per invoice at a time: a double click retries the
-- same row (same idempotency key) instead of opening a second checkout.
CREATE UNIQUE INDEX IF NOT EXISTS uq_money_sessions_creating
  ON money.checkout_sessions (invoice_id) WHERE status IN ('creating', 'uncertain');

-- ── money.charges: what the card rail adds to a payment ─────────────────
-- `state = 'unapplied'` is money that reached the rail but settles no invoice
-- (unknown session, currency mismatch, would overpay): never written into
-- os_payments silently, always shown for reconciliation.
CREATE TABLE IF NOT EXISTS money.charges (
  provider_charge   TEXT PRIMARY KEY,       -- ch_… / py_…
  provider          TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe')),
  payment_intent    TEXT NOT NULL UNIQUE,   -- pi_…
  session_id        UUID REFERENCES money.checkout_sessions (id) ON DELETE RESTRICT,
  invoice_id        UUID REFERENCES os_invoices (id) ON DELETE RESTRICT,
  payment_id        UUID UNIQUE REFERENCES os_payments (id) ON DELETE RESTRICT,
  gross             NUMERIC(12, 2) NOT NULL CHECK (gross > 0),
  fee               NUMERIC(12, 2) CHECK (fee IS NULL OR fee >= 0),
  net               NUMERIC(12, 2),
  currency          TEXT NOT NULL,
  method_type       TEXT,
  balance_txn       TEXT UNIQUE,            -- txn_…
  available_on      DATE,
  payout_id         TEXT,
  livemode          BOOLEAN NOT NULL,
  state             TEXT NOT NULL CHECK (state IN ('applied', 'unapplied')),
  unapplied_reason  TEXT,
  -- Marcel handled an unapplied charge (refunded it, applied it by hand, accepted it).
  resolved_at       TIMESTAMPTZ,
  resolved_by       TEXT,
  resolution_note   TEXT CHECK (resolution_note IS NULL OR length(resolution_note) <= 300),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (fee IS NULL OR net = gross - fee),
  CHECK (state = 'unapplied' OR payment_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_money_charges_invoice ON money.charges (invoice_id);
CREATE INDEX IF NOT EXISTS idx_money_charges_payout  ON money.charges (payout_id);

-- ── money.disputes ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS money.disputes (
  provider_dispute  TEXT PRIMARY KEY,       -- dp_…
  provider          TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe')),
  provider_charge   TEXT NOT NULL,
  invoice_id        UUID REFERENCES os_invoices (id) ON DELETE RESTRICT,
  amount            NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency          TEXT NOT NULL,
  reason            TEXT,
  status            TEXT NOT NULL,          -- warning_needs_response, needs_response, under_review, won, lost …
  evidence_due      TIMESTAMPTZ,
  livemode          BOOLEAN NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── money.payouts: rail → Revolut ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS money.payouts (
  provider_payout   TEXT PRIMARY KEY,       -- po_…
  provider          TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe')),
  amount            NUMERIC(12, 2) NOT NULL,
  currency          TEXT NOT NULL,
  arrival_date      DATE,
  status            TEXT NOT NULL CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'canceled')),
  destination_last4 TEXT CHECK (destination_last4 IS NULL OR destination_last4 ~ '^[0-9]{4}$'),
  failure_code      TEXT,
  livemode          BOOLEAN NOT NULL,
  -- Marcel confirms the payout arrived on the Revolut statement.
  reconciled_at     TIMESTAMPTZ,
  reconciled_by     TEXT,
  bank_reference    TEXT CHECK (bank_reference IS NULL OR length(bank_reference) <= 120),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── money.provider_events: every verified webhook event, once ───────────
-- A duplicate delivery hits the primary key. An event whose processing did
-- not finish (`received`, `failed`) is processed again on redelivery; the
-- processing itself is idempotent.
CREATE TABLE IF NOT EXISTS money.provider_events (
  provider      TEXT NOT NULL CHECK (provider IN ('stripe')),
  event_id      TEXT NOT NULL,              -- evt_…
  type          TEXT NOT NULL,
  livemode      BOOLEAN NOT NULL,
  object_id     TEXT,
  invoice_id    UUID REFERENCES os_invoices (id) ON DELETE RESTRICT,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- When the current processing attempt started. A concurrent redelivery of an
  -- event still being processed is answered 409 so the provider retries later.
  claimed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at    TIMESTAMPTZ,
  attempts      INTEGER NOT NULL DEFAULT 1,
  outcome       TEXT NOT NULL DEFAULT 'received'
                CHECK (outcome IN ('received', 'applied', 'ignored', 'reconcile', 'failed')),
  detail        JSONB NOT NULL DEFAULT '{}'::jsonb,   -- ids and amounts only; never card data
  error         TEXT,
  resolved_at   TIMESTAMPTZ,                -- Marcel handled a reconcile item
  resolved_by   TEXT,
  resolution_note TEXT CHECK (resolution_note IS NULL OR length(resolution_note) <= 300),
  PRIMARY KEY (provider, event_id)
);
CREATE INDEX IF NOT EXISTS idx_money_events_open
  ON money.provider_events (received_at) WHERE outcome IN ('reconcile', 'failed') AND resolved_at IS NULL;
