-- VibeChat Unified PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── USERS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  BIGSERIAL PRIMARY KEY,
    email               VARCHAR(255) UNIQUE NOT NULL,
    userid              VARCHAR(20) UNIQUE NOT NULL,
    name                VARCHAR(100) NOT NULL,
    password_hash       VARCHAR(255),
    google_id           VARCHAR(255) UNIQUE,
    rank_badge          INTEGER UNIQUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    last_login          TIMESTAMP,
    is_active           BOOLEAN DEFAULT TRUE,
    login_attempts      INTEGER DEFAULT 0,
    locked_until        TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_userid ON users(userid);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ── PROFILES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT UNIQUE NOT NULL,
    bio                 TEXT DEFAULT '',
    avatar_url          TEXT,
    is_private          BOOLEAN DEFAULT TRUE,
    show_rank_badge     BOOLEAN DEFAULT TRUE,
    show_online_status  BOOLEAN DEFAULT TRUE,
    read_receipts       BOOLEAN DEFAULT TRUE,
    vibe_requests_from  TEXT DEFAULT 'everyone',
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── USER SETTINGS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT UNIQUE NOT NULL,
    notif_follow_requests   BOOLEAN DEFAULT TRUE,
    notif_messages          BOOLEAN DEFAULT TRUE,
    notif_vibe_requests     BOOLEAN DEFAULT TRUE,
    notif_shared_playlists  BOOLEAN DEFAULT TRUE,
    theme                   TEXT DEFAULT 'light',
    updated_at              TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── OTP VERIFICATIONS ─────────────────────────────
CREATE TABLE IF NOT EXISTS otp_verifications (
    id          BIGSERIAL PRIMARY KEY,
    email       TEXT NOT NULL,
    otp_hash    TEXT NOT NULL,
    purpose     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    expires_at  TIMESTAMP NOT NULL,
    attempts    INTEGER DEFAULT 0,
    is_used     BOOLEAN DEFAULT FALSE
);

-- ── FOLLOWS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
    id              BIGSERIAL PRIMARY KEY,
    follower_id     BIGINT NOT NULL,
    following_id    BIGINT NOT NULL,
    status          TEXT DEFAULT 'pending',
    created_at      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ── BLOCKED USERS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_users (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    blocked_id      BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, blocked_id)
);

-- ── SONGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS songs (
    id                  BIGSERIAL PRIMARY KEY,
    youtube_id          TEXT UNIQUE NOT NULL,
    title               TEXT NOT NULL,
    artist              TEXT NOT NULL DEFAULT '',
    duration            INTEGER NOT NULL DEFAULT 0,
    thumbnail_url       TEXT,
    s3_audio_url        TEXT,
    tags                TEXT[] NOT NULL DEFAULT '{}',
    youtube_like_count  BIGINT NOT NULL DEFAULT 0,
    vibechat_like_count BIGINT NOT NULL DEFAULT 0,
    listened_count      BIGINT NOT NULL DEFAULT 0,
    fetched_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_songs_title_trgm
    ON songs USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_songs_artist_trgm
    ON songs USING GIN (artist gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_songs_tags_gin
    ON songs USING GIN (tags);

-- ── LIKED SONGS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS liked_songs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    song_id     BIGINT NOT NULL,
    liked_at    TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    UNIQUE(user_id, song_id)
);

-- ── DOWNLOADS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS downloads (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    song_id         BIGINT NOT NULL,
    downloaded_at   TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    UNIQUE(user_id, song_id)
);

-- ── PLAYLISTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlists (
    id              BIGSERIAL PRIMARY KEY,
    owner_id        BIGINT NOT NULL,
    name            TEXT NOT NULL,
    cover_url       TEXT,
    is_shared       BOOLEAN DEFAULT FALSE,
    shared_with_id  BIGINT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── PLAYLIST SONGS ────────────────────────────────
CREATE TABLE IF NOT EXISTS playlist_songs (
    id          BIGSERIAL PRIMARY KEY,
    playlist_id BIGINT NOT NULL,
    song_id     BIGINT NOT NULL,
    added_by    BIGINT NOT NULL,
    position    INTEGER NOT NULL,
    added_at    TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ── LISTENING HISTORY ─────────────────────────────
CREATE TABLE IF NOT EXISTS listening_history (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    song_id     BIGINT NOT NULL,
    played_at   TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_listening_history_user ON listening_history(user_id);

-- ── SEARCH HISTORY ────────────────────────────────
CREATE TABLE IF NOT EXISTS search_history (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    type            TEXT NOT NULL,
    reference_id    BIGINT NOT NULL,
    searched_at     TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);

-- ── CONVERSATIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
    id              BIGSERIAL PRIMARY KEY,
    user1_id        BIGINT NOT NULL,
    user2_id        BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user1_id, user2_id)
);

-- ── MESSAGES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id       BIGINT NOT NULL,
    type            TEXT DEFAULT 'text',
    content         TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- ── VIBE SESSIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS vibe_sessions (
    id                  BIGSERIAL PRIMARY KEY,
    conversation_id     BIGINT NOT NULL,
    host_user_id        BIGINT NOT NULL,
    is_cohost           BOOLEAN DEFAULT FALSE,
    current_song_id     BIGINT,
    playback_position   REAL DEFAULT 0,
    playback_state      TEXT DEFAULT 'paused',
    started_at          TIMESTAMP DEFAULT NOW(),
    ended_at            TIMESTAMP,
    status              TEXT DEFAULT 'active',
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── VIBE QUEUE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS vibe_queue (
    id          BIGSERIAL PRIMARY KEY,
    session_id  BIGINT NOT NULL,
    song_id     BIGINT NOT NULL,
    added_by    BIGINT NOT NULL,
    position    INTEGER NOT NULL,
    is_played   BOOLEAN DEFAULT FALSE,
    added_at    TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES vibe_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ── FEED ACTIVITY ─────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_activity (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    song_id         BIGINT NOT NULL,
    activity_type   TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feed_activity_user ON feed_activity(user_id);

-- ── SONG CLIPS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS song_clips (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    song_id         BIGINT NOT NULL,
    start_seconds   INTEGER NOT NULL,
    end_seconds     INTEGER NOT NULL,
    posted_at       TIMESTAMP DEFAULT NOW(),
    expires_at      TIMESTAMP NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_song_clips_user ON song_clips(user_id);

-- ── CLIP VIEWS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS clip_views (
    id          BIGSERIAL PRIMARY KEY,
    clip_id     BIGINT NOT NULL,
    viewer_id   BIGINT NOT NULL,
    viewed_at   TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (clip_id) REFERENCES song_clips(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(clip_id, viewer_id)
);

-- ── NOTIFICATIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    type            TEXT NOT NULL,
    from_user_id    BIGINT,
    message         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ── BLOCKED VIBE USERS ────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_vibe_users (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    blocked_user_id BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, blocked_user_id)
);
