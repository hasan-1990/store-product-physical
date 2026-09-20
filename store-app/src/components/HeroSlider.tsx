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

interface HeroSliderProps {
  slides?: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

// حذف اسلایدهای پیش‌فرض - فقط از اسلایدرهای دیتابیس استفاده می‌شود
const defaultSlides: HeroSlide[] = [];

const HeroSlider = ({ 
  slides = [], 
  autoPlay = true, 
  autoPlayInterval = 8000,
  className = ''
}: HeroSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    // Force reflow so the width reset applies before animation restarts
    void progressEl.getBoundingClientRect();
    progressEl.style.transition = `width ${autoPlayInterval}ms linear`;
    progressEl.style.width = '100%';
  }, [autoPlay, autoPlayInterval]);

  // Load slides from API
  useEffect(() => {
    const loadSlides = async () => {
      try {
        // Use cache for better performance
        const response = await fetch(`/api/admin/slider`, {
          next: { revalidate: 300 } // Cache for 5 minutes
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            // Filter only active slides
            const activeSlides = data.data.filter((slide: any) => slide.active);
            if (activeSlides.length > 0) {
              setHeroSlides(activeSlides);
            } else {
              // اگر اسلاید فعالی نبود، از دیفالت استفاده کن
              setHeroSlides(defaultSlides);
            }
          } else {
            // اگر هیچ اسلایدی نبود، از دیفالت استفاده کن
            setHeroSlides(defaultSlides);
          }
        } else {
          // در صورت خطا، از دیفالت استفاده کن
          setHeroSlides(defaultSlides);
        }
      } catch (error) {
        console.error('Error loading slides:', error);
        // در صورت خطا، از دیفالت استفاده کن
        setHeroSlides(defaultSlides);
      } finally {
        // بعد از لود (موفق یا ناموفق)، loading را false کن
        setIsLoading(false);
      }
    };

    loadSlides();

    // Listen for custom events to refresh slides when updated from admin
    const handleSliderUpdate = () => {
      console.log('Slider updated, reloading...');
      loadSlides();
    };

    window.addEventListener('sliderUpdated', handleSliderUpdate);
    
    return () => {
      window.removeEventListener('sliderUpdated', handleSliderUpdate);
    };
  }, []);

  // Use either API slides or provided slides, fallback to defaults
  const activeSlides = slides.length > 0 ? slides : heroSlides;

  useEffect(() => {
    if (activeSlides.length === 0) return;
    setCurrentIndex((prev) => {
      if (prev >= activeSlides.length) {
        return 0;
      }
      return prev;
    });
  }, [activeSlides.length]);

  useEffect(() => {
    if (autoPlay && activeSlides.length > 1) {
      let slideTimeout: NodeJS.Timeout;
      
      resetProgressAnimation();
      
      // Set timeout to change slide
      slideTimeout = setTimeout(() => {
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
        setTimeout(() => setIsAnimating(false), 1200);
      }, autoPlayInterval);

      return () => {
        clearTimeout(slideTimeout);
      };
    }
  }, [autoPlay, autoPlayInterval, activeSlides.length, currentIndex, resetProgressAnimation]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    resetProgressAnimation();
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    setTimeout(() => setIsAnimating(false), 1200);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    resetProgressAnimation();
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    setTimeout(() => setIsAnimating(false), 1200);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    resetProgressAnimation();
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 1200);
  };

  // نمایش اسکلتون در حالت لودینگ
  if (isLoading) {
    return (
      <div className={`hero-slider relative overflow-hidden ${className} bg-gray-200 animate-pulse`} style={{ minHeight: '500px', height: '60vh', maxHeight: '600px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4 space-y-6">
            <div className="h-12 bg-gray-300 rounded-lg w-3/4 mx-auto"></div>
            <div className="h-8 bg-gray-300 rounded-lg w-2/3 mx-auto"></div>
            <div className="h-12 bg-gray-300 rounded-full w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSlides.length === 0) {
    // اگر اسلایدی نباشد، هیچ چیز نمایش نده
    return null;
  }

  const currentSlide = activeSlides[currentIndex];

  // فقط current و next slide رو render کن برای بهبود performance
  return (
    <div className={`hero-slider relative overflow-hidden ${className}`} style={{ minHeight: '500px', height: '60vh', maxHeight: '600px' }}>
      {/* Background Images - فقط current slide */}
      <div className="absolute inset-0">
        {activeSlides
          .filter(slide => slide.imageUrl || slide.image)
          .map((slide, index) => {
            // فقط current slide رو نشون بده
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
        {activeSlides
          .filter(slide => slide.imageUrl || slide.image) // Only show dots for slides with images
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
          {/* Glossy effect like video player */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/50 to-pink-400/50 blur-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroSlider);
