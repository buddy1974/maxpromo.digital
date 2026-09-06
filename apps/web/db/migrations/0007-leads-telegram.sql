CREATE TABLE chat.leads_telegram (
  id              BIGSERIAL    PRIMARY KEY,
  session_id      UUID         NOT NULL REFERENCES chat.sessions(id) ON DELETE CASCADE,
  product_slug    TEXT,
  visitor_name    TEXT,
  visitor_email   TEXT,
  visitor_phone   TEXT,
  visitor_org     TEXT,
  message         TEXT         NOT NULL,
  source_host     TEXT         NOT NULL,
  status          TEXT         NOT NULL DEFAULT 'new',
  telegram_msg_id BIGINT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_status     ON chat.leads_telegram (status);
CREATE INDEX idx_leads_created    ON chat.leads_telegram (created_at DESC);
