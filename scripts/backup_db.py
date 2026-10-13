#!/usr/bin/env python3
"""
Nutiyala Couture - SQLite Database Backup & Recovery Script
Uses SQLite's native online backup API (sqlite3.Connection.backup).
Features:
- Safe, non-blocking online hot backup while server is running.
- Integrity verification via 'PRAGMA integrity_check'.
- Configurable retention policy (default: 14 days).
- Comprehensive error handling and non-zero exit codes on failure.
- Verification and restore capabilities.
"""

import os
import sys
import sqlite3
import argparse
import datetime
import glob
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("nutiyala_backup")

DEFAULT_DB_PATH = os.environ.get(
    'NUTIYALA_DB_PATH',
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'nutiyala.db')
)
DEFAULT_BACKUP_DIR = os.environ.get(
    'NUTIYALA_BACKUP_DIR',
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backups', 'db')
)
DEFAULT_RETENTION_DAYS = int(os.environ.get('NUTIYALA_BACKUP_RETENTION_DAYS', '14'))

def perform_backup(source_path=DEFAULT_DB_PATH, backup_dir=DEFAULT_BACKUP_DIR, retention_days=DEFAULT_RETENTION_DAYS):
    """
    Performs an online backup of the SQLite database.
    """
    if not os.path.exists(source_path):
        logger.error(f"Source database file not found: {source_path}")
        return False, None

    os.makedirs(backup_dir, exist_ok=True)
    try:
        # Secure directory permissions on POSIX systems
        if hasattr(os, 'chmod'):
            os.chmod(backup_dir, 0o700)
    except Exception as e:
        logger.debug(f"Note on directory chmod: {e}")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"nutiyala_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)

    logger.info(f"Initiating online backup from: {source_path}")
    logger.info(f"Target backup destination: {backup_path}")

    src_conn = None
    dst_conn = None
    try:
        src_conn = sqlite3.connect(source_path, timeout=30.0)
        dst_conn = sqlite3.connect(backup_path)

        # Execute native online backup
        with dst_conn:
            src_conn.backup(dst_conn, pages=100, sleep=0.01)

        dst_conn.close()
        dst_conn = None
        src_conn.close()
        src_conn = None

        logger.info("Database online copy completed.")

        # Set secure file permissions on POSIX systems
        try:
            if hasattr(os, 'chmod'):
                os.chmod(backup_path, 0o600)
        except Exception:
            pass

        # Integrity Check on Backup
        if not verify_integrity(backup_path):
            logger.error("Backup file failed integrity verification! Removing corrupted backup.")
            if os.path.exists(backup_path):
                os.remove(backup_path)
            return False, None

        logger.info(f"Backup successfully verified. Size: {os.path.getsize(backup_path):,} bytes.")

        # Prune old backups
        prune_old_backups(backup_dir, retention_days)

        return True, backup_path

    except Exception as exc:
        logger.error(f"Backup failed with error: {exc}", exc_info=True)
        if dst_conn:
            try:
                dst_conn.close()
            except Exception:
                pass
        if src_conn:
            try:
                src_conn.close()
            except Exception:
                pass
        if os.path.exists(backup_path):
            try:
                os.remove(backup_path)
            except Exception:
                pass
        return False, None

def verify_integrity(db_path):
    """
    Executes 'PRAGMA integrity_check' on the database.
    """
    logger.info(f"Running integrity check on: {db_path}")
    try:
        conn = sqlite3.connect(db_path, timeout=10.0)
        cursor = conn.cursor()
        cursor.execute("PRAGMA integrity_check")
        rows = cursor.fetchall()
        conn.close()

        if len(rows) == 1 and rows[0][0].lower() == 'ok':
            logger.info("Integrity check passed: OK")
            return True
        else:
            logger.error(f"Integrity check reported issues: {rows}")
            return False
    except Exception as exc:
        logger.error(f"Integrity check failed: {exc}")
        return False

def prune_old_backups(backup_dir, retention_days):
    """
    Deletes backups older than retention_days.
    """
    if retention_days <= 0:
        return

    pattern = os.path.join(backup_dir, "nutiyala_backup_*.db")
    files = glob.glob(pattern)
    cutoff = datetime.datetime.now() - datetime.timedelta(days=retention_days)

    logger.info(f"Pruning backups older than {retention_days} days (cutoff: {cutoff.strftime('%Y-%m-%d %H:%M:%S')})...")
    deleted_count = 0

    for file_path in files:
        try:
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
            if mtime < cutoff:
                os.remove(file_path)
                deleted_count += 1
                logger.info(f"Pruned expired backup: {os.path.basename(file_path)}")
        except Exception as e:
            logger.warning(f"Could not prune {file_path}: {e}")

    logger.info(f"Pruning complete. {deleted_count} expired backup(s) removed.")

def restore_backup(backup_file, target_path):
    """
    Restores a verified backup to a target database destination.
    """
    logger.info(f"Preparing to restore from: {backup_file} -> {target_path}")
    if not os.path.exists(backup_file):
        logger.error(f"Specified backup file not found: {backup_file}")
        return False

    if not verify_integrity(backup_file):
        logger.error("Backup file failed integrity check. Aborting restore.")
        return False

    try:
        # Create destination directory if needed
        target_dir = os.path.dirname(os.path.abspath(target_path))
        os.makedirs(target_dir, exist_ok=True)

        src_conn = sqlite3.connect(backup_file)
        dst_conn = sqlite3.connect(target_path)
        with dst_conn:
            src_conn.backup(dst_conn)
        dst_conn.close()
        src_conn.close()

        # Check restored database
        if not verify_integrity(target_path):
            logger.error("Restored database failed integrity check!")
            return False

        logger.info(f"Successfully restored and verified database at: {target_path}")
        return True
    except Exception as e:
        logger.error(f"Restore failed: {e}", exc_info=True)
        return False

def main():
    parser = argparse.ArgumentParser(description="Nutiyala Couture SQLite Backup & Restore Utility")
    parser.add_argument('--backup', action='store_true', help="Execute database backup (default action)")
    parser.add_argument('--verify', metavar="DB_FILE", help="Verify integrity of specified database file")
    parser.add_argument('--restore', metavar="BACKUP_FILE", help="Restore specified backup file")
    parser.add_argument('--target', metavar="TARGET_PATH", default=DEFAULT_DB_PATH, help="Target path for restore")
    parser.add_argument('--source', default=DEFAULT_DB_PATH, help="Source database path for backup")
    parser.add_argument('--dir', default=DEFAULT_BACKUP_DIR, help="Backup storage directory")
    parser.add_argument('--retention', type=int, default=DEFAULT_RETENTION_DAYS, help="Retention period in days")

    args = parser.parse_args()

    if args.verify:
        success = verify_integrity(args.verify)
        sys.exit(0 if success else 1)

    if args.restore:
        success = restore_backup(args.restore, args.target)
        sys.exit(0 if success else 1)

    # Default action: backup
    success, backup_path = perform_backup(args.source, args.dir, args.retention)
    if success:
        logger.info(f"Backup job finished successfully: {backup_path}")
        sys.exit(0)
    else:
        logger.error("Backup job terminated with errors.")
        sys.exit(1)

if __name__ == '__main__':
    main()
