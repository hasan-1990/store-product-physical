// Component برای نمایش بخش‌های تخفیفی در موقعیت‌های مختلف سایت
// این فایل Server Component است و در سمت سرور اجرا می‌شود

import React from 'react';
import MultipleDiscountSectionsSSR from '@/components/MultipleDiscountSectionsSSR';

// برای صفحه اصلی - بالا (بعد از اسلایدر)
export function HomeTopDiscountSections() {
  return <MultipleDiscountSectionsSSR position="home-top" />;
}

// برای صفحه اصلی - وسط 
export function HomeMiddleDiscountSections() {
  return <MultipleDiscountSectionsSSR position="home-middle" />;
}

// برای صفحه اصلی - پایین
export function HomeBottomDiscountSections() {
  return <MultipleDiscountSectionsSSR position="home-bottom" />;
}

// برای صفحات دسته‌بندی - بالا
export function CategoryTopDiscountSections() {
  return <MultipleDiscountSectionsSSR position="category-top" />;
}

// برای صفحات دسته‌بندی - کناری  
export function CategorySidebarDiscountSections() {
  return <MultipleDiscountSectionsSSR position="category-sidebar" />;
}

// برای صفحه محصول - پیشنهادی
export function ProductRelatedDiscountSections() {
  return <MultipleDiscountSectionsSSR position="product-related" />;
}

// برای صفحه سبد خرید - پیشنهادی
export function CartSuggestionsDiscountSections() {
  return <MultipleDiscountSectionsSSR position="cart-suggestions" />;
}