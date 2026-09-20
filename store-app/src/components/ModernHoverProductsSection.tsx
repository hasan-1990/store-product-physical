'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { generateProductUrl } from '@/lib/url-client';

interface ModernHoverProductsSectionProps {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  maxProducts?: number;
  className?: string;
}

const ModernHoverProductsSection: React.FC<ModernHoverProductsSectionProps> = ({
  title = "جدیدترین محصولات",
  subtitle = "کشف کنید، انتخاب کنید و لذت ببرید",
  backgroundColor = "bg-white",
  maxProducts = 8,
  className = ""
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');

  useEffect(() => {
    fetchProducts();
  }, [maxProducts]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?sort=latest&limit=${maxProducts}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          setProducts(data.products);
        } else {
          setError('No products found');
        }
      } else {
        setError('Failed to fetch products');
      }
    } catch (error) {
      setError('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSlideChange = async (newIndex: number) => {
    if (isTransitioning || newIndex === currentIndex) return;

    setIsTransitioning(true);
    setAnimationPhase('exiting');

    // انیمیشن خروج محصولات فعلی با تاخیر تدریجی
    await new Promise(resolve => {
      setTimeout(() => {
        setCurrentIndex(newIndex);
        setAnimationPhase('entering');
        resolve(void 0);
      }, 900); // زمان بیشتر برای خروج نرم
    });

    // انیمیشن ورود محصولات جدید
    setTimeout(() => {
      setIsTransitioning(false);
      setAnimationPhase('idle');
    }, 1000); // زمان بیشتر برای ورود نرم
  };

  const nextSlide = () => {
    if (currentIndex < totalProducts - productsPerPage) {
      handleSlideChange(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      handleSlideChange(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <section className={`py-16 ${backgroundColor} ${className} min-h-[700px]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
            <div className="w-20 h-1 bg-gray-200 mx-auto mb-12 rounded-full"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`py-16 ${backgroundColor} ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">خطا در بارگذاری محصولات</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </section>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <section className={`py-16 ${backgroundColor} ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">هیچ محصولی یافت نشد</h2>
          <p className="text-gray-500">لطفاً بعداً تلاش کنید</p>
        </div>
      </section>
    );
  }

  const visibleProducts = products.slice(0, maxProducts);
  const totalProducts = visibleProducts.length;

  // محصولات صفحه فعلی (4 عدد)
  const productsPerPage = 4;
  const startIndex = currentIndex;
  const endIndex = Math.min(startIndex + productsPerPage, totalProducts);
  const currentProducts: (Product | null)[] = visibleProducts.slice(startIndex, endIndex);

  // پر کردن جاهای خالی تا 4 عدد
  const displayProducts: (Product | null)[] = [...currentProducts];
  while (displayProducts.length < productsPerPage && displayProducts.length > 0) {
    displayProducts.push(null);
  }

  return (
    <section className={`py-16 ${backgroundColor} ${className} min-h-[700px]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 min-h-[140px]">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {title}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {subtitle}
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0 || isTransitioning}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-3 hover:bg-white hover:shadow-xl transition-all duration-500 ease-out transform hover:scale-110 ${
              currentIndex === 0 || isTransitioning ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
            }`}
            aria-label="محصول قبلی"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            disabled={currentIndex >= totalProducts - productsPerPage || isTransitioning}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-3 hover:bg-white hover:shadow-xl transition-all duration-500 ease-out transform hover:scale-110 ${
              currentIndex >= totalProducts - productsPerPage || isTransitioning ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
            }`}
            aria-label="محصول بعدی"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Products Grid با انیمیشن تدریجی */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product, index) => {
              if (!product) {
                // جای خالی شفاف
                return (
                  <div key={`empty-${index}`} className="opacity-0 pointer-events-none">
                    <div className="h-96 bg-transparent rounded-2xl"></div>
                  </div>
                );
              }

              // محاسبه تاخیر و کلاس انیمیشن برای هر محصول - حرکت نرم و یکنواخت
              const getAnimationSettings = () => {
                switch (animationPhase) {
                  case 'exiting':
                    return {
                      delay: `${index * 100}ms`,
                      class: 'opacity-0 transform translate-x-8 scale-98'
                    };
                  case 'entering':
                    return {
                      delay: `${index * 100}ms`, // تاخیر یکنواخت برای همه
                      class: 'opacity-100 transform translate-x-0 scale-100'
                    };
                  default:
                    return {
                      delay: '0ms',
                      class: 'opacity-100 transform translate-x-0 scale-100'
                    };
                }
              };

              const animationSettings = getAnimationSettings();

              return (
                <div
                  key={product.id || product._id}
                  className={`
                    group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl
                    transition-all
                    ${animationSettings.class}
                  `}
                  style={{
                    transitionDelay: animationSettings.delay,
                    transitionDuration: '700ms',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {/* Image Section */}
                  <div className="relative w-full h-64 overflow-hidden">
                    <Link
                      href={generateProductUrl(product)}
                      className="block w-full h-full"
                    >
                      <Image
                        className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
                        src={product.imageUrl || product.image || '/placeholder.svg'}
                        alt={product.name}
                        width={300}
                        height={256}
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </Link>

                    {(product.isOnSale || (product.originalPrice && product.price < (product.originalPrice || 0))) && (
                      <span className="absolute top-4 right-4 rounded-full bg-red-500 px-3 py-1 text-center text-sm font-bold text-white shadow-lg z-20">
                        {product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0}%
                      </span>
                    )}

                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20">
                        <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold text-base shadow-2xl">
                          ناموجود
                        </span>
                      </div>
                    )}

                    {/* Overlay Effect */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 z-10"></div>
                  </div>

                  {/* Content Section */}
                  <div className="relative bg-white p-6">
                    <p className="transition duration-300 text-base leading-7 font-bold line-clamp-2 min-h-[60px] pb-3 text-gray-800 group-hover:text-orange-500">
                      <Link href={generateProductUrl(product)}>
                        {product.name}
                      </Link>
                    </p>

                    <div className="flex w-full items-end justify-between pb-5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-start gap-1">
                          <span className="transition duration-300 text-xl leading-7 font-bold text-gray-900">
                            {product.price.toLocaleString('fa-IR')}
                          </span>
                          <span className="transition duration-300 text-[13px] text-gray-600">تومان</span>
                        </div>
                        {product.originalPrice && product.originalPrice !== product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {product.originalPrice.toLocaleString('fa-IR')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-3.5">
                        {product.rating && (
                          <div className="flex items-center justify-center gap-1 bg-orange-50 rounded-full px-3 py-1">
                            <span className="transition duration-300 text-sm leading-7 font-bold text-orange-600">
                              {product.rating.toFixed(1)}
                            </span>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" color="#FFC87B" style={{color: '#FFC87B'}} height="16" width="16">
                              <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buttons - Slide up on hover */}
                    <div className="flex items-center justify-center w-full gap-3 p-0 transform translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                      <Link
                        href={generateProductUrl(product)}
                        className="h-[46px] flex-1"
                      >
                        <button className="cursor-pointer flex items-center justify-center gap-[10px] rounded-xl focus:outline-none bg-gray-100 h-full w-full p-0 text-[14px] font-bold text-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-200 hover:border-gray-300">
                          <div className="flex items-center justify-center">پیش‌نمایش</div>
                        </button>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        disabled={product.stock === 0}
                        className="font-semibold cursor-pointer flex items-center justify-center rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none gap-2.5 hover:bg-orange-600 h-[46px] flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 p-0 text-[14px] text-white disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400"
                      >
                        <div className="flex items-center justify-center">افزودن به سبد خرید</div>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-3 space-x-reverse">
            {Array.from({ length: Math.max(1, Math.ceil((totalProducts - productsPerPage + 1))) }).map((_, index) => (
              <button
                key={index}
                onClick={() => !isTransitioning && handleSlideChange(index)}
                className={`w-4 h-4 rounded-full transition-all duration-500 ease-out ${
                  index === currentIndex 
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 scale-125 shadow-lg' 
                    : 'bg-gray-300 hover:bg-gray-400'
                } ${isTransitioning ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                aria-label={`برو به محصول ${index + 1}`}
                disabled={isTransitioning}
              />
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-2xl hover:from-orange-600 hover:to-yellow-600 transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
          >
            مشاهده همه محصولات
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ModernHoverProductsSection;