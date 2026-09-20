'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types';

interface TabbedProducts2Settings {
  discountedTab: {
    title: string;
    subtitle: string;
    displayCount: number;
    selectedProducts: string[];
    sortOrder: 'manual' | 'latest' | 'popular' | 'random';
  };
  active: boolean;
}

export default function TabbedProducts2() {
  const [settings, setSettings] = useState<TabbedProducts2Settings | null>(null);
  const [introSettings, setIntroSettings] = useState({
    title: 'پیشنهادات ویژه ما',
    subtitle: ''
  });
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [SwiperComponent, setSwiperComponent] = useState<any>(null);
  const [SwiperSlideComponent, setSwiperSlideComponent] = useState<any>(null);
  const [modules, setModules] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Lazy load Swiper
  useEffect(() => {
    // Dynamic import CSS (side-effect imports)
    if (typeof window !== 'undefined') {
      require('swiper/css');
      require('swiper/css/navigation');
      require('swiper/css/pagination');
    }
    
    // Dynamic import Swiper components
    Promise.all([
      import('swiper/react'),
      import('swiper/modules'),
    ]).then(([swiperReact, swiperModules]) => {
      setSwiperComponent(() => swiperReact.Swiper);
      setSwiperSlideComponent(() => swiperReact.SwiperSlide);
      setModules({
        Autoplay: swiperModules.Autoplay,
        Navigation: swiperModules.Navigation,
        Pagination: swiperModules.Pagination,
      });
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔄 TabbedProducts2: Starting to fetch data...');
      
      // بارگذاری تنظیمات معرفی
      try {
        const introResponse = await fetch('/api/admin/tabbed2-intro-settings');
        if (introResponse.ok) {
          const introData = await introResponse.json();
          setIntroSettings(introData);
          console.log('✅ TabbedProducts2: Intro settings loaded:', introData);
        }
      } catch (error) {
        console.log('⚠️ TabbedProducts2: Failed to load intro settings, using defaults');
      }
      
      // بارگذاری تنظیمات محصولات
      const settingsResponse = await fetch('/api/admin/tabbed-products2-settings');
      console.log('📡 TabbedProducts2: Settings response status:', settingsResponse.status);
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        console.log('📋 TabbedProducts2: Settings loaded:', settingsData);
        
        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings);
          console.log('✅ TabbedProducts2: Settings set successfully');
          
          // بارگذاری محصولات بر اساس تنظیمات
          await loadProducts(settingsData.settings);
        } else {
          console.log('❌ TabbedProducts2: Settings data invalid, using fallback');
          // استفاده از تنظیمات پیش‌فرض
          const fallbackSettings = {
            discountedTab: {
              title: 'محصولات تخفیف‌دار',
              subtitle: '',
              displayCount: 8,
              selectedProducts: [],
              sortOrder: 'latest' as const
            },
            active: true
          };
          setSettings(fallbackSettings);
          await loadProducts(fallbackSettings);
        }
      } else {
        console.error('❌ TabbedProducts2: خطا در بارگذاری تنظیمات تب‌دار');
        // استفاده از تنظیمات پیش‌فرض در صورت خطا
        const fallbackSettings = {
          discountedTab: {
            title: 'محصولات تخفیف‌دار',
            subtitle: '',
            displayCount: 8,
            selectedProducts: [],
            sortOrder: 'latest' as const
          },
          active: true
        };
        setSettings(fallbackSettings);
        await loadProducts(fallbackSettings);
      }
    } catch (error) {
      console.error('❌ TabbedProducts2: خطا در fetchData:', error);
      // استفاده از تنظیمات پیش‌فرض در صورت خطا
      const fallbackSettings = {
        discountedTab: {
          title: 'محصولات تخفیف‌دار',
          subtitle: '',
          displayCount: 8,
          selectedProducts: [],
          sortOrder: 'latest' as const
        },
        active: true
      };
      setSettings(fallbackSettings);
      await loadProducts(fallbackSettings);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (currentSettings: TabbedProducts2Settings) => {
    try {
      console.log('🔄 TabbedProducts2: Loading products with settings:', currentSettings);
      
      // بارگذاری محصولات تخفیف‌دار
      if (currentSettings.discountedTab.sortOrder === 'manual') {
        console.log('🎯 TabbedProducts2: Loading discounted products manually');
        // استفاده از محصولات انتخاب شده دستی
        if (currentSettings.discountedTab.selectedProducts.length > 0) {
          console.log('📦 TabbedProducts2: Discounted product IDs:', currentSettings.discountedTab.selectedProducts);
          const productPromises = currentSettings.discountedTab.selectedProducts.map((id: string) =>
            fetch(`/api/products/${id}`).then(res => res.ok ? res.json() : null)
          );
          const productsData = await Promise.all(productPromises);
          const validProducts = productsData.filter((p: any) => p !== null).map((p: any) => p.product || p);
          console.log('✅ TabbedProducts2: Discounted products loaded:', validProducts.length);
          setDiscountedProducts(validProducts);
        } else {
          console.log('⚠️ TabbedProducts2: No discounted products selected');
          setDiscountedProducts([]);
        }
      } else {
        console.log('🔄 TabbedProducts2: Loading discounted products automatically with sort:', currentSettings.discountedTab.sortOrder);
        // بارگذاری خودکار بر اساس نوع چینش
        const discountedResponse = await fetch(`/api/products?sort=${currentSettings.discountedTab.sortOrder}&limit=${currentSettings.discountedTab.displayCount}`);
        if (discountedResponse.ok) {
          const discountedData = await discountedResponse.json();
          console.log('📦 TabbedProducts2: Discounted API response:', discountedData);
          setDiscountedProducts(Array.isArray(discountedData.products) ? discountedData.products : []);
        } else {
          console.error('❌ TabbedProducts2: Discounted products API failed');
        }
      }

    } catch (error) {
      console.error('❌ TabbedProducts2: خطا در بارگذاری محصولات:', error);
      setDiscountedProducts([]);
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

  if (loading || !SwiperComponent || !SwiperSlideComponent || !modules) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">در حال بارگذاری محصولات...</p>
      </div>
    );
  }

  if (!settings || !settings.active) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            محصولات تخفیف‌دار
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            بهترین تخفیف‌ها را از دست ندهید
          </p>
        </div>

        {/* Discounted Products Section */}
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-green-100 px-4 py-2 rounded-full mb-4">
              <span className="text-2xl">💰</span>
              <h3 className="text-xl font-bold text-green-800">{settings.discountedTab.title}</h3>
            </div>
            <p className="text-gray-600">{settings.discountedTab.subtitle}</p>
            
            {/* Sort Order Info */}
            <div className="mt-2 text-sm text-gray-500">
              {settings.discountedTab.sortOrder === 'manual' && '📋 محصولات انتخابی'}
              {settings.discountedTab.sortOrder === 'latest' && '🕒 جدیدترین محصولات'}
              {settings.discountedTab.sortOrder === 'popular' && '👁️ پربازدیدترین محصولات'}
              {settings.discountedTab.sortOrder === 'random' && '🎲 چینش تصادفی'}
            </div>
          </div>

          {/* Discounted Products Swiper */}
          <div className="mb-8">
            <SwiperComponent
              modules={[modules.Autoplay, modules.Navigation, modules.Pagination]}
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
                delay: 5000,
                disableOnInteraction: false,
              }}
              navigation={true}
              pagination={{
                clickable: true,
              }}
              loop={true}
              className="discounted-products-swiper"
            >
              {discountedProducts.map((product) => (
                <SwiperSlideComponent key={product.id}>
                  <div className="h-full">
                    <ProductCard 
                      product={product} 
                      
                      className="h-full"
                    />
                  </div>
                </SwiperSlideComponent>
              ))}
            </SwiperComponent>
          </div>

          {/* Discounted Empty State */}
          {discountedProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-gray-500 text-lg">هیچ محصول تخفیف‌داری یافت نشد</p>
              <p className="text-gray-400 text-sm mt-2">لطفاً از پنل مدیریت محصولات را اضافه کنید</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
