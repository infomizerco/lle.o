import requests
import sys
import json
from datetime import datetime

class AdbhogAPITester:
    def __init__(self, base_url="https://a2cec551-7dac-4c42-964e-871955657761.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.token = None
        self.user_id = None
        self.test_product_id = None
        self.test_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@adbhog.com"

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add authorization header if required and token is available
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if auth_required:
            print(f"   Auth: {'✓' if self.token else '✗'}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'success' in response_data:
                        print(f"   Success: {response_data.get('success')}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    # Authentication Tests
    def test_user_registration(self):
        """Test user registration"""
        user_data = {
            "name": "Test User",
            "email": self.test_user_email,
            "password": "TestPass123!",
            "phone": "9876543210"
        }
        success, response = self.run_test("User Registration", "POST", "api/auth/register", 200, data=user_data)
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            print(f"   Token received: ✓")
        return success

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        success, response = self.run_test("User Login", "POST", "api/auth/login", 200, data=login_data)
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Login successful for: {response['user']['name']}")
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "api/auth/me", 200, auth_required=True)

    def test_protected_endpoint_without_auth(self):
        """Test accessing protected endpoint without authentication"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        success, _ = self.run_test("Protected Endpoint (No Auth)", "GET", "api/cart", 401, auth_required=False)
        # Restore token
        self.token = temp_token
        return success

    def test_get_products(self):
        """Test getting all products"""
        success, response = self.run_test("Get All Products", "GET", "api/products", 200)
        if success and 'products' in response:
            products = response['products']
            print(f"   Found {len(products)} products")
            if products:
                self.test_product_id = products[0]['id']
                print(f"   Sample product: {products[0]['name']}")
        return success

    def test_get_products_with_category(self):
        """Test getting products by category"""
        return self.run_test("Get Products by Category", "GET", "api/products", 200, 
                           params={"category": "Fruits"})

    def test_get_products_with_advanced_filters(self):
        """Test advanced product filtering"""
        params = {
            "category": "Fruits & Vegetables",
            "min_price": 40,
            "max_price": 200,
            "brand": "Adbhog",
            "sort_by": "price_low"
        }
        return self.run_test("Advanced Product Filtering", "GET", "api/products", 200, params=params)

    def test_search_suggestions(self):
        """Test search suggestions API"""
        return self.run_test("Search Suggestions", "GET", "api/search/suggestions", 200, 
                           params={"q": "tom"})

    def test_get_categories(self):
        """Test getting categories"""
        success, response = self.run_test("Get Categories", "GET", "api/categories", 200)
        if success and 'categories' in response:
            categories = response['categories']
            print(f"   Found {len(categories)} categories")
            for cat in categories:
                print(f"   - {cat['name']}: {cat['description']}")
        return success

    def test_location_check(self):
        """Test location service"""
        return self.run_test("Check Location", "GET", "api/location/check", 200,
                           params={"lat": 28.6139, "lng": 77.2090})

    def test_add_to_cart(self):
        """Test adding item to cart"""
        if not self.test_product_id:
            print("❌ No product ID available for cart test")
            return False
            
        cart_data = {
            "product_id": self.test_product_id,
            "quantity": 2,
            "user_id": self.user_id
        }
        return self.run_test("Add to Cart", "POST", "api/cart/add", 200, data=cart_data)

    def test_get_cart(self):
        """Test getting cart contents"""
        success, response = self.run_test("Get Cart", "GET", f"api/cart/{self.user_id}", 200)
        if success:
            cart = response.get('cart', [])
            total_items = response.get('total_items', 0)
            total_amount = response.get('total_amount', 0)
            print(f"   Cart items: {len(cart)}, Total items: {total_items}, Total: ₹{total_amount}")
        return success

    def test_update_cart(self):
        """Test updating cart quantity"""
        if not self.test_product_id:
            print("❌ No product ID available for cart update test")
            return False
            
        cart_data = {
            "product_id": self.test_product_id,
            "quantity": 3,
            "user_id": self.user_id
        }
        return self.run_test("Update Cart Quantity", "PUT", "api/cart/update", 200, data=cart_data)

    def test_place_order(self):
        """Test placing an order"""
        order_data = {
            "user_id": self.user_id,
            "items": [
                {
                    "product_id": self.test_product_id,
                    "quantity": 2,
                    "price": 45.0
                }
            ],
            "total_amount": 90.0,
            "delivery_address": "123 Test Street, Delhi, India",
            "payment_method": "cod"
        }
        success, response = self.run_test("Place Order", "POST", "api/orders", 200, data=order_data)
        if success and 'order_id' in response:
            print(f"   Order ID: {response['order_id']}")
            print(f"   Estimated delivery: {response.get('estimated_delivery')}")
        return success

    def test_get_orders(self):
        """Test getting user orders"""
        return self.run_test("Get User Orders", "GET", f"api/orders/{self.user_id}", 200)

    def test_clear_cart(self):
        """Test clearing cart"""
        return self.run_test("Clear Cart", "DELETE", f"api/cart/clear/{self.user_id}", 200)

def main():
    print("🚀 Starting Adbhog API Tests")
    print("=" * 50)
    
    tester = AdbhogAPITester()
    
    # Test sequence
    test_functions = [
        tester.test_root_endpoint,
        tester.test_get_products,
        tester.test_get_categories,
        tester.test_get_products_with_category,
        tester.test_get_products_with_search,
        tester.test_location_check,
        tester.test_add_to_cart,
        tester.test_get_cart,
        tester.test_update_cart,
        tester.test_get_cart,  # Check cart after update
        tester.test_place_order,
        tester.test_get_orders,
        tester.test_clear_cart,
        tester.test_get_cart,  # Verify cart is cleared
    ]
    
    # Run all tests
    for test_func in test_functions:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())