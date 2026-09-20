'use client';

import React, { useState, useEffect } from 'react';
import OptimizedImage from './OptimizedImage';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, A11y } from 'swiper/modules';
import { generateProductUrl } from '@/lib/url-client';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// استایل سفارشی برای فاصله بین اسلایدها و انیمیشن‌های زیبا
const swiperStyles = `
  .mySwiper .swiper-slide {
    padding: 0 16px !important;
    transition: transform 0.3s ease-out;
  }
  .mySwiper {
    margin: 0 -16px !important;
  }
  
  /* انیمیشن pulse برای بیج تخفیف */
  @keyframes gentle-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.95;
      transform: scale(1.02);
    }
  }
  
  .animate-pulse {
    animation: gentle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

interface Product {
  id: string;
  sequentialId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercentage: number;
  imageUrl: string;
  slug: string;
  category?: string;
  sectionId?: string;
}

interface DiscountSection {
  id: string;
  title: string;
  subtitle: string;
  active: boolean;
  maxProducts: number;
  showDiscountBadge: boolean;
  position: string;
  productType: 'newest' | 'latest' | 'random' | 'manual';
  selectedCategories: string[];
  order: number;
}

interface MultipleDiscountSectionsClientProps {
  sections: DiscountSection[];
  products: Product[];
  position?: string;
}

export default function MultipleDiscountSectionsClient({ 
  sections, 
  products, 
  position = 'home-top' 
}: MultipleDiscountSectionsClientProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to get products for a specific section
  const getProductsForSection = (section: DiscountSection) => {
    return products.filter(product => product.sectionId === section.id);
  };

  // Show loading placeholder until hydrated
  if (!isMounted) {
    return (
      <div className="w-full min-h-[400px] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: swiperStyles }} />
      <div className="space-y-12">
        {sections.map((section) => {
          const sectionProducts = getProductsForSection(section);
          
          if (sectionProducts.length === 0) {
            return null;
          }

          return (
            <div key={section.id} className="py-12 bg-gradient-to-b from-gray-50 to-white rounded-2xl shadow-sm">
              <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 
                    className="text-2xl font-bold text-gray-900"
                    id={`section-title-${section.id}`}
                  >
                    {section.title}
                  </h2>
                  
                  <div className="flex items-center gap-3">
                    <Link 
                      href="/products" 
                      className="text-orange-500 hover:text-orange-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
                      aria-label={`مشاهده همه محصولات ${section.title}`}
                    >
                      مشاهده همه
                    </Link>
                  </div>
                </div>

                {/* Products Slider */}
                <div 
                  className="relative"
                  role="region"
                  aria-label={`اسلایدر محصولات ${section.title}`}
                  aria-describedby={`swiper-desc-${section.id}`}
                >
                  {/* Hidden description for screen readers */}
                  <div id={`swiper-desc-${section.id}`} className="sr-only">
                    استفاده از کلیدهای فلش چپ و راست یا دکمه‌های ناوبری برای مشاهده محصولات بیشتر
                  </div>
                  <Swiper
                    modules={[Navigation, Pagination, Keyboard, A11y]}
                    spaceBetween={32}
                    slidesPerView={2}
                    navigation={false} // غیرفعال کردن navigation پیش‌فرض
                    keyboard={{
                      enabled: true,
                      onlyInViewport: true,
                    }}
                    a11y={{
                      enabled: true,
                      containerMessage: `بخش ${section.title} - مجموعه محصولات تخفیف‌دار`,
                      containerRole: 'region',
                      containerRoleDescriptionMessage: 'اسلایدر محصولات',
                      firstSlideMessage: 'این اولین محصول است',
                      lastSlideMessage: 'این آخرین محصول است',
                      nextSlideMessage: 'محصول بعدی',
                      prevSlideMessage: 'محصول قبلی',
                      slideLabelMessage: 'محصول {{index}} از {{slidesLength}}',
                      slideRole: 'group',
                      scrollOnFocus: true,
                    }}
                    breakpoints={{
                      640: {
                        slidesPerView: 2,
                        spaceBetween: 32,
                      },
                      768: {
                        slidesPerView: 3,
                        spaceBetween: 32,
                      },
                      1024: {
                        slidesPerView: 4,
                        spaceBetween: 32,
                      },
                      1280: {
                        slidesPerView: 5,
                        spaceBetween: 32,
                      },
                      1536: {
                        slidesPerView: 6,
                        spaceBetween: 32,
                      },
                    }}
                    className="!overflow-visible mySwiper"
                    style={{ padding: '0 4px' }}
                    dir="rtl"
                  >
                    {sectionProducts.map((product, index) => (
                      <SwiperSlide key={`${section.id}-${product.id}`} className="!h-auto" style={{ padding: '0 8px' }}>
                        <Link
                          href={generateProductUrl(product)}
                          className="group block h-full"
                          aria-label={`مشاهده جزئیات ${product.name}${product.discountPercentage > 0 ? ` با تخفیف ${product.discountPercentage} درصد` : ''}`}
                          role="link"
                          tabIndex={0}
                        >
                          <div className="flex flex-col h-[320px] w-full rounded-3xl bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 ease-out border border-gray-100 hover:border-orange-200 group-hover:scale-[1.02]">
                            {/* Product Image Container - Fixed Height */}
                            <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 p-3" role="img" aria-label={`تصویر ${product.name}`}>
                              {/* Image Wrapper با گوشه‌های گرد و اندازه ثابت */}
                              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-inner">
                                <OptimizedImage
                                  src={product.imageUrl || '/placeholder.jpg'}
                                  alt={`تصویر محصول ${product.name}`}
                                  width={300}
                                  height={192} // Fixed height
                                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
                                  decoding="async"
                                />
                              </div>
                              
                              {/* Discount Badge */}
                              {section.showDiscountBadge && product.discountPercentage > 0 && (
                                <div className="absolute top-2 left-2 z-10">
                                  <div 
                                    className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse"
                                    role="text"
                                    aria-label={`تخفیف ${product.discountPercentage} درصد`}
                                  >
                                    <span className="drop-shadow-sm">{product.discountPercentage}% تخفیف</span>
                                  </div>
                                </div>
                              )}

                              {/* Decorative Corner Element */}
                              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-orange-50 to-transparent rounded-tl-full opacity-30 pointer-events-none"></div>
                            </div>

                            {/* Product Info Section */}
                            <div className="flex-1 flex flex-col justify-between p-4 bg-white min-h-[120px]">
                              {/* Product Name */}
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight mb-3 group-hover:text-orange-600 transition-colors duration-300 min-h-[40px] flex items-center">
                                  {product.name}
                                </h3>
                              </div>
                              
                              {/* Divider Line after Title */}
                              <div className="border-t border-gray-100 mb-3"></div>
                              
                              {/* Price Section */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-right flex-1">
                                  {product.originalPrice && product.originalPrice > product.price && (
                                    <span className="text-gray-400 line-through text-xs block">
                                      {product.originalPrice.toLocaleString('fa-IR')} تومان
                                    </span>
                                  )}
                                  <span className={`font-bold text-sm ${product.discountPercentage > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                    {product.price.toLocaleString('fa-IR')} تومان
                                  </span>
                                </div>
                                
                                {/* Category Badge */}
                                {product.category && (
                                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                    {product.category}
                                  </span>
                                )}
                              </div>
                              
                              {/* Divider Line before Action Hint */}
                              <div className="border-t border-gray-100 pt-2">
                                {/* Action Hint */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400 group-hover:text-orange-500 transition-colors duration-300">
                                    مشاهده جزئیات
                                  </span>
                                  <svg 
                                    className="w-3 h-3 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-300" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}