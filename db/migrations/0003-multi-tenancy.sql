-- 0003-multi-tenancy.sql
--
-- Stage-3 foundation: add owner_id to every os_* table so each row is
-- scoped to a specific user. Today there's only one owner (Marcel) — the
-- backfill defaults every existing row to a fixed UUID for him. As soon
-- as a second user is onboarded, queries already filter by owner_id and
-- the schema is ready.
--
-- We do NOT introduce orgs/memberships yet — the cost is not justified
-- with one user. When that day comes, add an `organizations` table, a
-- `memberships` link, and replace owner_id with org_id (or both).
--
-- Safe to run multiple times.

-- 1. Owners table — minimal until Stage-3-real (Clerk/orgs).
CREATE TABLE IF NOT EXISTS os_owners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'admin'
);

-- 2. Insert Marcel as the canonical default owner.
INSERT INTO os_owners (id, email, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'info@maxpromo.digital',
  'Marcel Tabit Akwe',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- 3. Add owner_id everywhere. We default to Marcel during the migration so
--    existing rows get a value, then we tighten to NOT NULL.
--
-- The exception handler is scoped to the FK ADD only — using a per-iteration
-- inner BEGIN/EXCEPTION block. If we put it at the loop level, PL/pgSQL would
-- roll back the entire DO block on the first duplicate-FK error and nothing
-- would commit. Every other step here is idempotent on its own (IF NOT EXISTS,
-- and SET NOT NULL is a no-op when already NOT NULL).
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
    -- 3a. Add column (idempotent).
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS owner_id UUID',
      tbl
    );

    -- 3b. Backfill any nulls. Re-running this is harmless because the
    --     WHERE clause filters out already-set rows.
    EXECUTE format(
      'UPDATE %I SET owner_id = %L WHERE owner_id IS NULL',
      tbl, default_owner
    );

    -- 3c. Tighten to NOT NULL. SET NOT NULL is a no-op if already set.
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN owner_id SET NOT NULL',
      tbl
    );

    -- 3d. Add the FK. This is the only step that can throw on re-run, so
    --     it's the only one wrapped in an exception block. Per-iteration
    --     scope means a duplicate FK on table N doesn't abort tables N+1..6.
    BEGIN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (owner_id) REFERENCES os_owners (id)',
        tbl, tbl || '_owner_id_fkey'
      );
    EXCEPTION WHEN duplicate_object THEN
      NULL;  -- FK already exists from a prior run.
    END;

    -- 3e. Index (idempotent).
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I (owner_id)',
      'idx_' || tbl || '_owner_id', tbl
    );
  END LOOP;
END $$;

-- Sanity-check: every os_* table should have owner_id NOT NULL with a FK.
-- Run this verification query manually after the migration to confirm:
--
--   SELECT t.table_name,
--          (SELECT is_nullable FROM information_schema.columns
--             WHERE table_name = t.table_name AND column_name = 'owner_id') AS nullable,
--          EXISTS (
--            SELECT 1 FROM information_schema.table_constraints
--             WHERE table_name = t.table_name
--               AND constraint_name = t.table_name || '_owner_id_fkey'
--          ) AS has_fk
--     FROM (VALUES ('os_clients'),('os_invoices'),('os_angebote'),
--                  ('os_jobs'),('os_leads'),('os_newsletter')) t(table_name);
