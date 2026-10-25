-- 0026-universal-max.sql — Universal Max V1 (ADR-0029, 2026-10-25).
--
-- Two tables, kept apart on purpose:
--
--   os_max_interactions  what Marcel gave Max (his words, a voice transcript, or a file's metadata —
--                        never the file's bytes, never audio), the screen it came from, and what Max
--                        answered: an answer, a clarifying question, proposals, or a refusal.
--   os_max_proposals     each action Max proposed: its registered type, the one capability it maps
--                        to, the validated payload and the preview Marcel saw, and what happened —
--                        confirmed, executed through the capability, failed, rejected, expired.
--
-- Execution evidence also goes to os_audit (append-only) and to the records' own history through
-- the capabilities. No model reasoning is stored: only Marcel's input and business-facing text.
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS os_max_interactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  actor       text NOT NULL,
  input_kind  text NOT NULL CHECK (input_kind IN ('text', 'voice', 'file')),
  input_text  text NOT NULL DEFAULT '' CHECK (length(input_text) <= 4000),
  file_meta   jsonb,
  context     jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome     text NOT NULL CHECK (outcome IN ('answer', 'proposals', 'clarify', 'refused', 'failed')),
  reply       jsonb NOT NULL DEFAULT '{}'::jsonb,
  language    text CHECK (language IN ('de', 'en')),
  model       text,
  latency_ms  integer,
  request_id  text
);
CREATE INDEX IF NOT EXISTS os_max_interactions_recent ON os_max_interactions (actor, created_at DESC);

CREATE TABLE IF NOT EXISTS os_max_proposals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL REFERENCES os_max_interactions(id),
  position       integer NOT NULL DEFAULT 0,
  type           text NOT NULL,
  capability     text NOT NULL,
  confirmation   text NOT NULL CHECK (confirmation IN ('confirm', 'approve', 'none')),
  fields         jsonb NOT NULL DEFAULT '{}'::jsonb,
  grounded       jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_hash   text NOT NULL,
  status         text NOT NULL DEFAULT 'proposed'
                 CHECK (status IN ('proposed', 'executing', 'awaiting_approval', 'done', 'failed', 'refused', 'rejected', 'expired')),
  approval_id    uuid,
  result         jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  executed_at    timestamptz
);
CREATE INDEX IF NOT EXISTS os_max_proposals_interaction ON os_max_proposals (interaction_id, position);
CREATE INDEX IF NOT EXISTS os_max_proposals_open ON os_max_proposals (status) WHERE status IN ('proposed', 'awaiting_approval');
