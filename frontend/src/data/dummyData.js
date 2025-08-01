export const categories = [
  {
    id: 'fruits-vegetables',
    name: 'Fruits & Vegetables',
    description: 'Fresh, organic fruits and vegetables',
    subcategories: ['Fresh Fruits', 'Leafy Vegetables', 'Root Vegetables', 'Exotic Fruits']
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    description: 'Fresh dairy products and farm eggs',
    subcategories: ['Milk & Cream', 'Cheese & Paneer', 'Yogurt & Lassi', 'Eggs']
  },
  {
    id: 'grains-cereals',
    name: 'Grains & Cereals',
    description: 'Premium quality grains and cereals',
    subcategories: ['Rice & Rice Products', 'Wheat & Flour', 'Millets & Quinoa', 'Breakfast Cereals']
  },
  {
    id: 'cooking-essentials',
    name: 'Cooking Essentials',
    description: 'Daily cooking needs and spices',
    subcategories: ['Oils & Ghee', 'Spices & Seasonings', 'Salt & Sugar', 'Condiments & Sauces']
  },
  {
    id: 'snacks-beverages',
    name: 'Snacks & Beverages',
    description: 'Healthy snacks and refreshing beverages',
    subcategories: ['Healthy Snacks', 'Traditional Sweets', 'Tea & Coffee', 'Fresh Juices']
  },
  {
    id: 'household-care',
    name: 'Household Care',
    description: 'Daily household cleaning essentials',
    subcategories: ['Cleaning Supplies', 'Laundry Care', 'Personal Hygiene', 'Kitchen Essentials']
  }
];

export const products = [
  {
    id: 'b7793f19-8eab-41c6-9639-9ae50154e1d4',
    name: 'Fresh Organic Tomatoes',
    category: 'Fruits & Vegetables',
    subcategory: 'Fresh Vegetables',
    price: 45.0,
    original_price: 55.0,
    image: 'https://images.unsplash.com/photo-1568581789190-ae90a7da930b',
    description: 'Fresh, juicy organic tomatoes perfect for cooking and salads',
    unit: '500g',
    available: true,
    rating: 4.6,
    delivery_time: '15-30 mins',
    brand: 'Adbhog Fresh',
    tags: ['organic', 'fresh', 'local', 'pesticide-free'],
    nutritional_info: { calories: '18 per 100g', vitamin_c: 'High', fiber: '1.2g' }
  },
  {
    id: 'a3035109-1aaa-4aa8-b252-e1f43fc8b85a',
    name: 'Premium Basmati Rice',
    category: 'Grains & Cereals',
    subcategory: 'Rice & Rice Products',
    price: 185.0,
    original_price: 220.0,
    image: 'https://images.pexels.com/photos/33210855/pexels-photo-33210855.jpeg',
    description: 'Aged premium basmati rice with long grains and aromatic fragrance',
    unit: '1 kg',
    available: true,
    rating: 4.8,
    delivery_time: '15-30 mins',
    brand: 'Adbhog Premium',
    tags: ['basmati', 'aged', 'aromatic', 'premium'],
    nutritional_info: { calories: '345 per 100g', carbs: '78g', protein: '7g' }
  },
  {
    id: 'aa5e2a19-955c-4ec4-a56f-7ba1cba18a40',
    name: 'Fresh Full Cream Milk',
    category: 'Dairy & Eggs',
    subcategory: 'Milk & Cream',
    price: 65.0,
    image: 'https://images.unsplash.com/photo-1652738515643-4e95b0e4f0e8',
    description: 'Pure, fresh full cream milk from local dairy farms',
    unit: '1 liter',
    available: true,
    rating: 4.7,
    delivery_time: '15-30 mins',
    brand: 'Adbhog Dairy',
    tags: ['fresh', 'full-cream', 'pasteurized', 'farm-fresh'],
    nutritional_info: { calories: '60 per 100ml', protein: '3.2g', calcium: 'High' }
  },
  {
    id: 'ecd1e6fc-5b66-4dc1-adb6-909d9aa0e78b',
    name: 'Mixed Seasonal Fruits',
    category: 'Fruits & Vegetables',
    subcategory: 'Fresh Fruits',
    price: 299.0,
    original_price: 350.0,
    image: 'https://images.unsplash.com/photo-1705727209465-b292e4129a37',
    description: 'Fresh seasonal fruits basket - apples, pears, bananas and more',
    unit: '1 basket (1.5kg)',
    available: true,
    rating: 4.9,
    delivery_time: '15-30 mins',
    brand: 'Adbhog Fresh',
    tags: ['seasonal', 'mixed', 'fresh', 'vitamin-rich'],
    nutritional_info: { calories: 'Varies', vitamins: 'A, C, K', antioxidants: 'High' }
  },
  {
    id: 'ed833cf4-9f6f-43e1-b621-a180f3c2b6c2',
    name: 'Cold Pressed Mustard Oil',
    category: 'Cooking Essentials',
    subcategory: 'Oils & Ghee',
    price: 155.0,
    original_price: 175.0,
    image: 'https://images.unsplash.com/photo-1607103058066-0cc3e67f97be',
    description: 'Pure cold pressed mustard oil, perfect for cooking and health',
    unit: '500ml',
    available: true,
    rating: 4.5,
    delivery_time: '15-30 mins',
    brand: 'Adbhog Pure',
    tags: ['cold-pressed', 'pure', 'traditional', 'healthy'],
    nutritional_info: { calories: '884 per 100ml', omega_3: 'Present', vitamin_e: 'High' }
  },
  {
    id: '2d1b962a-acc4-47a9-97ef-7e9ab9d9617e',
    name: 'Organic Mixed Vegetables',
    category: 'Fruits & Vegetables',
    subcategory: 'Fresh Vegetables',
    price: 180.0,
    original_price: 220.0,
    image: 'https://images.pexels.com/photos/33171850/pexels-photo-33171850.jpeg',
    description: 'Fresh organic mixed vegetables including corn, peppers, and greens',
    unit: '1 pack (1kg)',
    available: true,
    rating: 4.7,
    delivery_time: '15-30 mins',
    brand: 'Adbhog Organic',
    tags: ['organic', 'mixed', 'fresh', 'pesticide-free'],
    nutritional_info: { calories: 'Varies', fiber: 'High', vitamins: 'Multiple' }
  },
  {
    id: '9152b537-5107-40b2-ac23-1a588ae96d60',
    name: 'Traditional Homemade Snacks',
    category: 'Snacks & Beverages',
    subcategory: 'Healthy Snacks',
    price: 135.0,
    image: 'https://images.unsplash.com/photo-1568581789190-ae90a7da930b',
    description: 'Healthy homemade snack mix with nuts, seeds, and dried fruits',
    unit: '250g',
    available: true,
    rating: 4.4,
    delivery_time: '15-30 mins',
    brand: 'Adbhog Kitchen',
    tags: ['homemade', 'healthy', 'traditional', 'no-preservatives'],
    nutritional_info: { calories: '510 per 100g', protein: '15g', healthy_fats: 'High' }
  },
  {
    id: '8ec1a6fd-ced1-4b35-a0c6-95a34143b0a1',
    name: 'Organic Whole Wheat Flour',
    category: 'Grains & Cereals',
    subcategory: 'Wheat & Flour',
    price: 95.0,
    original_price: 110.0,
    image: 'https://images.pexels.com/photos/33210855/pexels-photo-33210855.jpeg',
    description: 'Stone ground organic whole wheat flour for healthy rotis',
    unit: '1 kg',
    available: true,
    rating: 4.8,
    delivery_time: '15-30 mins',
    brand: 'Adbhog Mills',
    tags: ['organic', 'stone-ground', 'whole-wheat', 'fiber-rich'],
    nutritional_info: { calories: '340 per 100g', fiber: '12g', protein: '13g' }
  }
];
