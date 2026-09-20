'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useQuery } from '@tanstack/react-query';
import CompactProductCard from './CompactProductCard';
import Toast from './Toast';

// Custom hook for intersection observer
const useInView = (options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setIsInView(true);
        setHasAnimated(true);
      }
    }, {
      threshold: 0.3,
      ...options
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasAnimated, options]);

  return [ref, isInView] as const;
};

// Custom hook for counter animation
const useCountUp = (end: number, isInView: boolean, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.floor(end * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, isInView, duration]);

  return count;
};


// Stat Card Component with counter animation
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  isInView: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, isInView }) => {
  // Parse number from value string (e.g., "۴.۸" -> 4.8, "۱۰ هزار+" -> 10000)
  const parseValue = (val: string): number => {
    // Convert Persian numbers to English
    const persianToEnglish: { [key: string]: string } = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    
    let englishVal = val.replace(/[۰-۹]/g, (char) => persianToEnglish[char] || char);
    
    // Handle different formats
    if (englishVal.includes('هزار')) {
      const num = parseFloat(englishVal.replace(/[^0-9.]/g, ''));
      return num * 1000;
    }
    if (englishVal.includes('میلیون')) {
      const num = parseFloat(englishVal.replace(/[^0-9.]/g, ''));
      return num * 1000000;
    }
    
    // Just extract the number
    const num = parseFloat(englishVal.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const formatValue = (val: string, animatedNum: number): string => {
    // Keep the original format but replace the number
    if (val.includes('هزار')) {
      const num = (animatedNum / 1000).toFixed(0);
      return val.replace(/[۰-۹0-9]+/, num).replace(/[0-9]/g, (char) => {
        const englishToPersian: { [key: string]: string } = {
          '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
          '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
        };
        return englishToPersian[char] || char;
      });
    }
    
    if (val.includes('.')) {
      const num = animatedNum.toFixed(1);
      return val.replace(/[۰-۹0-9.]+/, num).replace(/[0-9.]/g, (char) => {
        if (char === '.') return '.';
        const englishToPersian: { [key: string]: string } = {
          '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
          '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
        };
        return englishToPersian[char] || char;
      });
    }
    
    const num = Math.floor(animatedNum).toString();
    return val.replace(/[۰-۹0-9]+/, num).replace(/[0-9]/g, (char) => {
      const englishToPersian: { [key: string]: string } = {
        '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
        '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
      };
      return englishToPersian[char] || char;
    });
  };

  const numericValue = parseValue(value);
  const animatedCount = useCountUp(numericValue, isInView, 2000);
  const displayValue = isInView ? formatValue(value, animatedCount) : value.replace(/[۰-۹0-9]/g, '۰');

  return (
    <div className="flex flex-col items-center space-y-4 transform transition-all duration-500"
         style={{
           opacity: isInView ? 1 : 0,
           transform: isInView ? 'translateY(0)' : 'translateY(20px)'
         }}>
      <div className="w-16 h-16 flex items-center justify-center transform transition-transform duration-700"
           style={{
             transform: isInView ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)'
           }}>
        {icon}
      </div>
      <div className="text-4xl font-bold text-white leading-tight whitespace-pre-wrap text-center tabular-nums">
        {displayValue}
      </div>
      <div className="text-[#e9d4ff] text-base">{label}</div>
    </div>
  );
};

// Custom hook for products by type with activeTab support
const useProductsByTypeWithTab = (type: string, limit: number, isActiveTab: boolean) => {
  return useQuery({
    queryKey: ['products-modern-showcase', type, limit],
    queryFn: async () => {
      console.log(`🔄 Fetching products for type: ${type}`);
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        type: type,
        active: 'true'
      });
      
      const response = await fetch(`/api/products?${queryParams}`);
      if (!response.ok) throw new Error('خطا در دریافت محصولات');
      const data = await response.json();
      console.log(`✅ Fetched ${data.products?.length || 0} products for type: ${type}`);
      return data.products || [];
    },
    enabled: isActiveTab && !!type,
    staleTime: 1000, // 1 second - fetch fresh when switching tabs
    gcTime: 60 * 1000, // Keep in cache for 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// TabContent Component for each tab's products
interface TabContentProps {
  tab: TabSettings;
  isActive: boolean;
  addingToCart: string | null;
  handleAddToCart: (productId: string) => void;
}

const TabContent: React.FC<TabContentProps> = ({ tab, isActive, addingToCart, handleAddToCart }) => {
  // Fetch products for this specific tab - only when active
  const { data: products = [], isLoading, error } = useProductsByTypeWithTab(
    tab.apiType,
    8,
    isActive // فقط وقتی تب فعال است fetch کن
  );

  console.log(`Tab: ${tab.label}, apiType: ${tab.apiType}, isActive: ${isActive}, products:`, products?.length || 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 h-[600px] animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-200 border border-gray-300"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-red-500">خطا در بارگذاری محصولات</div>
      </div>
    );
  }

  return (
    <div className="min-h-[600px] h-auto transition-all duration-500 ease-in-out p-4">
      {Array.isArray(products) && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px] auto-rows-[minmax(280px,auto)]">
          {products.slice(0, 8).map((product: any, index: number) => {
            // استفاده از _id برای سبد خرید (نه sequentialId!)
            const productId = product._id || (typeof product._id === 'object' ? product._id.toString() : product._id) || '';
            
            console.log(`🔍 Product #${index}:`, {
              name: product.name,
              _id: product._id,
              id: product.id,
              sequentialId: product.sequentialId,
              using: productId
            });
            
            return (
              <div 
                key={product.sequentialId || productId || index}
                className="transform transition-all duration-300 ease-in-out hover:scale-105 opacity-0 animate-fadeIn w-full"
                style={{
                  animationDelay: `${index * 100}ms`, // Staggered animation
                  animationFillMode: 'forwards'
                }}
              >
                <CompactProductCard
                  product={product}
                  onAddToCart={() => handleAddToCart(productId)}
                  isAddingToCart={addingToCart === productId}
                  className="h-full min-h-[280px] transition-all duration-300 ease-in-out w-full"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center animate-fadeIn">
          <div className="text-gray-400 text-lg">
            محصولی در این دسته‌بندی موجود نیست
          </div>
        </div>
      )}
    </div>
  );
};

interface PromoSettings {
  title: string;
  subtitle: string;
  buttonText: string;
  link: string;
  backgroundColor: string;
  backgroundImage?: string; // تصویر پس‌زمینه (اختیاری)
  useImage?: boolean; // استفاده از تصویر به جای رنگ
}

interface TabSettings {
  id: string;
  label: string;
  apiType: 'latest' | 'best_selling' | 'highest_rated' | 'most_viewed';
  active: boolean;
  color: string;
  promo: PromoSettings;
}

interface StatisticsData {
  products: { value: string; label: string };
  customers: { value: string; label: string };
  rating: { value: string; label: string };
  support: { value: string; label: string };
}

interface ModernShowcaseSettings {
  active: boolean;
  title: string;
  subtitle: string;
  showStatistics: boolean;
  statisticsData: StatisticsData;
  tabs: TabSettings[];
}

const ModernProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [settings, setSettings] = useState<ModernShowcaseSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const promoSwiperRef = useRef<any>(null);
  
  // Hook for statistics animation
  const [statsRef, isStatsInView] = useInView();

  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/modern-showcase-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSettings(data.data);
            // Set first active tab from right (last in array because of flex-row-reverse) as default
            const activeTabs = data.data.tabs.filter((tab: TabSettings) => tab.active);
            if (activeTabs.length > 0) {
              // چون از flex-row-reverse استفاده می‌کنیم، آخرین تب در آرایه = اولین تب از راست
              setActiveTab(activeTabs[activeTabs.length - 1].id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((tabId: string, slideIndex?: number) => {
    setActiveTab(tabId);
  }, []);

  // Get current tab config
  const currentTab = settings?.tabs.find(tab => tab.id === activeTab) || settings?.tabs.find(tab => tab.active);
  const activeTabs = settings?.tabs.filter(tab => tab.active) || [];

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCart(productId);
      
      // بررسی productId
      if (!productId || productId === '') {
        console.error('❌ productId خالی است!');
        alert('خطا: شناسه محصول نامعتبر است');
        setAddingToCart(null);
        return;
      }
      
      console.log('🆔 ProductId:', productId, 'Type:', typeof productId);
      
      // دریافت اطلاعات کاربر از localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      console.log('👤 User from localStorage:', user);
      
      // دریافت یا ایجاد sessionId
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('sessionId', sessionId);
        console.log('🆕 Created new sessionId:', sessionId);
      } else {
        console.log('♻️ Using existing sessionId:', sessionId);
      }
      
      // مطمئن شو که productId string است
      const productIdString = String(productId);
      
      const cartData = {
        productId: productIdString,
        quantity: 1,
        userId: user?._id || user?.id || null,
        sessionId: user ? null : sessionId,
      };
      
      console.log('🛒 Sending to cart API:', cartData);
      console.log('📝 Cart data types:', {
        productId: typeof cartData.productId,
        quantity: typeof cartData.quantity,
        userId: typeof cartData.userId,
        sessionId: typeof cartData.sessionId
      });
      
      // ارسال درخواست به API
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData),
      });

      const result = await response.json();
      
      console.log('📥 Response from cart API:', result);
      console.log('📊 Response status:', response.status);

      if (result.success) {
        console.log('✅ محصول با موفقیت به سبد خرید اضافه شد');
        setToast({ message: '✅ محصول با موفقیت به سبد خرید اضافه شد', type: 'success' });
      } else {
        console.error('❌ خطا در اضافه کردن به سبد:', result.error);
        if (result.details) {
          console.error('📋 جزئیات خطا:', JSON.stringify(result.details, null, 2));
        }
        setToast({ message: `❌ خطا: ${result.error || 'مشکلی در اضافه کردن محصول'}`, type: 'error' });
      }
    } catch (error) {
      console.error('خطا در ارسال درخواست:', error);
      setToast({ message: '❌ خطا در اضافه کردن محصول به سبد خرید', type: 'error' });
    } finally {
      setAddingToCart(null);
    }
  };

  // Don't render if settings are loading or component is disabled
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="lg:col-span-1 flex flex-col space-y-4">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings || !settings.active) {
    return null;
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={2000}
        />
      )}
      
      <section className="py-12 bg-white min-h-[400px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {(settings.title || settings.subtitle) && (
          <div className="text-center mb-8">
            {settings.title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {settings.title}
              </h2>
            )}
            {settings.subtitle && (
              <p className="text-gray-600 text-lg">
                {settings.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Main Content - Products Grid Left + Banner Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          {/* Right Side - Promotional Banner (Full Height) */}
          <div className="lg:col-span-1 lg:order-1 flex">
            <div className="w-full flex flex-col">
              {currentTab && (
                <Link href={currentTab.promo.link || '#'} className="block group flex-1">
                  <div 
                    className="relative h-full rounded-2xl shadow-2xl min-h-[600px]"
                    style={
                      currentTab.promo.useImage && currentTab.promo.backgroundImage
                        ? {
                            backgroundImage: `url(${currentTab.promo.backgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }
                        : { 
                            backgroundColor: currentTab.promo.backgroundColor || '#ff6b35'
                          }
                    }
                  >
                    {/* Dark overlay for better text readability when using image */}
                    {currentTab.promo.useImage && currentTab.promo.backgroundImage && (
                      <div className="absolute inset-0 bg-black/40 rounded-2xl"></div>
                    )}
                    
                    {/* Content Container */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center text-white">
                      <div className="space-y-6 max-w-sm">
                        {/* Icon */}
                        <div className="flex justify-center mb-8">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-3">
                          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                            {currentTab.promo.title}
                          </h2>
                          <p className="text-sm md:text-base opacity-90 font-light leading-relaxed px-4">
                            {currentTab.promo.subtitle}
                          </p>
                        </div>
                        
                        {/* Button */}
                        <div className="pt-4">
                          <button className="inline-flex items-center px-6 py-3 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 group-hover:scale-105 transform shadow-xl text-sm">
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            {currentTab.promo.buttonText || 'مشاهده بیشتر'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Left Side - Products Grid */}
          <div className="lg:col-span-3 lg:order-2">
            {/* Tab Navigation - Above Products Box */}
            <div className="flex justify-end gap-2 flex-row-reverse mb-3">
              {activeTabs.map((tab, index) => {
                const backgroundColor = tab.promo.backgroundColor || '#ff6b35';
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id, index)}
                    className={`px-4 py-2 font-medium transition-all duration-300 text-sm rounded-lg border whitespace-nowrap ${
                      isActive
                        ? 'text-white shadow-lg border-transparent'
                        : 'text-gray-700 hover:text-white hover:bg-gray-800 border-gray-200'
                    }`}
                    style={{
                      backgroundColor: isActive ? backgroundColor : 'transparent',
                      borderColor: isActive ? backgroundColor : undefined
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg min-h-[600px] border-4 border-gray-300 bg-white transition-all duration-500 ease-in-out overflow-hidden">
              {activeTabs.map((tab) => (
                <div 
                  key={tab.id}
                  className={`${activeTab === tab.id ? 'block animate-fadeIn' : 'hidden'}`}
                >
                  <TabContent 
                    tab={tab}
                    isActive={activeTab === tab.id}
                    addingToCart={addingToCart}
                    handleAddToCart={handleAddToCart}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Statistics */}
        {settings?.showStatistics && (
          <div ref={statsRef} className="mt-16 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
            <div className="bg-gradient-to-r from-[#59168b] via-[#6e11b0] to-[#59168b] py-16 px-4 md:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {/* Rating Statistic */}
                <StatCard
                  icon={<svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>}
                  value={settings.statisticsData.rating.value}
                  label={settings.statisticsData.rating.label}
                  isInView={isStatsInView}
                />

                {/* Support Statistic */}
                <StatCard
                  icon={<svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>}
                  value={settings.statisticsData.support.value}
                  label={settings.statisticsData.support.label}
                  isInView={isStatsInView}
                />

                {/* Customers Statistic */}
                <StatCard
                  icon={<svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>}
                  value={settings.statisticsData.customers.value}
                  label={settings.statisticsData.customers.label}
                  isInView={isStatsInView}
                />

                {/* Products Statistic */}
                <StatCard
                  icon={<svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/>
                  </svg>}
                  value={settings.statisticsData.products.value}
                  label={settings.statisticsData.products.label}
                  isInView={isStatsInView}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
    </>
  );
};

export default ModernProductShowcase;