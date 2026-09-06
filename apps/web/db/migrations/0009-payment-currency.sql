-- 0009-payment-currency.sql
--
-- Enterprise document system rebuild (Invoice + Angebot shared renderer).
--
-- Adds a configurable payment method ('bank' | 'momo' | 'both') and a
-- document currency (ISO 4217, e.g. 'EUR' | 'GBP') to both os_invoices
-- and os_angebote, so each document can independently declare how it
-- should be paid and in what currency without touching application code.
--
-- Existing rows default to 'bank' / 'EUR' (the behaviour before this
-- migration was EUR-only bank-transfer-only, so this is a no-op for
-- anything already in the database).
--
-- Safe to run multiple times.

ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'bank';
ALTER TABLE os_invoices ADD COLUMN IF NOT EXISTS currency       TEXT NOT NULL DEFAULT 'EUR';

ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'bank';
ALTER TABLE os_angebote ADD COLUMN IF NOT EXISTS currency       TEXT NOT NULL DEFAULT 'EUR';

-- Guard rails matching the application-level PaymentMethodId / CurrencyCode
-- unions (lib/documents/config.ts). Using NOT VALID + a follow-up VALIDATE
-- would be the zero-downtime pattern for a huge table; os_invoices/os_angebote
-- are small operational tables for a single-tenant business tool, so a plain
-- CHECK is fine here.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'os_invoices_payment_method_check'
  ) THEN
    ALTER TABLE os_invoices
      ADD CONSTRAINT os_invoices_payment_method_check
      CHECK (payment_method IN ('bank', 'momo', 'both'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'os_invoices_currency_check'
  ) THEN
    ALTER TABLE os_invoices
      ADD CONSTRAINT os_invoices_currency_check
      CHECK (currency IN ('EUR', 'GBP'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'os_angebote_payment_method_check'
  ) THEN
    ALTER TABLE os_angebote
      ADD CONSTRAINT os_angebote_payment_method_check
      CHECK (payment_method IN ('bank', 'momo', 'both'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'os_angebote_currency_check'
  ) THEN
    ALTER TABLE os_angebote
      ADD CONSTRAINT os_angebote_currency_check
      CHECK (currency IN ('EUR', 'GBP'));
  END IF;
END $$;
