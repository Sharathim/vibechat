import sqlite3
import os
from config import Config

def get_db():
    # This function is now deprecated for search, but kept for other modules
    # that have not been migrated from SQLite to PostgreSQL.
    db_path = Config.DATABASE_PATH
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def init_db():
    # This function is now deprecated for search, but kept for other modules
    # that have not been migrated from SQLite to PostgreSQL.
    conn = get_db()
    schema_path = os.path.join(
        os.path.dirname(__file__), 'schema.sql'
    )
    with open(schema_path, 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("✅ SQLite Database initialized successfully (deprecated for search)")

def query_db(query, args=(), one=False):
    # This function is now deprecated for search, but kept for other modules
    # that have not been migrated from SQLite to PostgreSQL.
    conn = get_db()
    try:
        cur = conn.execute(query, args)
        rv = cur.fetchall()
        conn.commit()
        return (rv[0] if rv else None) if one else rv
    finally:
        conn.close()

def execute_db(query, args=()):
    # This function is now deprecated for search, but kept for other modules
    # that have not been migrated from SQLite to PostgreSQL.
    conn = get_db()
    try:
        cur = conn.execute(query, args)
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()

def row_to_dict(row):
    if row is None:
        return None
    return dict(row)

def rows_to_list(rows):
    return [dict(row) for row in rows]