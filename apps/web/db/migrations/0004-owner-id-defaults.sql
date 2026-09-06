-- 0004-owner-id-defaults.sql
--
-- Bridge fix: 0003 made owner_id NOT NULL on every os_* table, but the
-- API route handlers don't supply owner_id in their INSERTs yet. Without
-- a column default, every save fails with "null value in column owner_id
-- violates not-null constraint".
--
-- Set the default to Marcel's owner UUID. New rows from the API
-- automatically get the right value. When we later refactor the route
-- handlers to read owner_id from the session, we'll drop these defaults
-- so a forgotten field becomes a hard error rather than a silent
-- single-tenant fallback.
--
-- Safe to re-run: ALTER COLUMN SET DEFAULT is idempotent.

DO $$
DECLARE
  tbl TEXT;
  default_owner UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'os_clients', 'os_invoices', 'os_angebote',
    'os_jobs',    'os_leads',    'os_newsletter'
  ]
  LOOP
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN owner_id SET DEFAULT %L',
      tbl, default_owner
    );
  END LOOP;
END $$;
