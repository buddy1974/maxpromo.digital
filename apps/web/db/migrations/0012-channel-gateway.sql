-- 0012-channel-gateway.sql
--
-- Messaging channels (WhatsApp first) on the existing conversation store.
--
-- The `chat` schema (0006) already models a conversation per (origin,
-- origin_id) with a handover state of bot | pending | human and an append-only
-- message list. A WhatsApp conversation is one more origin, so this migration
-- EXTENDS those tables rather than creating a second conversation store:
--
--   chat.sessions   + identity and links into Maxpromo OS (lead / client),
--                     derived qualification, takeover timestamps, the
--                     customer-service window, a processing lease, the daily
--                     model allowance, the AI disclosure timestamp
--   chat.messages   + provider message id (idempotency), kind, turn state,
--                     the outbound ledger (insert-once key, status, provider
--                     id, delivery state)
--   chat.events     unchanged; the gateway writes its trail there (wa.*)
--
-- Additive and idempotent. No existing value is rewritten. Web chat rows are
-- untouched: every new column is nullable or defaulted.

-- ── chat.sessions ──────────────────────────────────────────────────────
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS contact_phone      TEXT;          -- digits with country code
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS contact_user_id    TEXT;          -- Meta business-scoped user id
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS identity           TEXT NOT NULL DEFAULT 'unresolved';
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS lead_id            UUID REFERENCES os_leads   (id) ON DELETE SET NULL;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS client_id          UUID REFERENCES os_clients (id) ON DELETE SET NULL;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS known_first_name   TEXT;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS intent             TEXT;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS facts              JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS qualified_at       TIMESTAMPTZ;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS handover_reason    TEXT;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS handover_at        TIMESTAMPTZ;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS human_last_at      TIMESTAMPTZ;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS last_inbound_at    TIMESTAMPTZ;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS last_outbound_at   TIMESTAMPTZ;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS disclosed_at       TIMESTAMPTZ;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS lease_until        TIMESTAMPTZ;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS model_turns_day    DATE;
ALTER TABLE chat.sessions ADD COLUMN IF NOT EXISTS model_turns        INTEGER NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_sessions_identity_check') THEN
    ALTER TABLE chat.sessions ADD CONSTRAINT chat_sessions_identity_check
      CHECK (identity IN ('unresolved', 'new', 'lead', 'client', 'ambiguous'));
  END IF;
END $$;

-- A username-only contact is found again by its business-scoped id.
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_sessions_user_id
  ON chat.sessions (origin, contact_user_id) WHERE contact_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_lead   ON chat.sessions (lead_id)   WHERE lead_id   IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_client ON chat.sessions (client_id) WHERE client_id IS NOT NULL;

-- ── chat.messages ──────────────────────────────────────────────────────
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS external_id     TEXT;   -- provider message id (wamid)
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS kind            TEXT NOT NULL DEFAULT 'text';
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS turn_state      TEXT;   -- inbound: pending | answered | held
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS turn_note       TEXT;
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS sent_at         TIMESTAMPTZ;   -- provider timestamp of an inbound/echo
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS out_key         TEXT;   -- outbound: insert-once key
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS out_status      TEXT;   -- sending | sent | draft | failed | uncertain | suppressed
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS out_error       TEXT;
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS delivery        TEXT;   -- sent | delivered | read | failed
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS delivery_at     TIMESTAMPTZ;
ALTER TABLE chat.messages ADD COLUMN IF NOT EXISTS content_erased  BOOLEAN NOT NULL DEFAULT false;

-- Idempotency: one row per provider message, whatever the number of deliveries.
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_messages_external
  ON chat.messages (channel, external_id) WHERE external_id IS NOT NULL;
-- One reply per answered turn, whatever the number of attempts.
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_messages_out_key
  ON chat.messages (session_id, out_key) WHERE out_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_pending
  ON chat.messages (session_id, id) WHERE turn_state = 'pending';
CREATE INDEX IF NOT EXISTS idx_chat_messages_out_status
  ON chat.messages (out_status, created_at) WHERE out_status IN ('failed', 'uncertain', 'sending');
CREATE INDEX IF NOT EXISTS idx_chat_events_type_time
  ON chat.events (event_type, created_at DESC);
