'use client';

import { useState, useEffect } from 'react';
import OptimizedImage from './OptimizedImage';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { generateProductUrl } from '@/lib/url-client';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercentage: number;
  imageUrl: string;
  slug: string;
  category?: string;
}

const DiscountProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [settings, setSettings] = useState({
    active: true,
    title: 'محصولات تخفیفی',
    subtitle: '',
    maxProducts: 6,
    showDiscountBadge: true
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First, fetch the settings
        const settingsResponse = await fetch('/api/admin/discount-products-settings');
        const settingsData = await settingsResponse.json();
        
        let currentMaxProducts = settings.maxProducts;
        if (settingsData.success && settingsData.data) {
          setSettings(settingsData.data);
          currentMaxProducts = settingsData.data.maxProducts;
        }

        // Then, fetch products using the retrieved settings
        if (currentMaxProducts > 0) {
          const productsResponse = await fetch(`/api/products/discount?limit=${currentMaxProducts}`);
          const productsData = await productsResponse.json();
          if (productsData.success) {
            setProducts(productsData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching discount data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  if (!settings.active || loading) {
    return null;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <style jsx global>{`
        .discount-products-swiper .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: #d1d5db;
          opacity: 1;
          transition: all 0.3s ease;
        }
        .discount-products-swiper .swiper-pagination-bullet-active {
          background: #f97316;
          transform: scale(1.25);
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {settings.title}
          </h2>
          <p className="text-gray-600 text-lg">
            {settings.subtitle}
          </p>
        </div>

        {/* Products Slider */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={8}
            slidesPerView={1}
            slidesPerGroup={1}
            loop={products.length > 6}
            onSwiper={(swiper) => {
              setSwiperInstance(swiper);
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            navigation={false}
            pagination={{
              el: '.swiper-pagination-custom',
              clickable: true,
              enabled: products.length > 6
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                slidesPerGroup: 1,
              },
              768: {
                slidesPerView: 3,
                slidesPerGroup: 1,
              },
              1024: {
                slidesPerView: 6,
                slidesPerGroup: 1,
              },
            }}
            className="discount-products-swiper"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <Link
                  href={generateProductUrl(product)}
                  className="group block"
                >
                  <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden border border-gray-100 aspect-square flex flex-col">
                    {/* Product Image */}
                    <div className="relative flex-1 p-3">
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <OptimizedImage
                          src={product.imageUrl || '/images/products/placeholder.svg'}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          decoding="async"
                        />
                        
                        {/* Discount Badge */}
                        {settings.showDiscountBadge && product.discountPercentage > 0 && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-lg text-sm font-bold shadow-lg">
                            %{product.discountPercentage}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-3 pt-1">
                      {/* Product Name */}
                      <h3 className="text-sm font-semibold text-gray-900 text-center line-clamp-2 group-hover:text-orange-600 transition-colors leading-tight">
                        {product.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Link
            href="/products?discount=true"
            className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            مشاهده همه محصولات تخفیفی
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DiscountProducts;