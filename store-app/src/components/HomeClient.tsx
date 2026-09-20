'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import DynamicBannerSections from '@/components/DynamicBannerSections';
import { useAnalytics } from '@/hooks/useAnalytics';
import HeroSlider from '@/components/HeroSlider';
import AnimatedCategoriesClient from '@/components/AnimatedCategoriesClient';
import ModernProductShowcase from '@/components/ModernProductShowcase';
import MultipleHoverProductsSections from '@/components/MultipleHoverProductsSections';
import BlogSection from '@/components/BlogSection';

interface HomeClientProps {
  siteSettings: any;
  featuredCategories: any[];
  seoData: any;
  siteHeaderSettings: any;
  whyUsSettings: any;
  productsIntroSettings: any;
  heroSliderServer?: React.ReactNode;
  blogSectionServer?: React.ReactNode;
  animatedCategoriesServer?: React.ReactNode;
  homeTopDiscountSections?: React.ReactNode;
  homeMiddleDiscountSections?: React.ReactNode;
}

export default function HomeClient({
  siteSettings,
  featuredCategories,
  seoData,
  siteHeaderSettings,
  whyUsSettings,
  productsIntroSettings,
  heroSliderServer,
  blogSectionServer,
  animatedCategoriesServer,
  homeTopDiscountSections,
  homeMiddleDiscountSections
}: HomeClientProps) {
  const [error, setError] = useState<string | null>(null);

  const { trackPageView } = useAnalytics();

  const memoizedCategories = useMemo(() => featuredCategories || [], [featuredCategories]);

  useEffect(() => {
    // Defer analytics tracking
    const timer = setTimeout(() => trackPageView(), 100);
    return () => clearTimeout(timer);
  }, [trackPageView]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطا در بارگذاری</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full">
      <DynamicBannerSections position="before-hero" />

      {heroSliderServer ? (
        <section className="relative" style={{ minHeight: '500px', height: '60vh', maxHeight: '600px' }}>
          {heroSliderServer}
        </section>
      ) : (
        <section className="relative" style={{ minHeight: '500px', height: '60vh', maxHeight: '600px' }}>
          <HeroSlider autoPlay={true} autoPlayInterval={6000} />
        </section>
      )}

      <DynamicBannerSections position="after-hero" />
      <DynamicBannerSections position="before-categories" />

      <section className="bg-gradient-to-br from-gray-50 to-purple-50 py-10">
        {animatedCategoriesServer ? (
          animatedCategoriesServer
        ) : (
          <AnimatedCategoriesClient categories={memoizedCategories.map(cat => ({
            ...cat,
            _id: cat.id || cat._id
          }))} />
        )}
      </section>

      <DynamicBannerSections position="after-categories" />

      {homeTopDiscountSections}

      <DynamicBannerSections position="before-products" />

      <ModernProductShowcase />
      
      {homeMiddleDiscountSections}

      {/* نمایش بخش‌های محصولات با افکت خاص از پنل ادمین */}
      <MultipleHoverProductsSections position="home-top" />
      <MultipleHoverProductsSections position="home-middle" />
      <MultipleHoverProductsSections position="home-bottom" />

      <DynamicBannerSections position="after-products" />

      {blogSectionServer ? (
        blogSectionServer
      ) : (
        <BlogSection limit={3} showTitle={true} />
      )}
    </main>
  );
}
