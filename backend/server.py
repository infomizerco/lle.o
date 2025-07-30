from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
from datetime import datetime, timedelta
import json

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/adbhog')
client = MongoClient(MONGO_URL)
db = client.adbhog

# Collections
products_collection = db.products
cart_collection = db.cart
orders_collection = db.orders
users_collection = db.users

app = FastAPI(title="Adbhog API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    original_price: Optional[float] = None
    image: str
    description: str
    unit: str
    available: bool = True
    rating: float = 4.5
    delivery_time: str = "15-30 mins"

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

# Sample product data initialization
def init_sample_products():
    if products_collection.count_documents({}) == 0:
        sample_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "Fresh Tomatoes",
                "category": "Vegetables",
                "price": 45.0,
                "original_price": 55.0,
                "image": "https://images.unsplash.com/photo-1568581789190-ae90a7da930b",
                "description": "Fresh, juicy red tomatoes perfect for cooking",
                "unit": "500g",
                "available": True,
                "rating": 4.6,
                "delivery_time": "15-30 mins"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Mixed Fruits Basket",
                "category": "Fruits",
                "price": 299.0,
                "original_price": 350.0,
                "image": "https://images.unsplash.com/photo-1705727209465-b292e4129a37",
                "description": "Fresh seasonal fruits - apples, pears, bananas",
                "unit": "1 basket",
                "available": True,
                "rating": 4.8,
                "delivery_time": "15-30 mins"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Premium Orange Pack",
                "category": "Fruits",
                "price": 120.0,
                "original_price": 140.0,
                "image": "https://images.unsplash.com/photo-1648551244859-1e797dc13fe6",
                "description": "Sweet and juicy oranges, vitamin C rich",
                "unit": "1 kg",
                "available": True,
                "rating": 4.5,
                "delivery_time": "15-30 mins"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Farm Fresh Vegetables",
                "category": "Vegetables", 
                "price": 180.0,
                "original_price": 220.0,
                "image": "https://images.pexels.com/photos/33171850/pexels-photo-33171850.jpeg",
                "description": "Assorted fresh vegetables including corn and peppers",
                "unit": "1 pack",
                "available": True,
                "rating": 4.7,
                "delivery_time": "15-30 mins"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Organic Condiments",
                "category": "Pantry",
                "price": 250.0,
                "original_price": 280.0,
                "image": "https://images.unsplash.com/photo-1607103058066-0cc3e67f97be",
                "description": "Premium organic condiments and preserves",
                "unit": "3 jars",
                "available": True,
                "rating": 4.4,
                "delivery_time": "15-30 mins"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Fresh Dairy Milk",
                "category": "Dairy",
                "price": 65.0,
                "image": "https://images.unsplash.com/photo-1652738515643-4e95b0e4f0e8",
                "description": "Farm fresh full cream milk",
                "unit": "1 liter",
                "available": True,
                "rating": 4.8,
                "delivery_time": "15-30 mins"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Premium Rice",
                "category": "Grains",
                "price": 85.0,
                "original_price": 95.0,
                "image": "https://images.pexels.com/photos/33210855/pexels-photo-33210855.jpeg",
                "description": "Premium basmati rice, aromatic and long grain",
                "unit": "1 kg",
                "available": True,
                "rating": 4.6,
                "delivery_time": "15-30 mins"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Healthy Snack Mix",
                "category": "Snacks",
                "price": 135.0,
                "image": "https://images.unsplash.com/photo-1568581789190-ae90a7da930b",
                "description": "Nutritious mix of nuts and dried fruits",
                "unit": "250g",
                "available": True,
                "rating": 4.3,
                "delivery_time": "15-30 mins"
            }
        ]
        products_collection.insert_many(sample_products)
        print("Sample products initialized!")

# Initialize sample data on startup
init_sample_products()

@app.get("/")
async def root():
    return {"message": "Adbhog API is running!"}

@app.get("/api/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    try:
        query = {}
        if category and category.lower() != "all":
            query["category"] = {"$regex": category, "$options": "i"}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}}
            ]
        
        products = list(products_collection.find(query, {"_id": 0}))
        return {"success": True, "products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/categories")
async def get_categories():
    try:
        categories = products_collection.distinct("category")
        return {"success": True, "categories": ["All"] + categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cart/add")
async def add_to_cart(item: CartItem):
    try:
        # Check if item already exists in cart
        existing_item = cart_collection.find_one({
            "product_id": item.product_id, 
            "user_id": item.user_id
        })
        
        if existing_item:
            # Update quantity
            cart_collection.update_one(
                {"product_id": item.product_id, "user_id": item.user_id},
                {"$inc": {"quantity": item.quantity}}
            )
        else:
            # Add new item
            cart_data = item.dict()
            cart_collection.insert_one(cart_data)
        
        return {"success": True, "message": "Item added to cart"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cart/{user_id}")
async def get_cart(user_id: str):
    try:
        cart_items = list(cart_collection.find({"user_id": user_id}, {"_id": 0}))
        
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
async def update_cart_quantity(item: CartItem):
    try:
        if item.quantity <= 0:
            # Remove item if quantity is 0 or less
            cart_collection.delete_one({
                "product_id": item.product_id, 
                "user_id": item.user_id
            })
        else:
            # Update quantity
            cart_collection.update_one(
                {"product_id": item.product_id, "user_id": item.user_id},
                {"$set": {"quantity": item.quantity}}
            )
        
        return {"success": True, "message": "Cart updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/cart/clear/{user_id}")
async def clear_cart(user_id: str):
    try:
        cart_collection.delete_many({"user_id": user_id})
        return {"success": True, "message": "Cart cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/orders")
async def create_order(order_data: Dict[str, Any]):
    try:
        order_id = str(uuid.uuid4())
        estimated_delivery = (datetime.now() + timedelta(minutes=25)).strftime("%I:%M %p")
        
        order = {
            "id": order_id,
            "user_id": order_data["user_id"],
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
        cart_collection.delete_many({"user_id": order_data["user_id"]})
        
        return {
            "success": True, 
            "order_id": order_id,
            "message": "Order placed successfully!",
            "estimated_delivery": estimated_delivery
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders/{user_id}")
async def get_user_orders(user_id: str):
    try:
        orders = list(orders_collection.find(
            {"user_id": user_id}, 
            {"_id": 0}
        ).sort("created_at", -1))
        
        return {"success": True, "orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/location/check")
async def check_delivery_area(lat: float, lng: float):
    """Mock location service - in real app would check against service areas"""
    try:
        # Mock delivery areas (in real app, this would be a proper geospatial query)
        # For demo, we'll assume all locations within Delhi NCR are serviceable
        serviceable_areas = [
            "Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad"
        ]
        
        # Mock area detection based on coordinates
        area = "Delhi"  # In real app, reverse geocoding would be done
        is_serviceable = area in serviceable_areas
        
        return {
            "success": True,
            "serviceable": is_serviceable,
            "area": area,
            "delivery_time": "15-30 mins" if is_serviceable else "Not available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)