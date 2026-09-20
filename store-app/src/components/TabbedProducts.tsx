'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface TabbedProductsSettings {
  featuredTab: {
    title: string;
    subtitle: string;
    displayCount: number;
    selectedProducts: string[];
    sortOrder: 'manual' | 'random' | 'latest' | 'popular' | 'featured' | 'bestselling';
  };
  latestTab: {
    title: string;
    subtitle: string;
    displayCount: number;
    selectedProducts: string[];
    sortOrder: 'manual' | 'latest' | 'popular' | 'random' | 'featured' | 'bestselling';
  };
  bestsellingTab: {
    title: string;
    subtitle: string;
    displayCount: number;
    selectedProducts: string[];
    sortOrder: 'manual' | 'latest' | 'popular' | 'random' | 'featured' | 'bestselling';
  };
  active: boolean;
}

export default function TabbedProducts() {
  const [settings, setSettings] = useState<TabbedProductsSettings | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [bestsellingProducts, setBestsellingProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'featured' | 'latest' | 'bestselling'>('latest');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔄 TabbedProducts: Starting to fetch data...');
      
      // بارگذاری تنظیمات
      const settingsResponse = await fetch('/api/admin/tabbed-products-settings');
      console.log('📡 TabbedProducts: Settings response status:', settingsResponse.status);
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        console.log('📋 TabbedProducts: Settings loaded:', settingsData);
        
        if (settingsData.success && (settingsData.settings || settingsData.data)) {
          const actualSettings = settingsData.settings || settingsData.data;
          
          // تبدیل structure جدید به قدیمی
          const convertedSettings = {
            featuredTab: {
              title: actualSettings.featuredSection?.title || 'پر بازدید ترین',
              subtitle: actualSettings.featuredSection?.subtitle || 'محبوب‌ترین محصولات',
              displayCount: actualSettings.featuredSection?.count || 8,
              selectedProducts: [],
              sortOrder: 'popular' as const
            },
            latestTab: {
              title: actualSettings.latestSection?.title || 'جدید ترین',
              subtitle: actualSettings.latestSection?.subtitle || 'آخرین محصولات',
              displayCount: actualSettings.latestSection?.count || 8,
              selectedProducts: [],
              sortOrder: 'latest' as const
            },
            bestsellingTab: {
              title: actualSettings.bestsellingSection?.title || 'پرفروش ترین',
              subtitle: actualSettings.bestsellingSection?.subtitle || 'پرفروش‌ترین محصولات',
              displayCount: actualSettings.bestsellingSection?.count || 8,
              selectedProducts: [],
              sortOrder: 'bestselling' as const
            },
            active: actualSettings.active !== false
          };
          
          setSettings(convertedSettings);
          console.log('✅ TabbedProducts: Converted settings set successfully');
          
          // بارگذاری محصولات بر اساس تنظیمات
          await loadProducts(convertedSettings);
        } else {
          console.log('❌ TabbedProducts: Settings data invalid, using fallback');
          // استفاده از تنظیمات پیش‌فرض
          const fallbackSettings = {
            featuredTab: {
              title: 'محصولات ویژه',
              subtitle: 'محصولات منتخب ما',
              displayCount: 8,
              selectedProducts: [],
              sortOrder: 'featured' as const
            },
            latestTab: {
              title: 'جدیدترین محصولات',
              subtitle: 'آخرین محصولات اضافه شده',
              displayCount: 8,
              selectedProducts: [],
              sortOrder: 'latest' as const
            },
            bestsellingTab: {
              title: 'پرفروش ترین',
              subtitle: 'پرفروش‌ترین محصولات',
              displayCount: 8,
              selectedProducts: [],
              sortOrder: 'bestselling' as const
            },
            active: true
          };
          setSettings(fallbackSettings);
          await loadProducts(fallbackSettings);
        }
      } else {
        console.error('❌ TabbedProducts: خطا در بارگذاری تنظیمات تب‌دار');
        // استفاده از تنظیمات پیش‌فرض در صورت خطا
        const fallbackSettings = {
          featuredTab: {
            title: 'پر بازدید ترین',
            subtitle: 'محبوب‌ترین محصولات',
            displayCount: 8,
            selectedProducts: [],
            sortOrder: 'popular' as const
          },
          latestTab: {
            title: 'جدید ترین',
            subtitle: 'آخرین محصولات',
            displayCount: 8,
            selectedProducts: [],
            sortOrder: 'latest' as const
          },
          bestsellingTab: {
            title: 'پرفروش ترین',
            subtitle: 'پرفروش‌ترین محصولات',
            displayCount: 8,
            selectedProducts: [],
            sortOrder: 'bestselling' as const
          },
          active: true
        };
        setSettings(fallbackSettings);
        await loadProducts(fallbackSettings);
      }
    } catch (error) {
      console.error('❌ TabbedProducts: خطا در fetchData:', error);
      // استفاده از تنظیمات پیش‌فرض در صورت خطا
      const fallbackSettings = {
        featuredTab: {
          title: 'پر بازدید ترین',
          subtitle: 'محبوب‌ترین محصولات',
          displayCount: 8,
          selectedProducts: [],
          sortOrder: 'popular' as const
        },
        latestTab: {
          title: 'جدید ترین',
          subtitle: 'آخرین محصولات',
          displayCount: 8,
          selectedProducts: [],
          sortOrder: 'latest' as const
        },
        bestsellingTab: {
          title: 'پرفروش ترین',
          subtitle: 'پرفروش‌ترین محصولات',
          displayCount: 8,
          selectedProducts: [],
          sortOrder: 'bestselling' as const
        },
        active: true
      };
      setSettings(fallbackSettings);
      await loadProducts(fallbackSettings);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (currentSettings: TabbedProductsSettings) => {
    try {
      console.log('🔄 TabbedProducts: Loading products with settings:', currentSettings);
      
      // بارگذاری محصولات ویژه
      if (currentSettings.featuredTab.sortOrder === 'manual') {
        console.log('🎯 TabbedProducts: Loading featured products manually');
        // استفاده از محصولات انتخاب شده دستی
        if (currentSettings.featuredTab.selectedProducts.length > 0) {
          console.log('📦 TabbedProducts: Featured product IDs:', currentSettings.featuredTab.selectedProducts);
          const productPromises = currentSettings.featuredTab.selectedProducts.map(id =>
            fetch(`/api/products/${id}`).then(res => res.ok ? res.json() : null)
          );
          const productsData = await Promise.all(productPromises);
          const validProducts = productsData.filter(p => p !== null).map(p => p.product || p);
          console.log('✅ TabbedProducts: Featured products loaded:', validProducts.length);
          setFeaturedProducts(validProducts);
        } else {
          console.log('⚠️ TabbedProducts: No featured products selected, using featured API');
          const featuredResponse = await fetch(`/api/products?featured=true&limit=${currentSettings.featuredTab.displayCount}`);
          if (featuredResponse.ok) {
            const featuredData = await featuredResponse.json();
            setFeaturedProducts(Array.isArray(featuredData.products) ? featuredData.products : []);
          }
        }
      } else {
        console.log('🔄 TabbedProducts: Loading featured products automatically with sort:', currentSettings.featuredTab.sortOrder);
        // بارگذاری خودکار بر اساس نوع چینش
        let apiUrl = '';
        if (currentSettings.featuredTab.sortOrder === 'featured') {
          apiUrl = `/api/products?featured=true&limit=${currentSettings.featuredTab.displayCount}`;
        } else {
          apiUrl = `/api/products?sort=${currentSettings.featuredTab.sortOrder}&limit=${currentSettings.featuredTab.displayCount}`;
        }
        
        const featuredResponse = await fetch(apiUrl);
        if (featuredResponse.ok) {
          const featuredData = await featuredResponse.json();
          console.log('📦 TabbedProducts: Featured API response:', featuredData);
          setFeaturedProducts(Array.isArray(featuredData.products) ? featuredData.products : []);
        } else {
          console.error('❌ TabbedProducts: Featured products API failed');
          setFeaturedProducts([]);
        }
      }

      // بارگذاری جدیدترین محصولات
      if (currentSettings.latestTab.sortOrder === 'manual') {
        console.log('🎯 TabbedProducts: Loading latest products manually');
        // استفاده از محصولات انتخاب شده دستی
        if (currentSettings.latestTab.selectedProducts.length > 0) {
          console.log('📦 TabbedProducts: Latest product IDs:', currentSettings.latestTab.selectedProducts);
          const productPromises = currentSettings.latestTab.selectedProducts.map(id =>
            fetch(`/api/products/${id}`).then(res => res.ok ? res.json() : null)
          );
          const productsData = await Promise.all(productPromises);
          const validProducts = productsData.filter(p => p !== null).map(p => p.product || p);
          console.log('✅ TabbedProducts: Latest products loaded:', validProducts.length);
          setLatestProducts(validProducts);
        } else {
          console.log('⚠️ TabbedProducts: No latest products selected, using latest API');
          const latestResponse = await fetch(`/api/products?sort=latest&limit=${currentSettings.latestTab.displayCount}`);
          if (latestResponse.ok) {
            const latestData = await latestResponse.json();
            setLatestProducts(Array.isArray(latestData.products) ? latestData.products : []);
          }
        }
      } else {
        console.log('🔄 TabbedProducts: Loading latest products automatically with sort:', currentSettings.latestTab.sortOrder);
        // بارگذاری خودکار بر اساس نوع چینش
        let apiUrl = '';
        if (currentSettings.latestTab.sortOrder === 'featured') {
          apiUrl = `/api/products?featured=true&limit=${currentSettings.latestTab.displayCount}`;
        } else {
          apiUrl = `/api/products?sort=${currentSettings.latestTab.sortOrder}&limit=${currentSettings.latestTab.displayCount}`;
        }
        
        const latestResponse = await fetch(apiUrl);
        if (latestResponse.ok) {
          const latestData = await latestResponse.json();
          console.log('📦 TabbedProducts: Latest API response:', latestData);
          setLatestProducts(Array.isArray(latestData.products) ? latestData.products : []);
        } else {
          console.error('❌ TabbedProducts: Latest products API failed');
          setLatestProducts([]);
        }
      }

      // بارگذاری پرفروش‌ترین محصولات
      if (currentSettings.bestsellingTab.sortOrder === 'manual') {
        console.log('🎯 TabbedProducts: Loading bestselling products manually');
        if (currentSettings.bestsellingTab.selectedProducts.length > 0) {
          console.log('📦 TabbedProducts: Bestselling product IDs:', currentSettings.bestsellingTab.selectedProducts);
          const productPromises = currentSettings.bestsellingTab.selectedProducts.map(id =>
            fetch(`/api/products/${id}`).then(res => res.ok ? res.json() : null)
          );
          const productsData = await Promise.all(productPromises);
          const validProducts = productsData.filter(p => p !== null).map(p => p.product || p);
          console.log('✅ TabbedProducts: Bestselling products loaded:', validProducts.length);
          setBestsellingProducts(validProducts);
        } else {
          console.log('⚠️ TabbedProducts: No bestselling products selected, using bestselling API');
          const bestsellingResponse = await fetch(`/api/products?sort=bestselling&limit=${currentSettings.bestsellingTab.displayCount}`);
          if (bestsellingResponse.ok) {
            const bestsellingData = await bestsellingResponse.json();
            setBestsellingProducts(Array.isArray(bestsellingData.products) ? bestsellingData.products : []);
          }
        }
      } else {
        console.log('🔄 TabbedProducts: Loading bestselling products automatically with sort:', currentSettings.bestsellingTab.sortOrder);
        let apiUrl = `/api/products?sort=${currentSettings.bestsellingTab.sortOrder}&limit=${currentSettings.bestsellingTab.displayCount}`;
        
        const bestsellingResponse = await fetch(apiUrl);
        if (bestsellingResponse.ok) {
          const bestsellingData = await bestsellingResponse.json();
          console.log('📦 TabbedProducts: Bestselling API response:', bestsellingData);
          setBestsellingProducts(Array.isArray(bestsellingData.products) ? bestsellingData.products : []);
        } else {
          console.error('❌ TabbedProducts: Bestselling products API failed');
          setBestsellingProducts([]);
        }
      }

    } catch (error) {
      console.error('❌ TabbedProducts: خطا در بارگذاری محصولات:', error);
      setFeaturedProducts([]);
      setLatestProducts([]);
      setBestsellingProducts([]);
    }
  };

  const addToCart = async (productId: string) => {
    setAddingToCart(productId);

    try {
      const sessionId = localStorage.getItem('cart_session_id') || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!localStorage.getItem('cart_session_id')) {
        localStorage.setItem('cart_session_id', sessionId);
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert('محصول با موفقیت به سبد خرید اضافه شد!');
      } else {
        throw new Error(result.error || 'خطا در افزودن به سبد خرید');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('خطا در افزودن محصول به سبد خرید. لطفا دوباره تلاش کنید.');
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">در حال بارگذاری محصولات...</p>
      </div>
    );
  }

  if (!settings || !settings.active) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            مجموعه محصولات ما
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {/* توضیحات از تنظیمات خوانده می‌شود */}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setActiveTab('latest')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'latest'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🆕 {settings.latestTab.title}
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'featured'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⭐ {settings.featuredTab.title}
            </button>
            <button
              onClick={() => setActiveTab('bestselling')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'bestselling'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔥 {settings.bestsellingTab.title}
            </button>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            {activeTab === 'featured' 
              ? settings.featuredTab.subtitle 
              : activeTab === 'latest'
              ? settings.latestTab.subtitle
              : settings.bestsellingTab.subtitle
            }
          </p>
          
          {/* Sort Order Info */}
          <div className="mt-2 text-sm text-gray-500">
            {activeTab === 'featured' && (
              <span>
                {settings.featuredTab.sortOrder === 'manual' && '📋 محصولات انتخابی'}
                {settings.featuredTab.sortOrder === 'random' && '🎲 چینش تصادفی'}
                {settings.featuredTab.sortOrder === 'latest' && '🕒 جدیدترین محصولات'}
                {settings.featuredTab.sortOrder === 'popular' && '👁️ پربازدیدترین محصولات'}
                {settings.featuredTab.sortOrder === 'featured' && '⭐ محصولات ویژه منتخب'}
              </span>
            )}
            {activeTab === 'latest' && (
              <span>
                {settings.latestTab.sortOrder === 'manual' && '📋 محصولات انتخابی'}
                {settings.latestTab.sortOrder === 'latest' && '🕒 جدیدترین محصولات'}
                {settings.latestTab.sortOrder === 'popular' && '👁️ پربازدیدترین محصولات'}
                {settings.latestTab.sortOrder === 'random' && '🎲 چینش تصادفی'}
                {settings.latestTab.sortOrder === 'featured' && '⭐ محصولات ویژه منتخب'}
              </span>
            )}
            {activeTab === 'bestselling' && (
              <span>
                {settings.bestsellingTab.sortOrder === 'manual' && '📋 محصولات انتخابی'}
                {settings.bestsellingTab.sortOrder === 'bestselling' && '🔥 پرفروش‌ترین محصولات'}
                {settings.bestsellingTab.sortOrder === 'popular' && '👁️ پربازدیدترین محصولات'}
                {settings.bestsellingTab.sortOrder === 'random' && '🎲 چینش تصادفی'}
                {settings.bestsellingTab.sortOrder === 'featured' && '⭐ محصولات ویژه منتخب'}
              </span>
            )}
          </div>
        </div>

        {/* Products Swiper */}
        <div className="mb-8">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={40}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 32,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 36,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 40,
              },
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            navigation={true}
            pagination={{
              clickable: true,
            }}
            loop={true}
            className="tabbed-products-swiper"
            style={{
              '--swiper-navigation-color': '#9333ea',
              '--swiper-pagination-color': '#9333ea',
              '--swiper-navigation-size': '44px'
            } as React.CSSProperties}
          >
            {activeTab === 'featured' 
              ? featuredProducts.map((product) => (
                  <SwiperSlide key={product.id}>
                    <div className="h-full">
                      <ProductCard 
                        product={product} 
                        className="h-full"
                      />
                    </div>
                  </SwiperSlide>
                ))
              : activeTab === 'latest'
              ? latestProducts.map((product) => (
                  <SwiperSlide key={product.id}>
                    <div className="h-full">
                      <ProductCard 
                        product={product} 
                        className="h-full"
                      />
                    </div>
                  </SwiperSlide>
                ))
              : bestsellingProducts.map((product) => (
                  <SwiperSlide key={product.id}>
                    <div className="h-full">
                      <ProductCard 
                        product={product} 
                        className="h-full"
                      />
                    </div>
                  </SwiperSlide>
                ))
            }
          </Swiper>
        </div>

        {/* Empty State */}
        {((activeTab === 'featured' && featuredProducts.length === 0) ||
          (activeTab === 'latest' && latestProducts.length === 0) ||
          (activeTab === 'bestselling' && bestsellingProducts.length === 0)) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg">
              {activeTab === 'featured' 
                ? 'هیچ محصول ویژه‌ای یافت نشد' 
                : activeTab === 'latest'
                ? 'هیچ محصول جدیدی یافت نشد'
                : 'هیچ محصول پرفروشی یافت نشد'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              لطفاً از پنل مدیریت محصولات را اضافه کنید
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
