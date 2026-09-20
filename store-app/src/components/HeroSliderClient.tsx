'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import OptimizedImage from './OptimizedImage';
import Link from 'next/link';

interface HeroSlide {
  id: string;
  image: string;
  imageUrl?: string;
  title: string;
  subtitle: string;
  description?: string;
  backgroundType?: 'image' | 'video' | 'gradient';
  videoUrl?: string;
  gradientColors?: string[];
  buttonText: string;
  buttonLink: string;
  buttonStyle?: 'default' | 'outline' | 'ghost' | 'gradient';
  buttonColor?: string;
  theme: 'dark' | 'light';
  animation?: {
    entrance: 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'rotate';
    duration: number;
    delay: number;
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  };
  textPosition?: 'left' | 'center' | 'right' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  textColor?: string;
  textShadow?: boolean;
  overlay?: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  parallax?: boolean;
  autoHeight?: boolean;
  active?: boolean;
}

interface HeroSliderClientProps {
  slides: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const HeroSliderClient = ({ 
  slides = [], 
  autoPlay = true, 
  autoPlayInterval = 8000,
  className = ''
}: HeroSliderClientProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const resetProgressAnimation = useCallback(() => {
    const progressEl = progressRef.current;
    if (!progressEl) return;
    if (!autoPlay) {
      progressEl.style.transition = 'none';
      progressEl.style.width = '0%';
      return;
    }

    progressEl.style.transition = 'none';
    progressEl.style.width = '0%';
    // Force reflow
    void progressEl.getBoundingClientRect();
    progressEl.style.transition = `width ${autoPlayInterval}ms linear`;
    progressEl.style.width = '100%';
  }, [autoPlay, autoPlayInterval]);

  useEffect(() => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => {
      if (prev >= slides.length) {
        return 0;
      }
      return prev;
    });
  }, [slides.length]);

  useEffect(() => {
    if (autoPlay && slides.length > 1) {
      let slideTimeout: NodeJS.Timeout;
      
      resetProgressAnimation();
      
      slideTimeout = setTimeout(() => {
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setTimeout(() => setIsAnimating(false), 1200);
      }, autoPlayInterval);

      return () => {
        clearTimeout(slideTimeout);
      };
    }
  }, [autoPlay, autoPlayInterval, slides.length, currentIndex, resetProgressAnimation]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    resetProgressAnimation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 1200);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    resetProgressAnimation();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 1200);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    resetProgressAnimation();
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 1200);
  };

  if (slides.length === 0) {
    return (
      <div className={`hero-slider relative overflow-hidden ${className} flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600`} style={{ minHeight: '500px', height: '60vh', maxHeight: '600px' }}>
        <div className="text-center text-white max-w-2xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            به فروشگاه ما خوش آمدید
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            بهترین محصولات را با بهترین قیمت پیدا کنید
          </p>
          <Link
            href="/products"
            className="inline-block bg-white text-purple-600 font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            مشاهده محصولات
          </Link>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className={`hero-slider relative overflow-hidden ${className}`} style={{ minHeight: '500px', height: '60vh', maxHeight: '600px' }}>
      {/* Background Images */}
      <div className="absolute inset-0">
        {slides
          .filter(slide => slide.imageUrl || slide.image)
          .map((slide, index) => {
            if (index !== currentIndex) return null;
            
            const imageSrc = slide.imageUrl || slide.image;
            
            return (
              <div
                key={`${slide.id}-${index}`}
                className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out opacity-100"
              >
                <OptimizedImage
                  src={imageSrc}
                  alt={slide.title || 'Slider image'}
                  fill
                  className="object-cover"
                  priority={true}
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/40"></div>
              </div>
            );
          })}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto px-4">
          <div className={`transform transition-all duration-[1000ms] delay-200 ${
            isAnimating ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
          }`}>
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${
              currentSlide.theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="inline-block animate-fade-in-up">
                {currentSlide.title}
              </span>
            </h1>
            <p className={`text-xl md:text-2xl mb-8 ${
              currentSlide.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <span className="inline-block animate-fade-in-up delay-100">
                {currentSlide.subtitle}
              </span>
            </p>
            <div className="animate-fade-in-up delay-200">
              <Link
                href={currentSlide.buttonLink}
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
              >
                {currentSlide.buttonText}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute right-8 md:right-8 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 hover:scale-110 z-10"
        disabled={isAnimating}
        aria-label="اسلاید قبلی"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      <button
        onClick={handleNext}
        className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 hover:scale-110 z-10"
        disabled={isAnimating}
        aria-label="اسلاید بعدی"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
        {slides
          .filter(slide => slide.imageUrl || slide.image)
          .map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-700 ${
                index === currentIndex 
                  ? 'w-12 h-3 bg-white rounded-full' 
                  : 'w-3 h-3 bg-white/50 hover:bg-white/75 rounded-full'
              }`}
              disabled={isAnimating}
              aria-label={`برو به اسلاید ${index + 1}`}
            />
          ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-white/20 shadow-sm">
        <div 
          ref={progressRef}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 relative shadow-sm"
          style={{ width: '0%', willChange: 'width' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/50 to-pink-400/50 blur-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroSliderClient);
