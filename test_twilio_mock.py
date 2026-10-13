"""
Nutiyala Couture - Twilio SMS Integration Mock Test Suite
Automated unit & integration tests verifying:
1. Default simulation mode (carrier balance untouched, zero external network calls)
2. Safe handling of missing credentials and missing sender
3. Successful Twilio API dispatch with mocked HTTP 201 responses
4. Proper HTTP Basic Auth and E.164 phone number formatting
5. Error handling for authentication failure (HTTP 401), API errors (HTTP 400), and network timeouts
6. Order triggers (admin alert, customer placement, customer confirmation)
7. Deduplication and zero credential leakage in logs or database
"""

import unittest
from unittest.mock import patch, MagicMock
import urllib.error
import urllib.parse
import socket
import json
import base64
import os
import sms_service
import database

class TestTwilioSMSIntegration(unittest.TestCase):
    
    def setUp(self):
        # Ensure database tables exist
        database.init_db()
        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sms_logs WHERE order_number LIKE 'NC-UNITTEST%' OR order_number LIKE 'NC-SIM%'")
        cursor.execute("SELECT id FROM users LIMIT 1")
        user = cursor.fetchone()
        user_id = user['id'] if user else 1
        # Insert a valid test order to satisfy FOREIGN KEY constraint
        cursor.execute("DELETE FROM orders WHERE order_number = 'NC-UNITTEST-01'")
        cursor.execute("""
        INSERT INTO orders (order_number, user_id, total_amount, subtotal, shipping_address_json)
        VALUES ('NC-UNITTEST-01', ?, 18500, 18500, '{}')
        """, (user_id,))
        self.test_order_id = cursor.lastrowid
        conn.commit()
        conn.close()

    def tearDown(self):
        conn = database.get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sms_logs WHERE order_number LIKE 'NC-UNITTEST%' OR order_number = 'NC-SIM-01'")
        cursor.execute("DELETE FROM orders WHERE order_number = 'NC-UNITTEST-01'")
        conn.commit()
        conn.close()

    def test_01_default_mode_is_simulated_no_network_call(self):
        """Verify that default configuration operates in SIMULATED_LOCAL mode without contacting Twilio."""
        with patch('urllib.request.urlopen') as mock_urlopen:
            res = sms_service.record_sms(
                recipient_phone='+91 9894156412',
                message='Test simulation message',
                recipient_type='ADMIN',
                order_number='NC-SIM-01',
                action_tag='[TEST SIMULATION]'
            )
            # Must NOT call network
            mock_urlopen.assert_not_called()
            self.assertEqual(res['status'], 'SIMULATED_LOCAL')
            self.assertEqual(res['masked_phone'], '+91 ******6412')

    def test_02_missing_credentials_fails_gracefully_without_crash(self):
        """When live dispatch is enabled but credentials are missing, system returns clear failure without crashing."""
        dummy_config = {
            'account_sid': '',
            'auth_token': '',
            'phone_number': '',
            'live_dispatch': True
        }
        with patch('urllib.request.urlopen') as mock_urlopen:
            status, resp = sms_service.dispatch_twilio('+919894156412', 'Hello', config=dummy_config)
            mock_urlopen.assert_not_called()
            self.assertTrue(status.startswith('FAILED: MISSING_API_KEY'))

    def test_03_missing_sender_fails_gracefully(self):
        """When credentials exist but sender number is missing, system fails gracefully."""
        dummy_config = {
            'account_sid': 'ACmocked_account_sid_12345',
            'auth_token': 'mocked_auth_token_secret_67890',
            'phone_number': '',
            'live_dispatch': True
        }
        with patch('urllib.request.urlopen') as mock_urlopen:
            status, resp = sms_service.dispatch_twilio('+919894156412', 'Hello', config=dummy_config)
            mock_urlopen.assert_not_called()
            self.assertTrue(status.startswith('FAILED: MISSING_SENDER'))

    def test_04_successful_mocked_twilio_dispatch(self):
        """Verify dispatch_twilio sends proper Basic Auth headers, E.164 payload, and returns TWILIO_QUEUED."""
        dummy_config = {
            'account_sid': 'ACmocked_account_sid_12345',
            'auth_token': 'mocked_auth_token_secret_67890',
            'phone_number': '+15005550006',
            'live_dispatch': True
        }
        mock_response_body = json.dumps({
            "sid": "SMmocked_message_sid_abcdef123456",
            "status": "queued",
            "to": "+919894156412",
            "from": "+15005550006",
            "body": "Nutiyala Couture Order Confirmation"
        }).encode('utf-8')

        mock_http_response = MagicMock()
        mock_http_response.read.return_value = mock_response_body
        mock_http_response.__enter__.return_value = mock_http_response

        with patch('urllib.request.urlopen', return_value=mock_http_response) as mock_urlopen:
            status, resp = sms_service.dispatch_twilio(
                to_phone='+919894156412',
                message='Nutiyala Couture Order Confirmation',
                config=dummy_config
            )
            # Verify network call was made
            self.assertTrue(mock_urlopen.called)
            called_req = mock_urlopen.call_args[0][0]
            
            # Verify endpoint URL
            self.assertEqual(called_req.full_url, 'https://api.twilio.com/2010-04-01/Accounts/ACmocked_account_sid_12345/Messages.json')
            self.assertEqual(called_req.get_method(), 'POST')
            
            # Verify Basic Auth header
            expected_auth_str = "ACmocked_account_sid_12345:mocked_auth_token_secret_67890"
            expected_b64 = base64.b64encode(expected_auth_str.encode('utf-8')).decode('ascii')
            self.assertEqual(called_req.headers.get('Authorization'), f"Basic {expected_b64}")

            # Verify payload contains E.164 To, From, Body
            payload_str = called_req.data.decode('utf-8')
            parsed_payload = urllib.parse.parse_qs(payload_str)
            self.assertEqual(parsed_payload['To'][0], '+919894156412')
            self.assertEqual(parsed_payload['From'][0], '+15005550006')
            self.assertEqual(parsed_payload['Body'][0], 'Nutiyala Couture Order Confirmation')

            # Verify return status
            self.assertEqual(status, 'TWILIO_QUEUED (SMmocked_message_sid_abcdef123456)')
            self.assertEqual(resp['sid'], 'SMmocked_message_sid_abcdef123456')

    def test_05_authentication_error_mocked(self):
        """Verify HTTP 401 returns FAILED: AUTH_ERROR without exposing credentials."""
        dummy_config = {
            'account_sid': 'ACmocked_bad_sid',
            'auth_token': 'bad_token',
            'phone_number': '+15005550006',
            'live_dispatch': True
        }
        err_body = json.dumps({"code": 20003, "message": "Authentication Error - invalid username/password"}).encode('utf-8')
        http_error = urllib.error.HTTPError(
            url='https://api.twilio.com',
            code=401,
            msg='Unauthorized',
            hdrs={},
            fp=MagicMock(read=MagicMock(return_value=err_body))
        )

        with patch('urllib.request.urlopen', side_effect=http_error):
            status, resp = sms_service.dispatch_twilio('+919894156412', 'Test', config=dummy_config)
            self.assertTrue(status.startswith('FAILED: AUTH_ERROR'))
            # Ensure auth_token is never leaked in status
            self.assertNotIn('bad_token', status)

    def test_06_twilio_api_error_mocked(self):
        """Verify Twilio API error (e.g. unverified number on trial account 21608) returns proper status without crashing."""
        dummy_config = {
            'account_sid': 'ACmocked_sid',
            'auth_token': 'mocked_token',
            'phone_number': '+15005550006',
            'live_dispatch': True
        }
        err_body = json.dumps({"code": 21608, "message": "The number +919894156412 is unverified."}).encode('utf-8')
        http_error = urllib.error.HTTPError(
            url='https://api.twilio.com',
            code=400,
            msg='Bad Request',
            hdrs={},
            fp=MagicMock(read=MagicMock(return_value=err_body))
        )

        with patch('urllib.request.urlopen', side_effect=http_error):
            status, resp = sms_service.dispatch_twilio('+919894156412', 'Test', config=dummy_config)
            self.assertTrue(status.startswith('FAILED: TWILIO_ERROR_21608'))

    def test_07_network_timeout_mocked(self):
        """Verify network connection timeout returns FAILED: TIMEOUT safely."""
        dummy_config = {
            'account_sid': 'ACmocked_sid',
            'auth_token': 'mocked_token',
            'phone_number': '+15005550006',
            'live_dispatch': True
        }
        with patch('urllib.request.urlopen', side_effect=urllib.error.URLError(socket.timeout("timed out"))):
            status, resp = sms_service.dispatch_twilio('+919894156412', 'Test', config=dummy_config)
            self.assertEqual(status, 'FAILED: TIMEOUT')

    def test_08_order_triggers_operate_safely(self):
        """Verify order notification triggers work end-to-end without crashing."""
        sample_order = {
            'id': self.test_order_id,
            'order_number': 'NC-UNITTEST-01',
            'total_amount': 18500,
            'payment_method': 'Cash on Delivery',
            'customer_name': 'Priyal Sharma',
            'customer_mobile': '9894156412',
            'shipping_address_json': json.dumps({
                'name': 'Priyal Sharma',
                'phone': '+91 9894156412',
                'street': 'Boutique Residence 4',
                'city': 'Coimbatore',
                'pincode': '641001'
            }),
            'items': [{'product_name': 'Zari Kurti', 'size': 'M', 'color': 'Maroon', 'quantity': 1}]
        }

        # 1. Admin order alert trigger
        admin_res = sms_service.notify_admin_new_order(sample_order)
        self.assertIsNotNone(admin_res['sms_id'])
        self.assertEqual(admin_res['status'], 'SIMULATED_LOCAL')

        # 2. Customer order placed trigger
        cust_res = sms_service.notify_customer_order_placed(sample_order)
        self.assertIsNotNone(cust_res['sms_id'])
        self.assertEqual(cust_res['status'], 'SIMULATED_LOCAL')

        # 3. Customer order confirmation trigger
        conf_res = sms_service.notify_customer_order_confirmed(sample_order)
        self.assertIsNotNone(conf_res['sms_id'])
        self.assertEqual(conf_res['status'], 'SIMULATED_LOCAL')

        # 4. Duplicate prevention check
        dup_res = sms_service.notify_customer_order_confirmed(sample_order)
        self.assertEqual(dup_res['status'], 'DUPLICATE_SKIPPED')

    def test_09_no_secrets_in_logs_or_database(self):
        """Verify that secret tokens never appear in recent sms_logs."""
        logs = sms_service.get_recent_sms_logs(10)
        secret_patterns = ['auth_token', 'mocked_auth_token', 'TWILIO_AUTH_TOKEN']
        for log in logs:
            msg = log.get('message', '')
            status = log.get('status', '')
            for pattern in secret_patterns:
                self.assertNotIn(pattern, msg)
                self.assertNotIn(pattern, status)

if __name__ == '__main__':
    unittest.main()
