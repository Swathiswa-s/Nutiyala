import os
import sys
import json
import base64
import re
import mimetypes
import urllib.parse
from http.server import HTTPServer, ThreadingHTTPServer, SimpleHTTPRequestHandler
import env_loader
import database
import api

PORT = int(os.environ.get("PORT", 5173))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Initialize database schema and seeds on startup
database.init_db()

# Ensure uploads directory exists
UPLOADS_DIR = os.path.join(DIRECTORY, "assets", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Ensure correct MIME types
mimetypes.init()
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("text/html", ".html")
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/json", ".json")

class NutiyalaHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        allowed_orig = api.get_allowed_origin(self)
        if allowed_orig:
            self.send_header("Access-Control-Allow-Origin", allowed_orig)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Range")
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Vary", "Origin")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def normalize_custom_path(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')

        # 1. Strip subpath prefixes for static assets & scripts requested from /products/*, /account/*, /admin/*
        for prefix in ('/products/', '/account/', '/admin/', '/checkout/', '/orders/'):
            if path.startswith(prefix):
                sub = path[len(prefix):]
                query_suffix = f"?{parsed.query}" if parsed.query else ""
                # Static assets, styles, scripts, images, fonts
                if sub.startswith(('assets/', 'js/', 'css/')) or any(sub.endswith(ext) for ext in (
                    '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico',
                    '.woff', '.woff2', '.ttf', '.json', '.mp4', '.webm'
                )):
                    self.path = '/' + sub + query_suffix
                    return
                # If target file exists directly in root directory (e.g. admin-orders.html, admin-products.html)
                if os.path.isfile(os.path.join(DIRECTORY, sub)):
                    self.path = '/' + sub + query_suffix
                    return
                if os.path.isfile(os.path.join(DIRECTORY, sub + '.html')):
                    self.path = '/' + sub + '.html' + query_suffix
                    return
                # Known direct HTML page targets
                if sub in ('products.html', 'cart.html', 'index.html', 'login.html', 'register.html', 'account.html', 'style.css'):
                    self.path = '/' + sub + query_suffix
                    return
                if sub in ('products', 'cart', 'login', 'register', 'account'):
                    self.path = '/' + sub + '.html' + query_suffix
                    return

        # 2. Main HTML and Route Navigation
        if path in ('', '/'):
            self.path = '/index.html'
        elif path in ('/login', '/login.html'):
            self.path = '/login.html'
        elif path in ('/register', '/register.html'):
            self.path = '/register.html'
        elif path in ('/products', '/products.html'):
            self.path = '/products.html'
        elif path in ('/cart', '/cart.html'):
            self.path = '/cart.html'
        elif path in ('/product', '/product-detail', '/product-detail.html') or path.startswith('/products/'):
            self.path = '/product-detail.html'
        elif path in ('/account', '/account.html') or path.startswith('/account/'):
            self.path = '/account.html'
        elif path in ('/admin', '/admin/dashboard', '/admin.html', '/admin/dashboard.html'):
            self.path = '/admin-orders.html'
        elif path in ('/admin/products', '/admin/products.html', '/admin-products', '/admin-products.html', '/admin/admin-products.html'):
            self.path = '/admin-products.html'
        elif path in ('/admin/products/new', '/admin-product-edit', '/admin-product-edit.html') or path.startswith('/admin/products/edit'):
            self.path = '/admin-product-edit.html'
        elif path in ('/admin/inventory', '/admin/inventory.html', '/admin-inventory', '/admin-inventory.html', '/admin/admin-inventory.html'):
            self.path = '/admin-inventory.html'
        elif path in ('/admin/orders', '/admin/orders.html', '/admin-orders', '/admin-orders.html', '/admin/admin-orders.html'):
            self.path = '/admin-orders.html'
        elif path in ('/admin/customers', '/admin/customers.html', '/admin-customers', '/admin-customers.html', '/admin/admin-customers.html'):
            self.path = '/admin-customers.html'
        elif path in ('/admin/offers', '/admin/offer', '/admin/offers.html', '/admin-offers.html', '/admin/admin-offers.html'):
            self.path = '/admin-offers.html'
        elif path in ('/admin/categories', '/admin/categories.html', '/admin-categories', '/admin-categories.html', '/admin/admin-categories.html'):
            self.path = '/admin-categories.html'
        elif path in ('/admin/details', '/admin/details.html', '/admin-details', '/admin-details.html', '/admin/admin-details.html'):
            self.path = '/admin-details.html'
        elif path.startswith('/admin/assets/'):
            self.path = path.replace('/admin/assets/', '/assets/')

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        path_segments = [p.lower() for p in parsed.path.rstrip('/').split('/') if p]
        if any(p.startswith('.env') or p == '.git' or p.endswith(('.db', '.sqlite', '.sqlite3')) for p in path_segments):
            self.send_response(403)
            self.end_headers()
            return
        self.normalize_custom_path()
        return super().do_HEAD()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        query_params = urllib.parse.parse_qs(parsed.query)

        # Protect sensitive files (.env, .git, database files) from being exposed over HTTP
        path_segments = [p.lower() for p in path.split('/') if p]
        if any(p.startswith('.env') or p == '.git' or p.endswith(('.db', '.sqlite', '.sqlite3')) for p in path_segments):
            return api.send_json(self, {'error': 'Forbidden'}, 403)

        # ------------------------------------------------------------------
        # API Routes (GET)
        # ------------------------------------------------------------------
        if path.startswith('/api/'):
            if path == '/api/auth/me':
                return api.handle_me(self)
            elif path in ('/api/categories', '/api/admin/categories'):
                return api.handle_get_categories(self, query_params)
            elif path == '/api/products':
                return api.handle_get_products(self, query_params)
            elif path.startswith('/api/products/'):
                slug_or_id = path.replace('/api/products/', '')
                return api.handle_get_product_detail(self, slug_or_id)
            elif path == '/api/cart':
                return api.handle_get_cart(self)
            elif path == '/api/wishlist':
                return api.handle_get_wishlist(self)
            elif path == '/api/orders':
                return api.handle_get_orders(self)
            elif path == '/api/account/addresses':
                return api.handle_get_addresses(self)
            # Admin GET APIs
            elif path == '/api/admin/dashboard':
                return api.handle_admin_dashboard(self)
            elif path == '/api/admin/products':
                return api.handle_admin_products(self)
            elif path.startswith('/api/admin/products/'):
                prod_id = path.replace('/api/admin/products/', '')
                return api.handle_get_product_detail(self, prod_id)
            elif path == '/api/admin/inventory':
                return api.handle_admin_inventory(self)
            elif path == '/api/admin/orders':
                return api.handle_admin_orders(self)
            elif path == '/api/admin/customers':
                return api.handle_admin_customers(self)
            elif path.startswith('/api/admin/customers/'):
                cust_id = path.replace('/api/admin/customers/', '')
                return api.handle_admin_customer_detail(self, cust_id)
            elif path in ('/api/offers/active', '/api/offers/current'):
                return api.handle_get_active_offer(self)
            elif path == '/api/admin/offers':
                return api.handle_admin_get_offers(self)
            elif path == '/api/admin/subscribers':
                return api.handle_admin_get_subscribers(self)
            elif path == '/api/admin/inquiries':
                return api.handle_admin_get_inquiries(self)
            elif path in ('/api/settings', '/api/admin/details', '/api/boutique-details'):
                return api.handle_get_boutique_details(self)
            elif path in ('/api/admin/settings/sms-phone', '/api/admin/sms-phone'):
                return api.handle_get_admin_sms_phone(self)
            elif path in ('/api/admin/sms-logs', '/api/admin/sms/logs'):
                return api.handle_admin_get_sms_logs(self)
            else:
                return api.send_json(self, {'error': 'API endpoint not found.'}, 404)

        self.normalize_custom_path()

        # ------------------------------------------------------------------
        # Range request support for smooth MP4 video playback & scrubbing
        # ------------------------------------------------------------------
        range_header = self.headers.get('Range')
        file_path = self.translate_path(self.path)

        if range_header and os.path.isfile(file_path):
            try:
                total_size = os.path.getsize(file_path)
                range_match = range_header.strip().replace('bytes=', '')
                start_str, _, end_str = range_match.partition('-')
                start = int(start_str) if start_str else 0
                end = int(end_str) if end_str else total_size - 1
                if end >= total_size:
                    end = total_size - 1
                length = end - start + 1

                content_type, _ = mimetypes.guess_type(file_path)
                if not content_type:
                    content_type = 'application/octet-stream'

                self.send_response(206)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Range', f'bytes {start}-{end}/{total_size}')
                self.send_header('Content-Length', str(length))
                self.send_header('Accept-Ranges', 'bytes')
                self.end_headers()

                with open(file_path, 'rb') as f:
                    f.seek(start)
                    bytes_remaining = length
                    chunk_size = 64 * 1024
                    while bytes_remaining > 0:
                        to_read = min(chunk_size, bytes_remaining)
                        data = f.read(to_read)
                        if not data:
                            break
                        self.wfile.write(data)
                        bytes_remaining -= len(data)
                return
            except (ConnectionResetError, BrokenPipeError):
                return
            except Exception:
                pass

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')

        # Auth
        if path == '/api/auth/register':
            return api.handle_register(self)
        elif path == '/api/auth/login':
            return api.handle_login(self)
        elif path == '/api/auth/logout':
            return api.handle_logout(self)

        # Cart & Wishlist
        elif path == '/api/cart/items':
            return api.handle_add_cart_item(self)
        elif path == '/api/wishlist/toggle':
            return api.handle_toggle_wishlist(self)

        # Checkout & Addresses
        elif path == '/api/orders':
            return api.handle_create_order(self)
        elif path == '/api/account/addresses':
            return api.handle_add_address(self)

        # Newsletter & Inquiries
        elif path == '/api/newsletter':
            return api.handle_newsletter(self)
        elif path in ('/api/inquiries', '/api/appointments', '/api/contact'):
            return api.handle_create_inquiry(self)

        # Admin Actions
        elif path == '/api/admin/products':
            return api.handle_admin_create_product(self)
        elif path in ('/api/admin/categories', '/api/categories'):
            return api.handle_admin_create_category(self)
        elif path == '/api/admin/offers':
            return api.handle_admin_create_offer(self)
        elif path in ('/api/settings', '/api/admin/details', '/api/boutique-details'):
            return api.handle_update_boutique_details(self)
        elif path == '/api/admin/upload':
            # Handle image file upload
            return self.handle_file_upload()
        elif path in ('/api/admin/sms/test', '/api/admin/sms-test'):
            return api.handle_admin_send_test_sms(self)
        elif path.startswith('/api/admin/orders/') and path.endswith('/confirm'):
            parts = path.split('/')
            order_id = int(parts[4])
            return api.handle_admin_confirm_order(self, order_id)

        return api.send_json(self, {'error': 'POST endpoint not found.'}, 404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')

        if path.startswith('/api/cart/items/'):
            item_id = int(path.replace('/api/cart/items/', ''))
            return api.handle_update_cart_item(self, item_id)
        elif path.startswith('/api/admin/products/'):
            product_id = int(path.replace('/api/admin/products/', ''))
            return api.handle_admin_update_product(self, product_id)
        elif path.startswith('/api/admin/categories/') or path.startswith('/api/categories/'):
            parts = path.split('/')
            cat_id = int(parts[-1])
            return api.handle_admin_update_category(self, cat_id)
        elif path.startswith('/api/admin/offers/'):
            offer_id = int(path.replace('/api/admin/offers/', ''))
            return api.handle_admin_update_offer(self, offer_id)
        elif path.startswith('/api/admin/inventory/'):
            variant_id = int(path.replace('/api/admin/inventory/', ''))
            return api.handle_admin_update_inventory(self, variant_id)
        elif path.startswith('/api/admin/orders/') and path.endswith('/status'):
            parts = path.split('/')
            order_id = int(parts[4])
            return api.handle_admin_update_order_status(self, order_id)
        elif path == '/api/account/profile':
            return api.handle_update_profile(self)
        elif path in ('/api/settings', '/api/admin/details', '/api/boutique-details'):
            return api.handle_update_boutique_details(self)
        elif path in ('/api/admin/settings/sms-phone', '/api/admin/sms-phone'):
            return api.handle_update_admin_sms_phone(self)

        return api.send_json(self, {'error': 'PUT endpoint not found.'}, 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')

        if path.startswith('/api/cart/items/'):
            item_id = int(path.replace('/api/cart/items/', ''))
            return api.handle_delete_cart_item(self, item_id)
        elif path.startswith('/api/account/addresses/'):
            addr_id = int(path.replace('/api/account/addresses/', ''))
            return api.handle_delete_address(self, addr_id)
        elif path.startswith('/api/admin/products/'):
            product_id = int(path.replace('/api/admin/products/', ''))
            return api.handle_admin_delete_product(self, product_id)
        elif path.startswith('/api/admin/categories/') or path.startswith('/api/categories/'):
            parts = path.split('/')
            cat_id = int(parts[-1])
            return api.handle_admin_delete_category(self, cat_id)
        elif path.startswith('/api/admin/offers/'):
            offer_id = int(path.replace('/api/admin/offers/', ''))
            return api.handle_admin_delete_offer(self, offer_id)

        return api.send_json(self, {'error': 'DELETE endpoint not found.'}, 404)

    def handle_file_upload(self):
        if not api.require_admin(self): return
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length <= 0:
            return api.send_json(self, {'error': 'No file uploaded.'}, 400)
        
        ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit

        if content_length > MAX_FILE_SIZE:
            return api.send_json(self, {'error': 'File size exceeds maximum allowed limit of 10MB.'}, 400)
        
        content_type = self.headers.get('Content-Type', '')
        raw_data = self.rfile.read(content_length)

        try:
            # Handle base64 JSON payload
            if 'application/json' in content_type:
                payload = json.loads(raw_data.decode('utf-8'))
                data_url = payload.get('data', '')
                orig_name = payload.get('filename', 'product.jpg')
                
                ext = 'jpg'
                if '.' in orig_name:
                    ext = orig_name.rsplit('.', 1)[1].lower()
                elif 'png' in data_url:
                    ext = 'png'
                elif 'webp' in data_url:
                    ext = 'webp'
                
                if ext not in ALLOWED_EXTENSIONS:
                    return api.send_json(self, {'error': f'Invalid file extension ".{ext}". Allowed formats: {", ".join(sorted(ALLOWED_EXTENSIONS))}.'}, 400)

                if ',' in data_url:
                    _, b64data = data_url.split(',', 1)
                else:
                    b64data = data_url

                file_bytes = base64.b64decode(b64data)
                if len(file_bytes) > MAX_FILE_SIZE:
                    return api.send_json(self, {'error': 'Decoded image exceeds 10MB limit.'}, 400)

                clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', orig_name.rsplit('.', 1)[0]) if '.' in orig_name else 'product'
                safe_name = f"{clean_name[:20]}_{os.urandom(4).hex()}.{ext}"
                target_path = os.path.join(UPLOADS_DIR, safe_name)
                with open(target_path, 'wb') as f:
                    f.write(file_bytes)
                
                rel_url = f"/assets/uploads/{safe_name}"
                return api.send_json(self, {
                    'url': rel_url,
                    'filename': safe_name,
                    'size': len(file_bytes),
                    'message': 'Image uploaded successfully.'
                }, 201)
            else:
                # Raw binary upload
                ext = 'jpg'
                if 'png' in content_type: ext = 'png'
                elif 'webp' in content_type: ext = 'webp'
                elif 'gif' in content_type: ext = 'gif'
                
                if ext not in ALLOWED_EXTENSIONS:
                    return api.send_json(self, {'error': f'Invalid file format. Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}.'}, 400)

                safe_name = f"product_{os.urandom(6).hex()}.{ext}"
                target_path = os.path.join(UPLOADS_DIR, safe_name)
                with open(target_path, 'wb') as f:
                    f.write(raw_data)
                
                rel_url = f"/assets/uploads/{safe_name}"
                return api.send_json(self, {
                    'url': rel_url,
                    'filename': safe_name,
                    'size': len(raw_data),
                    'message': 'Image uploaded successfully.'
                }, 201)
        except Exception as e:
            return api.send_json(self, {'error': f'Upload failed: {str(e)}'}, 500)

def run():
    host = os.environ.get("HOST", "0.0.0.0")
    server_address = (host, PORT)
    httpd = ThreadingHTTPServer(server_address, NutiyalaHTTPRequestHandler)
    print(f"Nutiyala Couture Server running at: http://{host}:{PORT}/")
    print(f"Serving files from: {DIRECTORY}")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run()
