-- 0024-client-foundation.sql — clients become trustworthy business entities (Foundation repair, 2026-10-25).
--
-- 1. The fields the client form always collected but had nowhere to keep: website, language, source.
-- 2. Archive instead of delete: archived_at (status 'archived'); reversible, history untouched.
-- 3. No silent destruction. Every reference to a client becomes NO ACTION: a client that has an
--    invoice, quote, job, lead, follow-up, activity, file, recurring service or chat cannot be
--    removed by the database, whatever the application does. Before this, deleting a client
--    erased its activities and follow-ups (CASCADE) and quietly orphaned its invoices, quotes,
--    leads and jobs (SET NULL). NO ACTION (not RESTRICT) is checked at the end of the statement, so
--    the one governed permanent delete of an empty client can remove its own lifecycle notes and
--    the client in a single statement.
-- 4. Client documents keep their bytes in Postgres (as draft attachments do, 0020): os_files gains
--    `content`; storage_ref 'db' marks such a row. Type and size are decided by the application
--    from the bytes (lib/mail/draftAttachments attachableType), not by the browser.
--
-- Idempotent; safe to run twice.

ALTER TABLE os_clients ADD COLUMN IF NOT EXISTS website     TEXT;
ALTER TABLE os_clients ADD COLUMN IF NOT EXISTS language    TEXT;
ALTER TABLE os_clients ADD COLUMN IF NOT EXISTS source      TEXT;
ALTER TABLE os_clients ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'os_clients_language_check') THEN
    ALTER TABLE os_clients ADD CONSTRAINT os_clients_language_check CHECK (language IS NULL OR language IN ('de', 'en', 'fr'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'os_clients_archive_shape') THEN
    -- Archived means both, so a list filter on either can never disagree with the other.
    UPDATE os_clients SET archived_at = coalesce(archived_at, updated_at, now()) WHERE status = 'archived' AND archived_at IS NULL;
    UPDATE os_clients SET status = 'archived' WHERE archived_at IS NOT NULL AND status <> 'archived';
    ALTER TABLE os_clients ADD CONSTRAINT os_clients_archive_shape CHECK ((status = 'archived') = (archived_at IS NOT NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_os_clients_active ON os_clients (created_at DESC) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_os_clients_phone  ON os_clients (regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'));

-- Every foreign key onto os_clients(id) becomes NO ACTION, whatever it was called and whatever it did.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname, n.nspname, t.relname, a.attname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f' AND c.confrelid = 'public.os_clients'::regclass AND c.confdeltype <> 'a'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', r.nspname, r.relname, r.conname);
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.os_clients (id) ON DELETE NO ACTION',
                   r.nspname, r.relname, r.conname, r.attname);
  END LOOP;
END $$;

-- Client documents: bytes in the row, at most 8 MB (the application enforces the same and the type).
ALTER TABLE os_files ADD COLUMN IF NOT EXISTS content BYTEA;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'os_files_content_shape') THEN
    ALTER TABLE os_files ADD CONSTRAINT os_files_content_shape CHECK (
      content IS NULL OR (storage_ref = 'db' AND octet_length(content) = size_bytes AND size_bytes <= 8388608));
  END IF;
END $$;
