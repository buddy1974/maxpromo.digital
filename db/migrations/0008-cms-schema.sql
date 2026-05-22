CREATE SCHEMA IF NOT EXISTS cms;

CREATE TABLE cms.posts (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT         NOT NULL,
  locale          TEXT         NOT NULL,
  status          TEXT         NOT NULL DEFAULT 'draft',
  title           TEXT         NOT NULL,
  excerpt         TEXT,
  body_md         TEXT,
  body_html       TEXT,
  cover_image     TEXT,
  meta_title      TEXT,
  meta_desc       TEXT,
  tags            TEXT[]       NOT NULL DEFAULT '{}',
  social_text     TEXT,
  target_domains  TEXT[]       NOT NULL DEFAULT '{maxpromo.digital}',
  publish_at      TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  author          TEXT         NOT NULL DEFAULT 'Marcel',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (slug, locale)
);

CREATE INDEX idx_posts_status_publish ON cms.posts (status, publish_at);
CREATE INDEX idx_posts_locale_slug    ON cms.posts (locale, slug);
