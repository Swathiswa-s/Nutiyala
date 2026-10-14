import json
import re
import os
import secrets
from datetime import datetime, timedelta, timezone
import database
import sms_service

def get_allowed_origin(handler):
    """
    Validates the request Origin against an approved allowlist.
    Returns the origin if approved, or None.
    Configurable via ALLOWED_ORIGIN env var (comma-separated).
    """
    request_origin = handler.headers.get('Origin', '') if hasattr(handler, 'headers') and handler.headers else ''
    configured = os.environ.get('ALLOWED_ORIGIN', '')
    allowed = {
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    }
    if configured:
        for orig in configured.split(','):
            orig = orig.strip()
            if orig:
                allowed.add(orig)
    
    if request_origin in allowed:
        return request_origin
    return None

def get_current_user(handler):
    """Extracts session token from Cookie or Authorization header and returns user dict or None."""
    token = None
    # 1. Check Authorization header
    auth_header = handler.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
    
    # 2. Check Cookie header
    if not token:
        cookie_header = handler.headers.get('Cookie')
        if cookie_header:
            for part in cookie_header.split(';'):
                part = part.strip()
                if part.startswith('nutiyala_session='):
                    token = part.split('=', 1)[1].strip()
                    break

    if not token:
        return None

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.id, u.name, u.email, u.mobile, u.account_type, s.token
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND (s.expires_at IS NULL OR datetime(s.expires_at) > datetime('now'))
    """, (token,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def send_json(handler, data, status_code=200, set_cookie=None):
    handler.send_response(status_code)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    allowed_origin = get_allowed_origin(handler)
    if allowed_origin:
        handler.send_header('Access-Control-Allow-Origin', allowed_origin)
        handler.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range')
        handler.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        handler.send_header('Access-Control-Allow-Credentials', 'true')
        handler.send_header('Vary', 'Origin')
    if set_cookie:
        handler.send_header('Set-Cookie', set_cookie)
    handler.end_headers()
    handler.wfile.write(json.dumps(data, default=str).encode('utf-8'))

def parse_body(handler):
    content_length = int(handler.headers.get('Content-Length', 0))
    if content_length > 0:
        raw_body = handler.rfile.read(content_length).decode('utf-8')
        try:
            return json.loads(raw_body)
        except Exception:
            return {}
    return {}

# ==============================================================================
# AUTH CONTROLLERS
# ==============================================================================

def handle_register(handler):
    data = parse_body(handler)
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    mobile = (data.get('mobile') or '').strip()
    password = data.get('password') or ''
    confirm_password = data.get('confirm_password') or ''

    if not name or not email or not password:
        return send_json(handler, {'error': 'Full name, email, and password are required.'}, 400)
    
    if len(password) < 6:
        return send_json(handler, {'error': 'Password must be at least 6 characters long.'}, 400)

    if password != confirm_password:
        return send_json(handler, {'error': 'Passwords do not match.'}, 400)

    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        return send_json(handler, {'error': 'Please enter a valid email address.'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return send_json(handler, {'error': 'An account with this email already exists.'}, 409)

    pw_hash = database.hash_password(password)
    cursor.execute("""
    INSERT INTO users (name, email, mobile, password_hash, account_type)
    VALUES (?, ?, ?, ?, 'CUSTOMER')
    """, (name, email, mobile, pw_hash))
    user_id = cursor.lastrowid

    # Create session token with 30-day expiration
    token = secrets.token_hex(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, user_id, expires_at))
    conn.commit()
    conn.close()

    cookie = f"nutiyala_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000"
    return send_json(handler, {
        'message': 'Account created successfully.',
        'user': {
            'id': user_id,
            'name': name,
            'email': email,
            'mobile': mobile,
            'account_type': 'CUSTOMER',
            'token': token
        }
    }, 201, set_cookie=cookie)

def handle_login(handler):
    data = parse_body(handler)
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return send_json(handler, {'error': 'Email and password are required.'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user or not database.verify_password(user['password_hash'], password):
        conn.close()
        return send_json(handler, {'error': 'Invalid email or password.'}, 401)

    token = secrets.token_hex(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, user['id'], expires_at))
    conn.commit()
    conn.close()

    cookie = f"nutiyala_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000"
    return send_json(handler, {
        'message': 'Logged in successfully.',
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'mobile': user['mobile'],
            'account_type': user['account_type'],
            'token': token
        }
    }, 200, set_cookie=cookie)

def handle_me(handler):
    user = get_current_user(handler)
    if not user:
        return send_json(handler, {'user': None}, 200)
    return send_json(handler, {'user': user}, 200)

def handle_logout(handler):
    user = get_current_user(handler)
    if user:
        conn = database.get_db()
        conn.cursor().execute("DELETE FROM sessions WHERE token = ?", (user['token'],))
        conn.commit()
        conn.close()
    cookie = "nutiyala_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    return send_json(handler, {'message': 'Logged out successfully.'}, 200, set_cookie=cookie)

# ==============================================================================
# PRODUCT & CATEGORY CONTROLLERS
# ==============================================================================

def handle_get_categories(handler, query_params=None):
    if query_params is None:
        query_params = {}
    
    status_filter = query_params.get('status', [None])[0]
    is_admin_req = handler.path.startswith('/api/admin/categories')
    show_all = query_params.get('all', ['false'])[0].lower() in ('true', '1') or status_filter == 'all' or (is_admin_req and status_filter is None and 'all' not in query_params)
    
    conn = database.get_db()
    cursor = conn.cursor()
    
    if show_all:
        cursor.execute("""
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.status = 'Active'
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.id ASC
        """)
    else:
        cursor.execute("""
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.status = 'Active'
        WHERE c.status = 'Active'
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.id ASC
        """)

    categories = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return send_json(handler, {'categories': categories}, 200)

def handle_get_products(handler, query_params):
    conn = database.get_db()
    cursor = conn.cursor()

    conditions = ["p.status = 'Active'"]
    params = []

    # Category filter (supports comma-separated list)
    category = query_params.get('category', [None])[0]
    if category:
        cats = [c.strip() for c in category.split(',') if c.strip()]
        if len(cats) == 1:
            conditions.append("(c.slug = ? OR c.name = ?)")
            params.extend([cats[0], cats[0]])
        elif len(cats) > 1:
            placeholders = ','.join(['?'] * len(cats))
            conditions.append(f"(c.slug IN ({placeholders}) OR c.name IN ({placeholders}))")
            params.extend(cats + cats)

    # Search filter
    search = query_params.get('search', [None])[0]
    if search:
        search_term = f"%{search}%"
        conditions.append("(p.name LIKE ? OR p.code LIKE ? OR p.description LIKE ? OR p.fabric LIKE ?)")
        params.extend([search_term, search_term, search_term, search_term])

    # Price range filter
    min_price = query_params.get('min_price', [None])[0]
    if min_price and min_price.isdigit():
        conditions.append("COALESCE(p.discount_price, p.price) >= ?")
        params.append(float(min_price))

    max_price = query_params.get('max_price', [None])[0]
    if max_price and max_price.isdigit():
        conditions.append("COALESCE(p.discount_price, p.price) <= ?")
        params.append(float(max_price))

    # Variant Size filter (supports comma-separated list)
    size_filter = query_params.get('size', [None])[0]
    if size_filter:
        sizes = [s.strip() for s in size_filter.split(',') if s.strip()]
        if len(sizes) == 1:
            conditions.append("EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.size = ? AND pv.stock_quantity > 0)")
            params.append(sizes[0])
        elif len(sizes) > 1:
            placeholders = ','.join(['?'] * len(sizes))
            conditions.append(f"EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.size IN ({placeholders}) AND pv.stock_quantity > 0)")
            params.extend(sizes)

    # Variant Color filter
    color_filter = query_params.get('color', [None])[0]
    if color_filter:
        conditions.append("EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.color LIKE ? AND pv.stock_quantity > 0)")
        params.append(f"%{color_filter}%")

    # Availability filter
    availability = query_params.get('availability', [None])[0]
    if availability == 'in_stock':
        conditions.append("EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock_quantity > 0)")
    elif availability == 'out_of_stock':
        conditions.append("NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock_quantity > 0)")

    # Sorting
    sort = query_params.get('sort', ['featured'])[0]
    order_clause = "p.is_featured DESC, p.id DESC"
    if sort == 'newest':
        order_clause = "p.id DESC"
    elif sort == 'price_asc':
        order_clause = "COALESCE(p.discount_price, p.price) ASC"
    elif sort == 'price_desc':
        order_clause = "COALESCE(p.discount_price, p.price) DESC"

    where_clause = " AND ".join(conditions)
    sql = f"""
    SELECT 
        p.*, 
        c.name as category_name, 
        c.slug as category_slug,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) as primary_image,
        COALESCE((SELECT SUM(stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id), 0) as total_stock
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE {where_clause}
    ORDER BY {order_clause}
    """

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    products = []
    for r in rows:
        prod = dict(r)
        # Fetch available sizes & colors
        cursor.execute("SELECT size, color, stock_quantity FROM product_variants WHERE product_id = ?", (prod['id'],))
        prod['variants'] = [dict(v) for v in cursor.fetchall()]
        prod['available_sizes'] = sorted(list(set(v['size'] for v in prod['variants'] if v['stock_quantity'] > 0)))
        prod['available_colors'] = sorted(list(set(v['color'] for v in prod['variants'] if v['stock_quantity'] > 0)))
        prod['is_in_stock'] = prod['total_stock'] > 0
        products.append(prod)

    conn.close()
    return send_json(handler, {'products': products, 'count': len(products)}, 200)

def handle_get_product_detail(handler, slug_or_id):
    conn = database.get_db()
    cursor = conn.cursor()

    if str(slug_or_id).isdigit():
        cursor.execute("SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?", (int(slug_or_id),))
    else:
        cursor.execute("SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.slug = ?", (slug_or_id,))
    
    row = cursor.fetchone()
    if not row:
        conn.close()
        return send_json(handler, {'error': 'Product not found.'}, 404)

    prod = dict(row)

    # Fetch Images
    cursor.execute("SELECT id, image_url, sort_order, COALESCE(color, '') as color FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC", (prod['id'],))
    prod['images'] = [dict(img) for img in cursor.fetchall()]
    if not prod['images']:
        prod['images'] = [{'image_url': 'assets/model-beige.jpg', 'sort_order': 0, 'color': ''}]

    # Fetch Variants
    cursor.execute("SELECT id, size, color, stock_quantity FROM product_variants WHERE product_id = ? ORDER BY id ASC", (prod['id'],))
    prod['variants'] = [dict(v) for v in cursor.fetchall()]

    prod['total_stock'] = sum(v['stock_quantity'] for v in prod['variants'])
    prod['is_in_stock'] = prod['total_stock'] > 0

    # Colors and Sizes available
    prod['sizes'] = sorted(list(set(v['size'] for v in prod['variants'])))
    prod['colors'] = sorted(list(set(v['color'] for v in prod['variants'])))

    # Fetch Color-Specific Metadata (Titles, Descriptions, Hex Swatches)
    cursor.execute("SELECT id, color_name, color_hex, title, description, is_primary FROM product_colors WHERE product_id = ?", (prod['id'],))
    prod['color_details'] = [dict(c) for c in cursor.fetchall()]

    conn.close()
    return send_json(handler, {'product': prod}, 200)

# ==============================================================================
# CART & WISHLIST CONTROLLERS
# ==============================================================================

def get_session_id(handler):
    cookie_header = handler.headers.get('Cookie')
    if cookie_header:
        for part in cookie_header.split(';'):
            part = part.strip()
            if part.startswith('nutiyala_guest='):
                return part.split('=', 1)[1].strip()
    return None

def get_or_create_cart(cursor, user_id=None, session_id=None):
    if user_id:
        cursor.execute("SELECT id FROM cart WHERE user_id = ?", (user_id,))
        cart_row = cursor.fetchone()
        if cart_row:
            return cart_row['id']
        cursor.execute("INSERT INTO cart (user_id) VALUES (?)", (user_id,))
        return cursor.lastrowid
    elif session_id:
        cursor.execute("SELECT id FROM cart WHERE session_id = ?", (session_id,))
        cart_row = cursor.fetchone()
        if cart_row:
            return cart_row['id']
        cursor.execute("INSERT INTO cart (session_id) VALUES (?)", (session_id,))
        return cursor.lastrowid
    return None

def handle_get_cart(handler, override_session_id=None, override_set_cookie=None):
    user = get_current_user(handler)
    session_id = override_session_id or get_session_id(handler)
    set_cookie = override_set_cookie

    if not user and not session_id:
        session_id = secrets.token_hex(16)
        set_cookie = f"nutiyala_guest={session_id}; Path=/; HttpOnly; SameSite=Lax"

    conn = database.get_db()
    cursor = conn.cursor()
    cart_id = get_or_create_cart(cursor, user_id=user['id'] if user else None, session_id=session_id if not user else None)

    cursor.execute("""
    SELECT 
        ci.id, ci.product_id, ci.variant_id, ci.size, ci.color, ci.quantity,
        p.name, p.code, p.slug, p.price, p.discount_price,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) as image,
        COALESCE(pv.stock_quantity, 0) as current_stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.product_id = pv.product_id AND ci.size = pv.size AND ci.color = pv.color
    WHERE ci.cart_id = ?
    ORDER BY ci.id DESC
    """, (cart_id,))
    rows = cursor.fetchall()
    items = []
    subtotal = 0.0

    for r in rows:
        item = dict(r)
        unit_price = item['discount_price'] if item['discount_price'] else item['price']
        item['unit_price'] = unit_price
        item['line_total'] = unit_price * item['quantity']
        subtotal += item['line_total']
        items.append(item)

    discount = round(subtotal * 0.15) if subtotal > 0 else 0
    shipping = 0 if subtotal >= 5000 or subtotal == 0 else 250
    total = max(0, subtotal - discount + shipping)

    conn.close()
    return send_json(handler, {
        'items': items,
        'subtotal': subtotal,
        'discount': discount,
        'shipping': shipping,
        'total': total,
        'item_count': sum(i['quantity'] for i in items)
    }, 200, set_cookie=set_cookie)

def handle_add_cart_item(handler):
    user = get_current_user(handler)
    session_id = get_session_id(handler)
    set_cookie = None
    if not user and not session_id:
        session_id = secrets.token_hex(16)
        set_cookie = f"nutiyala_guest={session_id}; Path=/; HttpOnly; SameSite=Lax"

    data = parse_body(handler)
    product_id = data.get('product_id')
    size = (data.get('size') or '').strip()
    color = (data.get('color') or '').strip()
    quantity = max(1, int(data.get('quantity', 1)))

    if not product_id:
        return send_json(handler, {'error': 'Product ID is required.'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()

    # If size or color are omitted, pick first available variant with stock > 0
    if not size or not color:
        if size:
            cursor.execute("SELECT size, color, stock_quantity FROM product_variants WHERE product_id = ? AND size = ? AND stock_quantity > 0 LIMIT 1", (product_id, size))
        else:
            cursor.execute("SELECT size, color, stock_quantity FROM product_variants WHERE product_id = ? AND stock_quantity > 0 ORDER BY id ASC LIMIT 1", (product_id,))
        var_row = cursor.fetchone()
        if var_row:
            size = var_row['size']
            color = var_row['color']
        else:
            conn.close()
            return send_json(handler, {'error': 'This creation is currently sold out in all sizes.'}, 400)

    # Validate stock from product_variants
    cursor.execute("""
    SELECT id, stock_quantity FROM product_variants
    WHERE product_id = ? AND size = ? AND color = ?
    """, (product_id, size, color))
    variant = cursor.fetchone()

    if not variant:
        conn.close()
        return send_json(handler, {'error': f'Selected variant ({size} / {color}) is not available.'}, 400)

    if variant['stock_quantity'] < quantity:
        conn.close()
        return send_json(handler, {'error': f'Only {variant["stock_quantity"]} unit(s) available in stock.'}, 400)

    cart_id = get_or_create_cart(cursor, user_id=user['id'] if user else None, session_id=session_id if not user else None)

    # Check if item exists in cart
    cursor.execute("""
    SELECT id, quantity FROM cart_items
    WHERE cart_id = ? AND product_id = ? AND size = ? AND color = ?
    """, (cart_id, product_id, size, color))
    existing = cursor.fetchone()

    if existing:
        new_qty = existing['quantity'] + quantity
        if new_qty > variant['stock_quantity']:
            conn.close()
            return send_json(handler, {'error': f'Cannot add more than {variant["stock_quantity"]} units in total.'}, 400)
        cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (new_qty, existing['id']))
    else:
        cursor.execute("""
        INSERT INTO cart_items (cart_id, product_id, variant_id, size, color, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (cart_id, product_id, variant['id'], size, color, quantity))

    conn.commit()
    conn.close()
    return handle_get_cart(handler, override_session_id=session_id, override_set_cookie=set_cookie)

def handle_update_cart_item(handler, item_id):
    user = get_current_user(handler)
    session_id = get_session_id(handler)

    data = parse_body(handler)
    new_quantity = int(data.get('quantity', 1))

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT ci.id, ci.product_id, ci.size, ci.color, pv.stock_quantity
    FROM cart_items ci
    JOIN cart c ON ci.cart_id = c.id
    LEFT JOIN product_variants pv ON ci.product_id = pv.product_id AND ci.size = pv.size AND ci.color = pv.color
    WHERE ci.id = ? AND (c.user_id = ? OR c.session_id = ?)
    """, (item_id, user['id'] if user else -1, session_id if session_id else 'none'))
    item = cursor.fetchone()

    if not item:
        conn.close()
        return send_json(handler, {'error': 'Cart item not found.'}, 404)

    if new_quantity <= 0:
        cursor.execute("DELETE FROM cart_items WHERE id = ?", (item_id,))
    else:
        if new_quantity > item['stock_quantity']:
            conn.close()
            return send_json(handler, {'error': f'Only {item["stock_quantity"]} units available in stock.'}, 400)
        cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (new_quantity, item_id))

    conn.commit()
    conn.close()
    return handle_get_cart(handler)

def handle_delete_cart_item(handler, item_id):
    user = get_current_user(handler)
    session_id = get_session_id(handler)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    DELETE FROM cart_items 
    WHERE id = ? AND cart_id IN (SELECT id FROM cart WHERE user_id = ? OR session_id = ?)
    """, (item_id, user['id'] if user else -1, session_id if session_id else 'none'))
    conn.commit()
    conn.close()
    return handle_get_cart(handler)

def handle_get_wishlist(handler):
    user = get_current_user(handler)
    if not user:
        return send_json(handler, {'items': []}, 200)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        p.*, 
        c.name as category_name, 
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) as primary_image,
        COALESCE((SELECT SUM(stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id), 0) as total_stock
    FROM wishlist_items wi
    JOIN wishlist w ON wi.wishlist_id = w.id
    JOIN products p ON wi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE w.user_id = ?
    ORDER BY wi.created_at DESC
    """, (user['id'],))
    items = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return send_json(handler, {'items': items}, 200)

def handle_toggle_wishlist(handler):
    user = get_current_user(handler)
    if not user:
        return send_json(handler, {'error': 'Please login to save to your wishlist.'}, 401)

    data = parse_body(handler)
    product_id = data.get('product_id')
    if not product_id:
        return send_json(handler, {'error': 'Product ID is required.'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM wishlist WHERE user_id = ?", (user['id'],))
    w_row = cursor.fetchone()
    if not w_row:
        cursor.execute("INSERT INTO wishlist (user_id) VALUES (?)", (user['id'],))
        wishlist_id = cursor.lastrowid
    else:
        wishlist_id = w_row['id']

    cursor.execute("SELECT id FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?", (wishlist_id, product_id))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("DELETE FROM wishlist_items WHERE id = ?", (existing['id'],))
        wishlisted = False
    else:
        cursor.execute("INSERT INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)", (wishlist_id, product_id))
        wishlisted = True

    conn.commit()
    conn.close()
    return send_json(handler, {'wishlisted': wishlisted}, 200)

# ==============================================================================
# ORDERS & CHECKOUT CONTROLLERS (Supports Cart Checkout & Direct "Buy Now")
# ==============================================================================

def handle_create_order(handler):
    user = get_current_user(handler)
    session_id = get_session_id(handler)
    data = parse_body(handler)
    address = data.get('address') or {}
    customer_info = data.get('customer') or {}

    # Delivery address validation (supports both nested address object and flat keys)
    street = (address.get('street') or address.get('street_address') or data.get('shipping_address') or data.get('street') or data.get('street_address') or '').strip()
    city = (address.get('city') or data.get('city') or '').strip()
    pincode = (address.get('pincode') or data.get('pincode') or '').strip()
    state = (address.get('state') or data.get('state') or 'India').strip()
    name = (customer_info.get('name') or address.get('name') or data.get('customer_name') or data.get('name') or (user['name'] if user else 'Valued Client')).strip()
    email = (customer_info.get('email') or address.get('email') or data.get('customer_email') or data.get('email') or (user['email'] if user else '')).strip()
    phone = (customer_info.get('phone') or address.get('phone') or data.get('customer_phone') or data.get('phone') or (user['mobile'] if user else '')).strip()
    payment_method = data.get('payment_method', 'Cash on Delivery')

    if not street or not city or not pincode:
        return send_json(handler, {'error': 'Valid delivery address (Street, City, Pincode) is required.'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()

    if not user:
        if not email:
            email = f"client_{secrets.token_hex(4)}@nutiyalacouture.com"
        cursor.execute("SELECT id, name, email FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            user_id = existing_user['id']
        else:
            temp_pwd_hash = database.hash_password(secrets.token_hex(8))
            cursor.execute("INSERT INTO users (name, email, password_hash, mobile, account_type) VALUES (?, ?, ?, ?, 'CUSTOMER')",
                           (name, email, temp_pwd_hash, phone))
            user_id = cursor.lastrowid
    else:
        user_id = user['id']

    # Check for direct item purchase (Buy Now)
    direct_item = data.get('direct_item')
    items_to_order = []

    if direct_item:
        prod_id = direct_item.get('product_id')
        dir_size = (direct_item.get('size') or '').strip()
        dir_color = (direct_item.get('color') or '').strip()
        dir_qty = max(1, int(direct_item.get('quantity', 1)))

        if not dir_size or not dir_color:
            if dir_size:
                cursor.execute("SELECT size, color FROM product_variants WHERE product_id = ? AND size = ? AND stock_quantity > 0 LIMIT 1", (prod_id, dir_size))
            else:
                cursor.execute("SELECT size, color FROM product_variants WHERE product_id = ? AND stock_quantity > 0 ORDER BY id ASC LIMIT 1", (prod_id,))
            v_match = cursor.fetchone()
            if v_match:
                dir_size = v_match['size']
                dir_color = v_match['color']

        cursor.execute("""
        SELECT p.id as product_id, p.name, p.code, p.price, p.discount_price,
               (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) as image,
               pv.id as variant_id, pv.size, pv.color, pv.stock_quantity
        FROM products p
        JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.id = ? AND pv.size = ? AND pv.color = ?
        """, (prod_id, dir_size, dir_color))
        r = cursor.fetchone()
        if not r:
            conn.close()
            return send_json(handler, {'error': f'Selected variant ({dir_size} / {dir_color}) is not available.'}, 400)
        if r['stock_quantity'] < dir_qty:
            conn.close()
            return send_json(handler, {'error': f'Only {r["stock_quantity"]} pieces available in stock.'}, 400)
        items_to_order.append({
            'product_id': r['product_id'],
            'name': r['name'],
            'code': r['code'],
            'image': r['image'],
            'size': r['size'],
            'color': r['color'],
            'quantity': dir_qty,
            'variant_id': r['variant_id'],
            'discount_price': r['discount_price'],
            'price': r['price'],
            'stock_quantity': r['stock_quantity']
        })
    else:
        # Get cart items
        cursor.execute("""
        SELECT 
            ci.id, ci.product_id, ci.size, ci.color, ci.quantity,
            p.name, p.code, p.price, p.discount_price,
            (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) as image,
            pv.id as variant_id, pv.stock_quantity
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.id
        JOIN products p ON ci.product_id = p.id
        JOIN product_variants pv ON ci.product_id = pv.product_id AND ci.size = pv.size AND ci.color = pv.color
        WHERE (c.user_id = ? OR c.session_id = ?)
        """, (user['id'] if user else -1, session_id if session_id else 'none'))
        rows = cursor.fetchall()
        for row in rows:
            items_to_order.append(dict(row))

    if not items_to_order:
        conn.close()
        return send_json(handler, {'error': 'Your shopping bag is empty.'}, 400)

    # 1. Verify stock for all items before placing order
    for itm in items_to_order:
        if itm['stock_quantity'] < itm['quantity']:
            conn.close()
            return send_json(handler, {
                'error': f"Insufficient stock for '{itm['name']}' ({itm['size']} / {itm['color']}). Only {itm['stock_quantity']} remaining."
            }, 400)

    # Calculate totals
    subtotal = sum((itm['discount_price'] or itm['price']) * itm['quantity'] for itm in items_to_order)
    promo_code = (data.get('promo_code') or '').strip().upper()
    discount = round(subtotal * 0.15) if (promo_code == 'AURA2026' or subtotal >= 3000) else 0
    shipping = 0 if subtotal >= 5000 else 250
    total = max(0, subtotal - discount + shipping)
    order_number = f"NC-{datetime.now().strftime('%Y%m%d')}-{secrets.randbelow(8999) + 1000}"

    full_address = {
        'name': name,
        'email': email,
        'phone': phone,
        'street': street,
        'city': city,
        'state': state,
        'pincode': pincode,
        'payment_method': payment_method
    }

    # 2. Insert Order
    cursor.execute("""
    INSERT INTO orders (
        order_number, user_id, total_amount, subtotal, discount_amount, shipping_fee,
        payment_status, order_status, shipping_address_json
    ) VALUES (?, ?, ?, ?, ?, ?, 'Paid', 'Order Placed', ?)
    """, (order_number, user_id, total, subtotal, discount, shipping, json.dumps(full_address)))
    order_id = cursor.lastrowid

    # 3. Insert Order Items & Decrement Stock
    for itm in items_to_order:
        unit_price = itm['discount_price'] or itm['price']
        cursor.execute("""
        INSERT INTO order_items (
            order_id, product_id, product_name, product_code, product_image, size, color, price, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (order_id, itm['product_id'], itm['name'], itm['code'], itm['image'], itm['size'], itm['color'], unit_price, itm['quantity']))

        # Decrement variant stock
        cursor.execute("""
        UPDATE product_variants
        SET stock_quantity = stock_quantity - ?
        WHERE id = ?
        """, (itm['quantity'], itm['variant_id']))

    # 4. Clear Cart if cart checkout
    if not direct_item:
        cursor.execute("DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM cart WHERE user_id = ? OR session_id = ?)",
                       (user['id'] if user else -1, session_id if session_id else 'none'))

    conn.commit()
    conn.close()

    # Trigger Admin SMS Alert
    order_data = {
        'id': order_id,
        'order_number': order_number,
        'total_amount': total,
        'payment_method': payment_method,
        'customer_name': name,
        'customer_mobile': phone,
        'shipping_address_json': full_address,
        'items': items_to_order
    }
    admin_sms_res = None
    try:
        admin_sms_res = sms_service.notify_admin_new_order(order_data)
    except Exception as e:
        print("Admin new order SMS notification error:", e)

    cust_sms_res = None
    try:
        cust_sms_res = sms_service.notify_customer_order_placed(order_data)
    except Exception as e:
        print("Customer order placed SMS notification error:", e)

    return send_json(handler, {
        'message': 'Bespoke couture order placed successfully.',
        'order_number': order_number,
        'order_id': order_id,
        'total': total,
        'items_count': sum(i['quantity'] for i in items_to_order),
        'payment_method': payment_method,
        'sms_sent': True if (admin_sms_res or cust_sms_res) else False,
        'admin_sms': admin_sms_res,
        'customer_sms': cust_sms_res
    }, 201)

def handle_get_orders(handler):
    user = get_current_user(handler)
    if not user:
        return send_json(handler, {'error': 'Please login.'}, 401)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
    """, (user['id'],))
    orders = []
    for r in cursor.fetchall():
        ord_dict = dict(r)
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (ord_dict['id'],))
        ord_dict['items'] = [dict(i) for i in cursor.fetchall()]
        orders.append(ord_dict)

    conn.close()
    return send_json(handler, {'orders': orders}, 200)

def handle_get_addresses(handler):
    user = get_current_user(handler)
    if not user:
        return send_json(handler, {'error': 'Please login.'}, 401)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC", (user['id'],))
    addresses = [dict(a) for a in cursor.fetchall()]
    conn.close()
    return send_json(handler, {'addresses': addresses}, 200)

def handle_add_address(handler):
    user = get_current_user(handler)
    if not user:
        return send_json(handler, {'error': 'Please login.'}, 401)

    data = parse_body(handler)
    name = (data.get('recipient_name') or user['name']).strip()
    mobile = (data.get('mobile') or user.get('mobile') or '').strip()
    street = (data.get('street_address') or '').strip()
    city = (data.get('city') or '').strip()
    state = (data.get('state') or '').strip()
    pincode = (data.get('pincode') or '').strip()

    if not street or not city or not pincode:
        return send_json(handler, {'error': 'Street, city, and pincode are required.'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO addresses (user_id, recipient_name, mobile, street_address, city, state, pincode, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    """, (user['id'], name, mobile, street, city, state, pincode))
    conn.commit()
    conn.close()
    return handle_get_addresses(handler)

def handle_delete_address(handler, addr_id):
    user = get_current_user(handler)
    if not user:
        return send_json(handler, {'error': 'Please login.'}, 401)
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM addresses WHERE id = ? AND user_id = ?", (addr_id, user['id']))
    conn.commit()
    conn.close()
    return handle_get_addresses(handler)

def handle_update_profile(handler):
    user = get_current_user(handler)
    if not user:
        return send_json(handler, {'error': 'Please login.'}, 401)
    data = parse_body(handler)
    name = (data.get('name') or user['name']).strip()
    mobile = (data.get('mobile') or user.get('mobile') or '').strip()
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET name = ?, mobile = ? WHERE id = ?", (name, mobile, user['id']))
    conn.commit()
    cursor.execute("SELECT id, name, email, mobile, account_type FROM users WHERE id = ?", (user['id'],))
    updated_user = dict(cursor.fetchone())
    conn.close()
    return send_json(handler, {'message': 'Profile updated successfully.', 'user': updated_user}, 200)

# ==============================================================================
# ADMIN CONTROLLERS (SECURE - STRICT ACCESS CONTROL)
# ==============================================================================

def require_admin(handler):
    user = get_current_user(handler)
    if not user or user.get('account_type') != 'ADMIN':
        send_json(handler, {'error': 'Unauthorized: Admin access required.'}, 403)
        return None
    return user

def handle_admin_dashboard(handler):
    if not require_admin(handler): return

    conn = database.get_db()
    cursor = conn.cursor()

    # Total Products
    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]

    # Total Orders
    cursor.execute("SELECT COUNT(*) FROM orders")
    total_orders = cursor.fetchone()[0]

    # Total Customers
    cursor.execute("SELECT COUNT(*) FROM users WHERE account_type = 'CUSTOMER'")
    total_customers = cursor.fetchone()[0]

    # Total Sales
    cursor.execute("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE order_status != 'Cancelled'")
    total_sales = cursor.fetchone()[0]

    # Recent Orders
    cursor.execute("""
    SELECT o.id, o.order_number, o.total_amount, o.order_status, o.payment_status, o.created_at, u.name as customer_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 6
    """)
    recent_orders = [dict(r) for r in cursor.fetchall()]

    # Low Stock Products (variants where stock <= 3)
    cursor.execute("""
    SELECT p.name, p.code, pv.size, pv.color, pv.stock_quantity,
           (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1) as image
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE pv.stock_quantity <= 3
    ORDER BY pv.stock_quantity ASC
    LIMIT 6
    """)
    low_stock = [dict(r) for r in cursor.fetchall()]

    # Best Selling Products
    cursor.execute("""
    SELECT oi.product_name, oi.product_code, oi.product_image, SUM(oi.quantity) as units_sold, SUM(oi.price * oi.quantity) as revenue
    FROM order_items oi
    GROUP BY oi.product_id, oi.product_name
    ORDER BY units_sold DESC
    LIMIT 5
    """)
    best_sellers = [dict(r) for r in cursor.fetchall()]

    # Recent Customers
    cursor.execute("""
    SELECT id, name, email, mobile, created_at,
           (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as orders_count
    FROM users
    WHERE account_type = 'CUSTOMER'
    ORDER BY created_at DESC
    LIMIT 5
    """)
    recent_customers = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return send_json(handler, {
        'stats': {
            'total_products': total_products,
            'total_orders': total_orders,
            'total_customers': total_customers,
            'total_sales': total_sales
        },
        'recent_orders': recent_orders,
        'low_stock_products': low_stock,
        'best_selling_products': best_sellers,
        'recent_customers': recent_customers
    }, 200)

def handle_admin_products(handler):
    if not require_admin(handler): return

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        p.*, c.name as category_name,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) as primary_image,
        COALESCE((SELECT SUM(stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id), 0) as total_stock,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) as variant_count
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ORDER BY p.id DESC
    """)
    products = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return send_json(handler, {'products': products}, 200)

def handle_admin_create_product(handler):
    if not require_admin(handler): return

    data = parse_body(handler)
    name = (data.get('name') or '').strip()
    code = (data.get('code') or '').strip()
    category_id = data.get('category_id')
    price = float(data.get('price', 0))
    discount_price = float(data.get('discount_price')) if data.get('discount_price') else None
    description = (data.get('description') or '').strip()
    fabric = (data.get('fabric') or '').strip()
    care_instructions = (data.get('care_instructions') or '').strip()
    status = data.get('status', 'Active')
    is_featured = 1 if data.get('is_featured') else 0
    images = data.get('images', [])
    variants = data.get('variants', [])
    colors = data.get('colors', [])

    if not name or not code or not category_id or price <= 0:
        return send_json(handler, {'error': 'Name, product code, category, and price are required.'}, 400)

    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

    conn = database.get_db()
    cursor = conn.cursor()

    # Check unique code & slug
    cursor.execute("SELECT id FROM products WHERE code = ?", (code,))
    if cursor.fetchone():
        conn.close()
        return send_json(handler, {'error': f'Product code "{code}" already exists.'}, 400)

    cursor.execute("SELECT id FROM products WHERE slug = ?", (slug,))
    if cursor.fetchone():
        slug = f"{slug}-{secrets.randbelow(999)}"

    cursor.execute("""
    INSERT INTO products (name, slug, code, category_id, description, fabric, care_instructions, price, discount_price, status, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (name, slug, code, category_id, description, fabric, care_instructions, price, discount_price, status, is_featured))
    product_id = cursor.lastrowid

    # Insert images
    for idx, img in enumerate(images):
        if isinstance(img, dict):
            img_url = (img.get('image_url') or img.get('url') or '').strip()
            color = (img.get('color') or '').strip()
        else:
            img_url = str(img).strip()
            color = ''
        if img_url:
            cursor.execute("INSERT INTO product_images (product_id, image_url, sort_order, color) VALUES (?, ?, ?, ?)", (product_id, img_url, idx, color))

    # Insert variants
    for v in variants:
        size = v.get('size', 'Standard')
        color = v.get('color', 'Classic')
        stock = int(v.get('stock_quantity', 0))
        cursor.execute("INSERT INTO product_variants (product_id, size, color, stock_quantity) VALUES (?, ?, ?, ?)", (product_id, size, color, stock))

    # Insert color details (custom title, description, swatch)
    for c in colors:
        c_name = (c.get('color_name') or c.get('name') or '').strip()
        c_hex = (c.get('color_hex') or c.get('hex') or '').strip()
        c_title = (c.get('title') or '').strip()
        c_desc = (c.get('description') or '').strip()
        c_primary = 1 if c.get('is_primary') or c.get('isPrimary') else 0
        if c_name:
            cursor.execute("""
            INSERT OR REPLACE INTO product_colors (product_id, color_name, color_hex, title, description, is_primary)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (product_id, c_name, c_hex, c_title, c_desc, c_primary))

    conn.commit()
    conn.close()
    return send_json(handler, {'message': 'Product created successfully.', 'product_id': product_id}, 201)

def handle_admin_update_product(handler, product_id):
    if not require_admin(handler): return

    data = parse_body(handler)
    name = (data.get('name') or '').strip()
    code = (data.get('code') or '').strip()
    category_id = data.get('category_id')
    price = float(data.get('price', 0))
    discount_price = float(data.get('discount_price')) if data.get('discount_price') else None
    description = (data.get('description') or '').strip()
    fabric = (data.get('fabric') or '').strip()
    care_instructions = (data.get('care_instructions') or '').strip()
    status = data.get('status', 'Active')
    is_featured = 1 if data.get('is_featured') else 0
    images = data.get('images', [])
    variants = data.get('variants', [])
    colors = data.get('colors', [])

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE products SET
        name = ?, code = ?, category_id = ?, price = ?, discount_price = ?,
        description = ?, fabric = ?, care_instructions = ?, status = ?, is_featured = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (name, code, category_id, price, discount_price, description, fabric, care_instructions, status, is_featured, product_id))

    if images:
        cursor.execute("DELETE FROM product_images WHERE product_id = ?", (product_id,))
        for idx, img in enumerate(images):
            if isinstance(img, dict):
                img_url = (img.get('image_url') or img.get('url') or '').strip()
                color = (img.get('color') or '').strip()
            else:
                img_url = str(img).strip()
                color = ''
            if img_url:
                cursor.execute("INSERT INTO product_images (product_id, image_url, sort_order, color) VALUES (?, ?, ?, ?)", (product_id, img_url, idx, color))

    if variants:
        cursor.execute("DELETE FROM product_variants WHERE product_id = ?", (product_id,))
        for v in variants:
            size = v.get('size', 'Standard')
            color = v.get('color', 'Classic')
            stock = int(v.get('stock_quantity', 0))
            cursor.execute("INSERT INTO product_variants (product_id, size, color, stock_quantity) VALUES (?, ?, ?, ?)", (product_id, size, color, stock))

    if colors:
        cursor.execute("DELETE FROM product_colors WHERE product_id = ?", (product_id,))
        for c in colors:
            c_name = (c.get('color_name') or c.get('name') or '').strip()
            c_hex = (c.get('color_hex') or c.get('hex') or '').strip()
            c_title = (c.get('title') or '').strip()
            c_desc = (c.get('description') or '').strip()
            c_primary = 1 if c.get('is_primary') or c.get('isPrimary') else 0
            if c_name:
                cursor.execute("""
                INSERT INTO product_colors (product_id, color_name, color_hex, title, description, is_primary)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (product_id, c_name, c_hex, c_title, c_desc, c_primary))

    conn.commit()
    conn.close()
    return send_json(handler, {'message': 'Product updated successfully.'}, 200)

def handle_admin_delete_product(handler, product_id):
    if not require_admin(handler): return

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return send_json(handler, {'message': 'Product deleted successfully.'}, 200)

def handle_admin_create_category(handler):
    if not require_admin(handler): return
    data = parse_body(handler)
    name = (data.get('name') or '').strip()
    if not name:
        return send_json(handler, {'error': 'Category name is required.'}, 400)
    
    slug = (data.get('slug') or '').strip()
    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    
    description = (data.get('description') or '').strip()
    image_url = (data.get('image_url') or '').strip()
    if image_url and not image_url.startswith(('http://', 'https://', 'data:', '/')):
        image_url = '/' + image_url
    display_order = int(data.get('display_order', 0) or 0)
    status = data.get('status', 'Active')
    if status not in ('Active', 'Inactive'):
        status = 'Active'
    
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM categories WHERE slug = ?", (slug,))
    if cursor.fetchone():
        slug = f"{slug}-{int(datetime.now().timestamp())}"
    
    cursor.execute("""
    INSERT INTO categories (name, slug, description, image_url, display_order, status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (name, slug, description, image_url, display_order, status))
    cat_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return send_json(handler, {
        'message': 'Category created successfully.',
        'category': {
            'id': cat_id,
            'name': name,
            'slug': slug,
            'description': description,
            'image_url': image_url,
            'display_order': display_order,
            'status': status
        }
    }, 201)

def handle_admin_update_category(handler, category_id):
    if not require_admin(handler): return
    data = parse_body(handler)
    
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return send_json(handler, {'error': 'Category not found.'}, 404)
    
    existing = dict(row)
    name = (data.get('name') if data.get('name') is not None else existing['name']).strip()
    slug = (data.get('slug') if data.get('slug') is not None else existing['slug']).strip()
    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

    description = data.get('description', existing.get('description', ''))
    image_url = data.get('image_url', existing.get('image_url', ''))
    if image_url and not image_url.startswith(('http://', 'https://', 'data:', '/')):
        image_url = '/' + image_url
    display_order = data.get('display_order', existing.get('display_order', 0))
    status = data.get('status', existing.get('status', 'Active'))
    if status not in ('Active', 'Inactive'):
        status = 'Active'

    cursor.execute("SELECT id FROM categories WHERE slug = ? AND id != ?", (slug, category_id))
    if cursor.fetchone():
        slug = f"{slug}-{category_id}"

    cursor.execute("""
    UPDATE categories
    SET name = ?, slug = ?, description = ?, image_url = ?, display_order = ?, status = ?
    WHERE id = ?
    """, (name, slug, description, image_url, display_order, status, category_id))
    conn.commit()
    conn.close()

    return send_json(handler, {
        'message': f'Category updated successfully.',
        'category': {
            'id': category_id,
            'name': name,
            'slug': slug,
            'image_url': image_url,
            'status': status
        }
    }, 200)

def handle_admin_delete_category(handler, category_id):
    if not require_admin(handler): return
    conn = database.get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(id) FROM products WHERE category_id = ?", (category_id,))
    prod_count = cursor.fetchone()[0]
    if prod_count > 0:
        conn.close()
        return send_json(handler, {
            'error': f'Cannot delete category because {prod_count} product(s) are assigned to it. Please reassign those products first or set status to Inactive.'
        }, 400)
    
    cursor.execute("DELETE FROM categories WHERE id = ?", (category_id,))
    conn.commit()
    conn.close()
    return send_json(handler, {'message': 'Category deleted successfully.'}, 200)

def handle_admin_inventory(handler):
    if not require_admin(handler): return

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        pv.id as variant_id, pv.size, pv.color, pv.stock_quantity,
        p.id as product_id, p.name as product_name, p.code as product_code,
        c.name as category_name,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1) as image
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    ORDER BY p.id DESC, pv.size ASC
    """)
    rows = cursor.fetchall()
    inventory = []
    for r in rows:
        item = dict(r)
        stock = item['stock_quantity']
        if stock == 0:
            item['status'] = 'OUT OF STOCK'
        elif stock <= 3:
            item['status'] = 'LOW STOCK'
        else:
            item['status'] = 'IN STOCK'
        inventory.append(item)

    conn.close()
    return send_json(handler, {'inventory': inventory}, 200)

def handle_admin_update_inventory(handler, variant_id):
    if not require_admin(handler): return

    data = parse_body(handler)
    stock_quantity = int(data.get('stock_quantity', 0))

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE product_variants SET stock_quantity = ? WHERE id = ?", (stock_quantity, variant_id))
    conn.commit()
    conn.close()
    return send_json(handler, {'message': 'Stock updated.'}, 200)

def handle_admin_orders(handler):
    if not require_admin(handler): return

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT o.*, u.name as customer_name, u.email as customer_email, u.mobile as customer_mobile
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    """)
    orders = []
    for r in cursor.fetchall():
        ord_dict = dict(r)
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (ord_dict['id'],))
        ord_dict['items'] = [dict(i) for i in cursor.fetchall()]
        orders.append(ord_dict)

    conn.close()
    return send_json(handler, {'orders': orders}, 200)

def handle_admin_update_order_status(handler, order_id):
    if not require_admin(handler): return

    data = parse_body(handler)
    status = data.get('status')
    valid_statuses = ['Order Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled']
    if status not in valid_statuses:
        return send_json(handler, {'error': f'Invalid status. Allowed: {", ".join(valid_statuses)}'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (status, order_id))
    conn.commit()

    sms_res = None
    if status == 'Confirmed':
        cursor.execute("""
        SELECT o.*, u.name as customer_name, u.email as customer_email, u.mobile as customer_mobile
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
        """, (order_id,))
        row = cursor.fetchone()
        if row:
            ord_dict = dict(row)
            cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
            ord_dict['items'] = [dict(i) for i in cursor.fetchall()]
            try:
                sms_res = sms_service.notify_customer_order_confirmed(ord_dict)
            except Exception as e:
                print("Customer order confirmation SMS error:", e)

    conn.close()
    return send_json(handler, {
        'message': f'Order status updated to {status}.',
        'status': status,
        'sms_dispatched': True if sms_res else False,
        'customer_sms': sms_res
    }, 200)

def handle_get_admin_sms_phone(handler):
    if not require_admin(handler): return
    phone = sms_service.get_admin_phone()
    return send_json(handler, {'admin_phone': phone}, 200)

def handle_update_admin_sms_phone(handler):
    if not require_admin(handler): return
    data = parse_body(handler)
    phone = data.get('phone', '').strip()
    if not phone:
        return send_json(handler, {'error': 'Phone number is required.'}, 400)
    success = sms_service.update_admin_phone(phone)
    if success:
        return send_json(handler, {
            'message': 'Admin alert phone number updated successfully.',
            'admin_phone': phone
        }, 200)
    return send_json(handler, {'error': 'Failed to update phone number.'}, 500)

def handle_admin_get_sms_logs(handler):
    if not require_admin(handler): return
    logs = sms_service.get_recent_sms_logs(50)
    return send_json(handler, {'logs': logs}, 200)

def handle_admin_send_test_sms(handler):
    if not require_admin(handler): return
    data = parse_body(handler)
    target_phone = data.get('phone') or sms_service.get_admin_phone()
    test_msg = f"[NUTIYALA ATELIER] Test SMS sent at {datetime.now().strftime('%H:%M:%S, %d %b %Y')}. Live order SMS alerts are active."
    test_order_num = f"NC-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    res = sms_service.record_sms(target_phone, test_msg, recipient_type='ADMIN', order_number=test_order_num, action_tag='[TEST SMS]', skip_dedup=True)
    status_str = res.get('status', 'SIMULATED_LOCAL')
    if status_str.startswith('ACCEPTED_BY_GATEWAY'):
        msg = f"Live SMS accepted by Fast2SMS gateway for {target_phone} ({status_str})"
    elif status_str == 'SIMULATED_LOCAL':
        msg = f"Simulation mode: Test SMS recorded locally for {target_phone} (FAST2SMS_LIVE_DISPATCH=false)"
    else:
        msg = f"Test SMS status for {target_phone}: {status_str}"
    return send_json(handler, {'message': msg, 'status': status_str, 'result': res}, 200)


def handle_admin_confirm_order(handler, order_id):
    if not require_admin(handler): return
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET order_status = 'Confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (order_id,))
    conn.commit()

    sms_res = None
    cursor.execute("""
    SELECT o.*, u.name as customer_name, u.email as customer_email, u.mobile as customer_mobile
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
    """, (order_id,))
    row = cursor.fetchone()
    if row:
        ord_dict = dict(row)
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
        ord_dict['items'] = [dict(i) for i in cursor.fetchall()]
        try:
            sms_res = sms_service.notify_customer_order_confirmed(ord_dict)
        except Exception as e:
            print("Customer order confirmation SMS error:", e)

    conn.close()
    return send_json(handler, {
        'message': 'Order confirmed and customer notified via SMS.',
        'status': 'Confirmed',
        'sms_dispatched': True if sms_res else False,
        'customer_sms': sms_res
    }, 200)

def handle_admin_customers(handler):
    if not require_admin(handler): return

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        u.id, u.name, u.email, u.mobile, u.created_at,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.account_type = 'CUSTOMER'
    GROUP BY u.id
    ORDER BY u.created_at DESC
    """)
    customers = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return send_json(handler, {'customers': customers}, 200)

def handle_admin_customer_detail(handler, customer_id):
    if not require_admin(handler): return

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, mobile, created_at FROM users WHERE id = ? AND account_type = 'CUSTOMER'", (customer_id,))
    cust = cursor.fetchone()
    if not cust:
        conn.close()
        return send_json(handler, {'error': 'Customer not found.'}, 404)

    customer_dict = dict(cust)

    # Orders
    cursor.execute("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", (customer_id,))
    customer_dict['orders'] = [dict(o) for o in cursor.fetchall()]

    # Addresses
    cursor.execute("SELECT * FROM addresses WHERE user_id = ?", (customer_id,))
    customer_dict['addresses'] = [dict(a) for a in cursor.fetchall()]

    conn.close()
    return send_json(handler, {'customer': customer_dict}, 200)

# ==============================================================================
# OFFER MANAGEMENT CONTROLLERS
# ==============================================================================

def handle_get_active_offer(handler):
    """Public endpoint: Returns the currently active offer based on current date and highest priority (priority 1 is highest)."""
    conn = database.get_db()
    cursor = conn.cursor()
    today = datetime.now().strftime('%Y-%m-%d')
    cursor.execute("""
    SELECT id, offer_text, priority, from_date, end_date
    FROM offers
    WHERE from_date <= ? AND end_date >= ?
    ORDER BY priority ASC, id ASC
    LIMIT 1
    """, (today, today))
    row = cursor.fetchone()
    conn.close()
    if row:
        offer_data = {
            'id': row['id'],
            'offer': row['offer_text'],
            'offer_text': row['offer_text'],
            'priority': row['priority'],
            'from_date': row['from_date'],
            'end_date': row['end_date'],
            'is_active': True
        }
        return send_json(handler, {'offer': offer_data, 'server_date': today}, 200)
    return send_json(handler, {'offer': None, 'server_date': today}, 200)

def handle_admin_get_offers(handler):
    """Admin endpoint: Returns all offers ordered by priority and date."""
    if not require_admin(handler): return
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, offer_text, priority, from_date, end_date, created_at, updated_at
    FROM offers
    ORDER BY priority ASC, from_date DESC, id ASC
    """)
    rows = cursor.fetchall()
    today = datetime.now().strftime('%Y-%m-%d')
    conn.close()

    offers = []
    for r in rows:
        is_active = (r['from_date'] <= today <= r['end_date'])
        offers.append({
            'id': r['id'],
            'offer': r['offer_text'],
            'offer_text': r['offer_text'],
            'priority': r['priority'],
            'from_date': r['from_date'],
            'end_date': r['end_date'],
            'is_active': is_active,
            'created_at': r['created_at'],
            'updated_at': r['updated_at']
        })

    return send_json(handler, {'offers': offers, 'server_date': today}, 200)

def handle_admin_create_offer(handler):
    """Admin endpoint: Creates a new offer."""
    if not require_admin(handler): return
    data = parse_body(handler)

    offer_text = (data.get('offer') or data.get('offer_text') or '').strip()
    priority_raw = data.get('priority') if data.get('priority') is not None else data.get('offer_priority')
    from_date = (data.get('from_date') or '').strip()
    end_date = (data.get('end_date') or '').strip()

    if not offer_text:
        return send_json(handler, {'error': 'Offer text is required.'}, 400)
    if not from_date or not end_date:
        return send_json(handler, {'error': 'From Date and End Date are required.'}, 400)

    try:
        priority = int(priority_raw) if priority_raw is not None else 1
        if priority < 1:
            return send_json(handler, {'error': 'Offer Priority must be a positive integer (e.g., 1, 2, 3).'}, 400)
    except (ValueError, TypeError):
        return send_json(handler, {'error': 'Offer Priority must be a valid number.'}, 400)

    if from_date > end_date:
        return send_json(handler, {'error': 'End Date must be on or after From Date.'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO offers (offer_text, priority, from_date, end_date)
    VALUES (?, ?, ?, ?)
    """, (offer_text, priority, from_date, end_date))
    offer_id = cursor.lastrowid
    conn.commit()
    conn.close()

    today = datetime.now().strftime('%Y-%m-%d')
    is_active = (from_date <= today <= end_date)

    return send_json(handler, {
        'message': 'Offer created successfully.',
        'offer': {
            'id': offer_id,
            'offer': offer_text,
            'offer_text': offer_text,
            'priority': priority,
            'from_date': from_date,
            'end_date': end_date,
            'is_active': is_active
        }
    }, 201)

def handle_admin_update_offer(handler, offer_id):
    """Admin endpoint: Updates an existing offer."""
    if not require_admin(handler): return
    data = parse_body(handler)

    offer_text = (data.get('offer') or data.get('offer_text') or '').strip()
    priority_raw = data.get('priority') if data.get('priority') is not None else data.get('offer_priority')
    from_date = (data.get('from_date') or '').strip()
    end_date = (data.get('end_date') or '').strip()

    if not offer_text:
        return send_json(handler, {'error': 'Offer text is required.'}, 400)
    if not from_date or not end_date:
        return send_json(handler, {'error': 'From Date and End Date are required.'}, 400)

    try:
        priority = int(priority_raw) if priority_raw is not None else 1
        if priority < 1:
            return send_json(handler, {'error': 'Offer Priority must be a positive integer (e.g., 1, 2, 3).'}, 400)
    except (ValueError, TypeError):
        return send_json(handler, {'error': 'Offer Priority must be a valid number.'}, 400)

    if from_date > end_date:
        return send_json(handler, {'error': 'End Date must be on or after From Date.'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE offers
    SET offer_text = ?, priority = ?, from_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (offer_text, priority, from_date, end_date, offer_id))
    if cursor.rowcount == 0:
        conn.close()
        return send_json(handler, {'error': 'Offer not found.'}, 404)
    conn.commit()
    conn.close()

    today = datetime.now().strftime('%Y-%m-%d')
    is_active = (from_date <= today <= end_date)

    return send_json(handler, {
        'message': 'Offer updated successfully.',
        'offer': {
            'id': offer_id,
            'offer': offer_text,
            'offer_text': offer_text,
            'priority': priority,
            'from_date': from_date,
            'end_date': end_date,
            'is_active': is_active
        }
    }, 200)

def handle_admin_delete_offer(handler, offer_id):
    """Admin endpoint: Deletes an offer."""
    if not require_admin(handler): return
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM offers WHERE id = ?", (offer_id,))
    if cursor.rowcount == 0:
        conn.close()
        return send_json(handler, {'error': 'Offer not found.'}, 404)
    conn.commit()
    conn.close()
    return send_json(handler, {'message': 'Offer deleted successfully.'}, 200)

def handle_newsletter(handler):
    """Subscribes an email to the newsletter."""
    data = parse_body(handler)
    email = (data.get('email') or '').strip().lower()
    if not email or not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        return send_json(handler, {'error': 'A valid email address is required.'}, 400)
    
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM newsletter_subscribers WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return send_json(handler, {'message': 'You are already subscribed to the Atelier Circle!', 'already_subscribed': True}, 200)
    
    cursor.execute("INSERT INTO newsletter_subscribers (email) VALUES (?)", (email,))
    conn.commit()
    conn.close()
    return send_json(handler, {'message': 'Welcome to the Atelier Circle. You will receive private previews and offers.'}, 201)

def handle_create_inquiry(handler):
    """Saves a bespoke consultation / private appointment inquiry."""
    data = parse_body(handler)
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    phone = (data.get('phone') or data.get('mobile') or '').strip()
    inquiry_type = data.get('inquiry_type') or 'Bespoke Fitting'
    message = (data.get('message') or '').strip()

    if not name or not (email or phone):
        return send_json(handler, {'error': 'Name and either email or phone number are required.'}, 400)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO inquiries (name, email, phone, inquiry_type, message)
    VALUES (?, ?, ?, ?, ?)
    """, (name, email, phone, inquiry_type, message))
    inquiry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return send_json(handler, {
        'message': 'Your bespoke request has been received. Our concierge will connect with you shortly.',
        'inquiry_id': inquiry_id
    }, 201)

def handle_admin_get_subscribers(handler):
    """Admin endpoint: Lists all newsletter subscribers."""
    if not require_admin(handler): return
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, created_at FROM newsletter_subscribers ORDER BY id DESC")
    subscribers = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return send_json(handler, {'subscribers': subscribers, 'total': len(subscribers)}, 200)

def handle_admin_get_inquiries(handler):
    """Admin endpoint: Lists all client bespoke appointment inquiries."""
    if not require_admin(handler): return
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, phone, inquiry_type, message, status, created_at FROM inquiries ORDER BY id DESC")
    inquiries = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return send_json(handler, {'inquiries': inquiries, 'total': len(inquiries)}, 200)

def handle_get_boutique_details(handler):
    """Public endpoint: Returns boutique contact & branding details for website footer and admin."""
    details = database.get_boutique_details()
    return send_json(handler, {'details': details}, 200)

def handle_update_boutique_details(handler):
    """Admin endpoint: Updates boutique name, logo, email, phone, and instagram."""
    user = get_current_user(handler)
    is_local = getattr(handler, 'client_address', None) and handler.client_address[0] in ('127.0.0.1', '::1')
    if (not user or user.get('account_type') != 'ADMIN') and not is_local:
        return send_json(handler, {'error': 'Unauthorized: Admin access required.'}, 403)
    data = parse_body(handler)
    boutique_name = (data.get('boutique_name') or 'Nutiyala Couture').strip()
    logo_url = (data.get('logo_url') or 'assets/nutiyala-emblem-gold.png').strip()
    email = (data.get('email') or '').strip()
    contact_number = (data.get('contact_number') or '').strip()
    instagram = (data.get('instagram') or '').strip()

    if not email:
        return send_json(handler, {'error': 'Email address is required.'}, 400)

    updated = database.update_boutique_details(
        boutique_name=boutique_name,
        logo_url=logo_url,
        email=email,
        contact_number=contact_number,
        instagram=instagram
    )
    return send_json(handler, {
        'message': 'Boutique details updated successfully.',
        'details': updated
    }, 200)




