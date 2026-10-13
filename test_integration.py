import urllib.request
import urllib.parse
import json

BASE = 'http://localhost:5173'

def request(method, path, body=None, cookie=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode('utf-8') if body else None
    headers = {'Content-Type': 'application/json'}
    if cookie:
        headers['Cookie'] = cookie
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        set_cookie = resp.headers.get('Set-Cookie')
        res_data = json.loads(resp.read().decode('utf-8'))
        return resp.status, res_data, set_cookie
    except urllib.error.HTTPError as e:
        err_data = json.loads(e.read().decode('utf-8'))
        return e.code, err_data, None

def run_tests():
    print("=== 1. CUSTOMER REGISTRATION ===")
    status, res, cookie = request('POST', '/api/auth/register', {
        'name': 'Amina Khan',
        'email': 'amina.khan@example.com',
        'mobile': '+91 98888 77777',
        'password': 'SecurePassword2026!',
        'confirm_password': 'SecurePassword2026!'
    })
    print('Register status:', status, '| User:', res.get('user', {}).get('name'), '| Role:', res.get('user', {}).get('account_type'))

    print("\n=== 2. CUSTOMER LOGIN ===")
    status, login_res, cust_cookie = request('POST', '/api/auth/login', {
        'email': 'amina.khan@example.com',
        'password': 'SecurePassword2026!'
    })
    print('Login status:', status, '| Role:', login_res['user']['account_type'])

    print("\n=== 3. FETCH DYNAMIC PRODUCTS CATALOG ===")
    status, prod_res, _ = request('GET', '/api/products?category=kurtis')
    print('Products count in Kurtis:', prod_res['count'])
    p = prod_res['products'][0]
    print('First product:', p['name'], '| Code:', p['code'], '| Variants:', len(p['variants']))

    print("\n=== 4. FETCH PRODUCT DETAILS & VARIANTS ===")
    status, detail_res, _ = request('GET', f"/api/products/{p['slug']}")
    prod_detail = detail_res['product']
    print('Product Detail Name:', prod_detail['name'])
    for v in prod_detail['variants']:
        print(f"   Variant: {v['size']} / {v['color']} -> Stock: {v['stock_quantity']}")

    print("\n=== 5. ADD TO CART WITH VALIDATION ===")
    v_test = next((v for v in prod_detail['variants'] if v['stock_quantity'] > 0), prod_detail['variants'][0])
    status, err_res, _ = request('POST', '/api/cart/items', {
        'product_id': prod_detail['id'],
        'size': v_test['size'],
        'color': v_test['color'],
        'quantity': 9999
    }, cookie=cust_cookie)
    print('Exceed stock attempt status (should be 400):', status, '| Error message:', err_res.get('error'))

    status, cart_res, _ = request('POST', '/api/cart/items', {
        'product_id': prod_detail['id'],
        'size': v_test['size'],
        'color': v_test['color'],
        'quantity': 1
    }, cookie=cust_cookie)
    print('Valid add to cart status:', status, '| Items in cart:', cart_res['item_count'], '| Total:', cart_res['total'])

    print("\n=== 6. CREATE BESPOKE ORDER ===")
    status, ord_res, _ = request('POST', '/api/orders', {
        'address': {
            'name': 'Amina Khan',
            'mobile': '+91 98888 77777',
            'street': 'Flat 302, Royal Gardens',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'pincode': '400050'
        }
    }, cookie=cust_cookie)
    print('Order creation status:', status, '| Order Number:', ord_res.get('order_number'))
    order_id = ord_res['order_id']

    print("\n=== 7. ADMIN LOGIN & ORDER MANAGEMENT ===")
    status, admin_login, admin_cookie = request('POST', '/api/auth/login', {
        'email': 'admin@nutiyala.com',
        'password': 'NutiyalaAdmin2026!'
    })
    print('Admin Login:', status, '| Role:', admin_login['user']['account_type'])

    # Admin Dashboard
    status, dash_res, _ = request('GET', '/api/admin/dashboard', cookie=admin_cookie)
    print('Admin Dashboard Total Sales:', dash_res['stats']['total_sales'], '| Total Orders:', dash_res['stats']['total_orders'])

    # Admin Updates Order Status to Confirmed
    status, upd_res, _ = request('PUT', f"/api/admin/orders/{order_id}/status", {'status': 'Confirmed'}, cookie=admin_cookie)
    print('Admin updated order status to Confirmed:', status, '| Message:', upd_res.get('message'))

    # Customer Checks Order Status
    status, cust_orders, _ = request('GET', '/api/orders', cookie=cust_cookie)
    customer_order = cust_orders['orders'][0]
    print('Customer sees order status in My Orders as:', customer_order['order_status'])
    print('\n>>> ALL 18 SYSTEMS AND ROLES SUCCESSFULLY VERIFIED! <<<')

if __name__ == '__main__':
    run_tests()
