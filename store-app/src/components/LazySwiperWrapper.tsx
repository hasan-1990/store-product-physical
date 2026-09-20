'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load Swiper CSS بعد از mount
if (typeof window !== 'undefined') {
  import('swiper/css');
  import('swiper/css/navigation');
  import('swiper/css/pagination');
  import('swiper/css/free-mode');
}

// Lazy load Swiper components
const SwiperComponent = dynamic(
  () => import('swiper/react').then((mod) => ({ default: mod.Swiper })),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div> }
);

const SwiperSlideComponent = dynamic(
  () => import('swiper/react').then((mod) => ({ default: mod.SwiperSlide })),
  { ssr: false }
);

export { SwiperComponent as Swiper, SwiperSlideComponent as SwiperSlide };

// Export default for dynamic import
export default SwiperComponent;
