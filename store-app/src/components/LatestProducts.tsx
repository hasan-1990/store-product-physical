'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { Product } from '@/types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface LatestProductsSettings {
  title: string;
  subtitle: string;
  maxProducts: number;
  active: boolean;
  selectionMode: 'manual' | 'latest' | 'random' | 'most_viewed' | 'best_selling' | 'highest_rated';
  autoUpdateInterval: number;
  selectedProducts: string[];
}

const LatestProducts: React.FC = () => {
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<LatestProductsSettings>({
    title: 'جدیدترین محصولات',
    subtitle: 'آخرین محصولات اضافه شده به فروشگاه',
    maxProducts: 8,
    active: true,
    selectionMode: 'latest',
    autoUpdateInterval: 24,
    selectedProducts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestProducts();
  }, []);

  const fetchLatestProducts = async () => {
    try {
      // دریافت تنظیمات
      const settingsResponse = await fetch('/api/admin/latest-products-settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings);
        }
      }

      // دریافت محصولات براساس تنظیمات
      let endpoint = '/api/products?limit=' + settings.maxProducts;
      
      // اگر حالت انتخاب دستی است، فقط محصولات انتخاب شده را بگیر
      if (settings.selectionMode === 'manual' && settings.selectedProducts.length > 0) {
        endpoint = '/api/products?ids=' + settings.selectedProducts.join(',');
      } else if (settings.selectionMode === 'latest') {
        endpoint = '/api/products?sort=latest&limit=' + settings.maxProducts;
      } else if (settings.selectionMode === 'best_selling') {
        endpoint = '/api/products?sort=bestselling&limit=' + settings.maxProducts;
      } else if (settings.selectionMode === 'most_viewed') {
        endpoint = '/api/products?sort=views&limit=' + settings.maxProducts;
      } else if (settings.selectionMode === 'highest_rated') {
        endpoint = '/api/products?sort=rating&limit=' + settings.maxProducts;
      } else if (settings.selectionMode === 'random') {
        endpoint = '/api/products?sort=random&limit=' + settings.maxProducts;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          setProducts(data.products);
        }
      }
    } catch (error) {
      console.error('Error fetching latest products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId: string) => {
    setAddingToCart(productId);
    // Simulate add to cart
    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  // اگر بخش غیرفعال است یا محصولی وجود ندارد، چیزی نمایش نده
  if (!settings.active || products.length === 0) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {settings.title}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {settings.subtitle}
          </p>
          <div className="w-20 h-1 bg-green-600 mx-auto mt-6"></div>
        </div>

        {/* Products Slider - Desktop */}
        <div className="hidden md:block">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={40}
            slidesPerView={1}
            navigation={{
              nextEl: '.latest-swiper-button-next',
              prevEl: '.latest-swiper-button-prev',
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
            }}
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
            className="latest-products-swiper"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            href="/products?sort=newest"
            className="inline-flex items-center px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-300"
          >
            مشاهده همه محصولات جدید
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestProducts;
