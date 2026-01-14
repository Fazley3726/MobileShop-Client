'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Phone {
  brand: string;
  phone_name: string;
  slug: string;
  image: string;
}

interface PhoneResponse {
  status: boolean;
  data: Phone[];
}

interface CartItem {
  phone: Phone;
  quantity: number;
}

// Generate consistent price based on phone slug
const getPhonePrice = (slug: string): number => {
  if (!slug) return 50000; // Default price if slug is undefined
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash = hash & hash;
  }
  // Price between 15000 and 150000 Taka
  const price = 15000 + (Math.abs(hash % 135000));
  return price;
};

// Calculate delivery charge (5% of total, minimum 30, maximum 100)
const calculateDeliveryCharge = (total: number): number => {
  const charge = total * 0.05;
  if (charge < 30) return 30;
  if (charge > 100) return 100;
  return Math.round(charge);
};

// Generate consistent ratings based on phone slug
const getPhoneRatings = (slug: string) => {
  if (!slug) {
    return {
      overall: 6.5,
      design: 8,
      display: 6,
      performance: 3,
      camera: 5,
      connectivity: 6,
      features: 7,
      battery: 9,
      usability: 8
    };
  }
  
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash = hash & hash;
  }
  
  const ratings = {
    overall: 4.5 + (Math.abs(hash % 30) / 10), // 4.5 to 7.5
    design: 5 + (Math.abs((hash * 2) % 50) / 10), // 5 to 10
    display: 4 + (Math.abs((hash * 3) % 60) / 10), // 4 to 10
    performance: 3 + (Math.abs((hash * 5) % 70) / 10), // 3 to 10
    camera: 4 + (Math.abs((hash * 7) % 60) / 10), // 4 to 10
    connectivity: 5 + (Math.abs((hash * 11) % 50) / 10), // 5 to 10
    features: 5 + (Math.abs((hash * 13) % 50) / 10), // 5 to 10
    battery: 6 + (Math.abs((hash * 17) % 40) / 10), // 6 to 10
    usability: 6 + (Math.abs((hash * 19) % 40) / 10) // 6 to 10
  };
  
  ratings.overall = Math.round(ratings.overall * 10) / 10;
  return ratings;
};

// Generate pros and cons based on phone
const getProsAndCons = (phone: Phone) => {
  const pros = [
    "6.74-inch display with 120Hz refresh.",
    "6GB memory and 128GB storage.",
    "50MP primary and 8MP selfie camera.",
    "Bluetooth, GPS and Android 16 support.",
    "5000mAh battery with USB-type C port."
  ];
  
  const cons = [
    "LCD display panel.",
    "Unisoc T615 processor."
  ];
  
  return { pros, cons };
};

// Generate specifications based on phone
const getSpecifications = (phone: Phone, price: number) => {
  return {
    prices: {
      official: `6GB 128GB Tk. ${price.toLocaleString()}`
    },
    launch: {
      announced: "2025, January 10",
      status: "Available. Released 2025, January 10"
    },
    network: {
      technology: "GSM / HSPA / LTE / 5G",
      bands: "2G, 3G, 4G, 5G"
    },
    body: {
      dimensions: "168.3 x 76.3 x 8.2 mm",
      weight: "199 g",
      build: "Glass front, plastic back, plastic frame"
    },
    display: {
      type: "LCD, 120Hz",
      size: "6.74 inches",
      resolution: "1080 x 2400 pixels"
    },
    platform: {
      os: "Android 16",
      chipset: "Unisoc T615",
      cpu: "Octa-core",
      gpu: "Mali-G57"
    },
    memory: {
      cardSlot: "microSDXC",
      internal: "128GB 6GB RAM"
    },
    mainCamera: {
      modules: "50 MP, f/1.8, (wide), PDAF",
      features: "LED flash, HDR, panorama",
      video: "1080p@30fps"
    },
    selfieCamera: {
      modules: "8 MP, f/2.0",
      video: "1080p@30fps"
    },
    sound: {
      loudspeaker: "Yes",
      jack: "3.5mm jack"
    },
    comms: {
      wlan: "Wi-Fi 802.11 a/b/g/n/ac",
      bluetooth: "5.0, A2DP, LE",
      positioning: "GPS, GLONASS, BDS",
      nfc: "No",
      radio: "FM radio",
      usb: "USB Type-C 2.0"
    },
    features: {
      sensors: "Fingerprint (side-mounted), accelerometer, gyro, proximity, compass"
    },
    battery: {
      type: "Li-Po 5000 mAh, non-removable",
      charging: "18W wired"
    }
  };
};

export default function PhoneDetails() {
  const params = useParams();
  const router = useRouter();
  const phoneSlug = params.id as string;
  const [phone, setPhone] = useState<Phone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: quantity selection, 2: confirmation
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState('Midnight Ocean');
  const [selectedStorage, setSelectedStorage] = useState('12/256GB');
  const [selectedRegion, setSelectedRegion] = useState('BD-Official');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchPhoneDetails = async () => {
      if (!phoneSlug) {
        setError('Phone slug is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      // First, try to get phone from sessionStorage (if navigated from main page)
      if (typeof window !== 'undefined') {
        try {
          const storedPhone = sessionStorage.getItem('selectedPhone');
          if (storedPhone) {
            const parsedPhone: Phone = JSON.parse(storedPhone);
            if (parsedPhone.slug === phoneSlug) {
              setPhone(parsedPhone);
              setLoading(false);
              // Clear sessionStorage after using it
              sessionStorage.removeItem('selectedPhone');
              return;
            }
          }
        } catch (err) {
          console.error('Error reading from sessionStorage:', err);
        }
      }
      
      try {
        // Strategy 1: Try searching by slug first (most direct)
        let response = await fetch(`https://openapi.programming-hero.com/api/phones?search=${encodeURIComponent(phoneSlug)}`);
        
        if (response.ok) {
          const data: PhoneResponse = await response.json();
          
          if (data.status && data.data && data.data.length > 0) {
            // Find the phone with matching slug
            const foundPhone = data.data.find(p => p.slug === phoneSlug);
            if (foundPhone) {
              setPhone(foundPhone);
              setLoading(false);
              return;
            }
            // If exact match not found, use first result as fallback
            setPhone(data.data[0]);
            setLoading(false);
            return;
          }
        }

        // Strategy 2: Try fetching all phones (if API supports it)
        response = await fetch(`https://openapi.programming-hero.com/api/phones`);
        
        if (response.ok) {
          const data: PhoneResponse = await response.json();
          
          if (data.status && data.data && data.data.length > 0) {
            const foundPhone = data.data.find(p => p.slug === phoneSlug);
            if (foundPhone) {
              setPhone(foundPhone);
              setLoading(false);
              return;
            }
          }
        }

        // Strategy 3: Try searching by phone name (extract from slug)
        // Convert slug like "iphone-15-pro" to "iphone 15 pro"
        const phoneNameFromSlug = phoneSlug.replace(/-/g, ' ');
        response = await fetch(`https://openapi.programming-hero.com/api/phones?search=${encodeURIComponent(phoneNameFromSlug)}`);
        
        if (response.ok) {
          const data: PhoneResponse = await response.json();
          
          if (data.status && data.data && data.data.length > 0) {
            const foundPhone = data.data.find(p => p.slug === phoneSlug);
            if (foundPhone) {
              setPhone(foundPhone);
              setLoading(false);
              return;
            }
            // Use first result if no exact match
            setPhone(data.data[0]);
            setLoading(false);
            return;
          }
        }

        // Strategy 4: Try searching by individual words from slug
        const slugWords = phoneSlug.split('-');
        for (const word of slugWords) {
          if (word.length > 2) { // Skip very short words
            response = await fetch(`https://openapi.programming-hero.com/api/phones?search=${encodeURIComponent(word)}`);
            if (response.ok) {
              const data: PhoneResponse = await response.json();
              if (data.status && data.data && data.data.length > 0) {
                const foundPhone = data.data.find(p => p.slug === phoneSlug);
                if (foundPhone) {
                  setPhone(foundPhone);
                  setLoading(false);
                  return;
                }
              }
            }
          }
        }

        // Strategy 5: Try common brand searches
        const brands = ['iphone', 'samsung', 'xiaomi', 'oneplus', 'oppo', 'vivo', 'realme', 'huawei'];
        for (const brand of brands) {
          if (phoneSlug.toLowerCase().includes(brand)) {
            response = await fetch(`https://openapi.programming-hero.com/api/phones?search=${encodeURIComponent(brand)}`);
            if (response.ok) {
              const data: PhoneResponse = await response.json();
              if (data.status && data.data && data.data.length > 0) {
                const foundPhone = data.data.find(p => p.slug === phoneSlug);
                if (foundPhone) {
                  setPhone(foundPhone);
                  setLoading(false);
                  return;
                }
              }
            }
            break;
          }
        }

        // If all strategies fail
        setError('Phone not found');
      } catch (err) {
        console.error('Error fetching phone details:', err);
        setError('Failed to load phone details. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    };

    if (phoneSlug) {
      fetchPhoneDetails();
    }
  }, [phoneSlug]);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (err) {
        console.error('Error loading cart:', err);
      }
    };
    
    loadCart();
    const interval = setInterval(loadCart, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Cart functions
  const addToCart = (phone: Phone, qty: number) => {
    if (typeof window === 'undefined') return;
    
    const savedCart = localStorage.getItem('cart');
    const currentCart = savedCart ? JSON.parse(savedCart) : [];
    const existingItem = currentCart.find((item: CartItem) => item.phone.slug === phone.slug);
    
    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      currentCart.push({ phone, quantity: qty });
    }
    
    localStorage.setItem('cart', JSON.stringify(currentCart));
    setCart(currentCart);
    setShowCart(true);
  };

  const removeFromCart = (slug: string) => {
    if (typeof window === 'undefined') return;
    
    const savedCart = localStorage.getItem('cart');
    const currentCart = savedCart ? JSON.parse(savedCart) : [];
    const updatedCart = currentCart.filter((item: CartItem) => item.phone.slug !== slug);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const updateCartQuantity = (slug: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(slug);
      return;
    }
    if (typeof window === 'undefined') return;
    
    const savedCart = localStorage.getItem('cart');
    const currentCart = savedCart ? JSON.parse(savedCart) : [];
    const updatedCart = currentCart.map((item: CartItem) =>
      item.phone.slug === slug ? { ...item, quantity: newQuantity } : item
    );
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  const getTotalCartItems = (): number => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, item) => total + (getPhonePrice(item.phone.slug) * item.quantity), 0);
  };

  const calculateDeliveryChargeForCart = (total: number): number => {
    return calculateDeliveryCharge(total);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1570ef] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading phone details...</p>
        </div>
      </div>
    );
  }

  if (error || !phone) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">{error || 'Phone not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#1570ef] text-white rounded-2xl hover:bg-[#0d5bd8] transition-all font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const price = getPhonePrice(phone.slug);
  const subtotal = price * quantity;
  const deliveryCharge = calculateDeliveryCharge(subtotal);
  const grandTotal = subtotal + deliveryCharge;

  const handleOrderNow = () => {
    setModalStep(1);
    setShowSuccessModal(true);
  };

  const handleConfirmOrder = () => {
    setModalStep(2);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Apple Style */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            
            {/* Cart Button - Apple Style */}
            <div className="relative">
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {getTotalCartItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-50">
                    {getTotalCartItems()}
                  </span>
                )}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>

              {/* Cart Dropdown - Apple Style */}
              {showCart && (
                <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[500px] overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-lg">Cart ({getTotalCartItems()})</h3>
                      {cart.length > 0 && (
                        <span className="text-sm font-medium text-gray-600">Tk. {getCartTotal().toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {cart.length === 0 ? (
                      <div className="p-12 text-center text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500 font-light">Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="p-3">
                        {cart.map((item) => (
                          <div key={item.phone.slug} className="flex items-center gap-3 p-3 rounded-xl mb-2 hover:bg-gray-50 transition-colors">
                            <img
                              src={item.phone.image || 'https://via.placeholder.com/60x60'}
                              alt={item.phone.phone_name}
                              className="w-14 h-14 rounded-xl object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{item.phone.phone_name}</h4>
                              <p className="text-xs text-gray-500">{item.phone.brand}</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                Tk. {(getPhonePrice(item.phone.slug) * item.quantity).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {/* Quantity Controls - Apple Style */}
                              <div className="flex items-center gap-1 bg-gray-100 rounded-xl">
                                <button
                                  onClick={() => updateCartQuantity(item.phone.slug, item.quantity - 1)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-l-xl transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.phone.slug, item.quantity + 1)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-r-xl transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                              {/* Remove Button */}
                              <button
                                onClick={() => removeFromCart(item.phone.slug)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Cart Footer - Apple Style */}
                  {cart.length > 0 && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-medium text-gray-900">Tk. {getCartTotal().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Delivery:</span>
                        <span className="font-medium text-gray-900">Tk. {calculateDeliveryChargeForCart(getCartTotal()).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4 border-t border-gray-200 pt-3">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="text-lg font-semibold text-gray-900">Tk. {(getCartTotal() + calculateDeliveryChargeForCart(getCartTotal())).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCart(false);
                          setShowCartSuccessModal(true);
                        }}
                        className="w-full py-3 bg-[#1570ef] text-white rounded-2xl font-medium text-base hover:bg-[#0d5bd8] transition-all duration-200 active:scale-95"
                      >
                        Checkout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Images */}
          <div>
            {/* Main Product Image */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-4 flex items-center justify-center min-h-[500px]">
              <img
                src={[phone.image, phone.image, phone.image][selectedImageIndex] || phone.image || 'https://via.placeholder.com/500x500'}
                alt={phone.phone_name}
                className="w-full max-w-md h-auto object-contain transition-opacity duration-300"
              />
            </div>
            
            {/* Thumbnail Images */}
            <div className="flex gap-3">
              {[phone.image, phone.image, phone.image].map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-1 bg-white rounded-xl border-2 overflow-hidden transition-all ${
                    selectedImageIndex === index 
                      ? 'border-[#1570ef] shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-square p-4 flex items-center justify-center">
                    <img
                      src={img || 'https://via.placeholder.com/150x150'}
                      alt={`${phone.phone_name} view ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Product Information */}
          <div>
            {/* Brand Logo */}
            <div className="mb-3">
              <span className="text-sm font-semibold text-[#1570ef] uppercase tracking-wider">{phone.brand}</span>
            </div>
            
            {/* Product Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {phone.phone_name}
            </h1>
            
            {/* Price and Availability */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">৳{price.toLocaleString()}</span>
                <span className="text-sm text-gray-600">(Cash Price)</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">Availability: In Stock</span>
                <span className="text-gray-500">Code: {phone.slug}</span>
              </div>
            </div>


            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">Color:</label>
              <div className="flex gap-3">
                {['Arctic Dawn', 'Black Eclipse', 'Midnight Ocean'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedColor === color
                        ? 'border-[#1570ef] bg-[#1570ef]/10'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-sm font-medium ${selectedColor === color ? 'text-[#1570ef]' : 'text-gray-900'}`}>{color}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">Storage:</label>
              <div className="flex gap-3">
                {['12/256GB', '12/512GB', '16/512GB'].map((storage) => (
                  <button
                    key={storage}
                    onClick={() => setSelectedStorage(storage)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedStorage === storage
                        ? 'border-[#1570ef] bg-[#1570ef]/10'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-sm font-medium ${selectedStorage === storage ? 'text-[#1570ef]' : 'text-gray-900'}`}>{storage}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Region Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">Region:</label>
              <div className="flex gap-3">
                {['BD-Official', 'IND'].map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedRegion === region
                        ? 'border-[#1570ef] bg-[#1570ef]/10'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-sm font-medium ${selectedRegion === region ? 'text-[#1570ef]' : 'text-gray-900'}`}>{region}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">Select Quantity:</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-[#1570ef]/10 hover:border-[#1570ef] border-2 border-transparent rounded-xl transition-colors font-bold text-gray-700 hover:text-[#1570ef]"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-10 text-center border-2 border-gray-200 rounded-xl font-semibold text-gray-900 focus:outline-none focus:border-[#1570ef]"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-[#1570ef]/10 hover:border-[#1570ef] border-2 border-transparent rounded-xl transition-colors font-bold text-gray-700 hover:text-[#1570ef]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleOrderNow}
                className="flex-1 px-6 py-4 bg-[#1570ef] text-white rounded-2xl font-semibold text-base hover:bg-[#0d5bd8] transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                Shop Now
              </button>
              <button
                onClick={() => addToCart(phone, quantity)}
                className="flex-1 px-6 py-4 bg-white border-2 border-[#1570ef] text-[#1570ef] rounded-2xl font-semibold text-base hover:bg-[#1570ef]/5 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add To Cart
              </button>
            </div>

            {/* EMI Option */}
            <div className="mb-4">
              <button className="w-full px-4 py-3 bg-[#1570ef]/5 border border-[#1570ef]/20 rounded-xl flex items-center justify-center gap-2 text-[#1570ef] font-medium hover:bg-[#1570ef]/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                EMI Available View Plans
              </button>
            </div>

            {/* WhatsApp Button */}
            <div className="mb-6">
              <button className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2 text-green-700 font-medium hover:bg-green-100 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Whatsapp
              </button>
            </div>

            {/* Delivery Timescale */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Delivery Timescale: 3-5 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating, Pros & Cons, and Specifications Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {phone && (() => {
          const ratings = getPhoneRatings(phone.slug);
          const { pros, cons } = getProsAndCons(phone);
          const specs = getSpecifications(phone, price);
          
          return (
            <div className="space-y-8">
              {/* OUR RATING Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">OUR RATING</h2>
                <p className="text-xs text-gray-500 mb-4">The overall rating is based on review by our experts</p>
                
                {/* Overall Score */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-3xl font-bold text-gray-900">{ratings.overall}</div>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${(ratings.overall / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Category Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Design', score: ratings.design, color: 'bg-blue-500' },
                    { name: 'Display', score: ratings.display, color: 'bg-orange-500' },
                    { name: 'Performance', score: ratings.performance, color: 'bg-red-500' },
                    { name: 'Camera', score: ratings.camera, color: 'bg-orange-500' },
                    { name: 'Connectivity', score: ratings.connectivity, color: 'bg-orange-500' },
                    { name: 'Features', score: ratings.features, color: 'bg-orange-500' },
                    { name: 'Battery', score: ratings.battery, color: 'bg-blue-500' },
                    { name: 'Usability', score: ratings.usability, color: 'bg-blue-500' }
                  ].map((category) => (
                    <div key={category.name} className="border border-gray-200 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-900 mb-1">{category.name}</div>
                      <div className="text-sm font-bold text-gray-900 mb-1.5">{category.score}/10</div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${category.color} rounded-full transition-all`}
                          style={{ width: `${(category.score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro and cons Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pro and cons</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Pros */}
                  <div>
                    <div className="bg-green-600 text-white px-3 py-1.5 rounded-t-lg text-sm font-semibold mb-0">
                      Pros
                    </div>
                    <div className="border border-gray-200 border-t-0 rounded-b-lg p-3 space-y-2">
                      {pros.map((pro, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">{pro}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Cons */}
                  <div>
                    <div className="bg-red-600 text-white px-3 py-1.5 rounded-t-lg text-sm font-semibold mb-0">
                      Cons
                    </div>
                    <div className="border border-gray-200 border-t-0 rounded-b-lg p-3 space-y-2">
                      {cons.map((con, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-sm text-gray-700">{con}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Specifications Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Prices */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Prices</h3>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Official</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{specs.prices.official}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Launch */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Launch</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Announced</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{specs.launch.announced}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Status</span>
                        <span className="text-sm font-medium text-gray-900">{specs.launch.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Network */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Network</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Technology</span>
                        <span className="text-sm font-medium text-gray-900">{specs.network.technology}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Bands</span>
                        <span className="text-sm font-medium text-gray-900">{specs.network.bands}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Body</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Dimensions</span>
                        <span className="text-sm font-medium text-gray-900">{specs.body.dimensions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Weight</span>
                        <span className="text-sm font-medium text-gray-900">{specs.body.weight}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Build</span>
                        <span className="text-sm font-medium text-gray-900">{specs.body.build}</span>
                      </div>
                    </div>
                  </div>

                  {/* Display */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Display</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Type</span>
                        <span className="text-sm font-medium text-gray-900">{specs.display.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Size</span>
                        <span className="text-sm font-medium text-gray-900">{specs.display.size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Resolution</span>
                        <span className="text-sm font-medium text-gray-900">{specs.display.resolution}</span>
                      </div>
                    </div>
                  </div>

                  {/* Platform */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Platform</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">OS</span>
                        <span className="text-sm font-medium text-gray-900">{specs.platform.os}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Chipset</span>
                        <span className="text-sm font-medium text-gray-900">{specs.platform.chipset}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">CPU</span>
                        <span className="text-sm font-medium text-gray-900">{specs.platform.cpu}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">GPU</span>
                        <span className="text-sm font-medium text-gray-900">{specs.platform.gpu}</span>
                      </div>
                    </div>
                  </div>

                  {/* Memory */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Memory</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Card Slot</span>
                        <span className="text-sm font-medium text-gray-900">{specs.memory.cardSlot}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Internal</span>
                        <span className="text-sm font-medium text-gray-900">{specs.memory.internal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Camera */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Main Camera</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Modules</span>
                        <span className="text-sm font-medium text-gray-900">{specs.mainCamera.modules}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Features</span>
                        <span className="text-sm font-medium text-gray-900">{specs.mainCamera.features}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Video</span>
                        <span className="text-sm font-medium text-gray-900">{specs.mainCamera.video}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selfie Camera */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Selfie Camera</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Modules</span>
                        <span className="text-sm font-medium text-gray-900">{specs.selfieCamera.modules}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Video</span>
                        <span className="text-sm font-medium text-gray-900">{specs.selfieCamera.video}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sound */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Sound</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Loudspeaker</span>
                        <span className="text-sm font-medium text-gray-900">{specs.sound.loudspeaker}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Jack</span>
                        <span className="text-sm font-medium text-gray-900">{specs.sound.jack}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comms */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Comms</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">WLAN</span>
                        <span className="text-sm font-medium text-gray-900">{specs.comms.wlan}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Bluetooth</span>
                        <span className="text-sm font-medium text-gray-900">{specs.comms.bluetooth}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Positioning</span>
                        <span className="text-sm font-medium text-gray-900">{specs.comms.positioning}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">NFC</span>
                        <span className="text-sm font-medium text-gray-900">{specs.comms.nfc}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Radio</span>
                        <span className="text-sm font-medium text-gray-900">{specs.comms.radio}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">USB</span>
                        <span className="text-sm font-medium text-gray-900">{specs.comms.usb}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Features</h3>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Sensors</span>
                        <span className="text-sm font-medium text-gray-900">{specs.features.sensors}</span>
                      </div>
                    </div>
                  </div>

                  {/* Battery */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Battery</h3>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Type</span>
                        <span className="text-sm font-medium text-gray-900">{specs.battery.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Charging</span>
                        <span className="text-sm font-medium text-gray-900">{specs.battery.charging}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Order Modal - Apple Style */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowSuccessModal(false);
            setModalStep(1);
          }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {modalStep === 1 ? (
              /* Step 1: Quantity Selection */
              <>
                <h2 className="text-3xl font-semibold text-gray-900 text-center mb-8">Select Quantity</h2>
                
                {/* Phone Info - Apple Style */}
                <div className="flex items-center gap-4 mb-8 p-5 bg-gray-50 rounded-2xl">
                  <img
                    src={phone.image || 'https://via.placeholder.com/100x100'}
                    alt={phone.phone_name}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium mb-1">{phone.brand}</p>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{phone.phone_name}</h3>
                    <p className="text-xl font-semibold text-gray-900">Tk. {price.toLocaleString()}</p>
                  </div>
                </div>

                {/* Quantity Selector - Apple Style */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-4 text-center">Quantity</label>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-14 h-14 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors font-semibold text-gray-700 text-2xl active:scale-95"
                    >
                      −
                    </button>
                    <div className="w-24 text-center">
                      <span className="text-4xl font-semibold text-gray-900">{quantity}</span>
                    </div>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-14 h-14 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors font-semibold text-gray-700 text-2xl active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Breakdown - Apple Style */}
                <div className="mb-8 p-5 bg-gray-50 rounded-2xl space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">Tk. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="font-medium text-gray-900">Tk. {deliveryCharge.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3 mt-3">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">Tk. {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons - Apple Style */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmOrder}
                    className="w-full py-4 bg-[#1570ef] text-white rounded-2xl font-medium text-base hover:bg-[#0d5bd8] transition-all duration-200 active:scale-95"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      setModalStep(1);
                    }}
                    className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-medium text-base hover:bg-gray-200 transition-all duration-200 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Order Confirmation - Apple Style */
              <>
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Success Message */}
                <h2 className="text-3xl font-semibold text-gray-900 text-center mb-3">Order Successful!</h2>
                <p className="text-gray-600 text-center mb-8 text-lg">Your order has been placed successfully.</p>

                {/* Order Summary - Apple Style */}
                <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={phone.image || 'https://via.placeholder.com/80x80'}
                      alt={phone.phone_name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">{phone.brand}</p>
                      <h3 className="font-semibold text-gray-900">{phone.phone_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Quantity: {quantity}</p>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">Tk. {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-medium text-gray-900">Tk. {deliveryCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3 mt-3">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">Tk. {grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Close Button - Apple Style */}
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setModalStep(1);
                  }}
                  className="w-full py-4 bg-[#1570ef] text-white rounded-2xl font-medium text-base hover:bg-[#0d5bd8] transition-all duration-200 active:scale-95"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cart Checkout Success Modal - Apple Style */}
      {showCartSuccessModal && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCartSuccessModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 transform transition-all max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon - Apple Style */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Message - Apple Style */}
            <h2 className="text-3xl font-semibold text-gray-900 text-center mb-3">Order Successful!</h2>
            <p className="text-gray-600 text-center mb-8 text-lg">Your order has been placed successfully.</p>

            {/* Order Details - Apple Style */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Order Items ({getTotalCartItems()})</h3>
              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.phone.slug} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                    <img
                      src={item.phone.image || 'https://via.placeholder.com/60x60'}
                      alt={item.phone.phone_name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.phone.phone_name}</h4>
                      <p className="text-xs text-gray-500">{item.phone.brand}</p>
                      <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        Tk. {(getPhonePrice(item.phone.slug) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown - Apple Style */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Subtotal ({getTotalCartItems()} {getTotalCartItems() === 1 ? 'item' : 'items'}):</span>
                  <span className="font-medium text-gray-900">Tk. {getCartTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-medium text-gray-900">Tk. {calculateDeliveryChargeForCart(getCartTotal()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3 mt-3">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">Tk. {(getCartTotal() + calculateDeliveryChargeForCart(getCartTotal())).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Close Button - Apple Style */}
            <button
              onClick={() => {
                setShowCartSuccessModal(false);
                setCart([]);
                if (typeof window !== 'undefined') {
                  try {
                    localStorage.setItem('cart', JSON.stringify([]));
                  } catch (err) {
                    console.error('Error clearing cart:', err);
                  }
                }
              }}
              className="w-full py-4 bg-[#1570ef] text-white rounded-2xl font-medium text-base hover:bg-[#0d5bd8] transition-all duration-200 active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
