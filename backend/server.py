from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import os
import uuid
from datetime import datetime, timedelta
import json
import jwt
import bcrypt
from functools import wraps

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/adbhog')
client = MongoClient(MONGO_URL)
db = client.adbhog

# Collections
products_collection = db.products
cart_collection = db.cart
orders_collection = db.orders
users_collection = db.users
categories_collection = db.categories

# JWT Configuration
JWT_SECRET = "adbhog_secret_key_2025"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="Adbhog Grocery API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    created_at: datetime
    is_active: bool = True

class Product(BaseModel):
    id: str
    name: str
    category: str
    subcategory: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    image: str
    description: str
    unit: str
    available: bool = True
    rating: float = 4.5
    delivery_time: str = "15-30 mins"
    brand: str = "Adbhog"
    ingredients: Optional[List[str]] = None
    nutritional_info: Optional[Dict[str, str]] = None
    tags: Optional[List[str]] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    user_id: str

class OrderItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Order(BaseModel):
    id: str
    user_id: str
    items: List[OrderItem]
    total_amount: float
    delivery_address: str
    payment_method: str
    status: str = "confirmed"
    created_at: datetime
    estimated_delivery: str

class FilterRequest(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    brand: Optional[str] = None
    tags: Optional[List[str]] = None
    sort_by: Optional[str] = "name"  # name, price_low, price_high, rating, newest

# Authentication utilities
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    return verify_jwt_token(token)

# Initialize sample data
def init_categories():
    if categories_collection.count_documents({}) == 0:
        grocery_categories = [
            {
                "id": "fruits-vegetables",
                "name": "Fruits & Vegetables",
                "description": "Fresh, organic fruits and vegetables",
                "subcategories": ["Fresh Fruits", "Leafy Vegetables", "Root Vegetables", "Exotic Fruits"]
            },
            {
                "id": "dairy-eggs",
                "name": "Dairy & Eggs",
                "description": "Fresh dairy products and farm eggs",
                "subcategories": ["Milk & Cream", "Cheese & Paneer", "Yogurt & Lassi", "Eggs"]
            },
            {
                "id": "grains-cereals",
                "name": "Grains & Cereals",
                "description": "Premium quality grains and cereals",
                "subcategories": ["Rice & Rice Products", "Wheat & Flour", "Millets & Quinoa", "Breakfast Cereals"]
            },
            {
                "id": "cooking-essentials",
                "name": "Cooking Essentials",
                "description": "Daily cooking needs and spices",
                "subcategories": ["Oils & Ghee", "Spices & Seasonings", "Salt & Sugar", "Condiments & Sauces"]
            },
            {
                "id": "snacks-beverages",
                "name": "Snacks & Beverages",
                "description": "Healthy snacks and refreshing beverages",
                "subcategories": ["Healthy Snacks", "Traditional Sweets", "Tea & Coffee", "Fresh Juices"]
            },
            {
                "id": "household-care",
                "name": "Household Care",
                "description": "Daily household cleaning essentials",
                "subcategories": ["Cleaning Supplies", "Laundry Care", "Personal Hygiene", "Kitchen Essentials"]
            }
        ]
        categories_collection.insert_many(grocery_categories)
        print("Grocery categories initialized!")

def init_sample_products():
    if products_collection.count_documents({}) == 0:
        grocery_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "Fresh Organic Tomatoes",
                "category": "Fruits & Vegetables",
                "subcategory": "Fresh Vegetables",
                "price": 45.0,
                "original_price": 55.0,
                "image": "https://images.unsplash.com/photo-1568581789190-ae90a7da930b",
                "description": "Fresh, juicy organic tomatoes perfect for cooking and salads",
                "unit": "500g",
                "available": True,
                "rating": 4.6,
                "delivery_time": "15-30 mins",
                "brand": "Adbhog Fresh",
                "tags": ["organic", "fresh", "local", "pesticide-free"],
                "nutritional_info": {"calories": "18 per 100g", "vitamin_c": "High", "fiber": "1.2g"}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Premium Basmati Rice",
                "category": "Grains & Cereals",
                "subcategory": "Rice & Rice Products",
                "price": 185.0,
                "original_price": 220.0,
                "image": "https://images.pexels.com/photos/33210855/pexels-photo-33210855.jpeg",
                "description": "Aged premium basmati rice with long grains and aromatic fragrance",
                "unit": "1 kg",
                "available": True,
                "rating": 4.8,
                "delivery_time": "15-30 mins",
                "brand": "Adbhog Premium",
                "tags": ["basmati", "aged", "aromatic", "premium"],
                "nutritional_info": {"calories": "345 per 100g", "carbs": "78g", "protein": "7g"}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Fresh Full Cream Milk",
                "category": "Dairy & Eggs",
                "subcategory": "Milk & Cream",
                "price": 65.0,
                "image": "https://images.unsplash.com/photo-1652738515643-4e95b0e4f0e8",
                "description": "Pure, fresh full cream milk from local dairy farms",
                "unit": "1 liter",
                "available": True,
                "rating": 4.7,
                "delivery_time": "15-30 mins",
                "brand": "Adbhog Dairy",
                "tags": ["fresh", "full-cream", "pasteurized", "farm-fresh"],
                "nutritional_info": {"calories": "60 per 100ml", "protein": "3.2g", "calcium": "High"}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Mixed Seasonal Fruits",
                "category": "Fruits & Vegetables",
                "subcategory": "Fresh Fruits",
                "price": 299.0,
                "original_price": 350.0,
                "image": "https://images.unsplash.com/photo-1705727209465-b292e4129a37",
                "description": "Fresh seasonal fruits basket - apples, pears, bananas and more",
                "unit": "1 basket (1.5kg)",
                "available": True,
                "rating": 4.9,
                "delivery_time": "15-30 mins",
                "brand": "Adbhog Fresh",
                "tags": ["seasonal", "mixed", "fresh", "vitamin-rich"],
                "nutritional_info": {"calories": "Varies", "vitamins": "A, C, K", "antioxidants": "High"}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cold Pressed Mustard Oil",
                "category": "Cooking Essentials",
                "subcategory": "Oils & Ghee",
                "price": 155.0,
                "original_price": 175.0,
                "image": "https://images.unsplash.com/photo-1607103058066-0cc3e67f97be",
                "description": "Pure cold pressed mustard oil, perfect for cooking and health",
                "unit": "500ml",
                "available": True,
                "rating": 4.5,
                "delivery_time": "15-30 mins",
                "brand": "Adbhog Pure",
                "tags": ["cold-pressed", "pure", "traditional", "healthy"],
                "nutritional_info": {"calories": "884 per 100ml", "omega_3": "Present", "vitamin_e": "High"}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Organic Mixed Vegetables",
                "category": "Fruits & Vegetables",
                "subcategory": "Fresh Vegetables",
                "price": 180.0,
                "original_price": 220.0,
                "image": "https://images.pexels.com/photos/33171850/pexels-photo-33171850.jpeg",
                "description": "Fresh organic mixed vegetables including corn, peppers, and greens",
                "unit": "1 pack (1kg)",
                "available": True,
                "rating": 4.7,
                "delivery_time": "15-30 mins",
                "brand": "Adbhog Organic",
                "tags": ["organic", "mixed", "fresh", "pesticide-free"],
                "nutritional_info": {"calories": "Varies", "fiber": "High", "vitamins": "Multiple"}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Traditional Homemade Snacks",
                "category": "Snacks & Beverages",
                "subcategory": "Healthy Snacks",
                "price": 135.0,
                "image": "https://images.unsplash.com/photo-1568581789190-ae90a7da930b",
                "description": "Healthy homemade snack mix with nuts, seeds, and dried fruits",
                "unit": "250g",
                "available": True,
                "rating": 4.4,
                "delivery_time": "15-30 mins",
                "brand": "Adbhog Kitchen",
                "tags": ["homemade", "healthy", "traditional", "no-preservatives"],
                "nutritional_info": {"calories": "510 per 100g", "protein": "15g", "healthy_fats": "High"}
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Organic Whole Wheat Flour",
                "category": "Grains & Cereals",
                "subcategory": "Wheat & Flour",
                "price": 95.0,
                "original_price": 110.0,
                "image": "https://images.pexels.com/photos/33210855/pexels-photo-33210855.jpeg",
                "description": "Stone ground organic whole wheat flour for healthy rotis",
                "unit": "1 kg",
                "available": True,
                "rating": 4.8,
                "delivery_time": "15-30 mins",
                "brand": "Adbhog Mills",
                "tags": ["organic", "stone-ground", "whole-wheat", "fiber-rich"],
                "nutritional_info": {"calories": "340 per 100g", "fiber": "12g", "protein": "13g"}
            }
        ]
        products_collection.insert_many(grocery_products)
        print("Grocery products initialized!")

# Initialize data on startup
init_categories()
init_sample_products()

@app.get("/")
async def root():
    return {"message": "Adbhog Grocery API is running!", "version": "1.0.0"}

# Authentication endpoints
@app.post("/api/auth/register")
async def register_user(user_data: UserRegister):
    try:
        # Check if user exists
        existing_user = users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "password": hashed_password,
            "phone": user_data.phone,
            "created_at": datetime.now(),
            "is_active": True
        }
        
        users_collection.insert_one(user_doc)
        
        # Generate JWT token
        token = create_jwt_token(user_id)
        
        return {
            "success": True,
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user_id,
                "name": user_data.name,
                "email": user_data.email,
                "phone": user_data.phone
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login_user(login_data: UserLogin):
    try:
        # Find user
        user = users_collection.find_one({"email": login_data.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(login_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Generate JWT token
        token = create_jwt_token(user["id"])
        
        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"]
            }
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/me")
async def get_current_user_info(current_user_id: str = Depends(get_current_user)):
    try:
        user = users_collection.find_one({"id": current_user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "user": user}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Categories endpoints
@app.get("/api/categories")
async def get_categories():
    try:
        categories = list(categories_collection.find({}, {"_id": 0}))
        return {"success": True, "categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Products endpoints with advanced filtering
@app.get("/api/products")
async def get_products(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    tags: Optional[str] = None,
    sort_by: Optional[str] = "name"
):
    try:
        query = {"available": True}
        
        # Category filter
        if category and category.lower() != "all":
            query["category"] = {"$regex": category, "$options": "i"}
        
        # Subcategory filter
        if subcategory:
            query["subcategory"] = {"$regex": subcategory, "$options": "i"}
        
        # Search filter
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}},
                {"subcategory": {"$regex": search, "$options": "i"}},
                {"tags": {"$in": [search.lower()]}}
            ]
        
        # Price range filter
        if min_price is not None or max_price is not None:
            price_filter = {}
            if min_price is not None:
                price_filter["$gte"] = min_price
            if max_price is not None:
                price_filter["$lte"] = max_price
            query["price"] = price_filter
        
        # Brand filter
        if brand:
            query["brand"] = {"$regex": brand, "$options": "i"}
        
        # Tags filter
        if tags:
            tag_list = [tag.strip().lower() for tag in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        
        # Sorting
        sort_options = {
            "name": [("name", 1)],
            "price_low": [("price", 1)],
            "price_high": [("price", -1)],
            "rating": [("rating", -1)],
            "newest": [("created_at", -1)]
        }
        sort_order = sort_options.get(sort_by, [("name", 1)])
        
        products = list(products_collection.find(query, {"_id": 0}).sort(sort_order))
        
        return {
            "success": True, 
            "products": products,
            "count": len(products),
            "filters_applied": {
                "category": category,
                "subcategory": subcategory,
                "search": search,
                "price_range": f"{min_price}-{max_price}" if min_price or max_price else None,
                "brand": brand,
                "tags": tags,
                "sort_by": sort_by
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/products/{product_id}")
async def get_product_details(product_id: str):
    try:
        product = products_collection.find_one({"id": product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"success": True, "product": product}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Cart endpoints (authenticated)
@app.post("/api/cart/add")
async def add_to_cart(item: CartItem, current_user_id: str = Depends(get_current_user)):
    try:
        # Override user_id with authenticated user
        item.user_id = current_user_id
        
        # Verify product exists
        product = products_collection.find_one({"id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if item already exists in cart
        existing_item = cart_collection.find_one({
            "product_id": item.product_id, 
            "user_id": current_user_id
        })
        
        if existing_item:
            # Update quantity
            cart_collection.update_one(
                {"product_id": item.product_id, "user_id": current_user_id},
                {"$inc": {"quantity": item.quantity}}
            )
        else:
            # Add new item
            cart_data = item.dict()
            cart_collection.insert_one(cart_data)
        
        return {"success": True, "message": "Item added to cart"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cart")
async def get_cart(current_user_id: str = Depends(get_current_user)):
    try:
        cart_items = list(cart_collection.find({"user_id": current_user_id}, {"_id": 0}))
        
        # Get product details for each cart item
        cart_with_products = []
        total_amount = 0
        
        for item in cart_items:
            product = products_collection.find_one({"id": item["product_id"]}, {"_id": 0})
            if product:
                cart_item = {
                    **item,
                    "product": product,
                    "item_total": product["price"] * item["quantity"]
                }
                cart_with_products.append(cart_item)
                total_amount += cart_item["item_total"]
        
        return {
            "success": True, 
            "cart": cart_with_products,
            "total_amount": total_amount,
            "total_items": sum(item["quantity"] for item in cart_items)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/cart/update")
async def update_cart_quantity(item: CartItem, current_user_id: str = Depends(get_current_user)):
    try:
        if item.quantity <= 0:
            # Remove item if quantity is 0 or less
            cart_collection.delete_one({
                "product_id": item.product_id, 
                "user_id": current_user_id
            })
        else:
            # Update quantity
            cart_collection.update_one(
                {"product_id": item.product_id, "user_id": current_user_id},
                {"$set": {"quantity": item.quantity}}
            )
        
        return {"success": True, "message": "Cart updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/cart/clear")
async def clear_cart(current_user_id: str = Depends(get_current_user)):
    try:
        cart_collection.delete_many({"user_id": current_user_id})
        return {"success": True, "message": "Cart cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Orders endpoints (authenticated)
@app.post("/api/orders")
async def create_order(order_data: Dict[str, Any], current_user_id: str = Depends(get_current_user)):
    try:
        order_id = str(uuid.uuid4())
        estimated_delivery = (datetime.now() + timedelta(minutes=25)).strftime("%I:%M %p")
        
        order = {
            "id": order_id,
            "user_id": current_user_id,
            "items": order_data["items"],
            "total_amount": order_data["total_amount"],
            "delivery_address": order_data["delivery_address"],
            "payment_method": order_data["payment_method"],
            "status": "confirmed",
            "created_at": datetime.now(),
            "estimated_delivery": estimated_delivery
        }
        
        orders_collection.insert_one(order)
        
        # Clear cart after successful order
        cart_collection.delete_many({"user_id": current_user_id})
        
        return {
            "success": True, 
            "order_id": order_id,
            "message": "Order placed successfully!",
            "estimated_delivery": estimated_delivery
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders")
async def get_user_orders(current_user_id: str = Depends(get_current_user)):
    try:
        orders = list(orders_collection.find(
            {"user_id": current_user_id}, 
            {"_id": 0}
        ).sort("created_at", -1))
        
        return {"success": True, "orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Location service (mock)
@app.get("/api/location/check")
async def check_delivery_area(lat: float, lng: float):
    try:
        # Mock delivery areas for grocery service
        serviceable_areas = [
            "Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad",
            "Mumbai", "Pune", "Bangalore", "Hyderabad", "Chennai"
        ]
        
        # Mock area detection based on coordinates
        area = "Delhi"  # In real app, reverse geocoding would be done
        is_serviceable = area in serviceable_areas
        
        return {
            "success": True,
            "serviceable": is_serviceable,
            "area": area,
            "delivery_time": "15-30 mins" if is_serviceable else "Not available",
            "service_type": "Grocery & Daily Essentials"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Search suggestions endpoint
@app.get("/api/search/suggestions")
async def get_search_suggestions(q: str):
    try:
        if len(q) < 2:
            return {"success": True, "suggestions": []}
        
        # Search in product names and categories
        products = list(products_collection.find(
            {"$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"category": {"$regex": q, "$options": "i"}},
                {"subcategory": {"$regex": q, "$options": "i"}},
                {"tags": {"$in": [q.lower()]}}
            ]},
            {"name": 1, "category": 1, "_id": 0}
        ).limit(10))
        
        suggestions = list(set([p["name"] for p in products]))[:5]
        
        return {"success": True, "suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)