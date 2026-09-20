'use client';

import React, { useState } from 'react';
import { ProductBuyButton, HeaderLayoutTest, PriceDisplayTest } from '@/components/ab-testing/ABTestExamples';
import { useABTestContext } from '@/contexts/ABTestContext';

export default function ABTestDemoPage() {
  const { getVariant, isInTest, trackConversion } = useABTestContext();
  const [cartItems, setCartItems] = useState(0);

  const handleAddToCart = () => {
    setCartItems(prev => prev + 1);
    // شبیه‌سازی افزودن به سبد خرید واقعی
    console.log('محصول به سبد خرید اضافه شد');
  };

  const sampleProducts = [
    {
      id: '1',
      name: 'هدفون بی‌سیم پریمیوم',
      price: 2500000,
      discountPrice: 1999000,
      image: '/images/products/headphone.jpg'
    },
    {
      id: '2', 
      name: 'ساعت هوشمند ورزشی',
      price: 3200000,
      image: '/images/products/smartwatch.jpg'
    },
    {
      id: '3',
      name: 'کیبورد مکانیکی گیمینگ',
      price: 1800000,
      discountPrice: 1440000,
      image: '/images/products/keyboard.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header با A/B Test */}
      <HeaderLayoutTest>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative">
            <button className="text-gray-700 hover:text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0L3 5m2 2l2 8m0 0h6m-6 0a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems}
                </span>
              )}
            </button>
          </div>
          <button className="text-gray-700 hover:text-purple-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </HeaderLayoutTest>

      <div className="container mx-auto px-4 py-8">
        {/* A/B Test Info Panel */}
        <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-purple-200 mb-4">🧪 صفحه آزمایش A/B Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
              <h3 className="font-semibold text-gray-200">تست رنگ دکمه:</h3>
              <p className="text-gray-300">
                شما در گروه: <span className="font-bold text-blue-400">
                  {getVariant('button-color-test') || 'خارج از تست'}
                </span>
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
              <h3 className="font-semibold text-gray-200">تست چیدمان هدر:</h3>
              <p className="text-gray-300">
                شما در گروه: <span className="font-bold text-emerald-400">
                  {getVariant('header-layout-test') || 'خارج از تست'}
                </span>
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
              <h3 className="font-semibold text-gray-200">تست نمایش قیمت:</h3>
              <p className="text-gray-300">
                شما در گروه: <span className="font-bold text-purple-400">
                  {getVariant('pricing-display-test') || 'خارج از تست'}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-900/30 rounded border border-yellow-500/30">
            <p className="text-yellow-200 text-sm">
              💡 هر بار که صفحه را refresh کنید، ممکن است به گروه متفاوتی تخصیص یابید (بر اساس درصد تست).
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleProducts.map((product) => (
            <div key={product.id} className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-gray-700/50">
              {/* Product Image Placeholder */}
              <div className="h-48 bg-gray-700/50 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">{product.name}</h3>
                
                {/* Price with A/B Test */}
                <div className="mb-4">
                  <PriceDisplayTest
                    originalPrice={product.price}
                    discountPrice={product.discountPrice}
                  />
                </div>

                {/* Buy Button with A/B Test */}
                <ProductBuyButton
                  productId={product.id}
                  productName={product.name}
                  price={product.discountPrice || product.price}
                  onAddToCart={handleAddToCart}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Test Action Buttons */}
        <div className="mt-12 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-bold text-white mb-4">اقدامات تست</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                if (isInTest('button-color-test')) {
                  trackConversion('button-color-test', 'page_view');
                }
                alert('Page view ثبت شد!');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
            >
              ثبت Page View
            </button>
            
            <button
              onClick={() => {
                if (isInTest('header-layout-test')) {
                  trackConversion('header-layout-test', 'navigation_click');
                }
                alert('Navigation click ثبت شد!');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
            >
              ثبت Navigation Click
            </button>
            
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
            >
              🔄 Refresh (تست مجدد)
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-bold text-white mb-4">آمار جلسه شما</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-900/30 rounded border border-blue-500/30">
              <div className="text-2xl font-bold text-blue-400">{cartItems}</div>
              <div className="text-sm text-gray-300">افزوده شده به سبد</div>
            </div>
            <div className="text-center p-4 bg-emerald-900/30 rounded border border-emerald-500/30">
              <div className="text-2xl font-bold text-emerald-400">
                {Object.values({
                  'button-color-test': isInTest('button-color-test'),
                  'header-layout-test': isInTest('header-layout-test'), 
                  'pricing-display-test': isInTest('pricing-display-test')
                }).filter(Boolean).length}
              </div>
              <div className="text-sm text-gray-300">تست‌های فعال</div>
            </div>
            <div className="text-center p-4 bg-purple-900/30 rounded border border-purple-500/30">
              <div className="text-2xl font-bold text-purple-400">100%</div>
              <div className="text-sm text-gray-300">درصد آماده‌سازی</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}