-- PROPOSED — NOT A MIGRATION. Design for Phase A (Stripe ↔ Maxpromo Money), reviewed before it
-- moves to apps/web/db/migrations/. Additive; every external id is unique so replays are harmless.
-- Stripe is a payment rail: invoices, clients and the payment ledger stay in the OS tables.

-- One payment request (Checkout Session / Payment Link) per invoice revision.
CREATE TABLE IF NOT EXISTS stripe_payment_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES os_invoices(id) ON DELETE RESTRICT,
  stripe_object   text NOT NULL UNIQUE,              -- cs_… or plink_…
  url             text NOT NULL CHECK (url LIKE 'https://%'),
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),
  currency        text NOT NULL CHECK (currency IN ('EUR','GBP')),
  idempotency_key text NOT NULL UNIQUE,              -- invoice:<id>:<open>:<revision>
  status          text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','pending','succeeded','failed','expired','cancelled')),
  livemode        boolean NOT NULL,
  approval_id     uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_stripe_open_request_per_invoice ON stripe_payment_requests(invoice_id) WHERE status IN ('requested','pending');

-- Every verified webhook event, once. A duplicate delivery hits the primary key and does nothing.
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id     text PRIMARY KEY,                     -- evt_…
  type         text NOT NULL,
  livemode     boolean NOT NULL,
  object_id    text,
  invoice_id   uuid REFERENCES os_invoices(id),
  received_at  timestamptz NOT NULL DEFAULT now(),
  applied_at   timestamptz,
  outcome      text NOT NULL DEFAULT 'received' CHECK (outcome IN ('received','applied','ignored','reconcile','failed')),
  detail       jsonb NOT NULL DEFAULT '{}'           -- ids and amounts only; never card data
);
CREATE INDEX IF NOT EXISTS stripe_events_reconcile ON stripe_events(received_at) WHERE outcome IN ('reconcile','failed');

-- Gross, fee and net per successful charge; os_payments holds the gross that settles the invoice.
CREATE TABLE IF NOT EXISTS stripe_charges (
  charge_id        text PRIMARY KEY,                 -- ch_… / py_…
  payment_intent   text NOT NULL UNIQUE,             -- pi_…
  invoice_id       uuid NOT NULL REFERENCES os_invoices(id),
  os_payment_id    uuid UNIQUE REFERENCES os_payments(id),
  gross            numeric(12,2) NOT NULL,
  fee              numeric(12,2) NOT NULL,
  net              numeric(12,2) NOT NULL,
  currency         text NOT NULL,
  balance_txn      text UNIQUE,                      -- txn_…
  available_on     date,
  payout_id        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (net = gross - fee)
);

CREATE TABLE IF NOT EXISTS stripe_refunds (
  refund_id    text PRIMARY KEY,                     -- re_…
  charge_id    text NOT NULL REFERENCES stripe_charges(charge_id),
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  currency     text NOT NULL,
  status       text NOT NULL CHECK (status IN ('pending','succeeded','failed','canceled')),
  approval_id  uuid,                                 -- refunds are AMBER, owner-approved
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_disputes (
  dispute_id   text PRIMARY KEY,                     -- dp_…
  charge_id    text NOT NULL REFERENCES stripe_charges(charge_id),
  amount       numeric(12,2) NOT NULL,
  currency     text NOT NULL,
  reason       text,
  status       text NOT NULL,                        -- needs_response, under_review, won, lost …
  evidence_due timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_payouts (
  payout_id     text PRIMARY KEY,                    -- po_…
  amount        numeric(12,2) NOT NULL,
  currency      text NOT NULL,
  arrival_date  date,
  status        text NOT NULL CHECK (status IN ('pending','in_transit','paid','failed','canceled')),
  destination   text,                                -- last4 of the Revolut account only
  failure_code  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- os_payments.method gains the value 'stripe' (free text today); reference holds the pi_… id.
