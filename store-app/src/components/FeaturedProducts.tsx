'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { useLatestProductsWithSettings } from '@/hooks/useApi';

// Import Swiper styles


const FeaturedProducts: React.FC = () => {
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Use React Query hook with fresh data
  const { data, isLoading: loading, error, refetch } = useLatestProductsWithSettings();

  // Force fresh data on mount
  React.useEffect(() => {
    refetch();
  }, [refetch]);

  // Extract data
  const featuredSettings = data?.settings?.success ? data.settings.settings : null;
  const products = data?.products?.success ? data.products.data || [] : [];

  // استخراج تنظیمات فاصله‌گذاری از پنل مدیریت - اعمال مستقیم مقادیر شما
  let spaceBetweenCards = 20; // فاصله بین کارت‌ها از پنل
  let containerPadding = 16;  // فاصله از لبه‌ها از پنل
  let navigationOffset = 23;  // فاصله دکمه‌های ناوبری از پنل

  const handleAddToCart = (productId: string) => {
    setAddingToCart(productId);
    // Simulate add to cart
    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  // Show loading state
  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">خطا در بارگذاری محصولات ویژه</h2>
            <p className="text-gray-600">{error.message}</p>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if section is disabled or no products
  if (!featuredSettings?.enabled || !products.length) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto" style={{ paddingLeft: `${containerPadding}px`, paddingRight: `${containerPadding}px` }}>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {featuredSettings.title || 'محصولات ویژه'}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {featuredSettings.subtitle || 'محصولات منتخب و برتر ما'}
          </p>
          <div className="w-20 h-1 bg-blue-600 mx-auto mt-6"></div>
        </div>

        {/* Products Slider - Desktop */}
        <div className="hidden md:block">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={spaceBetweenCards}
            slidesPerView={1}
            navigation={{
              nextEl: '.featured-swiper-button-next',
              prevEl: '.featured-swiper-button-prev',
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: Math.max(20, spaceBetweenCards - 8),
              },
              768: {
                slidesPerView: 3,
                spaceBetween: Math.max(24, spaceBetweenCards - 4),
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: spaceBetweenCards,
              },
            }}
            className="featured-products-swiper"
          >
            {products.map((product: Product) => (
              <SwiperSlide key={product.id || product._id}>
                <ProductCard
                  product={product}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Products Grid - Mobile */}
        <div className="md:hidden">
          <div className={`grid grid-cols-1 sm:grid-cols-2`} style={{ gap: `${Math.max(16, spaceBetweenCards)}px` }}>
            {products.slice(0, 4).map((product: Product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
              />
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/products?featured=true"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-300"
          >
            مشاهده همه محصولات ویژه
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
