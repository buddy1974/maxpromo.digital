-- 0020-draft-attachments.sql (also: delivery reports on outbound messages)
--
-- Files Marcel attaches to an email he is writing (ADR-0023 amendment, ADR-0025).
--
-- A draft attachment belongs to exactly one draft and dies with it. The bytes live here, beside
-- the draft, because they are sent with it through the mailbox and nowhere else; once the email
-- is sent, the copy in Hostinger's Sent folder is the record and the row keeps only its metadata
-- (`content` is cleared after a confirmed send).
--
-- Bounds, also enforced by the upload route: 4 MB per file (the request body limit of the
-- serverless platform), 10 MB per draft, a fixed set of document and image types — never
-- executables, scripts, HTML or archives. Changing a draft's attachments changes its revision, so
-- a confirmation shown before the change can no longer send it.
--
-- Additive; safe to run more than once.

CREATE TABLE IF NOT EXISTS mail.draft_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id      UUID NOT NULL REFERENCES mail.drafts (id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    TEXT NOT NULL,
  filename      TEXT NOT NULL CHECK (length(filename) BETWEEN 1 AND 200 AND filename !~ '[/\\]'),
  content_type  TEXT NOT NULL CHECK (content_type IN (
                  'application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain', 'text/csv',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation')),
  size_bytes    INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 4194304),
  sha256        TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  -- An OS document attached by reference keeps its origin for the audit (invoice or quotation PDF).
  source        TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'invoice', 'angebot')),
  source_id     UUID,
  content       BYTEA,
  CHECK (content IS NULL OR octet_length(content) = size_bytes)
);
CREATE INDEX IF NOT EXISTS idx_mail_draft_attachments_draft ON mail.draft_attachments (draft_id, created_at);
-- The same file twice on one draft is one attachment.
CREATE UNIQUE INDEX IF NOT EXISTS uq_mail_draft_attachments_hash ON mail.draft_attachments (draft_id, sha256);

-- ── Delivery reports on Maxpromo's own outbound messages ────────────────
-- A bounce (MAILER-DAEMON / postmaster report) marks the outbound message it is about, so the
-- conversation and attention can say "this email did not arrive" (lib/mail/bounces.ts).
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS delivery_state  TEXT CHECK (delivery_state IN ('bounced', 'delayed'));
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS delivery_detail TEXT CHECK (delivery_detail IS NULL OR length(delivery_detail) <= 300);
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS delivery_report UUID REFERENCES mail.messages (id) ON DELETE SET NULL;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS delivery_at     TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_mail_messages_delivery ON mail.messages (delivery_at DESC) WHERE delivery_state IS NOT NULL;
