-- 0022 — Which Stripe payout carried a refund or a lost dispute (risk 132).
--
-- A payout's balance transactions (readable with the restricted key's Balance read) list the charges
-- AND the refunds/dispute adjustments it settled. Charges were already linked (money.charges.payout_id);
-- reversals now are too, so "not yet paid out" is exact: unpaid-out charge net minus reversals no
-- payout has carried yet. Schema-only, additive.

ALTER TABLE money.reversals ADD COLUMN IF NOT EXISTS payout_id TEXT;
CREATE INDEX IF NOT EXISTS idx_money_reversals_payout ON money.reversals (payout_id);
