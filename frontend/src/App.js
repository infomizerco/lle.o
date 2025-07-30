import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, MapPin, Star, Plus, Minus, Trash2, Heart, Clock, CheckCircle, X, ChevronRight, Zap, Gift, Coffee, User, LogOut, Eye, EyeOff, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Slider } from './components/ui/slider';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

function App() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState('Gomti Nagar, Viram Khand 5, Lucknow...');
  const [isServiceable, setIsServiceable] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adbhog_token'));
  const [showPassword, setShowPassword] = useState(false);
  const [searchSuggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    subcategory: '',
    minPrice: 0,
    maxPrice: 1000,
    brand: '',
    sortBy: 'name'
  });

  // Auth form data
  const [authData, setAuthData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  // Checkout form data
  const [checkoutData, setCheckoutData] = useState({
    address: '',
    phone: '',
    deliveryTime: 'now',
    paymentMethod: 'cod'
  });

  // Grocery-focused categories
  const groceryCategories = [
    { name: 'Fruits & Vegetables', icon: '🥬', color: 'bg-green-100' },
    { name: 'Dairy & Eggs', icon: '🥛', color: 'bg-blue-100' },
    { name: 'Grains & Cereals', icon: '🌾', color: 'bg-yellow-100' },
    { name: 'Cooking Essentials', icon: '🫒', color: 'bg-orange-100' },
    { name: 'Snacks & Beverages', icon: '🥜', color: 'bg-red-100' },
    { name: 'Household Care', icon: '🧽', color: 'bg-purple-100' }
  ];

  useEffect(() => {
    if (token) {
      getCurrentUser();
    }
    fetchProducts();
    fetchCategories();
    if (token) {
      fetchCart();
    }
    checkLocation();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [selectedCategory, searchQuery, filters, allProducts]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      fetchSearchSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const getCurrentUser = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem('adbhog_token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      localStorage.removeItem('adbhog_token');
      setToken(null);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      const data = await response.json();
      if (data.success) {
        setAllProducts(data.products);
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
        setCategories(['All', ...data.categories.map(cat => cat.name)]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCart = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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

  const fetchSearchSuggestions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/search/suggestions?q=${searchQuery}`);
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const checkLocation = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/location/check?lat=28.6139&lng=77.2090`);
      const data = await response.json();
      if (data.success) {
        setIsServiceable(data.serviceable);
      }
    } catch (error) {
      console.error('Error checking location:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Price filter
    filtered = filtered.filter(product => 
      product.price >= filters.minPrice && product.price <= filters.maxPrice
    );

    // Brand filter
    if (filters.brand) {
      filtered = filtered.filter(product => 
        product.brand.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }

    // Subcategory filter
    if (filters.subcategory) {
      filtered = filtered.filter(product => 
        product.subcategory && product.subcategory.toLowerCase().includes(filters.subcategory.toLowerCase())
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setProducts(filtered);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'login' 
        ? { email: authData.email, password: authData.password }
        : authData;

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('adbhog_token', data.token);
        setShowAuth(false);
        setAuthData({ name: '', email: '', password: '', phone: '' });
        
        // Fetch cart after login
        setTimeout(() => {
          fetchCart();
        }, 100);
      } else {
        alert(data.detail || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed. Please try again.');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCart([]);
    setCartTotal(0);
    setCartCount(0);
    localStorage.removeItem('adbhog_token');
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!token) {
      setShowAuth(true);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          user_id: 'will_be_overridden'
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          user_id: 'will_be_overridden'
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
      const response = await fetch(`${BACKEND_URL}/api/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const handleCheckout = () => {
    if (!token) {
      setShowAuth(true);
      return;
    }
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
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
        fetchCart();
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
            <p className="text-xs text-green-600 mb-1">{product.brand}</p>
            <p className="text-sm text-gray-600 mb-2">{product.unit}</p>
            
            {product.tags && (
              <div className="flex gap-1 mb-2">
                {product.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
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
                  ADD
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-green-600">adbhog</h1>
                <Badge className="bg-green-500 text-white px-2 py-1 text-xs">GROCERY FRESH</Badge>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Delivery in</span>
                  <span className="font-bold text-green-600">15 Mins</span>
                  <Zap className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{currentLocation}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search groceries, grains, dairy..."
                  className="pl-10 w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                
                {/* Search Suggestions */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 z-50">
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => user ? null : setShowAuth(true)}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {user ? user.name : 'Login'}
              </Button>
              
              {user && (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
              
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
        
        {/* Category Tabs */}
        <div className="border-t bg-white">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-6 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors
                      ${selectedCategory === category 
                        ? 'text-green-600 border-b-2 border-green-600' 
                        : 'text-gray-600 hover:text-green-600'
                      }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Icons Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {groceryCategories.map((category, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => setSelectedCategory(category.name)}
            >
              <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center hover:scale-105 transition-transform`}>
                <span className="text-2xl">{category.icon}</span>
              </div>
              <span className="text-xs text-center mt-2 font-medium">{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Banner - Grocery Focused */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl p-8 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-2">Fresh Grocery Corner</h2>
            <p className="text-white/90 mb-6 text-lg">
              Get fresh vegetables, premium grains & daily essentials<br />
              delivered in 15 mins with Adbhog!
            </p>
            <Button className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-6 py-3">
              Shop Now
            </Button>
          </div>
          
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="grid grid-cols-3 gap-2">
              {['🥬', '🌾', '🥛', '🫒', '🥜', '🧽'].map((emoji, i) => (
                <div key={i} className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Offers - Grocery Focused */}
      <div className="container mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fresh Produce Deals */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-1">Fresh Produce</h3>
              <h4 className="text-xl text-white mb-2">DEALS</h4>
              <Badge className="bg-yellow-500 text-black font-bold">UP TO 40% OFF</Badge>
              
              <div className="grid grid-cols-4 gap-2 mt-4">
                {['Vegetables', 'Fruits', 'Herbs', 'Organic'].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-emerald-400 rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-2xl">
                        {index === 0 ? '🥬' : index === 1 ? '🍎' : index === 2 ? '🌿' : '✨'}
                      </span>
                    </div>
                    <p className="text-xs text-white">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Premium Grains */}
          <div className="bg-gradient-to-r from-amber-200 to-orange-300 rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-amber-800 mb-1">Premium Grains</h3>
              <h4 className="text-xl text-amber-800 mb-2">COLLECTION</h4>
              <Badge className="bg-amber-600 text-white font-bold">BEST QUALITY</Badge>
              
              <div className="grid grid-cols-4 gap-2 mt-4">
                {['Basmati Rice', 'Wheat Flour', 'Millets', 'Quinoa'].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-amber-300 rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-2xl">
                        {index === 0 ? '🌾' : index === 1 ? '🌽' : index === 2 ? '🌿' : '🌱'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid with Results Count */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{selectedCategory === 'All' ? 'All Products' : selectedCategory}</h2>
            <p className="text-gray-600">{products.length} products found</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{authMode === 'login' ? 'Login' : 'Sign Up'} to Adbhog</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <Input
                placeholder="Full Name"
                value={authData.name}
                onChange={(e) => setAuthData({...authData, name: e.target.value})}
                required
              />
            )}
            
            <Input
              type="email"
              placeholder="Email"
              value={authData.email}
              onChange={(e) => setAuthData({...authData, email: e.target.value})}
              required
            />
            
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={authData.password}
                onChange={(e) => setAuthData({...authData, password: e.target.value})}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {authMode === 'register' && (
              <Input
                placeholder="Phone Number"
                value={authData.phone}
                onChange={(e) => setAuthData({...authData, phone: e.target.value})}
                required
              />
            )}
            
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </Button>
            
            <p className="text-center text-sm">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="text-green-600 hover:underline"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Products</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Price Range</label>
              <Slider
                value={[filters.minPrice, filters.maxPrice]}
                onValueChange={([min, max]) => setFilters({...filters, minPrice: min, maxPrice: max})}
                max={1000}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>₹{filters.minPrice}</span>
                <span>₹{filters.maxPrice}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <Select value={filters.brand} onValueChange={(value) => setFilters({...filters, brand: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Brands</SelectItem>
                  <SelectItem value="Adbhog Fresh">Adbhog Fresh</SelectItem>
                  <SelectItem value="Adbhog Premium">Adbhog Premium</SelectItem>
                  <SelectItem value="Adbhog Organic">Adbhog Organic</SelectItem>
                  <SelectItem value="Adbhog Kitchen">Adbhog Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price_low">Price (Low to High)</SelectItem>
                  <SelectItem value="price_high">Price (High to Low)</SelectItem>
                  <SelectItem value="rating">Rating (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setFilters({subcategory: '', minPrice: 0, maxPrice: 1000, brand: '', sortBy: 'name'})}
                className="flex-1"
              >
                Clear Filters
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <SelectItem value="now">Deliver Now (15 mins)</SelectItem>
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
              Your grocery order has been confirmed and will be delivered by{' '}
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