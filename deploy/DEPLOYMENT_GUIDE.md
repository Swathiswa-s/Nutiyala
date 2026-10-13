# Nutiyala Couture — Production Deployment & Operations Guide

This guide describes the configuration and verification procedures required to deploy the Nutiyala Couture platform to a Linux VPS (Ubuntu 22.04 / 24.04 LTS recommended) behind an Nginx reverse proxy with TLS/HTTPS, automated SQLite backups, and systemd service management.

---

## 1. Architecture Overview

```
[Public Internet]
       │
       ▼ (Port 80/443 HTTPS)
  ┌─────────┐
  │  Nginx  │  (SSL Termination, Gzip, Header sanitization, Static caching)
  └────┬────┘
       │ (127.0.0.1:5173 - Loopback only)
       ▼
 ┌───────────┐       ┌──────────────────────┐
 │  serve.py │ ────▶ │  SQLite Database     │ (/var/lib/nutiyala/nutiyala.db, 0600)
 └───────────┘       └──────────┬───────────┘
                                │ (Daily Hot Backup via sqlite3 backup API)
                                ▼
                     ┌──────────────────────┐
                     │ /var/backups/nutiyala│ (14-day rolling retention)
                     └──────────────────────┘
```

> **Production Server Note**:
> The application uses Python's standard `ThreadingHTTPServer` via `serve.py`. When bound strictly to `127.0.0.1:5173` behind an Nginx reverse proxy, this setup safely serves small-to-medium boutique traffic. For high-concurrency enterprise scale (>500 concurrent connections), wrapping the API into a WSGI/ASGI application (e.g., via Gunicorn with Uvicorn workers) is recommended.

---

## 2. Server Prerequisites

On your clean VPS:

```bash
# Update repository packages
sudo apt update && sudo apt upgrade -y

# Install required runtime dependencies
sudo apt install -y python3 python3-pip nginx certbot python3-certbot-nginx git curl
```

---

## 3. Dedicated Service User & File Permissions

Never run the application as `root`. Create an isolated system user:

```bash
# 1. Create system user
sudo useradd -r -s /bin/false -d /var/www/nutiyala_couture nutiyala

# 2. Create application and persistent storage directories
sudo mkdir -p /var/www/nutiyala_couture
sudo mkdir -p /var/lib/nutiyala
sudo mkdir -p /var/backups/nutiyala/db
sudo mkdir -p /etc/nutiyala
sudo mkdir -p /var/www/certbot

# 3. Clone or copy your project files to /var/www/nutiyala_couture
# Example: sudo cp -r /path/to/project/* /var/www/nutiyala_couture/

# 4. Set directory ownership and strict permissions
sudo chown -R nutiyala:nutiyala /var/www/nutiyala_couture
sudo chown -R nutiyala:nutiyala /var/lib/nutiyala
sudo chown -R nutiyala:nutiyala /var/backups/nutiyala

# Ensure persistent database file has strict permissions
sudo chmod 0700 /var/lib/nutiyala
sudo chmod 0700 /var/backups/nutiyala
```

---

## 4. Environment Configuration

Copy the template configuration to `/etc/nutiyala/nutiyala.env`:

```bash
sudo cp /var/www/nutiyala_couture/deploy/env.example /etc/nutiyala/nutiyala.env
sudo chown root:nutiyala /etc/nutiyala/nutiyala.env
sudo chmod 0640 /etc/nutiyala/nutiyala.env
```

Edit the file with your production values:

```bash
sudo nano /etc/nutiyala/nutiyala.env
```

Key variables to verify:
- `HOST=127.0.0.1` (Prevents direct public exposure)
- `PORT=5173`
- `ALLOWED_ORIGIN=https://nutiyalacouture.com,https://www.nutiyalacouture.com`
- `NUTIYALA_DB_PATH=/var/lib/nutiyala/nutiyala.db`
- `NUTIYALA_BACKUP_DIR=/var/backups/nutiyala/db`
- `FAST2SMS_API_KEY=<your_api_key>` (Your secret API key; never commit or log)
- `FAST2SMS_LIVE_DISPATCH=true` (Set to `true` in production to dispatch real carrier SMS; leave `false` in development)
- `ADMIN_NOTIFICATION_PHONE=+919894156412` (Store manager's 10-digit mobile number for instant order alerts)

---

## 5. Systemd Service Setup

Install and enable the background service:

```bash
# Copy systemd unit file
sudo cp /var/www/nutiyala_couture/deploy/systemd/nutiyala.service /etc/systemd/system/

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start on system boot
sudo systemctl enable nutiyala

# Start service
sudo systemctl start nutiyala

# Verify service status
sudo systemctl status nutiyala
```

To view live service logs:
```bash
journalctl -u nutiyala -f
```

---

## 6. Nginx Reverse Proxy & TLS Configuration

1. Copy the Nginx configuration:
```bash
sudo cp /var/www/nutiyala_couture/deploy/nginx/nutiyala.conf /etc/nginx/sites-available/nutiyala.conf
sudo ln -s /etc/nginx/sites-available/nutiyala.conf /etc/nginx/sites-enabled/
```

2. Point your domain DNS records:
   - `A` Record: `@` -> VPS Public IP
   - `A` Record: `www` -> VPS Public IP

3. Obtain Let's Encrypt TLS Certificate:
```bash
sudo certbot --nginx -d nutiyalacouture.com -d www.nutiyalacouture.com
```

4. Verify and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

Certbot automatically configures auto-renewal. Test renewal with:
```bash
sudo certbot renew --dry-run
```

---

## 7. Automated SQLite Database Backups

The backup utility `scripts/backup_db.py` uses SQLite's native online backup API, performs `PRAGMA integrity_check` on the backup copy, and prunes backups older than 14 days.

### Schedule Daily Backups via Cron

Add a scheduled task to run at 3:00 AM daily:

```bash
sudo crontab -u nutiyala -e
```

Add the following entry:

```cron
0 3 * * * /usr/bin/python3 /var/www/nutiyala_couture/scripts/backup_db.py >> /var/backups/nutiyala/backup.log 2>&1
```

### Manual Backup Run

```bash
sudo -u nutiyala python3 /var/www/nutiyala_couture/scripts/backup_db.py
```

### Database Restore Procedure

To test or restore a backup to the live database (or a test database):

1. **Stop the application service**:
   ```bash
   sudo systemctl stop nutiyala
   ```

2. **Verify backup file integrity**:
   ```bash
   python3 /var/www/nutiyala_couture/scripts/backup_db.py --verify /var/backups/nutiyala/db/nutiyala_backup_YYYYMMDD_HHMMSS.db
   ```

3. **Restore to the live database destination**:
   ```bash
   python3 /var/www/nutiyala_couture/scripts/backup_db.py --restore /var/backups/nutiyala/db/nutiyala_backup_YYYYMMDD_HHMMSS.db --target /var/lib/nutiyala/nutiyala.db
   ```

4. **Verify file permissions**:
   ```bash
   sudo chown nutiyala:nutiyala /var/lib/nutiyala/nutiyala.db
   sudo chmod 0600 /var/lib/nutiyala/nutiyala.db
   ```

5. **Restart the application service**:
   ```bash
   sudo systemctl start nutiyala
   sudo systemctl status nutiyala
   ```

---

## 8. Verification & Security Checklist

- [ ] `demo_admin_token` backdoor is rejected with HTTP 403.
- [ ] Admin APIs reject missing, invalid, or expired tokens.
- [ ] Direct access to `nutiyala.db` via browser returns HTTP 404 (blocked by Nginx).
- [ ] Direct access to `127.0.0.1:5173` is inaccessible from outside the server.
- [ ] Unapproved CORS origins do not receive `Access-Control-Allow-Origin`.
- [ ] Daily backup is created and verified under `/var/backups/nutiyala/db`.
- [ ] Fast2SMS live dispatch configured and verified with controlled test option.

---

## 9. Fast2SMS Production Integration & Live Verification Guide

Nutiyala Couture features a production-hardened Fast2SMS integration using the official Fast2SMS bulkV2 Quick route API (`https://www.fast2sms.com/dev/bulkV2`).

### 9.1 How to Obtain and Configure Fast2SMS Credentials

1. Register or sign in to your Fast2SMS account: [https://www.fast2sms.com/](https://www.fast2sms.com/).
2. Navigate to the **Dev API** dashboard: [https://www.fast2sms.com/dashboard/dev-api](https://www.fast2sms.com/dashboard/dev-api).
3. Copy your unique **Authorization API Key**.
4. Add wallet credits to your Fast2SMS account (Quick SMS requires wallet balance in INR).
5. In your production environment file `/etc/nutiyala/nutiyala.env`:
   ```bash
   sudo nano /etc/nutiyala/nutiyala.env
   ```
   Add:
   ```bash
   FAST2SMS_API_KEY=your_actual_fast2sms_api_key_here
   FAST2SMS_LIVE_DISPATCH=true
   ```
6. Ensure strict file permissions so secrets are never readable by unauthorized users:
   ```bash
   sudo chmod 0600 /etc/nutiyala/nutiyala.env
   sudo chown nutiyala:nutiyala /etc/nutiyala/nutiyala.env
   ```
7. Restart the service to apply changes:
   ```bash
   sudo systemctl restart nutiyala
   ```

### 9.2 Operating Modes: Live vs Simulated

| Mode | Condition | Gateway Call | Carrier Deductions | Status in Log |
| :--- | :--- | :--- | :--- | :--- |
| **Simulated Mode** (Default) | `FAST2SMS_LIVE_DISPATCH=false` | None | None (Free) | `SIMULATED_LOCAL` |
| **Live Dispatch** | `FAST2SMS_LIVE_DISPATCH=true` & valid key | `POST https://www.fast2sms.com/dev/bulkV2` | Standard SMS rate | `ACCEPTED_BY_GATEWAY` |
| **Controlled Test Option** | Admin sends test SMS with `send_real: true` | Calls live gateway for single test | 1 test SMS rate | `ACCEPTED_BY_GATEWAY` |

### 9.3 Notification Triggers

1. **Customer Order Placed (`[ORDER RECEIVED]`)**:
   - Dispatched immediately when customer completes checkout or Buy Now.
   - Recipient: Customer's validated 10-digit mobile number.
   - Message details: Order number, atelier items preview, total amount.
2. **Admin New Order Alert (`[NEW ORDER ALERT]`)**:
   - Dispatched immediately when any customer places an order.
   - Recipient: Store Admin phone (`boutique_details.admin_sms_phone`).
   - Message details: Order ID, customer name, customer phone, shipping address, order total.
3. **Admin Order Confirmation (`[ORDER CONFIRMED]`)**:
   - Dispatched when admin clicks **Confirm Order** in the Admin Portal.
   - Recipient: Customer mobile number.
   - Also syncs to customer's in-app notification center (`account.html#orders`).

### 9.4 Fault Tolerance & Data Safety Rules

- **Zero Order Impact**: All SMS calls are non-blocking and isolated in exception handlers. An SMS gateway timeout, invalid phone number, or network failure will **never** cause order creation or confirmation to fail.
- **Idempotent Deduplication**: If an admin updates an order multiple times or a network retry occurs, `sms_service.py` detects prior successful dispatch for that specific order event and marks subsequent attempts as `DUPLICATE_SKIPPED`, saving wallet balance.
- **Privacy-Preserving Logs**: Phone numbers are masked in all console outputs (`+91 ******6412`), and API keys are never printed, stored in logs, or exposed to the client-side browser.
- **Delivery Status Distinction**: Fast2SMS accepts messages asynchronously. The system logs `ACCEPTED_BY_GATEWAY` upon HTTP 200 return from Fast2SMS, clearly distinguishing gateway queue acceptance from telecom carrier delivery.

