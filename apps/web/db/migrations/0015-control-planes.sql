-- 0015-control-planes.sql
--
-- The Business Control Plane's side of the OS ↔ Agent Bureau contract (ADR-0021).
--
--   os_intake_receipts   one row per inbound enquiry a channel or the Agent
--                        Bureau hands to the OS, keyed by (source, external_ref).
--                        It is the permanent idempotency ledger: a retried or
--                        replayed enquiry finds its receipt and never creates a
--                        second lead. It records whether the enquiry created a
--                        lead or matched an existing one.
--
--   os_agent_events      what the Agent Control Plane reports that may need the
--                        owner: an agent blocked, failed, finished important
--                        work, found an exception or recommends something. The
--                        OS stores the projection it shows on /os; the run
--                        itself, its memory and its cost stay in the Bureau.
--                        (client, event_id) is unique, so a resent event is one
--                        row. Text here is agent output: shown as text, never
--                        executed or treated as instructions.
--
-- Additive and idempotent. No existing table or value changes.

CREATE TABLE IF NOT EXISTS os_intake_receipts (
  source        TEXT        NOT NULL CHECK (source ~ '^[a-z][a-z0-9_]{1,40}$'),
  external_ref  TEXT        NOT NULL CHECK (char_length(external_ref) BETWEEN 1 AND 120),
  lead_id       UUID        REFERENCES os_leads (id) ON DELETE SET NULL,
  outcome       TEXT        NOT NULL CHECK (outcome IN ('created', 'matched')),
  actor         TEXT        NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (source, external_ref)
);
CREATE INDEX IF NOT EXISTS idx_os_intake_receipts_lead ON os_intake_receipts (lead_id);

CREATE TABLE IF NOT EXISTS os_agent_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client           TEXT        NOT NULL CHECK (client IN ('bureau')),
  event_id         TEXT        NOT NULL CHECK (char_length(event_id) BETWEEN 8 AND 120),
  agent            TEXT        NOT NULL,
  kind             TEXT        NOT NULL CHECK (kind IN ('completed', 'blocked', 'failed', 'exception', 'recommendation', 'waiting')),
  severity         TEXT        NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title            TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  detail           TEXT        CHECK (detail IS NULL OR char_length(detail) <= 1000),
  run_id           TEXT        CHECK (run_id IS NULL OR char_length(run_id) <= 120),
  business_kind    TEXT        CHECK (business_kind IS NULL OR business_kind IN ('lead', 'client', 'angebot', 'invoice', 'job', 'email_thread')),
  business_id      TEXT,
  approval_id      UUID        REFERENCES os_approvals (id) ON DELETE SET NULL,
  occurred_at      TIMESTAMPTZ NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at  TIMESTAMPTZ,
  acknowledged_by  TEXT,
  UNIQUE (client, event_id)
);
CREATE INDEX IF NOT EXISTS idx_os_agent_events_open ON os_agent_events (received_at DESC) WHERE acknowledged_at IS NULL;
