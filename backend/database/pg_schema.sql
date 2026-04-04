-- VibeChat Auth Database (PostgreSQL)
-- This is a separate auth-only database for Google OAuth users

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    google_id   VARCHAR(255) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    username    VARCHAR(20) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_auth_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON users(username);

-- Songs used by search, playback, and history lookup.
CREATE TABLE IF NOT EXISTS songs (
    youtube_id          TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    thumbnail_url       TEXT,
    tags                TEXT[] NOT NULL DEFAULT '{}',
    youtube_like_count  BIGINT NOT NULL DEFAULT 0,
    vibechat_like_count BIGINT NOT NULL DEFAULT 0,
    duration            INTEGER NOT NULL DEFAULT 0,
    listened_count      BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_songs_title_trgm
    ON songs USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_songs_tags_gin
    ON songs USING GIN (tags);
