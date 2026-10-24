-- 0023 — Scheduled send, durable and server-side (Email OS).
--
-- A draft Marcel confirmed "send at <time>" is `scheduled`: the confirmation (approval) is bound to that
-- exact revision and content, like an immediate send. A sweep claims due drafts atomically
-- (scheduled → sending, once) and delivers them through the one send path (lib/mail/outbound.ts).
-- Cancelling or editing returns the draft to `draft`; a failed scheduled send returns it to `draft`
-- with the reason in schedule_error, so it is visible and never silently retried.
-- Times are stored as timestamptz (UTC); the OS shows Europe/Berlin. Schema-only, additive.

ALTER TABLE mail.drafts ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
ALTER TABLE mail.drafts ADD COLUMN IF NOT EXISTS scheduled_approval uuid;
ALTER TABLE mail.drafts ADD COLUMN IF NOT EXISTS schedule_error text CHECK (schedule_error IS NULL OR char_length(schedule_error) <= 300);
ALTER TABLE mail.drafts DROP CONSTRAINT IF EXISTS drafts_status_check;
ALTER TABLE mail.drafts ADD CONSTRAINT drafts_status_check CHECK (status IN ('draft','scheduled','sending','sent','uncertain','discarded'));
ALTER TABLE mail.drafts DROP CONSTRAINT IF EXISTS drafts_scheduled_shape;
ALTER TABLE mail.drafts ADD CONSTRAINT drafts_scheduled_shape CHECK (status <> 'scheduled' OR (scheduled_for IS NOT NULL AND scheduled_approval IS NOT NULL));
CREATE INDEX IF NOT EXISTS mail_drafts_due ON mail.drafts (scheduled_for) WHERE status = 'scheduled';
