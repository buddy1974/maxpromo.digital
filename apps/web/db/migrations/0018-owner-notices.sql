-- Owner Control Plane delivery ledger (ADR-0024). Additive and replayable.
-- One row per notice key that reached Marcel's phone. owner.notices keys are stable for as long as
-- the situation is the same, so a key delivered once is never sent again: twenty checks of one
-- overdue invoice are one message.
CREATE TABLE IF NOT EXISTS os_owner_notices (
 notice_key text PRIMARY KEY CHECK (char_length(notice_key) <= 300),
 channel text NOT NULL DEFAULT 'telegram' CHECK (channel IN ('telegram')),
 severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
 claimed_at timestamptz NOT NULL DEFAULT now(),
 delivered_at timestamptz,
 outcome text NOT NULL DEFAULT 'claimed' CHECK (outcome IN ('claimed','delivered','failed','suppressed'))
);
CREATE INDEX IF NOT EXISTS os_owner_notices_recent ON os_owner_notices(claimed_at DESC);
