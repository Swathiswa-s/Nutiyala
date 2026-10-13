import sqlite3
import shutil
from datetime import datetime
import os

DB_FILE = 'nutiyala.db'
BACKUP_DIR = 'backups'

def backup():
    if not os.path.exists(DB_FILE):
        print(f"Error: {DB_FILE} not found!")
        return

    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(BACKUP_DIR, f'nutiyala_backup_{timestamp}.db')

    # SQLite online backup API ensures safe backup even while server is running
    src = sqlite3.connect(DB_FILE)
    dst = sqlite3.connect(backup_file)
    with dst:
        src.backup(dst)
    dst.close()
    src.close()

    size_kb = os.path.getsize(backup_file) / 1024
    print(f"Database backed up successfully to: {backup_file} ({size_kb:.1f} KB)")

if __name__ == '__main__':
    backup()
