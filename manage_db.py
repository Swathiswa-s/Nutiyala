"""
Nutiyala Couture - Database Management CLI Tool
Usage:
    python manage_db.py stats    - Show table summary & record counts
    python manage_db.py users    - List users & account types
    python manage_db.py orders   - List recent orders & statuses
    python manage_db.py backup   - Create a timestamped backup of nutiyala.db
    python manage_db.py open     - Open nutiyala.db in DB Browser for SQLite
"""

import sys
import os
import sqlite3
import subprocess

DB_FILE = os.path.join(os.path.dirname(__file__), 'nutiyala.db')
APP_PATH = r"C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe"

def get_conn():
    if not os.path.exists(DB_FILE):
        print(f"Error: {DB_FILE} not found.")
        sys.exit(1)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def show_stats():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    tables = [r[0] for r in cur.fetchall()]
    
    print("\n" + "=" * 50)
    print("  NUTIYALA COUTURE - DATABASE SUMMARY")
    print("=" * 50)
    total_records = 0
    for tbl in tables:
        cur.execute(f"SELECT COUNT(*) FROM \"{tbl}\"")
        cnt = cur.fetchone()[0]
        total_records += cnt
        print(f"  • {tbl.ljust(22)} : {cnt:>6} records")
    print("-" * 50)
    print(f"  Total Tables: {len(tables)} | Total Records: {total_records}")
    print(f"  Database File: {DB_FILE} ({os.path.getsize(DB_FILE) / 1024:.1f} KB)")
    print("=" * 50 + "\n")
    conn.close()

def show_users():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, account_type, created_at FROM users ORDER BY id ASC")
    rows = cur.fetchall()
    print("\n" + "=" * 65)
    print(f"{'ID':<4} {'NAME':<20} {'ACCOUNT TYPE':<14} {'EMAIL'}")
    print("=" * 65)
    for r in rows:
        print(f"{r['id']:<4} {r['name']:<20} {r['account_type']:<14} {r['email']}")
    print("-" * 65 + "\n")
    conn.close()

def show_orders():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT o.order_number, u.name, o.total_amount, o.order_status, o.created_at
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.id DESC LIMIT 10
    """)
    rows = cur.fetchall()
    print("\n" + "=" * 78)
    print(f"{'ORDER #':<18} {'CLIENT':<18} {'TOTAL':<10} {'STATUS':<15} {'DATE'}")
    print("=" * 78)
    if not rows:
        print("  No orders placed yet.")
    for r in rows:
        print(f"{r['order_number']:<18} {r['name']:<18} Rs.{r['total_amount']:<9.2f} {r['order_status']:<15} {r['created_at']}")
    print("-" * 78 + "\n")
    conn.close()

def backup():
    from backup_db import backup as do_backup
    do_backup()

def open_gui():
    if os.path.exists(APP_PATH):
        print(f"Launching DB Browser for SQLite with {DB_FILE}...")
        subprocess.Popen([APP_PATH, DB_FILE])
    else:
        print(f"DB Browser for SQLite not found at default path. Launching system viewer for {DB_FILE}...")
        os.startfile(DB_FILE)

if __name__ == '__main__':
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else 'stats'
    if arg in ('stats', 'summary'):
        show_stats()
    elif arg in ('users', 'accounts'):
        show_users()
    elif arg in ('orders',):
        show_orders()
    elif arg in ('backup',):
        backup()
    elif arg in ('open', 'gui'):
        open_gui()
    else:
        print(__doc__)
