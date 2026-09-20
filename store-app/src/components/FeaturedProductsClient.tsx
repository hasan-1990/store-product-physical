'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

interface FeaturedProductsClientProps {
  products: Product[];
  settings: {
    enabled: boolean;
    title?: string;
    subtitle?: string;
  } | null;
}

const FeaturedProductsClient: React.FC<FeaturedProductsClientProps> = ({ 
  products = [],
  settings 
}) => {
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // استخراج تنظیمات فاصله‌گذاری
  const spaceBetweenCards = 24; // افزایش فاصله از 20 به 24
  const containerPadding = 16;

  const handleAddToCart = (productId: string) => {
    setAddingToCart(productId);
    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  // Don't render if section is disabled or no products
  if (!settings?.enabled || !products.length) {
    return null;
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {settings.title || 'محصولات ویژه'}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {settings.subtitle || 'محصولات منتخب و برتر ما'}
          </p>
          <div className="w-20 h-1 bg-blue-600 mx-auto mt-6"></div>
        </div>

        {/* Products Slider - Desktop */}
        <div className="hidden md:block relative px-12">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={32}
            slidesPerView={1}
            navigation={{
              nextEl: '.featured-swiper-button-next',
              prevEl: '.featured-swiper-button-prev',
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
              el: '.featured-swiper-pagination',
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 24,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 28,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 32,
              },
            }}
            className="featured-products-swiper pb-12"
          >
            {products.map((product: Product) => (
              <SwiperSlide key={product.id || product._id}>
                <div className="h-full">
                  <ProductCard product={product} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Custom Navigation Buttons */}
          <button className="featured-swiper-button-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="featured-swiper-button-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Custom Pagination */}
          <div className="featured-swiper-pagination flex justify-center mt-8"></div>
        </div>

        {/* Products Grid - Mobile */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-4">
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

export default FeaturedProductsClient;
