import sqlite3
import os
import hashlib
import secrets
from datetime import datetime

DB_PATH = os.environ.get('NUTIYALA_DB_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nutiyala.db'))

def hash_password(password: str) -> str:
    """Hashes a password with PBKDF2-HMAC-SHA256 and a cryptographically secure salt."""
    salt = secrets.token_bytes(16)
    pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}${pw_hash.hex()}"

def verify_password(stored_hash: str, password: str) -> bool:
    """Verifies a password against the stored salt$hash format."""
    try:
        salt_hex, hash_hex = stored_hash.split('$')
        salt = bytes.fromhex(salt_hex)
        expected_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return secrets.compare_digest(expected_hash.hex(), hash_hex)
    except Exception:
        return False

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def init_db():
    """Initializes tables and seeds initial data if not present."""
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        mobile TEXT,
        password_hash TEXT NOT NULL,
        account_type TEXT NOT NULL CHECK(account_type IN ('ADMIN', 'CUSTOMER')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Sessions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
    );
    """)

    # 3. Categories Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        image_url TEXT,
        display_order INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive'))
    );
    """)

    # 4. Products Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        description TEXT,
        fabric TEXT,
        care_instructions TEXT,
        price REAL NOT NULL,
        discount_price REAL,
        status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Draft', 'Archived')),
        is_featured INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Product Variants Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        size TEXT NOT NULL,
        color TEXT NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        UNIQUE(product_id, size, color)
    );
    """)

    # 6. Product Images Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
    );
    """)

    # 7. Cart & Cart Items Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        session_id TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        variant_id INTEGER REFERENCES product_variants(id),
        size TEXT NOT NULL,
        color TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        UNIQUE(cart_id, product_id, size, color)
    );
    """)

    # 8. Wishlist & Wishlist Items Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wishlist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wishlist_id INTEGER NOT NULL REFERENCES wishlist(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(wishlist_id, product_id)
    );
    """)

    # 9. Addresses Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        street_address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 10. Orders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        total_amount REAL NOT NULL,
        subtotal REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        shipping_fee REAL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'Paid',
        order_status TEXT NOT NULL DEFAULT 'Order Placed',
        shipping_address_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 11. Order Items Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        product_name TEXT NOT NULL,
        product_code TEXT NOT NULL,
        product_image TEXT,
        size TEXT NOT NULL,
        color TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL
    );
    """)

    # 12. Offers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offer_text TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 1,
        from_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 13. Newsletter Subscribers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 14. Inquiries / Private Appointments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        inquiry_type TEXT DEFAULT 'Bespoke Fitting',
        message TEXT,
        status TEXT DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 15. Store / Boutique Details Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS boutique_details (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        boutique_name TEXT NOT NULL DEFAULT 'Nutiyala Couture',
        logo_url TEXT NOT NULL DEFAULT 'assets/nutiyala-emblem-gold.png',
        email TEXT NOT NULL DEFAULT 'contact@nutiyala.com',
        contact_number TEXT NOT NULL DEFAULT '+91 98765 43210',
        admin_sms_phone TEXT NOT NULL DEFAULT '+91 9894156412',
        instagram TEXT NOT NULL DEFAULT 'https://instagram.com/nutiyala_couture',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 16. SMS Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sms_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER REFERENCES orders(id),
        order_number TEXT NOT NULL,
        recipient_type TEXT NOT NULL CHECK(recipient_type IN ('ADMIN', 'CUSTOMER')),
        recipient_phone TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'DELIVERED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 17. Customer Notifications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customer_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Add admin_sms_phone column if boutique_details already existed
    try:
        cursor.execute("ALTER TABLE boutique_details ADD COLUMN admin_sms_phone TEXT DEFAULT '+91 9894156412'")
    except Exception:
        pass

    conn.commit()

    # Seed initial data
    seed_data(cursor, conn)
    conn.close()

def seed_data(cursor, conn):
    # Seed Categories: KURTIS, CO-ORD SETS, HIJABS, SHAWLS, FESTIVAL WEAR, DAILY WEAR
    categories = [
        ('Kurtis', 'kurtis', 'Handcrafted royal kurtis, bespoke silk tunics, and ornate festive ensembles.', 'assets/emerald_green.png', 1),
        ('Co-ord Sets', 'co-ord-sets', 'Contemporary tailored two-piece silhouettes crafted in pure linen and silk velvet.', 'assets/navy_coord.png', 2),
        ('Hijabs', 'hijabs', 'Pure mulberry silk modest head veils and luxury silk scarves with delicate zardozi.', 'assets/luxury_hijab.png', 3),
        ('Shawls', 'shawls', 'Heirloom Kashmiri pashmina shawls with antique gold zari jaal and Mughal medallion motifs.', 'assets/luxury_shawl.png', 4),
        ('Festival Wear Kurti', 'festival-wear-kurti', 'Sumptuous deep velvet and festive ensembles richly detailed with dabka, sequins, and royal tilla needlework.', 'assets/maroon_velvet.png', 5),
        ('Daily Wear Kurtis', 'daily-wear-kurtis', 'Understated ivory & sand silhouettes crafted in breathable weaves for everyday grace and effortless poise.', 'assets/beige_kurti.png', 6)
    ]

    for name, slug, desc, img, order in categories:
        cursor.execute("SELECT id FROM categories WHERE slug = ?", (slug,))
        row = cursor.fetchone()
        if not row:
            cursor.execute("INSERT INTO categories (name, slug, description, image_url, display_order, status) VALUES (?, ?, ?, ?, ?, 'Active')", (name, slug, desc, img, order))
        else:
            cursor.execute("UPDATE categories SET image_url = COALESCE(image_url, ?), display_order = COALESCE(display_order, ?) WHERE slug = ?", (img, order, slug))

    conn.commit()

    # Get Category IDs
    cat_map = {}
    for row in cursor.execute("SELECT id, slug FROM categories").fetchall():
        cat_map[row['slug']] = row['id']

    # Seed Admin User
    admin_email = "admin@nutiyala.com"
    cursor.execute("SELECT id FROM users WHERE email = ?", (admin_email,))
    if not cursor.fetchone():
        admin_pw = hash_password("NutiyalaAdmin2026!")
        cursor.execute("""
        INSERT INTO users (name, email, mobile, password_hash, account_type)
        VALUES (?, ?, ?, ?, 'ADMIN')
        """, ("Nutiyala Atelier Admin", admin_email, "+91 98765 00001", admin_pw))

    conn.commit()

    # Seed Products
    initial_products = [
        {
            'name': 'Beige Embroidered Silk Kurti',
            'slug': 'beige-embroidered-silk-kurti',
            'code': 'NC-KT-001',
            'category_slug': 'kurtis',
            'price': 11399,
            'discount_price': 10899,
            'is_featured': 1,
            'description': 'Gracefully tailored from pure mulberry silk, featuring delicate hand-worked antique gold zari borders and a lightweight sheer dupatta. Designed for effortless evening poise.',
            'fabric': '100% Pure Mulberry Silk with Silk Organza Dupatta',
            'care_instructions': 'Dry clean only. Store in muslin cloth. Iron on reverse low heat.',
            'images': ['assets/model-beige.jpg', 'assets/beige_kurti.png'],
            'variants': [
                ('XS', 'Champagne Beige', 3),
                ('S', 'Champagne Beige', 8),
                ('M', 'Champagne Beige', 5),
                ('L', 'Champagne Beige', 2),
                ('XL', 'Champagne Beige', 0)  # Demo out-of-stock
            ]
        },
        {
            'name': 'Royal Maroon Silk Velvet Festival Kurti',
            'slug': 'royal-maroon-silk-velvet-festival-kurti',
            'code': 'NC-KT-002',
            'category_slug': 'kurtis',
            'price': 14899,
            'discount_price': 13999,
            'is_featured': 1,
            'description': 'Opulent silk velvet festival ensemble enriched with royal dabka, tilla, micro-sequins, and heritage gota needlework. An heirloom silhouette for celebrations.',
            'fabric': 'Pure Silk Velvet with Handloom Chanderi Lining',
            'care_instructions': 'Specialist dry clean only. Steam iron only.',
            'images': ['assets/maroon_velvet.png', 'assets/model-maroon.jpg'],
            'variants': [
                ('XS', 'Royal Maroon', 2),
                ('S', 'Royal Maroon', 6),
                ('M', 'Royal Maroon', 4),
                ('L', 'Royal Maroon', 3),
                ('XL', 'Royal Maroon', 1)
            ]
        },
        {
            'name': 'Emerald Green Raw Silk Kurti',
            'slug': 'emerald-green-raw-silk-kurti',
            'code': 'NC-KT-003',
            'category_slug': 'kurtis',
            'price': 12499,
            'discount_price': 11999,
            'is_featured': 1,
            'description': 'Handcrafted raw silk kurti adorned with intricate dabka necklines, hand-cut scallop hem, and regal zardozi embellishments along the bell sleeves.',
            'fabric': 'Pure Raw Silk with Silk Tissue Borders',
            'care_instructions': 'Dry clean only.',
            'images': ['assets/emerald_green.png', 'assets/product-emerald.jpg'],
            'variants': [
                ('XS', 'Emerald Green', 4),
                ('S', 'Emerald Green', 5),
                ('M', 'Emerald Green', 8),
                ('L', 'Emerald Green', 4),
                ('XL', 'Emerald Green', 2)
            ]
        },
        {
            'name': 'Noorani Ivory Royal Anarkali',
            'slug': 'noorani-ivory-royal-anarkali',
            'code': 'NC-KT-004',
            'category_slug': 'kurtis',
            'price': 18999,
            'discount_price': 17499,
            'is_featured': 1,
            'description': 'Heirloom champagne ivory floor-sweeping festive kurti with 32 hand-pleated kalis, Banarasi brocade border, and antique pearl tassels.',
            'fabric': 'Banarasi Chanderi Silk with Zari Brocade',
            'care_instructions': 'Professional dry clean only. Wrap in unbleached cotton.',
            'images': ['assets/model-anarkali-full.jpg', 'assets/model-anarkali-detail.jpg'],
            'variants': [
                ('XS', 'Ivory Gold', 2),
                ('S', 'Ivory Gold', 3),
                ('M', 'Ivory Gold', 4),
                ('L', 'Ivory Gold', 1),
                ('XL', 'Ivory Gold', 0)
            ]
        },
        {
            'name': 'Tailored Navy Casual Co-ord Set',
            'slug': 'tailored-navy-casual-co-ord-set',
            'code': 'NC-CD-001',
            'category_slug': 'co-ord-sets',
            'price': 9999,
            'discount_price': 8999,
            'is_featured': 1,
            'description': 'Tailored royal navy two-piece coordinated set with structured tunic lapel, hand-stitched horn buttons, and tapered cropped trousers.',
            'fabric': 'Premium Linen Silk Blend',
            'care_instructions': 'Gentle dry clean or delicate wash with pH neutral detergent.',
            'images': ['assets/navy_coord.png', 'assets/product-navy.jpg'],
            'variants': [
                ('XS', 'Midnight Navy', 4),
                ('S', 'Midnight Navy', 7),
                ('M', 'Midnight Navy', 6),
                ('L', 'Midnight Navy', 3),
                ('XL', 'Midnight Navy', 2)
            ]
        },
        {
            'name': 'Espresso Velvet Tailored Co-ord',
            'slug': 'espresso-velvet-tailored-co-ord',
            'code': 'NC-CD-002',
            'category_slug': 'co-ord-sets',
            'price': 13499,
            'discount_price': 12499,
            'is_featured': 0,
            'description': 'Bespoke espresso brown velvet jacket and fluid palazzo set with royal Mughal botanical embroidery along the lapels and pockets.',
            'fabric': 'Micro-velvet Silk Blend',
            'care_instructions': 'Specialist dry clean only.',
            'images': ['assets/category-coord.jpg', 'assets/maroon_velvet.png'],
            'variants': [
                ('XS', 'Espresso Bronze', 2),
                ('S', 'Espresso Bronze', 4),
                ('M', 'Espresso Bronze', 3),
                ('L', 'Espresso Bronze', 2),
                ('XL', 'Espresso Bronze', 1)
            ]
        },
        {
            'name': 'Pure Silk Luxury Hijab',
            'slug': 'pure-silk-luxury-hijab',
            'code': 'NC-HJ-001',
            'category_slug': 'hijabs',
            'price': 4299,
            'discount_price': 3899,
            'is_featured': 1,
            'description': 'Pure mulberry silk drape with handcrafted micro-zardozi borders and featherlight veil feel, created for modesty and luxury.',
            'fabric': '100% Mulberry Crepe Silk',
            'care_instructions': 'Gentle hand wash in cold water or dry clean. Low iron.',
            'images': ['assets/luxury_hijab.png'],
            'variants': [
                ('Standard', 'Desert Gold', 12),
                ('Standard', 'Royal Maroon', 8),
                ('Standard', 'Emerald Green', 6),
                ('Standard', 'Midnight Navy', 0)
            ]
        },
        {
            'name': 'Heritage Pashmina Gold Shawl',
            'slug': 'heritage-pashmina-gold-shawl',
            'code': 'NC-SH-001',
            'category_slug': 'shawls',
            'price': 15999,
            'discount_price': 14499,
            'is_featured': 1,
            'description': 'Woven royal Kashmiri pashmina with intricate gold zari jaal and antique Mughal medallion borders, draped over bespoke atelier wear.',
            'fabric': '100% Hand-spun Kashmiri Cashmere Pashmina with Gold Threading',
            'care_instructions': 'Strictly dry clean only. Store in cedar chest.',
            'images': ['assets/luxury_shawl.png', 'assets/category-shawls.jpg'],
            'variants': [
                ('Free Size', 'Antique Amber', 5),
                ('Free Size', 'Ruby Wine', 3),
                ('Free Size', 'Forest Olive', 2)
            ]
        }
    ]

    for p in initial_products:
        cursor.execute("SELECT id FROM products WHERE slug = ?", (p['slug'],))
        existing_p = cursor.fetchone()
        if not existing_p:
            cat_id = cat_map[p['category_slug']]
            cursor.execute("""
            INSERT INTO products (name, slug, code, category_id, description, fabric, care_instructions, price, discount_price, is_featured, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
            """, (p['name'], p['slug'], p['code'], cat_id, p['description'], p['fabric'], p['care_instructions'], p['price'], p['discount_price'], p['is_featured']))
            prod_id = cursor.lastrowid

            # Insert Images
            for idx, img in enumerate(p['images']):
                cursor.execute("""
                INSERT INTO product_images (product_id, image_url, sort_order)
                VALUES (?, ?, ?)
                """, (prod_id, img, idx))

            # Insert Variants
            for size, color, stock in p['variants']:
                cursor.execute("""
                INSERT INTO product_variants (product_id, size, color, stock_quantity)
                VALUES (?, ?, ?, ?)
                """, (prod_id, size, color, stock))

    conn.commit()

    # Seed Default Offer
    cursor.execute("SELECT COUNT(*) FROM offers")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO offers (offer_text, priority, from_date, end_date)
        VALUES (?, ?, ?, ?)
        """, (
            "Complimentary Worldwide Couture Shipping on Orders Over ₹5,000 • Code: AURA2026",
            1,
            "2026-01-01",
            "2026-12-31"
        ))

    # Seed Default Boutique Details
    cursor.execute("SELECT id FROM boutique_details WHERE id = 1")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO boutique_details (id, boutique_name, logo_url, email, contact_number, instagram)
        VALUES (1, 'Nutiyala Couture', 'assets/nutiyala-emblem-gold.png', 'contact@nutiyala.com', '+91 98765 43210', 'https://instagram.com/nutiyala_couture')
        """)

    conn.commit()

def get_boutique_details():
    """Fetches the boutique brand, contact info, and logo for admin & website footer."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT boutique_name, logo_url, email, contact_number, admin_sms_phone, instagram, updated_at
        FROM boutique_details WHERE id = 1
        """)
        row = cursor.fetchone()
        if row:
            d = dict(row)
            if not d.get('admin_sms_phone'):
                d['admin_sms_phone'] = d.get('contact_number') or '+91 9894156412'
            return d
    except Exception:
        pass
    finally:
        conn.close()
    return {
        "boutique_name": "Nutiyala Couture",
        "logo_url": "assets/nutiyala-emblem-gold.png",
        "email": "contact@nutiyala.com",
        "contact_number": "+91 98765 43210",
        "admin_sms_phone": "+91 9894156412",
        "instagram": "https://instagram.com/nutiyala_couture"
    }

def update_boutique_details(boutique_name, logo_url, email, contact_number, instagram):
    """Updates the boutique details."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO boutique_details (id, boutique_name, logo_url, email, contact_number, instagram, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
        boutique_name = excluded.boutique_name,
        logo_url = excluded.logo_url,
        email = excluded.email,
        contact_number = excluded.contact_number,
        instagram = excluded.instagram,
        updated_at = CURRENT_TIMESTAMP
    """, (boutique_name, logo_url, email, contact_number, instagram))
    conn.commit()
    conn.close()
    return get_boutique_details()

if __name__ == '__main__':
    print(f"Initializing Nutiyala Couture Database at: {DB_PATH}")
    init_db()
    print("Database initialized and seeded successfully.")
