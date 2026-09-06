-- 0002-angebote-enrichment.sql
--
-- Add structured columns for the AI enhancer's richer output so we stop
-- folding included items + payment terms into the notes field.
--
-- Safe to run multiple times.

ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS included_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS payment_terms  TEXT;

ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS included_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS payment_terms  TEXT;
