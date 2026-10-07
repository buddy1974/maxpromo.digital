-- 0011-commercial-core.sql
--
-- The commercial records the mobile operating layer needs, added to the one
-- database that already owns Maxpromo's commercial truth (ADR-0018).
--
-- WHY HERE
--
-- Telegram is an interface and OpenClaw is the execution layer. Neither may
-- become the place a lead, an Angebot, a payment or a follow-up lives. The OS
-- already owns clients, leads, quotations, invoices, document numbering and
-- the legal identity, so the missing commercial records join them rather than
-- starting a second store next to them.
--
-- WHAT IT ADDS
--
--   os_leads        pipeline fields: value, next action, last interaction,
--                   website, research facts, the service of interest.
--                   `status` stays the ONE pipeline field; its vocabulary is
--                   defined in lib/commercial/pipeline.ts. Legacy values
--                   (new, converted, archived) are mapped in code, never
--                   rewritten here — this migration changes no existing row.
--   os_activities   the commercial history of a lead, client or project.
--   os_followups    a dated next action that references a real record.
--   os_payments     money actually received, one row per receipt.
--   os_recurring    maintenance, hosting, retainers.
--   os_incidents    lightweight operational incidents for client systems.
--   os_files        metadata for business files; bytes live in storage the
--                   row names, never only inside a chat.
--   os_approvals    consequential actions prepared and waiting, bound to the
--                   exact payload by hash. Single use.
--   os_audit        append-only record of consequential commercial actions.
--   os_agent_nonces replay protection for the signed agent API.
--
-- Links added so one record leads to the next: angebot → lead, job, invoice
-- kind (deposit / final), invoice → angebot and job, job → lead and angebot.
--
-- Safe to run multiple times. Additive only: no column is dropped, no
-- existing value is rewritten, no constraint is tightened on existing data.

-- ── os_leads: pipeline ──────────────────────────────────────────────────
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS website             TEXT;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS city                TEXT;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS business_type       TEXT;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS language            TEXT;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS service_interest    TEXT;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS value               NUMERIC(12, 2);
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS currency            TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS next_action         TEXT;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS next_action_at      DATE;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS research            JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS client_id           UUID REFERENCES os_clients (id) ON DELETE SET NULL;
ALTER TABLE os_leads ADD COLUMN IF NOT EXISTS lost_reason         TEXT;

CREATE INDEX IF NOT EXISTS idx_os_leads_next_action_at ON os_leads (next_action_at);
CREATE INDEX IF NOT EXISTS idx_os_leads_company        ON os_leads (lower(company));
CREATE INDEX IF NOT EXISTS idx_os_leads_phone          ON os_leads (phone);
CREATE INDEX IF NOT EXISTS idx_os_leads_website        ON os_leads (lower(website));

-- ── links between documents and projects ────────────────────────────────
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS lead_id     UUID REFERENCES os_leads (id) ON DELETE SET NULL;
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS job_id      UUID REFERENCES os_jobs  (id) ON DELETE SET NULL;
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS angebot_id  UUID REFERENCES os_angebote (id) ON DELETE SET NULL;
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS job_id      UUID REFERENCES os_jobs     (id) ON DELETE SET NULL;
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS kind        TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE os_jobs ADD COLUMN IF NOT EXISTS lead_id     UUID REFERENCES os_leads    (id) ON DELETE SET NULL;
ALTER TABLE os_jobs ADD COLUMN IF NOT EXISTS angebot_id  UUID REFERENCES os_angebote (id) ON DELETE SET NULL;
ALTER TABLE os_jobs ADD COLUMN IF NOT EXISTS repository  TEXT;
ALTER TABLE os_jobs ADD COLUMN IF NOT EXISTS domain      TEXT;
ALTER TABLE os_jobs ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_os_angebote_lead_id ON os_angebote (lead_id);
CREATE INDEX IF NOT EXISTS idx_os_invoices_angebot ON os_invoices (angebot_id);
CREATE INDEX IF NOT EXISTS idx_os_invoices_due     ON os_invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_os_jobs_lead_id     ON os_jobs (lead_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'os_invoices_kind_check') THEN
    ALTER TABLE os_invoices ADD CONSTRAINT os_invoices_kind_check
      CHECK (kind IN ('standard', 'deposit', 'final'));
  END IF;
  /* One project per accepted quotation. A retried acceptance must find the
     project the first attempt created, not create a second. */
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'os_jobs_angebot_unique') THEN
    ALTER TABLE os_jobs ADD CONSTRAINT os_jobs_angebot_unique UNIQUE (angebot_id);
  END IF;
END $$;

-- One deposit and one final invoice per quotation, enforced by the database
-- rather than by remembering to check. A standard invoice is unconstrained.
CREATE UNIQUE INDEX IF NOT EXISTS uq_os_invoices_angebot_kind
  ON os_invoices (angebot_id, kind)
  WHERE angebot_id IS NOT NULL AND kind IN ('deposit', 'final');

-- ── os_activities ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id      UUID REFERENCES os_leads    (id) ON DELETE CASCADE,
  client_id    UUID REFERENCES os_clients  (id) ON DELETE CASCADE,
  job_id       UUID REFERENCES os_jobs     (id) ON DELETE CASCADE,
  angebot_id   UUID REFERENCES os_angebote (id) ON DELETE SET NULL,
  invoice_id   UUID REFERENCES os_invoices (id) ON DELETE SET NULL,
  kind         TEXT NOT NULL,
  channel      TEXT,
  summary      TEXT NOT NULL,
  detail       JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor        TEXT NOT NULL,
  external_ref TEXT,
  CONSTRAINT os_activities_has_subject CHECK (lead_id IS NOT NULL OR client_id IS NOT NULL OR job_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_os_activities_lead   ON os_activities (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_os_activities_client ON os_activities (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_os_activities_job    ON os_activities (job_id, created_at DESC);

-- ── os_followups ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_followups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_on      DATE NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  lead_id     UUID REFERENCES os_leads    (id) ON DELETE CASCADE,
  client_id   UUID REFERENCES os_clients  (id) ON DELETE CASCADE,
  angebot_id  UUID REFERENCES os_angebote (id) ON DELETE CASCADE,
  invoice_id  UUID REFERENCES os_invoices (id) ON DELETE CASCADE,
  /* Only when the follow-up should disappear if the other side writes first. */
  unless_reply BOOLEAN NOT NULL DEFAULT false,
  done_at     TIMESTAMPTZ,
  actor       TEXT NOT NULL,
  CONSTRAINT os_followups_has_subject CHECK (
    lead_id IS NOT NULL OR client_id IS NOT NULL OR angebot_id IS NOT NULL OR invoice_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_os_followups_open ON os_followups (due_on) WHERE status = 'open';
-- No two open follow-ups for the same record on the same day. "Remind me
-- Friday" said twice is one reminder.
CREATE UNIQUE INDEX IF NOT EXISTS uq_os_followups_open_subject_day ON os_followups (
  coalesce(lead_id,    '00000000-0000-0000-0000-000000000000'),
  coalesce(client_id,  '00000000-0000-0000-0000-000000000000'),
  coalesce(angebot_id, '00000000-0000-0000-0000-000000000000'),
  coalesce(invoice_id, '00000000-0000-0000-0000-000000000000'),
  due_on) WHERE status = 'open';

-- ── os_payments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  invoice_id   UUID NOT NULL REFERENCES os_invoices (id) ON DELETE RESTRICT,
  amount       NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency     TEXT NOT NULL,
  received_on  DATE NOT NULL,
  method       TEXT,
  reference    TEXT,
  actor        TEXT NOT NULL,
  approval_id  UUID
);
CREATE INDEX IF NOT EXISTS idx_os_payments_invoice  ON os_payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_os_payments_received ON os_payments (received_on);

-- ── os_recurring ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_recurring (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id     UUID NOT NULL REFERENCES os_clients (id) ON DELETE RESTRICT,
  job_id        UUID REFERENCES os_jobs (id) ON DELETE SET NULL,
  service       TEXT NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency      TEXT NOT NULL DEFAULT 'EUR',
  frequency     TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  starts_on     DATE NOT NULL,
  next_renewal  DATE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  notes         TEXT
);
CREATE INDEX IF NOT EXISTS idx_os_recurring_renewal ON os_recurring (next_renewal) WHERE status = 'active';

-- ── os_incidents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_incidents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id    UUID REFERENCES os_clients (id) ON DELETE SET NULL,
  job_id       UUID REFERENCES os_jobs    (id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  severity     TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status       TEXT NOT NULL DEFAULT 'open'
               CHECK (status IN ('open', 'investigating', 'fixed', 'monitoring', 'closed')),
  source       TEXT,
  cause        TEXT,
  resolution   TEXT,
  timeline     JSONB NOT NULL DEFAULT '[]'::jsonb,
  /* Twenty alerts for one outage are one incident. */
  dedupe_key   TEXT,
  actor        TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_os_incidents_open_dedupe
  ON os_incidents (dedupe_key) WHERE dedupe_key IS NOT NULL AND status <> 'closed';

-- ── os_files ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id      UUID REFERENCES os_leads   (id) ON DELETE SET NULL,
  client_id    UUID REFERENCES os_clients (id) ON DELETE SET NULL,
  job_id       UUID REFERENCES os_jobs    (id) ON DELETE SET NULL,
  filename     TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   BIGINT NOT NULL CHECK (size_bytes >= 0),
  sha256       TEXT NOT NULL,
  /* Where the bytes are, e.g. "openclaw-attachment:<id>". Never "telegram:". */
  storage_ref  TEXT NOT NULL CHECK (storage_ref NOT LIKE 'telegram:%'),
  label        TEXT,
  actor        TEXT NOT NULL,
  CONSTRAINT os_files_has_subject CHECK (lead_id IS NOT NULL OR client_id IS NOT NULL OR job_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_os_files_subject_hash ON os_files (
  coalesce(lead_id,   '00000000-0000-0000-0000-000000000000'),
  coalesce(client_id, '00000000-0000-0000-0000-000000000000'),
  coalesce(job_id,    '00000000-0000-0000-0000-000000000000'),
  sha256);

-- ── os_approvals ────────────────────────────────────────────────────────
-- One approval concept. A consequential action is prepared, its exact payload
-- is hashed, and it can be executed once, by the hash it was prepared with,
-- before it expires. Editing the payload means preparing a new approval.
CREATE TABLE IF NOT EXISTS os_approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  capability    TEXT NOT NULL,
  risk          TEXT NOT NULL CHECK (risk IN ('AMBER', 'RED')),
  summary       TEXT NOT NULL,
  preview       JSONB NOT NULL,
  payload       JSONB NOT NULL,
  payload_hash  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'executing', 'executed', 'failed', 'rejected', 'expired', 'superseded')),
  expires_at    TIMESTAMPTZ NOT NULL,
  requested_by  TEXT NOT NULL,
  decided_by    TEXT,
  decided_at    TIMESTAMPTZ,
  result        JSONB,
  /* Two preparations of the same action are one approval. */
  dedupe_key    TEXT
);
CREATE INDEX IF NOT EXISTS idx_os_approvals_pending ON os_approvals (created_at DESC) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS uq_os_approvals_pending_dedupe
  ON os_approvals (dedupe_key) WHERE dedupe_key IS NOT NULL AND status = 'pending';

-- ── os_audit ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS os_audit (
  id            BIGSERIAL PRIMARY KEY,
  owner_id      UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES os_owners (id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor         TEXT NOT NULL,
  channel       TEXT NOT NULL,
  operation     TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     TEXT,
  before_state  JSONB,
  after_state   JSONB,
  payload_hash  TEXT,
  approval_id   UUID,
  outcome       TEXT NOT NULL CHECK (outcome IN ('succeeded', 'failed', 'refused', 'uncertain')),
  external_ref  TEXT,
  error         TEXT
);
CREATE INDEX IF NOT EXISTS idx_os_audit_entity ON os_audit (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_os_audit_time   ON os_audit (created_at DESC);

-- Append-only. An audit row that can be edited is a note, not an audit.
CREATE OR REPLACE FUNCTION os_audit_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'os_audit is append-only';
END;
$$;
DROP TRIGGER IF EXISTS trg_os_audit_append_only ON os_audit;
CREATE TRIGGER trg_os_audit_append_only
  BEFORE UPDATE OR DELETE ON os_audit
  FOR EACH ROW EXECUTE FUNCTION os_audit_append_only();

-- ── os_agent_nonces ─────────────────────────────────────────────────────
-- A signed agent request is accepted once. The nonce is kept past the
-- signature window so a replay inside it is refused by the primary key.
CREATE TABLE IF NOT EXISTS os_agent_nonces (
  nonce       TEXT PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_os_agent_nonces_time ON os_agent_nonces (received_at);

-- ── os_agent_results ────────────────────────────────────────────────────
-- A retried request returns the first answer. The caller names each logical
-- request (Mission Control uses its turn id); a timeout after the OS has
-- committed must not create a second draft or consume a second number.
CREATE TABLE IF NOT EXISTS os_agent_results (
  request_id   TEXT PRIMARY KEY,
  capability   TEXT NOT NULL,
  input_hash   TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('running', 'done')),
  response     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
