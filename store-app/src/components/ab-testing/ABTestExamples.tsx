'use client';

import React from 'react';
import { ABTestWrapper, useABTestVariant } from '@/components/ab-testing/ABTestVariant';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface ProductBuyButtonProps {
  productId: string;
  productName: string;
  price: number;
  onAddToCart: () => void;
  className?: string;
}

export function ProductBuyButton({ 
  productId, 
  productName, 
  price, 
  onAddToCart,
  className = '' 
}: ProductBuyButtonProps) {
  const { variant, isInTest, trackConversion } = useABTestVariant('button-color-test');

  const handleClick = () => {
    // اجرای عملکرد اصلی
    onAddToCart();

    // ردیابی conversion برای A/B test
    if (isInTest) {
      trackConversion('add_to_cart', price);
    }
  };

  return (
    <ABTestWrapper
      testId="button-color-test"
      variants={{
        control: (
          <button
            onClick={handleClick}
            className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 ${className}`}
          >
            <ShoppingCartIcon className="w-5 h-5" />
            افزودن به سبد خرید
          </button>
        ),
        red: (
          <button
            onClick={handleClick}
            className={`w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg ${className}`}
          >
            <ShoppingCartIcon className="w-5 h-5" />
            خرید کنید
          </button>
        ),
        green: (
          <button
            onClick={handleClick}
            className={`w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg ${className}`}
          >
            <ShoppingCartIcon className="w-5 h-5" />
            🛒 اضافه کردن
          </button>
        )
      }}
      fallback={
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg ${className}`}
        >
          <ShoppingCartIcon className="w-5 h-5" />
          افزودن به سبد خرید
        </button>
      }
    />
  );
}

// کامپوننت تست برای Header Layout
interface HeaderLayoutTestProps {
  children: React.ReactNode;
}

export function HeaderLayoutTest({ children }: HeaderLayoutTestProps) {
  const { variant, isInTest, trackConversion } = useABTestVariant('header-layout-test');

  const handleNavigationClick = (item: string) => {
    if (isInTest) {
      trackConversion('navigation_click');
    }
  };

  return (
    <ABTestWrapper
      testId="header-layout-test"
      variants={{
        control: (
          <div className="w-full bg-white shadow-md">
            {/* Layout فعلی - عادی */}
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center justify-between">
                <div className="flex items-center space-x-8 space-x-reverse">
                  <div className="text-xl font-bold text-gray-900">فروشگاه هاب</div>
                  <div className="hidden md:flex items-center space-x-6 space-x-reverse">
                    <button 
                      onClick={() => handleNavigationClick('products')}
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      محصولات
                    </button>
                    <button 
                      onClick={() => handleNavigationClick('categories')}
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      دسته‌بندی‌ها
                    </button>
                    <button 
                      onClick={() => handleNavigationClick('blog')}
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      وبلاگ
                    </button>
                  </div>
                </div>
                {children}
              </nav>
            </div>
          </div>
        ),
        compact: (
          <div className="w-full bg-gray-50 border-b">
            {/* Layout فشرده */}
            <div className="container mx-auto px-4 py-2">
              <nav className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="text-lg font-bold text-gray-900">هاب</div>
                  <div className="hidden md:flex items-center space-x-4 space-x-reverse text-sm">
                    <button 
                      onClick={() => handleNavigationClick('products')}
                      className="text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded"
                    >
                      محصولات
                    </button>
                    <button 
                      onClick={() => handleNavigationClick('categories')}
                      className="text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded"
                    >
                      دسته‌ها
                    </button>
                    <button 
                      onClick={() => handleNavigationClick('blog')}
                      className="text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded"
                    >
                      بلاگ
                    </button>
                  </div>
                </div>
                {children}
              </nav>
            </div>
          </div>
        )
      }}
      fallback={
        <div className="w-full bg-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <div className="text-xl font-bold text-gray-900">فروشگاه هاب</div>
              {children}
            </nav>
          </div>
        </div>
      }
    />
  );
}

// کامپوننت تست برای نمایش قیمت
interface PriceDisplayTestProps {
  originalPrice: number;
  discountPrice?: number;
  currency?: string;
}

export function PriceDisplayTest({ 
  originalPrice, 
  discountPrice, 
  currency = 'تومان' 
}: PriceDisplayTestProps) {
  return (
    <ABTestWrapper
      testId="pricing-display-test"
      variants={{
        control: (
          // نمایش ساده قیمت
          <div className="text-right">
            {discountPrice ? (
              <div>
                <span className="text-xl font-bold text-white">
                  {discountPrice.toLocaleString()} {currency}
                </span>
                <span className="text-sm text-gray-400 line-through mr-2">
                  {originalPrice.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-white">
                {originalPrice.toLocaleString()} {currency}
              </span>
            )}
          </div>
        ),
        discount: (
          // نمایش با تاکید بر تخفیف
          <div className="text-right">
            {discountPrice ? (
              <div className="bg-red-900/30 p-3 rounded-lg border border-red-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {Math.round(((originalPrice - discountPrice) / originalPrice) * 100)}% تخفیف
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-red-400">
                    {discountPrice.toLocaleString()} {currency}
                  </span>
                  <span className="text-sm text-gray-400 line-through mr-2">
                    {originalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-emerald-400 mt-1">
                  شما {(originalPrice - discountPrice).toLocaleString()} تومان صرفه‌جویی می‌کنید!
                </div>
              </div>
            ) : (
              <span className="text-xl font-bold text-white">
                {originalPrice.toLocaleString()} {currency}
              </span>
            )}
          </div>
        )
      }}
      fallback={
        <div className="text-right">
          <span className="text-xl font-bold text-white">
            {(discountPrice || originalPrice).toLocaleString()} {currency}
          </span>
        </div>
      }
    />
  );
}