import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, MapPin, Star, Plus, Minus, Trash2, Heart, Clock, CheckCircle, X } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState('Delhi, India');
  const [isServiceable, setIsServiceable] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);

  // Mock user ID for demo
  const userId = 'demo-user-123';

  // Checkout form data
  const [checkoutData, setCheckoutData] = useState({
    address: '',
    phone: '',
    deliveryTime: 'now',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCart();
    checkLocation();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    setProducts(filtered);
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/cart/${userId}`);
      const data = await response.json();
      if (data.success) {
        setCart(data.cart);
        setCartTotal(data.total_amount);
        setCartCount(data.total_items);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const checkLocation = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/location/check?lat=28.6139&lng=77.2090`);
      const data = await response.json();
      if (data.success) {
        setCurrentLocation(data.area);
        setIsServiceable(data.serviceable);
      }
    } catch (error) {
      console.error('Error checking location:', error);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          user_id: userId
        }),
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateCartQuantity = async (productId, quantity) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          user_id: userId
        }),
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (productId) => {
    await updateCartQuantity(productId, 0);
  };

  const clearCart = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/cart/clear/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const handleCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
    setCheckoutStep(1);
  };

  const nextCheckoutStep = () => {
    if (checkoutStep < 3) {
      setCheckoutStep(checkoutStep + 1);
    }
  };

  const prevCheckoutStep = () => {
    if (checkoutStep > 1) {
      setCheckoutStep(checkoutStep - 1);
    }
  };

  const placeOrder = async () => {
    try {
      const orderItems = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          items: orderItems,
          total_amount: cartTotal,
          delivery_address: checkoutData.address,
          payment_method: checkoutData.paymentMethod
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOrderDetails({
          order_id: data.order_id,
          estimated_delivery: data.estimated_delivery
        });
        setOrderSuccess(true);
        setShowCheckout(false);
        fetchCart(); // This will clear the cart display
      }
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  const ProductCard = ({ product }) => {
    const cartItem = cart.find(item => item.product_id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
      <Card className="product-card group">
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {product.original_price && (
              <Badge className="absolute top-2 left-2 bg-green-500">
                {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
              </Badge>
            )}
            <button className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Heart className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">{product.rating}</span>
              <Clock className="w-4 h-4 text-gray-400 ml-2" />
              <span className="text-sm text-gray-600">{product.delivery_time}</span>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{product.unit}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">₹{product.price}</span>
                {product.original_price && (
                  <span className="text-sm text-gray-500 line-through">₹{product.original_price}</span>
                )}
              </div>
              
              {quantity > 0 ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => updateCartQuantity(product.id, quantity - 1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="font-semibold min-w-[20px] text-center">{quantity}</span>
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                    onClick={() => addToCart(product.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => addToCart(product.id)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-green-600">Adbhog</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{currentLocation}</span>
                {isServiceable && <Badge variant="secondary" className="bg-green-100 text-green-700">Serviceable</Badge>}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button
                variant="outline"
                className="relative"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-green-600 text-white min-w-[20px] h-5 flex items-center justify-center">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`whitespace-nowrap ${
                selectedCategory === category 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "hover:bg-green-50"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Your cart is empty</p>
            ) : (
              cart.map((item) => (
                <div key={item.product_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">₹{item.product.price} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold min-w-[20px] text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => addToCart(item.product_id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {cart.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total: ₹{cartTotal.toFixed(2)}</span>
                <Button variant="outline" size="sm" onClick={clearCart}>
                  Clear Cart
                </Button>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout - Step {checkoutStep} of 3</DialogTitle>
          </DialogHeader>
          
          {checkoutStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Delivery Address</h3>
              <Textarea
                placeholder="Enter your complete address..."
                value={checkoutData.address}
                onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})}
              />
              <Input
                placeholder="Phone number"
                value={checkoutData.phone}
                onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})}
              />
              <Button 
                className="w-full" 
                onClick={nextCheckoutStep}
                disabled={!checkoutData.address || !checkoutData.phone}
              >
                Continue
              </Button>
            </div>
          )}
          
          {checkoutStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Delivery Time</h3>
              <Select value={checkoutData.deliveryTime} onValueChange={(value) => setCheckoutData({...checkoutData, deliveryTime: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Deliver Now (15-30 mins)</SelectItem>
                  <SelectItem value="1hour">Within 1 Hour</SelectItem>
                  <SelectItem value="2hours">Within 2 Hours</SelectItem>
                  <SelectItem value="evening">This Evening (6-8 PM)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevCheckoutStep}>Back</Button>
                <Button className="flex-1" onClick={nextCheckoutStep}>Continue</Button>
              </div>
            </div>
          )}
          
          {checkoutStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Payment Method</h3>
              <Select value={checkoutData.paymentMethod} onValueChange={(value) => setCheckoutData({...checkoutData, paymentMethod: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="online">Pay Online (UPI/Card)</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Items ({cartCount})</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total Amount</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevCheckoutStep}>Back</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={placeOrder}>
                  Place Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Success Dialog */}
      <Dialog open={orderSuccess} onOpenChange={setOrderSuccess}>
        <DialogContent className="max-w-md text-center">
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-green-600">Order Placed!</h2>
            <p className="text-gray-600">
              Your order has been confirmed and will be delivered by{' '}
              <span className="font-semibold">{orderDetails?.estimated_delivery}</span>
            </p>
            <p className="text-sm text-gray-500">
              Order ID: {orderDetails?.order_id}
            </p>
            <Button className="w-full" onClick={() => setOrderSuccess(false)}>
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;