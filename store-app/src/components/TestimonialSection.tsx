'use client';

import React, { useState, useEffect } from 'react';
import type { TestimonialSettings } from '@/types';

const TestimonialSection: React.FC = () => {
  const [settings, setSettings] = useState<TestimonialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/testimonial-settings');
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching testimonial settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // اسلاید خودکار
  useEffect(() => {
    if (!settings || !settings.autoPlay || !activeTestimonials.length) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeTestimonials.length);
    }, settings.autoPlayInterval || 5000);

    return () => clearInterval(interval);
  }, [settings]);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!settings || !settings.showSection) {
    return null;
  }

  const activeTestimonials = settings.testimonials
    .filter(t => t.active)
    .sort((a, b) => a.order - b.order);

  if (activeTestimonials.length === 0) {
    return null;
  }

  const currentTestimonial = activeTestimonials[currentIndex];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: settings.backgroundColor || '#ffffff' }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* عنوان بخش */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {settings.sectionTitle}
          </h2>
          {settings.sectionSubtitle && (
            <p className="text-gray-600 text-lg">
              {settings.sectionSubtitle}
            </p>
          )}
        </div>

        {/* کارت نظر */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 relative">
          {/* آیکون نقل‌قول */}
          <div className="absolute top-6 right-6 text-6xl text-gray-200">
            "
          </div>

          {/* محتوای نظر */}
          <div className="relative z-10">
            {/* امتیاز */}
            <div className="flex justify-center mb-4">
              {renderStars(currentTestimonial.rating)}
            </div>

            {/* متن نظر */}
            <p className="text-gray-700 text-lg text-center mb-8 leading-relaxed">
              {currentTestimonial.comment}
            </p>

            {/* اطلاعات مشتری */}
            <div className="flex items-center justify-center gap-4">
              {currentTestimonial.customerAvatar && (
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  <img 
                    src={currentTestimonial.customerAvatar} 
                    alt={currentTestimonial.customerName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="text-center">
                <h4 className="font-semibold text-gray-900">
                  {currentTestimonial.customerName}
                </h4>
                {currentTestimonial.customerRole && (
                  <p className="text-sm text-gray-600">
                    {currentTestimonial.customerRole}
                  </p>
                )}
                {currentTestimonial.verified && (
                  <span className="inline-flex items-center text-xs text-green-600 mt-1">
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    خرید تایید شده
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* دکمه‌های ناوبری */}
        {activeTestimonials.length > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentIndex((prev) => 
                prev === 0 ? activeTestimonials.length - 1 : prev - 1
              )}
              className="w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-gray-700 hover:text-gray-900"
              aria-label="نظر قبلی"
            >
              ←
            </button>
            
            {/* نقاط نشانگر */}
            <div className="flex gap-2">
              {activeTestimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex 
                      ? 'bg-blue-600 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`نظر ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentIndex((prev) => 
                (prev + 1) % activeTestimonials.length
              )}
              className="w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-gray-700 hover:text-gray-900"
              aria-label="نظر بعدی"
            >
              →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialSection;
