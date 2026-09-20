'use client';

import React, { useEffect } from 'react';
import ProductCard from './ProductCard';

interface Product {
  _id: string;
  id?: string;
  name: string;
  price: number;
  imageUrl: string;
  [key: string]: any;
}

interface SwiperProductWrapperProps {
  products: Product[];
  sectionId: string;
  tabId: string;
}

// Lazy load Swiper فقط client-side
const SwiperProductWrapper: React.FC<SwiperProductWrapperProps> = ({ products, sectionId, tabId }) => {
  const [isClient, setIsClient] = React.useState(false);
  const [Swiper, setSwiper] = React.useState<any>(null);
  const [SwiperSlide, setSwiperSlide] = React.useState<any>(null);
  const [modules, setModules] = React.useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamic import Swiper CSS (side-effect imports)
    if (typeof window !== 'undefined') {
      require('swiper/css');
      require('swiper/css/navigation');
      require('swiper/css/pagination');
      require('swiper/css/free-mode');
    }
    
    // Dynamic import Swiper components
    Promise.all([
      import('swiper/react'),
      import('swiper/modules'),
    ]).then(([swiperReact, swiperModules]) => {
      setSwiper(() => swiperReact.Swiper);
      setSwiperSlide(() => swiperReact.SwiperSlide);
      setModules({
        Navigation: swiperModules.Navigation,
        Pagination: swiperModules.Pagination,
        Autoplay: swiperModules.Autoplay,
        FreeMode: swiperModules.FreeMode,
      });
    });
  }, []);

  if (!isClient || !Swiper || !SwiperSlide || !modules) {
    // Fallback: نمایش Grid ساده تا Swiper لود شود
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    );
  }

  return (
    <>
      <Swiper
        modules={[modules.Navigation, modules.Pagination, modules.Autoplay, modules.FreeMode]}
        spaceBetween={40}
        slidesPerView="auto"
        freeMode={true}
        loop={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          nextEl: `.custom-next-${sectionId}-${tabId}`,
        }}
        pagination={{
          clickable: true,
          el: `.custom-pagination-${sectionId}-${tabId}`,
        }}
        breakpoints={{
          320: {
            slidesPerView: 1.2,
            spaceBetween: 28,
          },
          480: {
            slidesPerView: 1.5,
            spaceBetween: 32,
          },
          768: {
            slidesPerView: 2.5,
            spaceBetween: 36,
          },
          1024: {
            slidesPerView: 3.5,
            spaceBetween: 40,
          },
          1280: {
            slidesPerView: 4,
            spaceBetween: 40,
          },
        }}
        className="!pb-16"
      >
        {products.map((product: Product, index: number) => (
          <SwiperSlide key={product._id || product.id} className="!w-80">
            <div 
              className="animate-fade-in-up" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Custom Pagination */}
      <div className={`custom-pagination-${sectionId}-${tabId} flex justify-center mt-8`}></div>
    </>
  );
};

export default SwiperProductWrapper;
