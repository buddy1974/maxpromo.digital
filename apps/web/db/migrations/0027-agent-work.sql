-- 0027-agent-work.sql — delegated agent work, the OS side (ADR-0030, 2026-10-26).
--
-- One row per piece of work the OS delegated to an Agent Bureau agent. The OS chooses the id and
-- the Bureau uses it as the idempotency key of its own work item: one id, one execution.
--
--   agent / capability   which Bureau agent, doing which registered thing (research → lead.research)
--   subject              the OS record the work is about (the lead); the result is applied there
--   requested_by/source  os:marcel through max or the lead screen; max_proposal links the Max card
--   state                queued → running → completed | failed | cancelled — what the OS knows
--   summary              the business-facing outcome (score, qualified, recommendation) for Max and
--                        the lead screen; the full findings live on the lead (os_leads.research.site)
--   failure              { category, reason, detail, retryable } — never a secret, never reasoning
--   runtime              { model, latencyMs, attempt } as the Bureau reported it
--
-- The audit of each step is os_audit (agentwork.request, agentwork.result) and the lead's timeline.
-- Idempotent.

CREATE TABLE IF NOT EXISTS os_agent_work (
  id             uuid PRIMARY KEY,
  agent          text NOT NULL CHECK (agent IN ('research')),
  capability     text NOT NULL,
  subject_kind   text NOT NULL CHECK (subject_kind IN ('lead')),
  subject_id     uuid NOT NULL,
  requested_by   text NOT NULL,
  source         text NOT NULL,
  max_proposal   uuid,
  state          text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  summary        jsonb,
  failure        jsonb,
  runtime        jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  started_at     timestamptz,
  finished_at    timestamptz,
  checked_at     timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS os_agent_work_subject ON os_agent_work (subject_kind, subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS os_agent_work_open ON os_agent_work (state) WHERE state IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS os_agent_work_proposal ON os_agent_work (max_proposal) WHERE max_proposal IS NOT NULL;
