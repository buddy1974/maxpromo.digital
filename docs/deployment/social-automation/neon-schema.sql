-- MaxPromo Digital Social Automation Schema

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  topic TEXT NOT NULL,
  sector TEXT,
  content_type TEXT,
  platform TEXT NOT NULL,
  caption TEXT,
  image_url TEXT,
  video_url TEXT,
  scheduled_for TIMESTAMPTZ,
  scheduled_window TEXT DEFAULT 'ANY',
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  platform_post_id TEXT,
  error_message TEXT,
  locale TEXT DEFAULT 'en',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS social_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  platform TEXT,
  post_id TEXT,
  comment_id TEXT UNIQUE,
  commenter_name TEXT,
  comment_text TEXT,
  sentiment TEXT,
  reply_text TEXT,
  reply_sent BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS social_rotation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  last_sector TEXT DEFAULT 'legal',
  last_run TIMESTAMPTZ DEFAULT now(),
  run_count INTEGER DEFAULT 0
);

INSERT INTO social_rotation (last_sector, run_count) VALUES ('legal', 0);
