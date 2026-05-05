-- 0001-document-numbering.sql
--
-- Replace the SELECT-MAX invoice/angebot numbering pattern with a Postgres
-- sequence per year. Two concurrent inserts can no longer collide on the
-- same number.
--
-- A function returns the formatted string ("MP-2026-007", "ANG-2026-007"),
-- creating the per-year sequence on first call. Sequences live in their
-- own schema so we can list them cleanly.

CREATE SCHEMA IF NOT EXISTS doc_seq;

CREATE OR REPLACE FUNCTION next_invoice_number(year_in INT DEFAULT EXTRACT(YEAR FROM now())::INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_name TEXT := format('doc_seq.invoice_%s', year_in);
  next_id  BIGINT;
BEGIN
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s START WITH 1', seq_name);
  EXECUTE format('SELECT nextval(''%s'')', seq_name) INTO next_id;
  RETURN format('MP-%s-%s', year_in, lpad(next_id::TEXT, 3, '0'));
END;
$$;

CREATE OR REPLACE FUNCTION next_angebot_number(year_in INT DEFAULT EXTRACT(YEAR FROM now())::INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_name TEXT := format('doc_seq.angebot_%s', year_in);
  next_id  BIGINT;
BEGIN
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s START WITH 1', seq_name);
  EXECUTE format('SELECT nextval(''%s'')', seq_name) INTO next_id;
  RETURN format('ANG-%s-%s', year_in, lpad(next_id::TEXT, 3, '0'));
END;
$$;

-- Backfill the sequences so they continue from the highest existing
-- number — NOT from 1 — so we don't issue duplicate invoice numbers
-- after migrating.
DO $$
DECLARE
  rec  RECORD;
  curr INT;
  seq  TEXT;
BEGIN
  FOR rec IN
    SELECT DISTINCT split_part(invoice_number, '-', 2)::INT AS yr
    FROM os_invoices
    WHERE invoice_number ~ '^MP-\d{4}-\d+$'
  LOOP
    SELECT max(split_part(invoice_number, '-', 3)::INT)
      INTO curr
      FROM os_invoices
      WHERE invoice_number LIKE format('MP-%s-%%', rec.yr);
    seq := format('doc_seq.invoice_%s', rec.yr);
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s START WITH 1', seq);
    EXECUTE format('SELECT setval(''%s'', %s, true)', seq, GREATEST(curr, 1));
  END LOOP;

  FOR rec IN
    SELECT DISTINCT split_part(angebot_number, '-', 2)::INT AS yr
    FROM os_angebote
    WHERE angebot_number ~ '^ANG-\d{4}-\d+$'
  LOOP
    SELECT max(split_part(angebot_number, '-', 3)::INT)
      INTO curr
      FROM os_angebote
      WHERE angebot_number LIKE format('ANG-%s-%%', rec.yr);
    seq := format('doc_seq.angebot_%s', rec.yr);
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s START WITH 1', seq);
    EXECUTE format('SELECT setval(''%s'', %s, true)', seq, GREATEST(curr, 1));
  END LOOP;
END $$;
