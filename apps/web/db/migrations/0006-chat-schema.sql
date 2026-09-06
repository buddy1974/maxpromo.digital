CREATE SCHEMA IF NOT EXISTS chat;

CREATE TABLE chat.sessions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  origin          TEXT         NOT NULL,
  origin_id       TEXT         NOT NULL,
  host            TEXT         NOT NULL,
  product_slug    TEXT,
  locale          TEXT         NOT NULL DEFAULT 'de',
  first_seen_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  visitor_label   TEXT,
  emotional_state TEXT,
  handover_state  TEXT         NOT NULL DEFAULT 'bot',
  metadata        JSONB        NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (origin, origin_id)
);

CREATE INDEX idx_sessions_host         ON chat.sessions (host);
CREATE INDEX idx_sessions_last_seen    ON chat.sessions (last_seen_at DESC);
CREATE INDEX idx_sessions_handover     ON chat.sessions (handover_state) WHERE handover_state <> 'bot';

CREATE TABLE chat.messages (
  id              BIGSERIAL    PRIMARY KEY,
  session_id      UUID         NOT NULL REFERENCES chat.sessions(id) ON DELETE CASCADE,
  role            TEXT         NOT NULL,
  content         TEXT         NOT NULL,
  channel         TEXT         NOT NULL,
  metadata        JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_session_time ON chat.messages (session_id, created_at);

CREATE TABLE chat.events (
  id              BIGSERIAL    PRIMARY KEY,
  session_id      UUID         NOT NULL REFERENCES chat.sessions(id) ON DELETE CASCADE,
  event_type      TEXT         NOT NULL,
  url             TEXT,
  product_slug    TEXT,
  scroll_depth    NUMERIC,
  time_on_page_ms INTEGER,
  referrer        TEXT,
  payload         JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_session_time ON chat.events (session_id, created_at DESC);
