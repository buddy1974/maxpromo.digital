-- 0028-research-calibration.sql — Marcel's judgement of a Research Agent result (field calibration, 2026-10-26).
--
-- One row per judgement Marcel records about ONE finished research run (os_agent_work). The research
-- itself is not copied: the run's summary in os_agent_work is the calibration record and never changes
-- after it finished. Rows are only ever added — changing his mind adds a row, and the newest row of a
-- run is its current review; earlier rows stay as history.
--
--   work_id      the research run judged (os_agent_work.id, agent research, state completed)
--   verdict      agree | partly | disagree
--   issues       what was wrong, from a fixed list (empty when nothing was)
--   note         optional, short
--   reviewed_by  os:marcel
--
-- A review changes nothing else: not the research, the score, the lead, its stage or any message.
-- Idempotent.

CREATE TABLE IF NOT EXISTS os_agent_work_review (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id      uuid NOT NULL REFERENCES os_agent_work (id),
  verdict      text NOT NULL CHECK (verdict IN ('agree', 'partly', 'disagree')),
  issues       text[] NOT NULL DEFAULT '{}' CHECK (issues <@ ARRAY['missed_signal', 'overstated', 'misunderstood', 'score_too_high', 'score_too_low', 'wrong_next_step']::text[]),
  note         text CHECK (note IS NULL OR char_length(note) <= 500),
  reviewed_by  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS os_agent_work_review_work ON os_agent_work_review (work_id, created_at DESC);
