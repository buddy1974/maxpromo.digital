-- 0010-document-language.sql
--
-- Document language (Deutsch/English) — independent of the OS interface
-- language. Controls which language an individual Invoice or Angebot is
-- rendered, emailed and named in: labels, table headings, payment
-- instructions, totals, and the §19 UStG clause.
--
-- Existing rows have no language recorded — the deterministic fallback is
-- 'de' (the business's original, only-ever-used language before this
-- migration), so nothing changes visually for any document already sent.
--
-- Safe to run multiple times.

ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de';
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'os_invoices_language_check'
  ) THEN
    ALTER TABLE os_invoices
      ADD CONSTRAINT os_invoices_language_check
      CHECK (language IN ('de', 'en'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'os_angebote_language_check'
  ) THEN
    ALTER TABLE os_angebote
      ADD CONSTRAINT os_angebote_language_check
      CHECK (language IN ('de', 'en'));
  END IF;
END $$;
