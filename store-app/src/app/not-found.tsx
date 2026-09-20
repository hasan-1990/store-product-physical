'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ExclamationTriangleIcon, 
  HomeIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  SparklesIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface SuggestedPage {
  title: string;
  url: string;
  description: string;
  icon: React.ComponentType<any>;
}

const Custom404: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedPages, setSuggestedPages] = useState<SuggestedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // انیمیشن ورود
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // ردیابی موس برای افکت parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // صفحات پیشنهادی با آیکون
  const defaultSuggestions: SuggestedPage[] = [
    {
      title: 'صفحه اصلی',
      url: '/',
      description: 'بازگشت به صفحه اصلی فروشگاه',
      icon: HomeIcon
    },
    {
      title: 'محصولات',
      url: '/products',
      description: 'مشاهده تمام محصولات',
      icon: SparklesIcon
    },
    {
      title: 'دسته‌بندی‌ها',
      url: '/categories',
      description: 'مرور دسته‌بندی‌های محصولات',
      icon: DocumentTextIcon
    },
    {
      title: 'بلاگ',
      url: '/blog',
      description: 'مطالعه مقالات و اخبار',
      icon: DocumentTextIcon
    },
    {
      title: 'تماس با ما',
      url: '/contact',
      description: 'ارتباط با پشتیبانی',
      icon: HeartIcon
    }
  ];

  // جستجوی هوشمند صفحات
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // فراخوانی API برای جستجوی صفحات مرتبط
      const response = await fetch(`/api/search/pages?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const results = await response.json();
        setSuggestedPages(results.pages || defaultSuggestions);
      } else {
        setSuggestedPages(defaultSuggestions);
      }
    } catch (error) {
      console.error('خطا در جستجو:', error);
      setSuggestedPages(defaultSuggestions);
    } finally {
      setLoading(false);
    }
  };

  // گزارش 404 به Google Analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: '404 - صفحه یافت نشد',
        page_location: window.location.href,
        custom_map: { custom_parameter: '404_error' }
      });
    }
  }, []);

  // Schema markup برای 404
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "صفحه یافت نشد - 404",
    "description": "متأسفانه صفحه مورد نظر یافت نشد. از لینک‌های زیر برای ادامه کاوش استفاده کنید.",
    "url": typeof window !== 'undefined' ? window.location.href : '',
    "mainEntity": {
      "@type": "Thing",
      "name": "خطای 404",
      "description": "صفحه درخواستی موجود نیست"
    }
  };

  return (
    <>
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema)
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Animated Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating circles */}
          <div 
            className="absolute w-64 h-64 bg-purple-200/30 rounded-full blur-3xl animate-pulse"
            style={{
              top: '10%',
              left: `${20 + mousePosition.x * 0.1}%`,
              transform: 'translate(-50%, -50%)',
              animationDelay: '0s'
            }}
          />
          <div 
            className="absolute w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"
            style={{
              top: '60%',
              right: `${10 + mousePosition.y * 0.1}%`,
              transform: 'translate(50%, -50%)',
              animationDelay: '2s'
            }}
          />
          <div 
            className="absolute w-48 h-48 bg-indigo-200/40 rounded-full blur-2xl animate-pulse"
            style={{
              bottom: '20%',
              left: `${30 + mousePosition.x * 0.05}%`,
              transform: 'translate(-50%, 50%)',
              animationDelay: '4s'
            }}
          />
          
          {/* Floating icons */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-purple-300/20 animate-bounce"
              style={{
                top: `${20 + (i * 15)}%`,
                left: `${10 + (i * 15)}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`
              }}
            >
              <SparklesIcon className="w-8 h-8" />
            </div>
          ))}
        </div>

        {/* Breadcrumb */}
        <div className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-4 transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}>
          <div className="max-w-7xl mx-auto">
            <Breadcrumb 
              items={[
                { name: 'خطای 404', current: true }
              ]}
              className="text-gray-600"
            />
          </div>
        </div>

        {/* محتوای اصلی */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 delay-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
          }`}>
            
            {/* آیکون و پیام اصلی */}
            <div className="mb-12">
              {/* 404 عدد بزرگ انیمیشنی */}
              <div className="relative mb-8">
                <h1 className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse select-none">
                  404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-20 h-20 md:w-32 md:h-32 text-yellow-500 animate-bounce" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                  اوه! صفحه گم شده 🕵️‍♂️
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  به نظر می‌رسه صفحه‌ای که دنبالش می‌گردی تو یه جای دیگه قایم شده!
                  <br />
                  نگران نباش، بذار کمکت کنیم پیداش کنی 🔍
                </p>
              </div>
            </div>

            {/* جستجوی انیمیشنی */}
            <div className={`mb-12 transition-all duration-700 delay-500 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center">
                <MagnifyingGlassIcon className="w-5 h-5 ml-3" />
                بیا چیزی که دنبالشی رو پیدا کنیم
              </h3>                <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                  <div className="flex-1 relative group">
                    <MagnifyingGlassIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="اینجا تایپ کن..."
                      className="w-full pr-12 pl-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-center placeholder-gray-400"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center font-medium"
                  >
                    {loading ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5 ml-3" />
                        جستجو کن
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* دکمه‌های اصلی */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700 delay-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <Link
                href="/"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg font-medium"
              >
                <HomeIcon className="w-6 h-6 ml-3 group-hover:animate-bounce" />
                برو خونه 🏠
              </Link>
              <button
                onClick={() => router.back()}
                className="group inline-flex items-center px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-gray-300 transition-all transform hover:scale-105 active:scale-95 shadow-lg font-medium"
              >
                <ArrowPathIcon className="w-6 h-6 ml-3 group-hover:animate-spin" />
                برگرد عقب ↩️
              </button>
            </div>

            {/* صفحات پیشنهادی انیمیشنی */}
            <div className={`text-right transition-all duration-1000 delay-900 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
            }`}>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 ml-4 text-purple-500" />
                یا از اینجا شروع کن ✨
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(suggestedPages.length > 0 ? suggestedPages : defaultSuggestions).map((page, index) => {
                  const IconComponent = page.icon;
                  return (
                    <Link
                      key={index}
                      href={page.url}
                      className="group block p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-200/50 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 hover:-translate-y-2"
                      style={{
                        animationDelay: `${1000 + index * 150}ms`
                      }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors mr-5">
                          {page.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {page.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* اطلاعات تماس */}
            <div className={`mt-16 transition-all duration-1000 delay-1200 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}>
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-200/30">
                <div className="flex items-center justify-center mb-4">
                  <HeartIcon className="w-8 h-8 text-red-500 animate-pulse ml-4" />
                  <h3 className="text-2xl font-bold text-gray-800">
                    هنوز پیدا نکردی؟ 💙
                  </h3>
                </div>
                <p className="text-gray-600 mb-6 text-lg">
                  اگه فکر می‌کنی این یه اشتباه بوده، خیالت راحت! 
                  <br />
                  تیم ما آماده‌ست کمکت کنه
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg font-medium"
                >
                  <HeartIcon className="w-5 h-5 ml-3" />
                  پشتیبانی عزیز 💕
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`bg-white/60 backdrop-blur-sm border-t border-gray-200/30 py-6 transition-all duration-1000 delay-1400 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-500 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 ml-3" />
              خطای 404 - صفحه یافت نشد | {new Date().getFullYear()} ✨
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Custom404;