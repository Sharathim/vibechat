"""
Database migration for unified authentication system.
This script safely migrates from the old 'gmail' + 'auth_provider' schema
to the new 'email' + 'google_id' schema.

Run this ONCE before starting the updated backend:
    python database/migrate_auth.py
"""
import sqlite3
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DB_PATH = os.path.join(os.path.dirname(__file__), 'vibechat.db')


def migrate():
    print(f"Migrating database: {DB_PATH}")

    if not os.path.exists(DB_PATH):
        print("Database not found. Creating fresh database...")
        # Run the schema script
        conn = sqlite3.connect(DB_PATH)
        with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r') as f:
            conn.executescript(f.read())
        conn.close()
        print("Fresh database created successfully!")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Check current schema
    cursor.execute("PRAGMA table_info(users)")
    columns = {row['name'] for row in cursor.fetchall()}
    print(f"Current columns: {columns}")

    migrations_needed = []

    # Check if we need to rename gmail -> email
    if 'gmail' in columns and 'email' not in columns:
        migrations_needed.append('rename_gmail_to_email')

    # Check if we need to add google_id
    if 'google_id' not in columns:
        migrations_needed.append('add_google_id')

    # Check if we need to remove auth_provider
    if 'auth_provider' in columns:
        migrations_needed.append('remove_auth_provider')

    if not migrations_needed:
        print("No migrations needed. Database is up to date!")
        conn.close()
        return

    print(f"Migrations needed: {migrations_needed}")

    # Begin transaction
    try:
        # SQLite doesn't support renaming columns directly in older versions
        # So we need to recreate the table

        # Step 1: Backup existing data
        print("\n1. Backing up user data...")
        cursor.execute("""
            SELECT id, gmail, username, name, password_hash, rank_badge,
                   auth_provider, created_at, last_login, is_active,
                   login_attempts, locked_until
            FROM users
        """)
        users_backup = cursor.fetchall()
        print(f"   Backed up {len(users_backup)} users")

        # Step 2: Drop old table and create new one
        print("\n2. Recreating users table with new schema...")
        cursor.execute("DROP TABLE IF EXISTS users_new")
        cursor.execute("""
            CREATE TABLE users_new (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                email           TEXT UNIQUE NOT NULL,
                username        TEXT UNIQUE NOT NULL,
                name            TEXT NOT NULL,
                password_hash   TEXT,
                google_id       TEXT UNIQUE,
                rank_badge      INTEGER UNIQUE,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login      DATETIME,
                is_active       BOOLEAN DEFAULT 1,
                login_attempts  INTEGER DEFAULT 0,
                locked_until    DATETIME
            )
        """)

        # Step 3: Migrate data
        print("\n3. Migrating user data...")
        for user in users_backup:
            # Determine google_id based on auth_provider
            google_id = None
            password = user['password_hash'] if user['password_hash'] else None

            # If user was created via Google (auth_provider = 'google'),
            # they might not have a google_id stored yet.
            # We'll leave it NULL and it will be set on next Google login.

            cursor.execute("""
                INSERT INTO users_new
                (id, email, username, name, password_hash, google_id, rank_badge,
                 created_at, last_login, is_active, login_attempts, locked_until)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user['id'],
                user['gmail'],  # gmail -> email
                user['username'],
                user['name'],
                password,
                google_id,
                user['rank_badge'],
                user['created_at'],
                user['last_login'],
                user['is_active'],
                user['login_attempts'],
                user['locked_until']
            ))

        print(f"   Migrated {len(users_backup)} users")

        # Step 4: Replace old table with new
        print("\n4. Replacing old table...")
        cursor.execute("DROP TABLE users")
        cursor.execute("ALTER TABLE users_new RENAME TO users")

        # Step 5: Recreate indexes
        print("\n5. Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)")

        # Step 6: Also migrate otp_verifications if needed
        cursor.execute("PRAGMA table_info(otp_verifications)")
        otp_columns = {row['name'] for row in cursor.fetchall()}

        if 'gmail' in otp_columns and 'email' not in otp_columns:
            print("\n6. Migrating otp_verifications table...")
            cursor.execute("SELECT * FROM otp_verifications")
            otp_backup = cursor.fetchall()

            cursor.execute("DROP TABLE IF EXISTS otp_verifications_new")
            cursor.execute("""
                CREATE TABLE otp_verifications_new (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    email       TEXT NOT NULL,
                    otp_hash    TEXT NOT NULL,
                    purpose     TEXT NOT NULL,
                    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at  DATETIME NOT NULL,
                    attempts    INTEGER DEFAULT 0,
                    is_used     BOOLEAN DEFAULT 0
                )
            """)

            for otp in otp_backup:
                cursor.execute("""
                    INSERT INTO otp_verifications_new
                    (id, email, otp_hash, purpose, created_at, expires_at, attempts, is_used)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    otp['id'],
                    otp['gmail'],  # gmail -> email
                    otp['otp_hash'],
                    otp['purpose'],
                    otp['created_at'],
                    otp['expires_at'],
                    otp['attempts'],
                    otp['is_used']
                ))

            cursor.execute("DROP TABLE otp_verifications")
            cursor.execute("ALTER TABLE otp_verifications_new RENAME TO otp_verifications")
            print(f"   Migrated {len(otp_backup)} OTP records")

        conn.commit()
        print("\n[OK] Migration completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] Migration failed: {e}")
        raise

    finally:
        conn.close()


if __name__ == '__main__':
    migrate()
