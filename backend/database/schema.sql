-- ── USERS ─────────────────────────────────────────
-- Email is the PRIMARY identifier for account merging
-- password_hash is NULL for Google-only users
-- google_id is NULL for email-only users
-- Both can be set for linked accounts
CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    email               TEXT UNIQUE NOT NULL,
    username            TEXT UNIQUE NOT NULL,
    name                TEXT NOT NULL,
    password_hash       TEXT,              -- NULL for Google-only users
    google_id           TEXT UNIQUE,       -- Firebase UID, NULL for email-only users
    rank_badge          INTEGER UNIQUE,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login          DATETIME,
    is_active           BOOLEAN DEFAULT 1,
    login_attempts      INTEGER DEFAULT 0,
    locked_until        DATETIME
);

-- ── PROFILES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER UNIQUE NOT NULL,
    bio                 TEXT DEFAULT '',
    avatar_url          TEXT,
    is_private          BOOLEAN DEFAULT 1,
    show_rank_badge     BOOLEAN DEFAULT 1,
    show_online_status  BOOLEAN DEFAULT 1,
    read_receipts       BOOLEAN DEFAULT 1,
    vibe_requests_from  TEXT DEFAULT 'everyone',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── USER SETTINGS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id                 INTEGER UNIQUE NOT NULL,
    notif_follow_requests   BOOLEAN DEFAULT 1,
    notif_messages          BOOLEAN DEFAULT 1,
    notif_vibe_requests     BOOLEAN DEFAULT 1,
    notif_shared_playlists  BOOLEAN DEFAULT 1,
    theme                   TEXT DEFAULT 'light',
    updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── OTP VERIFICATIONS ─────────────────────────────
CREATE TABLE IF NOT EXISTS otp_verifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT NOT NULL,
    otp_hash    TEXT NOT NULL,
    purpose     TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME NOT NULL,
    attempts    INTEGER DEFAULT 0,
    is_used     BOOLEAN DEFAULT 0
);

-- ── FOLLOWS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id     INTEGER NOT NULL,
    following_id    INTEGER NOT NULL,
    status          TEXT DEFAULT 'pending',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id)
);

-- ── BLOCKED USERS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    blocked_id      INTEGER NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, blocked_id)
);

-- ── SONGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS songs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    youtube_id      TEXT UNIQUE NOT NULL,
    title           TEXT NOT NULL,
    artist          TEXT NOT NULL,
    duration        INTEGER DEFAULT 0,
    thumbnail_url   TEXT,
    s3_audio_url    TEXT,
    fetched_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── LIKED SONGS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS liked_songs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    song_id     INTEGER NOT NULL,
    liked_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    UNIQUE(user_id, song_id)
);

-- ── DOWNLOADS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS downloads (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    song_id         INTEGER NOT NULL,
    downloaded_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    UNIQUE(user_id, song_id)
);

-- ── PLAYLISTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlists (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id        INTEGER NOT NULL,
    name            TEXT NOT NULL,
    cover_url       TEXT,
    is_shared       BOOLEAN DEFAULT 0,
    shared_with_id  INTEGER,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── PLAYLIST SONGS ────────────────────────────────
CREATE TABLE IF NOT EXISTS playlist_songs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    song_id     INTEGER NOT NULL,
    added_by    INTEGER NOT NULL,
    position    INTEGER NOT NULL,
    added_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ── LISTENING HISTORY ─────────────────────────────
CREATE TABLE IF NOT EXISTS listening_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    song_id     INTEGER NOT NULL,
    played_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- ── SEARCH HISTORY ────────────────────────────────
CREATE TABLE IF NOT EXISTS search_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    type            TEXT NOT NULL,
    reference_id    INTEGER NOT NULL,
    searched_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── CONVERSATIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id        INTEGER NOT NULL,
    user2_id        INTEGER NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user1_id, user2_id)
);

-- ── MESSAGES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id       INTEGER NOT NULL,
    type            TEXT DEFAULT 'text',
    content         TEXT,
    is_read         BOOLEAN DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── VIBE SESSIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS vibe_sessions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id     INTEGER NOT NULL,
    host_user_id        INTEGER NOT NULL,
    is_cohost           BOOLEAN DEFAULT 0,
    current_song_id     INTEGER,
    playback_position   REAL DEFAULT 0,
    playback_state      TEXT DEFAULT 'paused',
    started_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at            DATETIME,
    status              TEXT DEFAULT 'active',
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── VIBE QUEUE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS vibe_queue (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER NOT NULL,
    song_id     INTEGER NOT NULL,
    added_by    INTEGER NOT NULL,
    position    INTEGER NOT NULL,
    is_played   BOOLEAN DEFAULT 0,
    added_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES vibe_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ── FEED ACTIVITY ─────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_activity (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    song_id         INTEGER NOT NULL,
    activity_type   TEXT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- ── SONG CLIPS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS song_clips (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    song_id         INTEGER NOT NULL,
    start_seconds   INTEGER NOT NULL,
    end_seconds     INTEGER NOT NULL,
    posted_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME NOT NULL,
    is_active       BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- ── CLIP VIEWS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS clip_views (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    clip_id     INTEGER NOT NULL,
    viewer_id   INTEGER NOT NULL,
    viewed_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clip_id) REFERENCES song_clips(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(clip_id, viewer_id)
);

-- ── NOTIFICATIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    type            TEXT NOT NULL,
    from_user_id    INTEGER,
    message         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── BLOCKED VIBE USERS ────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_vibe_users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    blocked_user_id INTEGER NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, blocked_user_id)
);

-- ── INDEXES ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feed_activity_user ON feed_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_song_clips_user ON song_clips(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);