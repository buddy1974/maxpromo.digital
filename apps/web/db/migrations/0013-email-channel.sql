-- Additive, local preparation only. Apply solely to an isolated evidence DB first.
CREATE SCHEMA IF NOT EXISTS mail;
CREATE TABLE IF NOT EXISTS mail.accounts (
 id text PRIMARY KEY, address text NOT NULL UNIQUE, provider text NOT NULL,
 enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS mail.threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id text NOT NULL REFERENCES mail.accounts,
 provider_thread_id text NOT NULL, subject text NOT NULL,
 classification text NOT NULL DEFAULT 'other', needs_reply boolean NOT NULL DEFAULT false,
 waiting boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false,
 trashed boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(account_id,provider_thread_id)
);
CREATE TABLE IF NOT EXISTS mail.messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), thread_id uuid NOT NULL REFERENCES mail.threads,
 account_id text NOT NULL REFERENCES mail.accounts, provider_message_id text NOT NULL,
 sender text NOT NULL, recipients jsonb NOT NULL, cc jsonb NOT NULL DEFAULT '[]',
 subject text NOT NULL, body_text text NOT NULL, received_at timestamptz NOT NULL,
 is_read boolean NOT NULL DEFAULT false, attachments jsonb NOT NULL DEFAULT '[]',
 UNIQUE(account_id,provider_message_id)
);
CREATE INDEX IF NOT EXISTS mail_messages_thread ON mail.messages(thread_id,received_at);
CREATE TABLE IF NOT EXISTS mail.business_links (
 thread_id uuid NOT NULL REFERENCES mail.threads, entity_kind text NOT NULL CHECK(entity_kind IN ('lead','client','project')),
 entity_id text NOT NULL, match_status text NOT NULL CHECK(match_status IN ('possible','owner_confirmed')),
 PRIMARY KEY(thread_id,entity_kind,entity_id)
);
CREATE TABLE IF NOT EXISTS mail.events (
 id text PRIMARY KEY, account_id text NOT NULL REFERENCES mail.accounts,
 kind text NOT NULL, thread_id uuid REFERENCES mail.threads, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mail.action_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), thread_id uuid NOT NULL REFERENCES mail.threads,
 action text NOT NULL, status text NOT NULL, payload jsonb NOT NULL DEFAULT '{}',
 approval_id text UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
-- IDs are transport references, never a secret. No enabled account is seeded.
