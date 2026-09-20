'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';
import type { Swiper as SwiperType } from 'swiper';

interface Product {
  _id: string;
  id?: string;
  name: string;
  image?: string;
  imageUrl?: string;
  price: number;
  oldPrice?: number;
  slug?: string;
  category?: string;
}

interface Product3DCarouselProps {
  products?: Product[];
}

const ensureCoverflowItems = (items: Product[]): Product[] => {
  if (items.length >= 3) return items;
  if (items.length === 0) return [];
  const targetCount = 3;
  return Array.from({ length: targetCount }, (_, index) => items[index % items.length]);
};

const Product3DCarousel = ({ products = [] }: Product3DCarouselProps) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [SwiperComponent, setSwiperComponent] = useState<any>(null);
  const [SwiperSlideComponent, setSwiperSlideComponent] = useState<any>(null);
  const [modules, setModules] = useState<any>(null);

  const iranianProducts = useMemo(() => products.slice(0, 4), [products]);
  const shopThemesRaw = useMemo(() => products.slice(4, 12), [products]);
  const coverflowSource = shopThemesRaw.length > 0 ? shopThemesRaw : iranianProducts;
  const coverflowThemes = useMemo(() => ensureCoverflowItems(coverflowSource), [coverflowSource]);

  // Lazy load Swiper
  useEffect(() => {
    if (coverflowThemes.length === 0) return;
    
    // Dynamic import CSS (side-effect imports)
    if (typeof window !== 'undefined') {
      require('swiper/css');
      require('swiper/css/effect-coverflow');
    }
    
    // Dynamic import Swiper components
    Promise.all([
      import('swiper/react'),
      import('swiper/modules'),
    ]).then(([swiperReact, swiperModules]) => {
      setSwiperComponent(() => swiperReact.Swiper);
      setSwiperSlideComponent(() => swiperReact.SwiperSlide);
      setModules({
        EffectCoverflow: swiperModules.EffectCoverflow,
        Autoplay: swiperModules.Autoplay,
      });
    });
  }, [coverflowThemes.length]);

  if (coverflowThemes.length === 0) {
    return null;
  }

  if (!SwiperComponent || !SwiperSlideComponent || !modules) {
    // Loading fallback
    return (
      <section className="py-4 md:py-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
      </section>
    );
  }

  return (
    <>
      <section className="py-4 md:py-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 max-w-4xl mx-auto">
            <div className="flex-1 relative rounded-[20px] lg:rounded-[24px] overflow-hidden shadow-[0px_20px_40px_rgba(234,166,58,0.35)] bg-gradient-to-br from-orange-400 via-orange-300 to-amber-300">
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" viewBox="0 0 326 440" fill="none">
                  <path d="M0 300 Q100 250 200 300 T400 300 L400 440 L0 440 Z" fill="white" fillOpacity="0.3" />
                  <circle cx="50" cy="80" r="100" fill="white" fillOpacity="0.1" />
                  <circle cx="280" cy="350" r="80" fill="white" fillOpacity="0.15" />
                </svg>
              </div>
              <div className="relative z-10 p-4 lg:p-6 h-full min-h-[260px] flex flex-col">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {iranianProducts.map((product) => {
                    const productImage = product.imageUrl || product.image || '/placeholder.png';
                    const productSlug = product.slug || product._id;
                    return (
                      <Link
                        key={product._id || product.id}
                        href={`/products/${productSlug}`}
                        className="bg-white/95 rounded-[12px] p-1.5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                      >
                        <div className="aspect-square rounded-[10px] overflow-hidden relative">
                          <OptimizedImage
                            src={productImage}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-auto">
                  <h3 className="text-white text-base lg:text-lg font-black mb-1.5 drop-shadow-lg">محصولات ویژه</h3>
                  <p className="text-white/90 text-[10px] lg:text-xs mb-3 drop-shadow">پشتیبانی درجه یک</p>
                  <div className="flex gap-1.5">
                    <Link
                      href="/products"
                      className="flex-1 bg-white hover:bg-white/90 text-orange-600 font-bold text-[10px] lg:text-xs py-1.5 px-2 rounded-[12px] text-center transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      مشاهده همه
                    </Link>
                    <Link
                      href="/products?featured=true"
                      className="flex-1 bg-white hover:bg-white/90 text-orange-600 font-bold text-[10px] lg:text-xs py-1.5 px-2 rounded-[12px] text-center transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      محصولات ویژه
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 relative rounded-[24px] lg:rounded-[28px] overflow-hidden border border-white/10 bg-gradient-to-b from-[#0f172a] via-[#111b34] to-[#fbbf24]/35 shadow-[0px_28px_65px_rgba(15,23,42,0.45)]">
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-[-40px] right-[-40px] w-56 h-56 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-60px] left-[-30px] w-72 h-72 bg-gradient-to-tr from-orange-400 via-amber-400 to-yellow-300 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5"></div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f59e0b]/35 via-[#f59e0b]/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10 p-4 lg:p-6 h-full min-h-[260px] flex flex-col">
                <div className="flex-1 relative mb-4">
                  <SwiperComponent
                    onSwiper={(swiper: SwiperType) => {
                      swiperRef.current = swiper;
                    }}
                    effect="coverflow"
                    centeredSlides
                    grabCursor
                    slidesPerView="auto"
                    spaceBetween={-50}
                    loop={coverflowThemes.length > 1}
                    loopAdditionalSlides={4}
                    autoplay={{
                      delay: 2600,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true
                    }}
                    coverflowEffect={{
                      rotate: 32,
                      stretch: -45,
                      depth: 240,
                      modifier: 1.25,
                      slideShadows: true
                    }}
                    breakpoints={{
                      768: { spaceBetween: -60 },
                      1024: { spaceBetween: -90 }
                    }}
                    modules={[modules.EffectCoverflow, modules.Autoplay]}
                    className="h-full overflow-visible product-carousel-swiper"
                  >
                    {coverflowThemes.map((theme, index) => {
                      const themeImage = theme.imageUrl || theme.image || '/placeholder.png';
                      const themeSlug = theme.slug || theme._id;
                      const themePrice = theme.price ? theme.price.toLocaleString('fa-IR') : '0';

                      return (
                        <SwiperSlideComponent
                          key={`${theme._id || theme.id}-${index}`}
                          className="h-full !w-[220px] sm:!w-[240px] md:!w-[260px] lg:!w-[280px]"
                        >
                          <Link
                            href={`/products/${themeSlug}`}
                            className="block h-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                          >
                            <div className="theme-card relative h-full rounded-[22px] overflow-hidden shadow-[0px_24px_45px_rgba(15,23,42,0.6)] border border-white/5 bg-white/5 backdrop-blur-[1px]">
                              <OptimizedImage
                                src={themeImage}
                                alt={theme.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/25 to-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 lg:p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-orange-600 font-bold text-xs shadow-md ring-2 ring-white/70">
                                    {theme.name.charAt(0)}
                                  </div>
                                  <div className="text-white">
                                    <h4 className="font-bold text-xs lg:text-sm leading-tight">{theme.name}</h4>
                                    <p className="text-[10px] lg:text-[11px] text-white/80">{themePrice} تومان</p>
                                  </div>
                                </div>
                                <span className="inline-flex items-center justify-center px-3 py-2 w-full rounded-[12px] bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-gray-900 font-bold text-[10px] lg:text-xs transition-all duration-300 group-hover:from-amber-400 group-hover:to-orange-500 group-hover:scale-[1.04] shadow-lg">
                                  مشاهده محصول
                                </span>
                              </div>
                            </div>
                          </Link>
                        </SwiperSlideComponent>
                      );
                    })}
                  </SwiperComponent>
                </div>

                <div className="mt-auto space-y-2">
                  <h3 className="text-white text-base lg:text-lg font-black">قالب های برتر فروشگاهی</h3>
                  <p className="text-white/70 text-[10px] lg:text-xs">راه اندازی یک فروشگاه مدرن و خاص</p>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 hover:from-amber-400 hover:to-orange-500 text-gray-900 font-bold text-[10px] lg:text-xs py-2 rounded-[12px] transition-all duration-300 hover:scale-[1.03] shadow-lg"
                  >
                    مشاهده همه
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        :global(.product-carousel-swiper) {
          overflow: visible;
        }
        :global(.product-carousel-swiper .swiper-slide) {
          transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1),
            opacity 0.6s ease, filter 0.6s ease;
          opacity: 0.35;
          filter: blur(1px);
        }
        :global(.product-carousel-swiper .swiper-slide-next),
        :global(.product-carousel-swiper .swiper-slide-prev) {
          opacity: 0.65;
          filter: blur(0.5px);
        }
        :global(.product-carousel-swiper .swiper-slide-active) {
          opacity: 1;
          filter: none;
        }
        :global(.product-carousel-swiper .theme-card) {
          transform: translateY(14px) scale(0.9);
          transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.6s ease;
        }
        :global(.product-carousel-swiper .swiper-slide-prev .theme-card),
        :global(.product-carousel-swiper .swiper-slide-next .theme-card) {
          transform: translateY(6px) scale(0.95);
        }
        :global(.product-carousel-swiper .swiper-slide-active .theme-card) {
          transform: translateY(-4px) scale(1.04);
          box-shadow: 0px 28px 50px rgba(15, 23, 42, 0.6);
        }
      `}</style>
    </>
  );
};

export default Product3DCarousel;
