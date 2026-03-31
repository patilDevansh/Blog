-- Run once on your Postgres provider (Neon, Supabase, RDS, etc.).
-- Netlify functions read DATABASE_URL.

CREATE TABLE IF NOT EXISTS publishes (
  slug text PRIMARY KEY,
  manifest jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT publishes_slug_chars CHECK (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND length(slug) <= 120
  )
);

CREATE INDEX IF NOT EXISTS publishes_updated_at ON publishes (updated_at DESC);
