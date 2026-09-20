'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// ✅ Lazy load Swiper برای کاهش TBT
export const Swiper = dynamic(
  () => import('swiper/react').then(mod => mod.Swiper as any),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-100 h-64 rounded-lg" /> }
) as any;

export const SwiperSlide = dynamic(
  () => import('swiper/react').then(mod => mod.SwiperSlide as any),
  { ssr: false }
) as any;

// Lazy load Swiper modules
export const loadSwiperModules = () => 
  import('swiper/modules').then(mod => ({
    Navigation: mod.Navigation,
    Pagination: mod.Pagination,
    Autoplay: mod.Autoplay,
    Keyboard: mod.Keyboard,
    A11y: mod.A11y,
  }));

// Lazy load Swiper styles
if (typeof window !== 'undefined') {
  import('swiper/css');
  import('swiper/css/navigation');
  import('swiper/css/pagination');
}
