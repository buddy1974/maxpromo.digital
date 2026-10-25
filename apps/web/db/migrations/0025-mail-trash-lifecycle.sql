-- 0025-mail-trash-lifecycle.sql — Trash as a reversible Inbox state (Inbox hygiene, 2026-10-25).
--
-- Trash in Maxpromo OS is local and reversible, like archive: the conversation leaves every view,
-- count and attention list (they all filter trashed = false) and returns unchanged on restore.
-- Hostinger keeps the message; nothing is deleted, and permanent deletion is not offered.
--
-- 1. trashed_at — when it went to Trash (the Trash view's order, and the evidence of the action).
-- 2. Nothing new is lost in Trash: a new INBOUND message threading into a trashed conversation
--    brings the conversation back (trashed = false), so the other side's reply reaches Marcel.
--    Maxpromo's own outbound copies never do (a copy of a sent mail is not news).
--
-- Idempotent.

ALTER TABLE mail.threads ADD COLUMN IF NOT EXISTS trashed_at timestamptz;
UPDATE mail.threads SET trashed_at = coalesce(trashed_at, updated_at) WHERE trashed AND trashed_at IS NULL;
CREATE INDEX IF NOT EXISTS mail_threads_trashed ON mail.threads (trashed_at DESC) WHERE trashed;

CREATE OR REPLACE FUNCTION mail.untrash_on_inbound() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.direction = 'inbound' AND NOT (coalesce(NEW.risk_signals, '[]'::jsonb) ? 'self_copy') THEN
    UPDATE mail.threads SET trashed = false, trashed_at = NULL WHERE id = NEW.thread_id AND trashed;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS mail_messages_untrash ON mail.messages;
CREATE TRIGGER mail_messages_untrash AFTER INSERT ON mail.messages
  FOR EACH ROW EXECUTE FUNCTION mail.untrash_on_inbound();
