"""
PostgreSQL connection pool and helpers for the auth database.
Uses psycopg2 with a simple connection pool.
"""

import os
import psycopg2
import psycopg2.pool
import psycopg2.extras
from config import Config

_pool = None


def get_pg_pool():
    """Get or create the PostgreSQL connection pool."""
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=Config.DATABASE_URL,
        )
    return _pool


def get_pg_conn():
    """Get a connection from the pool."""
    return get_pg_pool().getconn()


def release_pg_conn(conn):
    """Return a connection to the pool."""
    get_pg_pool().putconn(conn)


def init_pg_db():
    """Initialize the PostgreSQL auth database using pg_schema.sql."""
    conn = get_pg_conn()
    try:
        schema_path = os.path.join(os.path.dirname(__file__), 'pg_schema.sql')
        with open(schema_path, 'r') as f:
            conn.cursor().execute(f.read())
        conn.commit()
        print("✅ PostgreSQL auth database initialized successfully")
    except Exception as e:
        conn.rollback()
        print(f"❌ PostgreSQL init error: {e}")
        raise
    finally:
        release_pg_conn(conn)


def query_pg(query, args=(), one=False):
    """
    Execute a SELECT query and return results as list of dicts (or single dict if one=True).
    """
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, args)
            rows = cur.fetchall()
            if one:
                return dict(rows[0]) if rows else None
            return [dict(r) for r in rows]
    finally:
        release_pg_conn(conn)


def execute_pg(query, args=()):
    """
    Execute an INSERT/UPDATE/DELETE query.
    For INSERT with RETURNING, returns the first column of the first row.
    Otherwise returns the rowcount.
    """
    conn = get_pg_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(query, args)
            conn.commit()
            if cur.description:
                row = cur.fetchone()
                return row[0] if row else None
            return cur.rowcount
    except Exception:
        conn.rollback()
        raise
    finally:
        release_pg_conn(conn)
