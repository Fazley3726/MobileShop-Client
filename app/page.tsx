'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// TypeScript declarations for model-viewer web component
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          'auto-rotate'?: boolean | string;
          'auto-rotate-delay'?: string;
          'rotation-per-second'?: string;
          'camera-controls'?: string | boolean;
          'interaction-policy'?: string;
          'disable-zoom'?: boolean;
          'disable-pan'?: boolean;
          'disable-tap'?: boolean;
          ar?: string | boolean;
          'shadow-intensity'?: string;
          exposure?: string;
          'environment-image'?: string;
          'camera-orbit'?: string;
          'field-of-view'?: string;
          'min-camera-orbit'?: string;
          'max-camera-orbit'?: string;
        },
        HTMLElement
      >;
    }
  }
}

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
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash = hash & hash;
  }
  // Price between 15000 and 150000 Taka
  const price = 15000 + (Math.abs(hash % 135000));
  return price;
};

// Generate promotions based on phone slug
const getPromotions = (slug: string): string[] => {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash = hash & hash;
  }
  const promotions: string[] = ['Free Delivery'];
  if (Math.abs(hash % 3) === 0) {
    promotions.unshift('20% off Tk. 5000');
  } else if (Math.abs(hash % 3) === 1) {
    promotions.unshift('15% off Tk. 3000');
  }
  return promotions;
};

export default function Home() {
  const router = useRouter();
  const [phones, setPhones] = useState<Phone[]>([]);
  const [allPhones, setAllPhones] = useState<Phone[]>([]);
  const [displayedPhones, setDisplayedPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(12);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [modalStep, setModalStep] = useState(1); // 1: quantity selection, 2: confirmation
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [heroCarouselIndex, setHeroCarouselIndex] = useState(0);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [phoneRotation, setPhoneRotation] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(true);

  // Load cart from localStorage on mount and sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
        }
      } catch (err) {
        console.error('Error loading cart:', err);
      }
    };
    
    loadCart();
    // Sync cart when localStorage changes (from other tabs/pages)
    window.addEventListener('storage', loadCart);
    // Also check periodically for changes
    const interval = setInterval(loadCart, 500);
    
    return () => {
      window.removeEventListener('storage', loadCart);
      clearInterval(interval);
    };
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  }, [cart]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (err) {
      console.error('Error saving favorites:', err);
    }
  }, [favorites]);

  useEffect(() => {
    const fetchPhones = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const apiUrl = 'https://openapi.programming-hero.com/api/phones';
        // Fetch iPhones by default
        const response = await fetch(`${apiUrl}?search=iphone`);
        
        if (response.ok) {
          const data: PhoneResponse = await response.json();
          if (data.status && data.data && data.data.length > 0) {
            const phonesToDisplay = data.data.slice(0, 12);
            setPhones(data.data);
            setAllPhones(data.data);
            setDisplayCount(12);
            setDisplayedPhones(phonesToDisplay);
            
            // Set initial brands from iPhone data
            const initialBrands = new Set<string>();
            data.data.forEach(phone => {
              if (phone.brand && phone.brand.trim()) {
                initialBrands.add(phone.brand);
              }
            });
            setAvailableBrands(Array.from(initialBrands).sort());
            
            setLoading(false);
            console.log('Phones loaded:', phonesToDisplay.length, 'phones displayed');
            
            // Fetch additional brands to populate filter dropdown
            fetchAdditionalBrands(data.data);
          } else {
            setPhones([]);
            setAllPhones([]);
            setDisplayedPhones([]);
            setLoading(false);
            console.log('No phones found');
          }
        } else {
          throw new Error('Failed to fetch phones');
        }
      } catch (err) {
        console.error('Error fetching phones:', err);
        setError('Failed to load phones. Please check your internet connection.');
        setLoading(false);
      }
    };

    const fetchAdditionalBrands = async (initialPhones: Phone[]) => {
      try {
        const apiUrl = 'https://openapi.programming-hero.com/api/phones';
        // Fetch popular brands: Samsung, Xiaomi, OnePlus, Oppo, Vivo
        const brandSearches = ['samsung', 'xiaomi', 'oneplus', 'oppo', 'vivo', 'realme', 'huawei'];
        const brandsSet = new Set<string>();
        
        // Add brands from initial phones (iPhones)
        initialPhones.forEach(phone => {
          if (phone.brand && phone.brand.trim()) {
            brandsSet.add(phone.brand);
          }
        });
        
        // Fetch phones for each brand and collect brands
        for (const brand of brandSearches) {
          try {
            const response = await fetch(`${apiUrl}?search=${encodeURIComponent(brand)}`);
            if (response.ok) {
              const data: PhoneResponse = await response.json();
              if (data.status && data.data && data.data.length > 0) {
                // Collect brands from fetched phones
                data.data.forEach(phone => {
                  if (phone.brand && phone.brand.trim()) {
                    brandsSet.add(phone.brand);
                  }
                });
                
                // Add unique phones to allPhones
                setAllPhones(prev => {
                  const existingSlugs = new Set(prev.map(p => p.slug));
                  const newPhones = data.data.filter(p => !existingSlugs.has(p.slug));
                  return [...prev, ...newPhones];
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching ${brand}:`, err);
          }
        }
        
        // Update available brands
        const brandsArray = Array.from(brandsSet).sort();
        const popularBrands = ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Oppo', 'Vivo', 'Realme', 'Huawei'];
        const sortedBrands: string[] = [];
        const otherBrands: string[] = [];
        
        brandsArray.forEach(brand => {
          const brandLower = brand.toLowerCase();
          if (popularBrands.some(pb => pb.toLowerCase() === brandLower)) {
            sortedBrands.push(brand);
          } else {
            otherBrands.push(brand);
          }
        });
        
        sortedBrands.sort((a, b) => {
          const aIndex = popularBrands.findIndex(pb => pb.toLowerCase() === a.toLowerCase());
          const bIndex = popularBrands.findIndex(pb => pb.toLowerCase() === b.toLowerCase());
          return aIndex - bIndex;
        });
        
        setAvailableBrands([...sortedBrands, ...otherBrands]);
      } catch (err) {
        console.error('Error fetching additional brands:', err);
      }
    };

    fetchPhones();
  }, []);

  // Search phones from API
  useEffect(() => {
    const searchPhones = async () => {
      if (searchText.trim() === '') {
        // If search is empty and we have allPhones (iPhones from initial load), show them
        if (!loadingMore && allPhones.length > 0) {
          // Check if we're actually coming back from a search by comparing phone slugs
          if (phones.length > 0) {
            const phonesSlugs = new Set(phones.map(p => p.slug));
            const allPhonesSlugs = new Set(allPhones.map(p => p.slug));
            const isDifferent = phonesSlugs.size !== allPhonesSlugs.size || 
              !Array.from(phonesSlugs).every(slug => allPhonesSlugs.has(slug));
            
            if (isDifferent) {
              // We're coming back from search, reset to allPhones
              setPhones(allPhones);
              setDisplayedPhones(allPhones.slice(0, displayCount));
            }
          }
        }
        return;
      }

      setLoading(true);
      try {
        const apiUrl = 'https://openapi.programming-hero.com/api/phones';
        const response = await fetch(`${apiUrl}?search=${encodeURIComponent(searchText)}`);
        
        if (response.ok) {
          const data: PhoneResponse = await response.json();
          if (data.status && data.data && data.data.length > 0) {
            setPhones(data.data);
            setDisplayedPhones(data.data.slice(0, 12));
            setDisplayCount(12);
          } else {
            setPhones([]);
            setDisplayedPhones([]);
          }
        }
      } catch (err) {
        console.error('Error searching phones:', err);
        setPhones([]);
        setDisplayedPhones([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchPhones();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchText, loadingMore]); // Remove allPhones dependency to prevent interference with loadMore

  // Update displayed phones when phones change (only on initial load)
  // This effect should NOT run when loading more phones or during search
  useEffect(() => {
    if (phones.length > 0 && searchText.trim() === '' && !loadingMore && displayedPhones.length === 0) {
      // Only update if displayedPhones is empty (initial load)
      setDisplayedPhones(phones.slice(0, Math.min(displayCount, phones.length)));
    }
  }, [phones.length, searchText, loadingMore]); // Only depend on phones.length, not phones array itself

  // Reset hero carousel when phones change (brand filter)
  useEffect(() => {
    if (phones.length > 0) {
      setHeroCarouselIndex(0);
    }
  }, [selectedBrand, phones.length]);

  // Load more phones function - loads 8 phones at a time
  const loadMorePhones = async () => {
    if (searchText.trim() !== '') {
      // If searching, show more from search results (8 at a time)
      const newCount = displayCount + 8;
      setDisplayCount(newCount);
      setDisplayedPhones(phones.slice(0, newCount));
      return;
    }

    // If not searching, fetch more phones from API
    setLoadingMore(true);
    try {
      const apiUrl = 'https://openapi.programming-hero.com/api/phones';
      const existingSlugs = new Set(allPhones.map(p => p.slug));
      
      // Fetch more phones with the same search term (iphone by default)
      const response = await fetch(`${apiUrl}?search=${encodeURIComponent(searchText || 'iphone')}`);
      
      if (response.ok) {
        const data: PhoneResponse = await response.json();
        if (data.status && data.data && data.data.length > 0) {
          // Filter out phones we already have
          const newPhones = data.data.filter(p => !existingSlugs.has(p.slug));
          const phonesToAdd = newPhones.slice(0, 8);
          
          if (phonesToAdd.length > 0) {
            const updatedAllPhones = [...allPhones, ...phonesToAdd];
            const newDisplayCount = displayCount + phonesToAdd.length;
            
            setAllPhones(updatedAllPhones);
            setPhones(updatedAllPhones);
            setDisplayCount(newDisplayCount);
            setDisplayedPhones(prev => {
              const currentSlugs = new Set(prev.map(p => p.slug));
              const uniqueNewPhones = phonesToAdd.filter(p => !currentSlugs.has(p.slug));
              return [...prev, ...uniqueNewPhones];
            });
          } else {
            // If no new phones found, try to show more from existing if available
            if (allPhones.length > displayCount) {
              const newDisplayCount = Math.min(displayCount + 8, allPhones.length);
              setDisplayCount(newDisplayCount);
              setDisplayedPhones(prev => {
                const additionalPhones = allPhones.slice(displayCount, newDisplayCount);
                const currentSlugs = new Set(prev.map(p => p.slug));
                const uniqueNew = additionalPhones.filter(p => !currentSlugs.has(p.slug));
                return [...prev, ...uniqueNew];
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading more phones:', err);
      // Fallback: try to show more from existing phones
      if (allPhones.length > displayCount) {
        const newDisplayCount = Math.min(displayCount + 8, allPhones.length);
        setDisplayCount(newDisplayCount);
        setDisplayedPhones(prev => {
          const additionalPhones = allPhones.slice(displayCount, newDisplayCount);
          const currentSlugs = new Set(prev.map(p => p.slug));
          const uniqueNew = additionalPhones.filter(p => !currentSlugs.has(p.slug));
          return [...prev, ...uniqueNew];
        });
      }
    } finally {
      setLoadingMore(false);
    }
  };

  // Calculate delivery charge (5% of total, minimum 30, maximum 100)
  const calculateDeliveryCharge = (total: number): number => {
    const charge = total * 0.05;
    if (charge < 30) return 30;
    if (charge > 100) return 100;
    return Math.round(charge);
  };

  const handleOrderNow = (phone: Phone) => {
    setSelectedPhone(phone);
    setOrderQuantity(1);
    setModalStep(1);
    setShowSuccessModal(true);
  };

  const handleConfirmOrder = () => {
    setModalStep(2);
  };

  // Cart functions
  const addToCart = (phone: Phone, quantity: number = 1) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.phone.slug === phone.slug);
      if (existingItem) {
        return prev.map(item =>
          item.phone.slug === phone.slug
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { phone, quantity }];
      }
    });
  };

  const removeFromCart = (phoneSlug: string) => {
    setCart(prev => prev.filter(item => item.phone.slug !== phoneSlug));
  };

  const updateCartQuantity = (phoneSlug: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(phoneSlug);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.phone.slug === phoneSlug
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalCartItems = (): number => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, item) => total + (getPhonePrice(item.phone.slug) * item.quantity), 0);
  };

  // Toggle favorite
  const toggleFavorite = (phoneSlug: string) => {
    setFavorites(prev => {
      if (prev.includes(phoneSlug)) {
        return prev.filter(slug => slug !== phoneSlug);
      } else {
        return [...prev, phoneSlug];
      }
    });
  };

  const isFavorite = (phoneSlug: string): boolean => {
    return favorites.includes(phoneSlug);
  };

  const getFavoritePhones = (): Phone[] => {
    return allPhones.filter(phone => favorites.includes(phone.slug));
  };

  // Get unique brands from available brands state
  const getUniqueBrands = (): string[] => {
    if (availableBrands.length > 0) {
      return availableBrands;
    }
    
    // Fallback: get from allPhones if availableBrands is empty
    if (allPhones && allPhones.length > 0) {
      const brands = new Set<string>();
      allPhones.forEach(phone => {
        if (phone.brand && phone.brand.trim()) {
          brands.add(phone.brand);
        }
      });
      return Array.from(brands).sort();
    }
    
    // Default brands if nothing is loaded
    return ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Oppo', 'Vivo'];
  };

  // Filter phones by brand
  const handleBrandSelect = async (brand: string) => {
    setSelectedBrand(brand);
    setShowBrandDropdown(false);
    setLoading(true);
    setSearchText(''); // Clear search when filtering by brand
    setHeroCarouselIndex(0); // Reset carousel to first phone
    
    try {
      const apiUrl = 'https://openapi.programming-hero.com/api/phones';
      const response = await fetch(`${apiUrl}?search=${encodeURIComponent(brand)}`);
      
      if (response.ok) {
        const data: PhoneResponse = await response.json();
        if (data.status && data.data && data.data.length > 0) {
          setPhones(data.data);
          setDisplayedPhones(data.data.slice(0, 12));
          setDisplayCount(12);
        } else {
          setPhones([]);
          setDisplayedPhones([]);
        }
      }
    } catch (err) {
      console.error('Error filtering by brand:', err);
      setPhones([]);
      setDisplayedPhones([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset brand filter
  const handleResetBrand = () => {
    setSelectedBrand('');
    setShowBrandDropdown(false);
    setSearchText('');
    setHeroCarouselIndex(0); // Reset carousel to first phone
    // Reset to initial iPhone data
    if (allPhones.length > 0) {
      setPhones(allPhones);
      setDisplayedPhones(allPhones.slice(0, 12));
      setDisplayCount(12);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (showFavorites) {
        if (!target.closest('.favorites-dropdown-container')) {
          setShowFavorites(false);
        }
      }
      
      if (showCart) {
        if (!target.closest('.cart-dropdown-container')) {
          setShowCart(false);
        }
      }

      if (showBrandDropdown) {
        if (!target.closest('.brand-dropdown-container')) {
          setShowBrandDropdown(false);
        }
      }
    };

    if (showFavorites || showCart || showBrandDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFavorites, showCart, showBrandDropdown]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Apple Style */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Mobile Shop</h1>
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center gap-3">
              {/* Brand Filter Button - Apple Style */}
              <div className="relative brand-dropdown-container">
                <button
                  onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center"
                  aria-label="Filter by Brand"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>

                {/* Brand Dropdown - Apple Style */}
                {showBrandDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[400px] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-lg">Filter by Brand</h3>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      <button
                        onClick={handleResetBrand}
                        className={`w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors ${selectedBrand === '' ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-700'}`}
                      >
                        All Brands
                      </button>
                      {getUniqueBrands().length > 0 ? (
                        getUniqueBrands().map((brand) => (
                          <button
                            key={brand}
                            onClick={() => handleBrandSelect(brand)}
                            className={`w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors ${selectedBrand === brand ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-700'}`}
                          >
                            {brand}
                          </button>
                        ))
                      ) : (
                        <div className="px-5 py-3 text-gray-500 text-sm">
                          Loading brands...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* My Favourite Button - Apple Style */}
              <div className="relative favorites-dropdown-container">
                <button
                  onClick={() => setShowFavorites(!showFavorites)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center"
                  aria-label="My Favourite"
                >
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-50">
                      {favorites.length}
                    </span>
                  )}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {/* Favorites Dropdown - Apple Style */}
                {showFavorites && (
                  <div 
                    className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[500px] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-lg">Favorites ({favorites.length})</h3>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {favorites.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                          <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <p className="text-gray-500 font-light">No favorites yet</p>
                        </div>
                      ) : (
                        <div className="p-3">
                          {getFavoritePhones().map((phone) => (
                            <div key={phone.slug} className="flex items-center gap-3 p-3 rounded-xl mb-2 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/food/${phone.slug}`)}>
                              <img
                                src={phone.image || 'https://via.placeholder.com/60x60'}
                                alt={phone.phone_name}
                                className="w-14 h-14 rounded-xl object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">{phone.phone_name}</h4>
                                <p className="text-xs text-gray-500">{phone.brand}</p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  Tk. {getPhonePrice(phone.slug).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(phone.slug);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Button - Apple Style */}
              <div className="relative cart-dropdown-container">
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center"
                aria-label="Cart"
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
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[500px] overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
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
                        <span className="font-medium text-gray-900">Tk. {calculateDeliveryCharge(getCartTotal()).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4 border-t border-gray-200 pt-3">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="text-lg font-semibold text-gray-900">Tk. {(getCartTotal() + calculateDeliveryCharge(getCartTotal())).toLocaleString()}</span>
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
        </div>
      </nav>

      {/* Hero Section - Left: Device Info + Features, Right: 3D Device */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {phones.length > 0 && (
            <div className="relative">
              {/* Main Hero Card - Single Card Layout */}
              <div 
                className="bg-white rounded-[2.5rem] overflow-visible relative min-h-[650px] flex shadow-2xl border border-gray-100"
              >
                {/* Subtle Pattern Background */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 hero-pattern-animated" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #1570ef 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                  }}></div>
                </div>

                {/* Subtle Glow Effects */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-[#1570ef]/5 rounded-full blur-3xl hero-glow-animated"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1570ef]/5 rounded-full blur-3xl hero-glow-animated" style={{ animationDelay: '2s' }}></div>

                {/* Left Section - Device Name & Features */}
                <div className="relative z-10 flex-1 flex flex-col justify-between p-8">
                  <div className="flex-1 overflow-y-auto hero-content-enter">
                    {/* Brand */}
                    <p key={`brand-${heroCarouselIndex}`} className="text-sm font-semibold text-[#1570ef] mb-3 tracking-wider uppercase hero-text-enter">
                      {phones[heroCarouselIndex]?.brand || 'Premium'}
                    </p>
                    
                    {/* Device Name */}
                    <h2 key={`name-${heroCarouselIndex}`} className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight tracking-tight hero-text-enter">
                      {phones[heroCarouselIndex]?.phone_name || 'Loading...'}
                    </h2>
                    
                    {/* Price */}
                    <div key={`price-${heroCarouselIndex}`} className="mb-6 hero-text-enter">
                      <span className="text-2xl font-bold text-gray-900">
                        Tk. {phones[heroCarouselIndex] ? getPhonePrice(phones[heroCarouselIndex].slug).toLocaleString() : '0'}
                      </span>
                    </div>

                    {/* Feature Icons */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div key={`feature-0-${heroCarouselIndex}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-100 hover:border-[#1570ef]/20 transition-all hero-feature-enter">
                        <div className="w-12 h-12 rounded-xl bg-[#1570ef]/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1570ef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Battery Life</p>
                          <p className="text-sm font-bold text-gray-900">All Day Power</p>
                        </div>
                      </div>
                      
                      <div key={`feature-1-${heroCarouselIndex}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-100 hover:border-[#1570ef]/20 transition-all hero-feature-enter-delay-1">
                        <div className="w-12 h-12 rounded-xl bg-[#1570ef]/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1570ef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Performance</p>
                          <p className="text-sm font-bold text-gray-900">A17 Pro Chip</p>
                        </div>
                      </div>
                      
                      <div key={`feature-2-${heroCarouselIndex}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-100 hover:border-[#1570ef]/20 transition-all hero-feature-enter-delay-2">
                        <div className="w-12 h-12 rounded-xl bg-[#1570ef]/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1570ef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Storage</p>
                          <p className="text-sm font-bold text-gray-900">Up to 1TB</p>
                        </div>
                      </div>
                      
                      <div key={`feature-3-${heroCarouselIndex}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-100 hover:border-[#1570ef]/20 transition-all hero-feature-enter-delay-3">
                        <div className="w-12 h-12 rounded-xl bg-[#1570ef]/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1570ef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Video</p>
                          <p className="text-sm font-bold text-gray-900">4K Recording</p>
                        </div>
                      </div>

                      <div key={`feature-4-${heroCarouselIndex}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-100 hover:border-[#1570ef]/20 transition-all hero-feature-enter-delay-4">
                        <div className="w-12 h-12 rounded-xl bg-[#1570ef]/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1570ef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Display</p>
                          <p className="text-sm font-bold text-gray-900">6.7" OLED</p>
                        </div>
                      </div>

                      <div key={`feature-5-${heroCarouselIndex}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-100 hover:border-[#1570ef]/20 transition-all hero-feature-enter-delay-5">
                        <div className="w-12 h-12 rounded-xl bg-[#1570ef]/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#1570ef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Connectivity</p>
                          <p className="text-sm font-bold text-gray-900">5G Ready</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const selectedPhone = phones[heroCarouselIndex];
                        if (selectedPhone && typeof window !== 'undefined') {
                          sessionStorage.setItem('selectedPhone', JSON.stringify(selectedPhone));
                        }
                        router.push(`/food/${phones[heroCarouselIndex]?.slug}`);
                      }}
                      className="flex-1 px-6 py-3 bg-[#1570ef] text-white rounded-2xl font-bold text-base hover:bg-[#0d5bd8] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      Learn more
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (phones[heroCarouselIndex]) {
                          handleOrderNow(phones[heroCarouselIndex]);
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-white border-2 border-[#1570ef] text-[#1570ef] rounded-2xl font-bold text-base hover:bg-[#1570ef]/5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                    >
                      Buy now
                    </button>
                  </div>
                </div>

                {/* Right Section - Premium 3D Phone Display */}
                <div className="relative z-10 flex-1 flex items-center justify-center p-8 overflow-visible">
                  {/* 3D Model Viewer Container */}
                  <div className="relative w-full flex items-center justify-center overflow-visible" style={{ height: '100%', minHeight: '500px' }}>
                    {/* Premium 3D Smartphone Model */}
                    {/* @ts-ignore */}
                    <model-viewer
                      src="/apple_iphone_13_pro_max.glb"
                      alt="Premium Smartphone 3D Model"
                      auto-rotate
                      rotation-per-second="20deg"
                      camera-controls
                      shadow-intensity="1"
                      exposure="1.2"
                      environment-image="neutral"
                      camera-orbit="0deg 75deg 120%"
                      field-of-view="35deg"
                      min-camera-orbit="auto auto 110%"
                      max-camera-orbit="auto auto 130%"
                      style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: '320px',
                        maxHeight: '580px',
                        backgroundColor: 'transparent',
                        objectFit: 'contain',
                        overflow: 'visible',
                        display: 'block',
                      }}
                      className="phone-3d-model"
                    />
                    
                    {/* Glow Effect Behind Phone */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                      <div className="w-96 h-96 bg-[#1570ef]/20 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carousel Controls - Professional Style */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <div className="flex gap-2.5 items-center">
                  {phones.slice(0, Math.min(4, phones.length)).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setHeroCarouselIndex(index)}
                      className={`rounded-full transition-all duration-300 ${
                        heroCarouselIndex === index 
                          ? 'bg-[#1570ef] w-8 h-2.5' 
                          : 'bg-gray-200 hover:bg-[#1570ef]/30 w-2.5 h-2.5'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setHeroCarouselIndex((prev) => (prev + 1) % Math.min(4, phones.length));
                  }}
                  className="ml-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Next slide"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Brand-wise Navigation Sections */}
      {selectedBrand && (() => {
        // Get phones for the selected brand
        const brandPhones = phones.filter(phone => 
          phone.brand && phone.brand.toLowerCase() === selectedBrand.toLowerCase()
        ).slice(0, 6);
        
        if (brandPhones.length === 0) return null;
        
        return (
          <div key={selectedBrand} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-16">
              {/* Brand Heading */}
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                {selectedBrand}
              </h2>
                
              {/* Horizontal Scrollable Product Row */}
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Product Items */}
                {brandPhones.map((phone, index) => {
                  const isNew = index < 3; // First 3 items are "New"
                  return (
                    <div
                      key={phone.slug}
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('selectedPhone', JSON.stringify(phone));
                        }
                        router.push(`/food/${phone.slug}`);
                      }}
                      className="flex-shrink-0 w-32 cursor-pointer group"
                    >
                      <div className="relative mb-2">
                        <div className="w-32 h-32 bg-gray-50 rounded-2xl flex items-center justify-center p-4 group-hover:bg-gray-100 transition-colors">
                          <img
                            src={phone.image || 'https://via.placeholder.com/128x128'}
                            alt={phone.phone_name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {isNew && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <span className="bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              New
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 text-center mt-2 line-clamp-2">
                        {phone.phone_name.replace(selectedBrand, '').trim() || phone.phone_name}
                      </p>
                    </div>
                  );
                })}
                
                {/* Compare Option */}
                <div
                  onClick={() => {
                    // Handle compare functionality
                    const brandPhonesList = brandPhones.map(p => p.slug).join(',');
                    router.push(`/?compare=${brandPhonesList}`);
                  }}
                  className="flex-shrink-0 w-32 cursor-pointer group"
                >
                  <div className="relative mb-2">
                    <div className="w-32 h-32 bg-gray-50 rounded-2xl flex items-center justify-center p-4 group-hover:bg-gray-100 transition-colors">
                      <div className="flex gap-1">
                        <div className="w-12 h-16 bg-white rounded-lg border border-gray-200"></div>
                        <div className="w-12 h-16 bg-gray-900 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center mt-2">
                    Compare
                  </p>
                </div>
                
                {/* Accessories Option */}
                <div
                  onClick={() => router.push('/?category=accessories')}
                  className="flex-shrink-0 w-32 cursor-pointer group"
                >
                  <div className="relative mb-2">
                    <div className="w-32 h-32 bg-gray-50 rounded-2xl flex items-center justify-center p-4 group-hover:bg-gray-100 transition-colors">
                      <div className="relative">
                        <div className="w-16 h-20 bg-orange-500 rounded-xl"></div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-gray-200"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center mt-2">
                    Accessories
                  </p>
                </div>
                
                {/* Shop Option */}
                <div
                  onClick={() => router.push('/?brand=' + selectedBrand.toLowerCase())}
                  className="flex-shrink-0 w-32 cursor-pointer group"
                >
                  <div className="relative mb-2">
                    <div className="w-32 h-32 bg-gray-50 rounded-2xl flex items-center justify-center p-4 group-hover:bg-gray-100 transition-colors">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center mt-2">
                    Shop
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Foods Section */}
        <div className="mb-8">

          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-3">
              Explore Our Collection
            </h2>
            <p className="text-lg text-gray-600 font-light">
              Discover the latest smartphones from top brands
            </p>
          </div>

          {/* Loading State - Apple Style Skeleton */}
            {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
                  <div className="w-full aspect-square bg-gray-100"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-100 rounded mb-3 w-1/3"></div>
                    <div className="h-6 bg-gray-100 rounded mb-2 w-3/4"></div>
                    <div className="h-7 bg-gray-100 rounded mb-6 w-1/2"></div>
                    <div className="flex flex-col gap-3">
                      <div className="h-11 bg-gray-100 rounded-2xl"></div>
                      <div className="h-11 bg-gray-100 rounded-2xl"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Food Grid */}
          {!loading && !error && (
            <>
              {displayedPhones.length === 0 && searchText.trim() !== '' ? (
                <div className="text-center py-20">
                  <p className="text-gray-500 text-xl font-light">No phones found matching "{searchText}"</p>
                </div>
              ) : displayedPhones.length === 0 && searchText.trim() === '' ? (
                <div className="text-center py-20">
                  <p className="text-gray-500 text-xl font-light">No phones available at the moment. Please try again later.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {displayedPhones.map((phone) => {
                    const price = getPhonePrice(phone.slug);
                
                return (
                  <div
                    key={phone.slug}
                        className="bg-white rounded-3xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl"
                        onClick={() => {
                          // Store phone data in sessionStorage for detail page
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem('selectedPhone', JSON.stringify(phone));
                          }
                          router.push(`/food/${phone.slug}`);
                        }}
                      >
                        {/* Phone Image - Apple Style */}
                        <div className="relative w-full aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-8">
                            <img
                            src={phone.image || 'https://via.placeholder.com/400x400'}
                              alt={phone.phone_name}
                              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                            {/* Favorite Icon - Apple Style */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(phone.slug);
                              }}
                              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-md hover:bg-white transition-all z-10"
                            >
                              <svg 
                                className={`w-5 h-5 transition-colors ${isFavorite(phone.slug) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                                fill={isFavorite(phone.slug) ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                        </div>

                        {/* Phone Info - Apple Style */}
                        <div className="p-6 flex flex-col">
                          <p className="text-sm text-gray-500 font-medium mb-1">{phone.brand || 'Phone'}</p>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                            {phone.phone_name}
                          </h3>
                          <div className="mb-6">
                            <span className="text-2xl font-semibold text-gray-900">
                              Tk. {price.toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Buttons - Apple Style */}
                          <div className="flex flex-col gap-3 mt-auto" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleOrderNow(phone)}
                              className="w-full py-3 bg-[#1570ef] text-white rounded-2xl font-medium text-base hover:bg-[#0d5bd8] transition-all duration-200 active:scale-95"
                            >
                              Buy Now
                            </button>
                            <button 
                              onClick={() => {
                                addToCart(phone, 1);
                                setShowCart(true);
                              }}
                              className="w-full py-3 bg-white border-2 border-[#1570ef] text-[#1570ef] rounded-2xl font-medium text-base hover:bg-[#1570ef]/5 transition-all duration-200 active:scale-95"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                  
                  {/* Load More Button - Apple Style */}
                  {displayedPhones.length > 0 && searchText.trim() === '' && (
                    <div className="mt-16 text-center">
                      <button
                        onClick={loadMorePhones}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-[#1570ef] text-white rounded-2xl font-medium text-base hover:bg-[#0d5bd8] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                      >
                        {loadingMore ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <span>Load More</span>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Load More Button for Search Results - Apple Style */}
                  {displayedPhones.length > 0 && searchText.trim() !== '' && phones.length > displayedPhones.length && (
                    <div className="mt-16 text-center">
                      <button
                        onClick={loadMorePhones}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-[#1570ef] text-white rounded-2xl font-medium text-base hover:bg-[#0d5bd8] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                      >
                        {loadingMore ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <span>Load More</span>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Order Modal - Apple Style */}
      {showSuccessModal && selectedPhone && (
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
                    src={selectedPhone.image || 'https://via.placeholder.com/100x100'}
                    alt={selectedPhone.phone_name}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium mb-1">{selectedPhone.brand || 'Phone'}</p>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{selectedPhone.phone_name}</h3>
                    <p className="text-xl font-semibold text-gray-900">Tk. {getPhonePrice(selectedPhone.slug).toLocaleString()}</p>
                  </div>
                </div>

                {/* Quantity Selector - Apple Style */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-4 text-center">Quantity</label>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                      className="w-14 h-14 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors font-semibold text-gray-700 text-2xl active:scale-95"
                    >
                      −
                    </button>
                    <div className="w-24 text-center">
                      <span className="text-4xl font-semibold text-gray-900">{orderQuantity}</span>
                    </div>
                    <button
                      onClick={() => setOrderQuantity(orderQuantity + 1)}
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
                    <span className="font-medium text-gray-900">Tk. {(getPhonePrice(selectedPhone.slug) * orderQuantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="font-medium text-gray-900">Tk. {calculateDeliveryCharge(getPhonePrice(selectedPhone.slug) * orderQuantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3 mt-3">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">Tk. {((getPhonePrice(selectedPhone.slug) * orderQuantity) + calculateDeliveryCharge(getPhonePrice(selectedPhone.slug) * orderQuantity)).toLocaleString()}</span>
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
                      src={selectedPhone.image || 'https://via.placeholder.com/80x80'}
                      alt={selectedPhone.phone_name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">{selectedPhone.brand || 'Phone'}</p>
                      <h3 className="font-semibold text-gray-900">{selectedPhone.phone_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Quantity: {orderQuantity}</p>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">Tk. {(getPhonePrice(selectedPhone.slug) * orderQuantity).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-medium text-gray-900">Tk. {calculateDeliveryCharge(getPhonePrice(selectedPhone.slug) * orderQuantity).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3 mt-3">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">Tk. {((getPhonePrice(selectedPhone.slug) * orderQuantity) + calculateDeliveryCharge(getPhonePrice(selectedPhone.slug) * orderQuantity)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Close Button - Apple Style */}
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setModalStep(1);
                  }}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-medium text-base hover:bg-gray-800 transition-all duration-200 active:scale-95"
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
                  <span className="font-medium text-gray-900">Tk. {calculateDeliveryCharge(getCartTotal()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-3 mt-3">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">Tk. {(getCartTotal() + calculateDeliveryCharge(getCartTotal())).toLocaleString()}</span>
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
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-medium text-base hover:bg-gray-800 transition-all duration-200 active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
