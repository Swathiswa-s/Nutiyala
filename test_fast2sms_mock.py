"""
Nutiyala Couture - Fast2SMS Integration Mock Test Suite
Automated unit & integration tests verifying:
1. Default simulation mode (carrier balance untouched, zero external network calls)
2. Safe handling of missing credentials and missing sender ID (DLT route)
3. Successful Fast2SMS Quick Route ('q') dispatch with mocked JSON responses
4. Accurate status reporting: marked as ACCEPTED_BY_GATEWAY, never falsely claiming DELIVERED
5. Fast2SMS DLT Route ('dlt') support with sender_id and entity_id
6. Error handling for rejection, authentication failure (HTTP 401), and network timeouts
7. Order notification triggers (admin alert, customer placement, customer confirmation)
8. Deduplication prevention and zero API key leakage in logs or database
"""

import unittest
from unittest.mock import patch, MagicMock
import urllib.error
import socket
import json
import os
import sms_service
import database

class TestFast2SMSIntegration(unittest.TestCase):
    
    def setUp(self):
        # Ensure database tables exist
        database.init_db()
        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sms_logs WHERE order_number LIKE 'NC-FAST2SMS%' OR order_number LIKE 'NC-SIM%'")
        cursor.execute("SELECT id FROM users LIMIT 1")
        user = cursor.fetchone()
        user_id = user['id'] if user else 1
        # Insert a valid test order to satisfy FOREIGN KEY constraint
        cursor.execute("DELETE FROM orders WHERE order_number = 'NC-FAST2SMS-01'")
        cursor.execute("""
        INSERT INTO orders (order_number, user_id, total_amount, subtotal, shipping_address_json)
        VALUES ('NC-FAST2SMS-01', ?, 18500, 18500, '{}')
        """, (user_id,))
        self.test_order_id = cursor.lastrowid
        conn.commit()
        conn.close()

    def tearDown(self):
        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sms_logs WHERE order_number LIKE 'NC-FAST2SMS%' OR order_number LIKE 'NC-SIM%'")
        cursor.execute("DELETE FROM orders WHERE order_number = 'NC-FAST2SMS-01'")
        conn.commit()
        conn.close()

    def test_01_default_mode_is_simulated_no_network_call(self):
        """Verify that default configuration operates in SIMULATED_LOCAL mode without contacting Fast2SMS."""
        with patch('urllib.request.urlopen') as mock_urlopen:
            res = sms_service.record_sms(
                recipient_phone='+91 9894156412',
                message='Test simulation message for Fast2SMS',
                recipient_type='ADMIN',
                order_number='NC-SIM-FAST2SMS',
                action_tag='[TEST SIMULATION]'
            )
            # Must NOT call network
            mock_urlopen.assert_not_called()
            self.assertEqual(res['status'], 'SIMULATED_LOCAL')
            self.assertEqual(res['masked_phone'], '+91 ******6412')

    def test_02_missing_credentials_fails_gracefully_without_crash(self):
        """When live dispatch is enabled but FAST2SMS_API_KEY is missing, system fails gracefully without crashing."""
        dummy_config = {
            'api_key': '',
            'live_dispatch': True,
            'route': 'q'
        }
        with patch('urllib.request.urlopen') as mock_urlopen:
            status, resp = sms_service.dispatch_fast2sms('9894156412', 'Hello', config=dummy_config)
            mock_urlopen.assert_not_called()
            self.assertTrue(status.startswith('FAILED: MISSING_API_KEY'))

    def test_03_invalid_phone_number_fails_gracefully(self):
        """When phone number is not a valid 10-digit number, returns clear validation failure."""
        dummy_config = {
            'api_key': 'mock_api_key_123',
            'live_dispatch': True,
            'route': 'q'
        }
        with patch('urllib.request.urlopen') as mock_urlopen:
            status, resp = sms_service.dispatch_fast2sms('123', 'Hello', config=dummy_config)
            mock_urlopen.assert_not_called()
            self.assertTrue(status.startswith('FAILED: INVALID_PHONE'))

    def test_04_successful_mocked_fast2sms_quick_route(self):
        """Verify dispatch_fast2sms sends proper headers, Quick route payload, and returns ACCEPTED_BY_GATEWAY."""
        dummy_config = {
            'api_key': 'fast2sms_secret_mock_key_999',
            'live_dispatch': True,
            'route': 'q'
        }
        mock_response_body = json.dumps({
            "return": True,
            "request_id": "req_fast2sms_mock_12345",
            "message": ["SMS sent successfully"]
        }).encode('utf-8')

        mock_http_response = MagicMock()
        mock_http_response.read.return_value = mock_response_body
        mock_http_response.__enter__.return_value = mock_http_response

        with patch('urllib.request.urlopen', return_value=mock_http_response) as mock_urlopen:
            status, resp = sms_service.dispatch_fast2sms(
                numbers='9894156412',
                message='Nutiyala Couture Order Confirmation',
                config=dummy_config
            )
            # Verify network call was made
            self.assertTrue(mock_urlopen.called)
            called_req = mock_urlopen.call_args[0][0]
            
            # Verify endpoint URL
            self.assertEqual(called_req.full_url, 'https://www.fast2sms.com/dev/bulkV2')
            self.assertEqual(called_req.get_method(), 'POST')
            
            # Verify Authorization header
            self.assertEqual(called_req.headers.get('Authorization'), 'fast2sms_secret_mock_key_999')

            # Verify payload contains route 'q' and 10-digit numbers
            payload_data = json.loads(called_req.data.decode('utf-8'))
            self.assertEqual(payload_data['route'], 'q')
            self.assertEqual(payload_data['numbers'], '9894156412')
            self.assertEqual(payload_data['message'], 'Nutiyala Couture Order Confirmation')

            # Verify return status records accepted into carrier queue, NOT claiming delivered
            self.assertEqual(status, 'ACCEPTED_BY_GATEWAY (req_fast2sms_mock_12345)')
            self.assertNotEqual(status, 'DELIVERED')
            self.assertEqual(resp['request_id'], 'req_fast2sms_mock_12345')

    def test_05_successful_mocked_fast2sms_dlt_route(self):
        """Verify DLT route payload contains sender_id and entity_id."""
        dummy_config = {
            'api_key': 'fast2sms_secret_mock_key_999',
            'live_dispatch': True,
            'route': 'dlt',
            'sender_id': 'NTYALA',
            'entity_id': '1201159123456789'
        }
        mock_response_body = json.dumps({
            "return": True,
            "request_id": "req_dlt_mock_999",
            "message": ["SMS sent successfully"]
        }).encode('utf-8')

        mock_http_response = MagicMock()
        mock_http_response.read.return_value = mock_response_body
        mock_http_response.__enter__.return_value = mock_http_response

        with patch('urllib.request.urlopen', return_value=mock_http_response) as mock_urlopen:
            status, resp = sms_service.dispatch_fast2sms(
                numbers='+91 9894156412',
                message='Order NC-100 confirmed. Nutiyala Couture',
                config=dummy_config
            )
            self.assertTrue(mock_urlopen.called)
            called_req = mock_urlopen.call_args[0][0]
            payload_data = json.loads(called_req.data.decode('utf-8'))
            self.assertEqual(payload_data['route'], 'dlt')
            self.assertEqual(payload_data['sender_id'], 'NTYALA')
            self.assertEqual(payload_data['entity_id'], '1201159123456789')
            self.assertEqual(payload_data['numbers'], '9894156412')
            self.assertEqual(status, 'ACCEPTED_BY_GATEWAY (req_dlt_mock_999)')

    def test_06_dlt_missing_sender_id_fails_gracefully(self):
        """When DLT route is configured but FAST2SMS_SENDER_ID is missing, fails safely."""
        dummy_config = {
            'api_key': 'fast2sms_secret_mock_key_999',
            'live_dispatch': True,
            'route': 'dlt',
            'sender_id': ''
        }
        with patch('urllib.request.urlopen') as mock_urlopen:
            status, resp = sms_service.dispatch_fast2sms('9894156412', 'Test', config=dummy_config)
            mock_urlopen.assert_not_called()
            self.assertTrue(status.startswith('FAILED: MISSING_SENDER'))

    def test_07_fast2sms_gateway_rejection_mocked(self):
        """Verify Fast2SMS return=false response returns FAILED: FAST2SMS_ERROR safely."""
        dummy_config = {
            'api_key': 'fast2sms_secret_mock_key_999',
            'live_dispatch': True,
            'route': 'q'
        }
        mock_response_body = json.dumps({
            "return": False,
            "message": ["Insufficient Fast2SMS balance or invalid route"]
        }).encode('utf-8')

        mock_http_response = MagicMock()
        mock_http_response.read.return_value = mock_response_body
        mock_http_response.__enter__.return_value = mock_http_response

        with patch('urllib.request.urlopen', return_value=mock_http_response):
            status, resp = sms_service.dispatch_fast2sms('9894156412', 'Test', config=dummy_config)
            self.assertTrue(status.startswith('FAILED: FAST2SMS_ERROR'))
            self.assertIn('Insufficient', status)

    def test_08_authentication_error_mocked(self):
        """Verify HTTP 401 returns FAILED: AUTH_ERROR without exposing credentials."""
        dummy_config = {
            'api_key': 'bad_api_key_secret',
            'live_dispatch': True,
            'route': 'q'
        }
        mock_http_err = urllib.error.HTTPError(
            url='https://www.fast2sms.com/dev/bulkV2',
            code=401,
            msg='Unauthorized',
            hdrs={},
            fp=MagicMock(read=lambda: b'{"message": "Unauthorized / Invalid API Key"}')
        )
        with patch('urllib.request.urlopen', side_effect=mock_http_err):
            status, resp = sms_service.dispatch_fast2sms('9894156412', 'Test', config=dummy_config)
            self.assertTrue(status.startswith('FAILED: AUTH_ERROR'))
            self.assertNotIn('bad_api_key_secret', status)

    def test_09_network_timeout_mocked(self):
        """Verify network connection timeout returns FAILED: TIMEOUT safely."""
        dummy_config = {
            'api_key': 'test_key',
            'live_dispatch': True,
            'route': 'q'
        }
        with patch('urllib.request.urlopen', side_effect=urllib.error.URLError(socket.timeout("timed out"))):
            status, resp = sms_service.dispatch_fast2sms('9894156412', 'Test', config=dummy_config)
            self.assertEqual(status, 'FAILED: TIMEOUT')

    def test_10_order_triggers_operate_safely(self):
        """Verify order notification triggers work end-to-end and deduplicate properly."""
        sample_order = {
            'id': self.test_order_id,
            'order_number': 'NC-FAST2SMS-01',
            'total_amount': 18500,
            'payment_method': 'Cash on Delivery',
            'shipping_address_json': {
                'name': 'Priyal Sharma',
                'phone': '+91 9894156412',
                'street': 'Boutique Residence 4',
                'city': 'Coimbatore',
                'pincode': '641001'
            },
            'items': [
                {'product_name': 'Zari Kurti', 'size': 'M', 'color': 'Maroon', 'quantity': 1, 'price': 18500}
            ]
        }

        # 1. Admin Alert Trigger
        admin_res = sms_service.notify_admin_new_order(sample_order)
        self.assertIsNotNone(admin_res)
        self.assertEqual(admin_res['status'], 'SIMULATED_LOCAL')

        # 2. Customer Order Placed Trigger
        cust_res = sms_service.notify_customer_order_placed(sample_order)
        self.assertIsNotNone(cust_res)
        self.assertEqual(cust_res['status'], 'SIMULATED_LOCAL')

        # 3. Customer Order Confirmed Trigger
        conf_res = sms_service.notify_customer_order_confirmed(sample_order)
        self.assertIsNotNone(conf_res)
        self.assertEqual(conf_res['status'], 'SIMULATED_LOCAL')

        # 4. Duplicate Check Trigger (Second confirmation must be skipped)
        dup_res = sms_service.notify_customer_order_confirmed(sample_order)
        self.assertEqual(dup_res['status'], 'DUPLICATE_SKIPPED')

    def test_11_no_secrets_in_logs_or_database(self):
        """Verify that secret tokens or API keys never appear in recent sms_logs."""
        logs = sms_service.get_recent_sms_logs(10)
        for log in logs:
            msg = log.get('message', '')
            status = log.get('status', '')
            # Fast2SMS key or Twilio token must not be in logs
            self.assertNotIn('cdd2b589be619c88116eacecca134fe3', msg)
            self.assertNotIn('cdd2b589be619c88116eacecca134fe3', status)
            self.assertNotIn('fast2sms_secret', msg)
            self.assertNotIn('fast2sms_secret', status)

    def test_12_test_sms_obeys_live_dispatch_guard(self):
        """Verify that Test SMS action cannot bypass FAST2SMS_LIVE_DISPATCH=false."""
        with patch('urllib.request.urlopen') as mock_urlopen:
            res = sms_service.record_sms(
                recipient_phone='+91 9894156412',
                message='Test Admin SMS verification unique',
                recipient_type='ADMIN',
                order_number='NC-TEST-SAFETY',
                action_tag='[TEST SAFETY]',
                force_live=True  # Attempting to force live while FAST2SMS_LIVE_DISPATCH is false
            )
            mock_urlopen.assert_not_called()
            self.assertEqual(res['status'], 'SIMULATED_LOCAL')


if __name__ == '__main__':
    unittest.main()

