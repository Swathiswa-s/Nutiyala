"""
NUTIYALA COUTURE • ATELIER SMS & NOTIFICATION ENGINE
Manages real-time SMS alerts to Store Admin on new orders,
and automatic confirmation SMS alerts to Customers when orders are placed and confirmed.
Integrates with the official Fast2SMS bulkV2 API with robust deduplication,
phone validation, safe privacy-preserving logging, and local simulation fallback.
"""

import os
import json
import re
import socket
import urllib.parse
import urllib.request
import urllib.error
import base64
from datetime import datetime
import env_loader
import database

FAST2SMS_ENDPOINT = "https://www.fast2sms.com/dev/bulkV2"
DEFAULT_TIMEOUT_SECONDS = 8

def get_active_provider() -> str:
    """
    Returns the configured primary SMS gateway provider: 'fast2sms' (default) or 'twilio'.
    Configured via SMS_PROVIDER in .env.
    """
    return os.environ.get('SMS_PROVIDER', 'fast2sms').strip().lower()

def get_fast2sms_config() -> dict:
    """
    Returns the Fast2SMS configuration dictionary from environment variables.
    Safe helper that does not print secrets or expose them in logs or client responses.
    Defaults live_dispatch to False when missing or unset.
    """
    return {
        'api_key': os.environ.get('FAST2SMS_API_KEY', '').strip(),
        'live_dispatch': os.environ.get('FAST2SMS_LIVE_DISPATCH', 'false').lower() in ('true', '1'),
        'route': os.environ.get('FAST2SMS_ROUTE', 'q').strip().lower(),
        'sender_id': os.environ.get('FAST2SMS_SENDER_ID', '').strip(),
        'entity_id': os.environ.get('FAST2SMS_ENTITY_ID', '').strip(),
    }

def get_twilio_config() -> dict:
    """
    Returns the Twilio SMS configuration dictionary from environment variables.
    Safe helper that does not print secrets or expose them in logs or client responses.
    Defaults live_dispatch to False when missing or unset.
    """
    return {
        'account_sid': os.environ.get('TWILIO_ACCOUNT_SID', '').strip(),
        'auth_token': os.environ.get('TWILIO_AUTH_TOKEN', '').strip(),
        'phone_number': os.environ.get('TWILIO_PHONE_NUMBER', '').strip(),
        'live_dispatch': os.environ.get('TWILIO_LIVE_DISPATCH', 'false').lower() in ('true', '1'),
    }


def get_admin_phone() -> str:
    """Returns the Admin mobile number configured to receive new order SMS alerts."""
    env_phone = os.environ.get('ADMIN_NOTIFICATION_PHONE', '').strip()
    if env_phone:
        return env_phone
    conn = database.get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT admin_sms_phone, contact_number FROM boutique_details WHERE id = 1")
        row = cursor.fetchone()
        if row:
            num = (row['admin_sms_phone'] or row['contact_number'] or '+91 9894156412').strip()
            return num
    except Exception:
        pass
    finally:
        conn.close()
    return '+91 9894156412'


def update_admin_phone(phone: str) -> bool:
    """Updates the Admin mobile number for SMS alerts in boutique_details."""
    phone = (phone or '').strip()
    if not phone:
        return False
    conn = database.get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        UPDATE boutique_details 
        SET admin_sms_phone = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = 1
        """, (phone,))
        conn.commit()
        return True
    except Exception as e:
        print("Error updating admin SMS phone:", e)
        return False
    finally:
        conn.close()

def validate_and_format_phone(phone: str):
    """
    Validates and standardizes an Indian mobile phone number.
    Returns: (is_valid: bool, display_formatted: str, ten_digit: str, error_reason: str)
    """
    if not phone:
        return False, "", "", "Phone number missing"

    raw_str = str(phone).strip()
    digits = ''.join(c for c in raw_str if c.isdigit())

    # Handle standard prefixes: 919876543210 (12 digits) or 09876543210 (11 digits)
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith('0'):
        digits = digits[1:]

    if len(digits) != 10:
        return False, raw_str, "", f"Expected 10-digit Indian mobile number, got {len(digits)} digits"

    # Indian mobile numbers begin with 6, 7, 8, or 9
    if digits[0] not in ('6', '7', '8', '9'):
        return False, raw_str, "", "Invalid Indian mobile prefix (must begin with 6, 7, 8, or 9)"

    formatted = f"+91 {digits[:5]} {digits[5:]}"
    return True, formatted, digits, ""

def clean_phone_number(phone: str) -> str:
    """Legacy helper for formatting phone strings."""
    valid, formatted, _, _ = validate_and_format_phone(phone)
    if valid:
        return formatted
    return str(phone).strip() if phone else ""

def mask_phone_number(phone: str) -> str:
    """Masks phone number for safe privacy-preserving logging, e.g. +91 ******6412."""
    if not phone:
        return "[NOT PROVIDED]"
    digits = ''.join(c for c in str(phone) if c.isdigit())
    if len(digits) >= 10:
        return f"+91 ******{digits[-4:]}"
    elif len(digits) >= 4:
        return f"******{digits[-4:]}"
    return "******"

def is_duplicate_sms(order_id=None, recipient_type='ADMIN', action_tag='', order_number=None) -> bool:
    """
    Checks if a notification with this action tag was already successfully
    dispatched for this order and recipient, preventing duplicate messages.
    Supports matching by either order_id or order_number.
    """
    if not action_tag:
        return False
    if not order_id and not order_number:
        return False

    # Extract core keyword without brackets, e.g. '[ORDER CONFIRMED]' -> 'ORDER CONFIRMED'
    clean_tag = re.sub(r'[\[\]]', '', action_tag).strip()
    pattern = f"%{clean_tag}%"

    conn = database.get_db()
    cursor = conn.cursor()
    try:
        if order_id:
            cursor.execute("""
            SELECT id, status, created_at FROM sms_logs 
            WHERE order_id = ? 
              AND recipient_type = ? 
              AND message LIKE ? 
              AND (status IN ('ACCEPTED_BY_GATEWAY', 'SENT', 'SIMULATED_LOCAL') OR status LIKE 'ACCEPTED_BY_GATEWAY%' OR status LIKE 'TWILIO_%')
            LIMIT 1
            """, (order_id, recipient_type, pattern))
        else:
            cursor.execute("""
            SELECT id, status, created_at FROM sms_logs 
            WHERE order_number = ? 
              AND recipient_type = ? 
              AND message LIKE ? 
              AND (status IN ('ACCEPTED_BY_GATEWAY', 'SENT', 'SIMULATED_LOCAL') OR status LIKE 'ACCEPTED_BY_GATEWAY%' OR status LIKE 'TWILIO_%')
            LIMIT 1
            """, (order_number, recipient_type, pattern))
        row = cursor.fetchone()
        return bool(row)
    except Exception as e:
        print("Error checking duplicate SMS in database:", e)
        return False
    finally:
        conn.close()

def dispatch_twilio(to_phone: str, message: str, config: dict = None, timeout: int = DEFAULT_TIMEOUT_SECONDS):
    """
    Dispatches SMS via Twilio Messages REST API.
    Returns: (gateway_status: str, response_dict: dict)
    Never exposes auth tokens or secrets in status strings, responses, or logs.
    """
    if config is None:
        config = get_twilio_config()

    account_sid = (config.get('account_sid') or '').strip()
    auth_token = (config.get('auth_token') or '').strip()
    from_phone = (config.get('phone_number') or '').strip()

    if not account_sid or not auth_token:
        return "FAILED: MISSING_API_KEY (Twilio credentials not configured)", {"error": "Missing Twilio credentials"}

    if not from_phone:
        return "FAILED: MISSING_SENDER (TWILIO_PHONE_NUMBER not configured)", {"error": "Missing Twilio sender number"}

    twilio_endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"

    payload = {
        "To": to_phone,
        "From": from_phone,
        "Body": message
    }
    encoded_data = urllib.parse.urlencode(payload).encode("utf-8")

    auth_pair = f"{account_sid}:{auth_token}"
    auth_b64 = base64.b64encode(auth_pair.encode("utf-8")).decode("ascii")

    headers = {
        "Authorization": f"Basic {auth_b64}",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "NutiyalaCouture-Twilio/1.0"
    }

    req = urllib.request.Request(
        twilio_endpoint,
        data=encoded_data,
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            resp_body = response.read().decode("utf-8", errors="ignore")
            try:
                resp_json = json.loads(resp_body)
            except Exception:
                resp_json = {"raw": resp_body}

            sid = resp_json.get("sid", "")
            status_desc = f"TWILIO_QUEUED ({sid})" if sid else "TWILIO_QUEUED"
            return status_desc, resp_json

    except urllib.error.HTTPError as http_err:
        try:
            err_body = http_err.read().decode("utf-8", errors="ignore")
            err_json = json.loads(err_body)
            err_code = err_json.get("code", http_err.code)
            err_msg = err_json.get("message", f"HTTP {http_err.code}")
        except Exception:
            err_json = {}
            err_code = http_err.code
            err_msg = f"HTTP {http_err.code}"

        if http_err.code in (401, 403):
            return f"FAILED: AUTH_ERROR (Twilio HTTP {http_err.code})", err_json
        return f"FAILED: TWILIO_ERROR_{err_code} ({str(err_msg)[:40]})", err_json

    except urllib.error.URLError as url_err:
        if isinstance(url_err.reason, socket.timeout) or "timed out" in str(url_err).lower():
            return "FAILED: TIMEOUT", {"error": "Twilio gateway connection timed out"}
        return f"FAILED: NETWORK_ERROR ({str(url_err.reason)[:40]})", {"error": str(url_err)}

    except Exception as gen_err:
        return f"FAILED: {str(gen_err)[:50]}", {"error": str(gen_err)}

def dispatch_fast2sms(numbers: str, message: str, api_key: str = None, timeout: int = DEFAULT_TIMEOUT_SECONDS, config: dict = None):
    """
    Dispatches SMS via Fast2SMS bulkV2 API.
    Supports both Quick route ('q') and DLT route ('dlt').
    Returns: (gateway_status: str, response_dict: dict)
    Never exposes API keys or secrets in status strings, responses, or logs.
    """
    if config is None:
        config = get_fast2sms_config()

    if api_key is None:
        api_key = config.get('api_key', '')
    api_key = str(api_key or '').strip()

    if not api_key:
        return "FAILED: MISSING_API_KEY (FAST2SMS_API_KEY not configured)", {"error": "Missing Fast2SMS API key"}

    # Clean target phone digits (expect 10-digit Indian mobile number)
    raw_digits = ''.join(c for c in str(numbers) if c.isdigit())
    if len(raw_digits) == 12 and raw_digits.startswith('91'):
        target_numbers = raw_digits[2:]
    elif len(raw_digits) == 11 and raw_digits.startswith('0'):
        target_numbers = raw_digits[1:]
    else:
        target_numbers = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits

    if not target_numbers or len(target_numbers) != 10:
        return "FAILED: INVALID_PHONE (10-digit mobile number required for Fast2SMS)", {"error": "Invalid recipient phone number"}

    route = config.get('route', 'q').strip().lower()

    if route == 'dlt':
        sender_id = (config.get('sender_id') or '').strip()
        entity_id = (config.get('entity_id') or '').strip()
        if not sender_id:
            return "FAILED: MISSING_SENDER (FAST2SMS_SENDER_ID required for DLT route)", {"error": "Missing DLT sender ID"}
        payload = {
            "route": "dlt",
            "sender_id": sender_id,
            "message": message,
            "flash": 0,
            "numbers": target_numbers
        }
        if entity_id:
            payload["entity_id"] = entity_id
    else:
        # Default Quick SMS route ('q') with automatic Unicode detection
        has_unicode = any(ord(c) > 127 for c in str(message))
        lang = "unicode" if has_unicode else "english"
        payload = {
            "route": "q",
            "message": message,
            "language": lang,
            "flash": 0,
            "numbers": target_numbers
        }

    req_bytes = json.dumps(payload).encode('utf-8')
    headers = {
        "authorization": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "NutiyalaCouture-Fast2SMS/1.0"
    }

    req = urllib.request.Request(
        FAST2SMS_ENDPOINT,
        data=req_bytes,
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            resp_body = response.read().decode('utf-8', errors='ignore')
            try:
                resp_json = json.loads(resp_body)
            except Exception:
                resp_json = {"raw": resp_body}

            if resp_json.get('return') is True:
                req_id = resp_json.get('request_id', '')
                status_desc = f"ACCEPTED_BY_GATEWAY ({req_id})" if req_id else "ACCEPTED_BY_GATEWAY"
                return status_desc, resp_json
            else:
                msg_val = resp_json.get('message', ['Rejected by gateway'])
                if isinstance(msg_val, list):
                    err_msg = ", ".join(str(m) for m in msg_val)
                else:
                    err_msg = str(msg_val)
                return f"FAILED: FAST2SMS_ERROR ({err_msg[:45]})", resp_json

    except urllib.error.HTTPError as http_err:
        try:
            err_body = http_err.read().decode('utf-8', errors='ignore')
            err_json = json.loads(err_body)
            msg_val = err_json.get('message', [f"HTTP {http_err.code}"])
            if isinstance(msg_val, list):
                err_detail = ", ".join(str(m) for m in msg_val)
            else:
                err_detail = str(msg_val)
        except Exception:
            err_json = {}
            err_detail = f"HTTP {http_err.code}"

        if http_err.code in (401, 403):
            return f"FAILED: AUTH_ERROR (HTTP {http_err.code})", err_json
        return f"FAILED: FAST2SMS_HTTP_{http_err.code} ({err_detail[:120]})", err_json

    except urllib.error.URLError as url_err:
        if isinstance(url_err.reason, socket.timeout) or "timed out" in str(url_err).lower():
            return "FAILED: TIMEOUT", {"error": "Fast2SMS gateway connection timed out"}
        return f"FAILED: NETWORK_ERROR ({str(url_err.reason)[:40]})", {"error": str(url_err)}

    except Exception as gen_err:
        return f"FAILED: {str(gen_err)[:50]}", {"error": str(gen_err)}

def record_sms(recipient_phone, message, recipient_type='ADMIN', order_id=None, order_number='', action_tag='', force_live=False, skip_dedup=False):
    """
    Main dispatch and logging engine.
    - Validates phone numbers.
    - Prevents duplicate dispatches for orders.
    - Supports Fast2SMS (primary) and Twilio (secondary).
    - Enforces live dispatch safety check (FAST2SMS_LIVE_DISPATCH / TWILIO_LIVE_DISPATCH).
    - Saves audit log in SQLite sms_logs table.
    """
    is_valid, formatted_phone, ten_digit, err_reason = validate_and_format_phone(recipient_phone)
    masked_phone = mask_phone_number(recipient_phone)

    # 1. Phone Number Validation Check
    if not recipient_phone or not str(recipient_phone).strip():
        gateway_status = "FAILED: MISSING_PHONE"
        log_to_db = True
    elif not is_valid:
        gateway_status = f"FAILED: INVALID_PHONE ({err_reason})"
        log_to_db = True
    else:
        # 2. Deduplication Check (skipped for manual on-demand diagnostic tests)
        if not skip_dedup and is_duplicate_sms(order_id=order_id, recipient_type=recipient_type, action_tag=action_tag, order_number=order_number):
            safe_tag = (action_tag or 'SMS').encode('ascii', errors='replace').decode('ascii')
            print(f"[SMS DEDUPLICATION] Skipped duplicate {safe_tag} for order {order_number} to {masked_phone}")
            return {
                'sms_id': None,
                'recipient_phone': formatted_phone,
                'masked_phone': masked_phone,
                'status': 'DUPLICATE_SKIPPED',
                'gateway_status': 'DUPLICATE_SKIPPED',
                'order_number': order_number,
                'message': 'Duplicate SMS dispatch skipped for this order event.'
            }

        # 3. Determine Provider Mode (Fast2SMS Primary, Twilio Secondary/Legacy)
        provider = get_active_provider()
        fast_cfg = get_fast2sms_config()
        tw_config = get_twilio_config()

        fast_live = fast_cfg.get('live_dispatch', False)
        tw_live = tw_config.get('live_dispatch', False)

        if provider == 'fast2sms':
            # Master safety guard: Live transmission occurs ONLY when FAST2SMS_LIVE_DISPATCH is enabled in .env
            if fast_live:
                if not fast_cfg.get('api_key'):
                    gateway_status = "FAILED: MISSING_API_KEY (FAST2SMS_API_KEY not configured)"
                else:
                    gateway_status, _ = dispatch_fast2sms(ten_digit, message, fast_cfg.get('api_key'), config=fast_cfg, timeout=DEFAULT_TIMEOUT_SECONDS)
            else:
                gateway_status = "SIMULATED_LOCAL"
        elif provider == 'twilio':
            if tw_live:
                to_e164 = f"+91{ten_digit}" if ten_digit else formatted_phone
                if not tw_config.get('account_sid') or not tw_config.get('auth_token'):
                    gateway_status = "FAILED: MISSING_API_KEY (Twilio credentials not configured)"
                elif not tw_config.get('phone_number'):
                    gateway_status = "FAILED: MISSING_SENDER (TWILIO_PHONE_NUMBER not configured)"
                else:
                    gateway_status, _ = dispatch_twilio(to_e164, message, tw_config, timeout=DEFAULT_TIMEOUT_SECONDS)
            else:
                gateway_status = "SIMULATED_LOCAL"
        else:
            gateway_status = "SIMULATED_LOCAL"

        log_to_db = True

    # WhatsApp concierge direct link (clean digits)
    wa_digits = '91' + ten_digit if ten_digit else ''
    wa_link = f"https://wa.me/{wa_digits}?text={urllib.parse.quote(message)}" if wa_digits else ""

    # 4. Record to SQLite sms_logs table
    sms_id = None
    if log_to_db:
        conn = database.get_db()
        cursor = conn.cursor()
        try:
            cursor.execute("""
            INSERT INTO sms_logs (order_id, order_number, recipient_type, recipient_phone, message, status)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (order_id, order_number, recipient_type, formatted_phone or str(recipient_phone), message, gateway_status))
            conn.commit()
            sms_id = cursor.lastrowid
        except Exception as db_err:
            print("Error persisting to sms_logs:", db_err)
        finally:
            conn.close()

    # 5. Safe Privacy-Preserving Console Log (Phone masked & ASCII-safe)
    timestamp_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    safe_msg = message.encode('ascii', errors='replace').decode('ascii')
    print("\n" + "=" * 65)
    print(f"[SMS ENGINE - {recipient_type} NOTIFICATION]")
    print(f"Timestamp: {timestamp_str}")
    print(f"To: {masked_phone}")
    print(f"Order: {order_number or 'N/A'}")
    print(f"Status: {gateway_status}")
    if action_tag:
        safe_act = action_tag.encode('ascii', errors='replace').decode('ascii')
        print(f"Action: {safe_act}")
    if gateway_status.startswith('ACCEPTED_BY_GATEWAY'):
        print(f"Provider: Fast2SMS bulkV2 ({gateway_status})")
    elif gateway_status.startswith('TWILIO_QUEUED'):
        print(f"Provider: Twilio Messages API ({gateway_status})")
    elif gateway_status == 'SIMULATED_LOCAL':
        print("Mode: SIMULATED_LOCAL (Carrier balance untouched)")
    print(f"Message:\n{safe_msg}")
    if wa_link:
        print(f"WhatsApp Concierge: {wa_link}")
    print("=" * 65 + "\n")


    return {
        'sms_id': sms_id,
        'recipient_phone': formatted_phone or str(recipient_phone),
        'masked_phone': masked_phone,
        'recipient_type': recipient_type,
        'order_number': order_number,
        'message': message,
        'status': gateway_status,
        'gateway_status': gateway_status,
        'wa_link': wa_link
    }

def notify_admin_new_order(order_dict, force_live=False):
    """
    TRIGGER 1: Triggered when customer buys a product (via Buy Now or Cart Checkout).
    Dispatches detailed SMS to the Admin's configured mobile number.
    """
    admin_phone = get_admin_phone()
    order_num = order_dict.get('order_number', 'NC-ORDER')
    total = order_dict.get('total_amount', order_dict.get('total', 0))
    pay_method = order_dict.get('payment_method', 'Cash on Delivery')

    # Parse address info
    raw_addr = order_dict.get('shipping_address_json')
    if isinstance(raw_addr, str):
        try:
            addr = json.loads(raw_addr)
        except Exception:
            addr = {}
    elif isinstance(raw_addr, dict):
        addr = raw_addr
    else:
        addr = {}

    cust_name = addr.get('name') or order_dict.get('customer_name') or 'Esteemed Client'
    cust_phone = addr.get('phone') or order_dict.get('customer_mobile') or 'Not provided'
    street = addr.get('street', '')
    city = addr.get('city', '')
    pincode = addr.get('pincode', '')
    address_str = f"{street}, {city} - {pincode}".strip(' ,-') or 'Atelier delivery'

    items = order_dict.get('items') or []
    if items:
        item_lines = [f"{it.get('product_name', it.get('name', 'Creation'))} ({it.get('size', 'Std')}/{it.get('color', 'Classic')} x{it.get('quantity', 1)})" for it in items]
        items_str = ", ".join(item_lines)
    else:
        items_str = f"{order_dict.get('items_count', 1)} Atelier Creation(s)"

    msg = (
        f"[NUTIYALA ATELIER] New Order Alert\n"
        f"Order: {order_num}\n"
        f"Items: {items_str}\n"
        f"Total: Rs.{int(total):,} ({pay_method})\n"
        f"Customer: {cust_name} | Ph: {cust_phone}\n"
        f"Address: {address_str}\n"
        f"Action: Review & Confirm in Admin Orders."
    )

    return record_sms(
        recipient_phone=admin_phone,
        message=msg,
        recipient_type='ADMIN',
        order_id=order_dict.get('id', order_dict.get('order_id')),
        order_number=order_num,
        action_tag='[NEW ORDER ALERT]',
        force_live=force_live
    )

def notify_customer_order_placed(order_dict, force_live=False):
    """
    TRIGGER 1B: Triggered when Customer places an order.
    Dispatches immediate receipt confirmation SMS to the Customer.
    """
    raw_addr = order_dict.get('shipping_address_json')
    if isinstance(raw_addr, str):
        try:
            addr = json.loads(raw_addr)
        except Exception:
            addr = {}
    elif isinstance(raw_addr, dict):
        addr = raw_addr
    else:
        addr = {}

    cust_phone = addr.get('phone') or order_dict.get('customer_mobile')
    cust_name = addr.get('name') or order_dict.get('customer_name') or 'Valued Client'
    order_num = order_dict.get('order_number', 'NC-ORDER')
    total = order_dict.get('total_amount', order_dict.get('total', 0))

    items = order_dict.get('items') or []
    if items:
        item_names = [it.get('product_name', it.get('name', 'Creation')) for it in items[:2]]
        items_str = ", ".join(item_names)
        if len(items) > 2:
            items_str += f" +{len(items)-2} more"
    else:
        items_str = "your couture order"

    if not cust_phone:
        return None

    msg = (
        f"[NUTIYALA COUTURE] Order Received\n"
        f"Dear {cust_name},\n"
        f"Thank you! Order {order_num} for {items_str} (Rs.{int(total):,}) is received.\n"
        f"We will SMS you once your order is confirmed. - Nutiyala Couture"
    )

    return record_sms(
        recipient_phone=cust_phone,
        message=msg,
        recipient_type='CUSTOMER',
        order_id=order_dict.get('id', order_dict.get('order_id')),
        order_number=order_num,
        action_tag='[ORDER RECEIVED]',
        force_live=force_live
    )

def notify_customer_order_confirmed(order_dict, force_live=False):
    """
    TRIGGER 2: Triggered when Admin confirms the order in the Admin portal.
    Dispatches order confirmation SMS to the Customer's phone number and logs in website state.
    """
    raw_addr = order_dict.get('shipping_address_json')
    if isinstance(raw_addr, str):
        try:
            addr = json.loads(raw_addr)
        except Exception:
            addr = {}
    elif isinstance(raw_addr, dict):
        addr = raw_addr
    else:
        addr = {}

    cust_phone = addr.get('phone') or order_dict.get('customer_mobile')
    cust_name = addr.get('name') or order_dict.get('customer_name') or 'Valued Client'
    order_num = order_dict.get('order_number', 'NC-ORDER')
    total = order_dict.get('total_amount', order_dict.get('total', 0))

    items = order_dict.get('items') or []
    if items:
        item_names = [it.get('product_name', it.get('name', 'Creation')) for it in items[:2]]
        items_str = ", ".join(item_names)
        if len(items) > 2:
            items_str += f" +{len(items)-2} more"
    else:
        items_str = "your bespoke couture order"

    if not cust_phone:
        return None

    msg = (
        f"[NUTIYALA COUTURE] Order Confirmed\n"
        f"Dear {cust_name},\n"
        f"Your order {order_num} for {items_str} (Rs.{int(total):,}) is CONFIRMED.\n"
        f"Our artisans are preparing your creation for dispatch.\n"
        f"Thank you for choosing Nutiyala Couture."
    )

    result = record_sms(
        recipient_phone=cust_phone,
        message=msg,
        recipient_type='CUSTOMER',
        order_id=order_dict.get('id', order_dict.get('order_id')),
        order_number=order_num,
        action_tag='[ORDER CONFIRMED]',
        force_live=force_live
    )

    # Log in customer in-app notifications if user_id present
    user_id = order_dict.get('user_id')
    if user_id:
        try:
            conn = database.get_db()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO customer_notifications (user_id, order_id, title, message)
            VALUES (?, ?, ?, ?)
            """, (
                user_id,
                order_dict.get('id', order_dict.get('order_id')),
                f"Order Confirmed: {order_num}",
                f"Your order for {items_str} has been confirmed by the Atelier. We are preparing it for delivery."
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print("Error creating in-app customer notification:", e)

    return result

def get_recent_sms_logs(limit=50):
    """Retrieves recent SMS logs for the Admin audit hub."""
    conn = database.get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT id, order_id, order_number, recipient_type, recipient_phone, message, status, created_at
        FROM sms_logs
        ORDER BY id DESC
        LIMIT ?
        """, (limit,))
        rows = [dict(r) for r in cursor.fetchall()]
        return rows
    except Exception as e:
        print("Error fetching sms_logs:", e)
        return []
    finally:
        conn.close()
