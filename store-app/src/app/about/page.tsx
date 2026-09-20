'use client';

import { useState, useEffect } from 'react';
import SEOManager from '@/components/SEOManager';
import Head from 'next/head';

interface Settings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  
  // تنظیمات صفحه درباره ما
  hero_title?: string;
  hero_subtitle?: string;
  hero_badge_text?: string;
  story_title?: string;
  story_subtitle?: string;
  story_paragraph_1?: string;
  story_paragraph_2?: string;
  story_paragraph_3?: string;
  mission_title?: string;
  mission_description?: string;
  values_title?: string;
  values_subtitle?: string;
  value_1_title?: string;
  value_1_description?: string;
  value_2_title?: string;
  value_2_description?: string;
  value_3_title?: string;
  value_3_description?: string;
  contact_title?: string;
  contact_subtitle?: string;
  social_title?: string;
  social_subtitle?: string;
  
  [key: string]: string | undefined;
}

export default function AboutPage() {
  const [settings, setSettings] = useState<Settings>({
    site_name: 'فروشگاه هاب',
    site_description: 'مقصد نهایی تجارت الکترونیک شما',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    
    // مقادیر پیش‌فرض برای صفحه درباره ما
    hero_title: 'درباره فروشگاه هاب',
    hero_subtitle: 'مقصد نهایی تجارت الکترونیک شما',
    hero_badge_text: 'به وب‌سایت ما خوش آمدید',
    story_title: 'داستان ما',
    story_subtitle: 'داستان موفقیت ما',
    story_paragraph_1: 'فروشگاه هاب با هدف ارائه بهترین تجربه خرید آنلاین برای مشتریان عزیز تأسیس شد. ما معتقدیم که خرید آنلاین باید ساده، ایمن و لذت‌بخش باشد.',
    story_paragraph_2: 'از روز اول، تمرکز ما بر کیفیت محصولات، سرویس مشتریان عالی و ایجاد تجربه‌ای فراموش‌نشدنی برای هر خریدار بوده است.',
    story_paragraph_3: 'امروز، ما افتخار داریم که به عنوان یکی از معتبرترین پلتفرم‌های تجارت الکترونیک، خدمات خود را به هزاران مشتری راضی ارائه می‌دهیم.',
    mission_title: 'ماموریت ما',
    mission_description: 'ما متعهد هستیم که بهترین محصولات را با بالاترین کیفیت و مناسب‌ترین قیمت‌ها به دست شما برسانیم و تجربه‌ای بی‌نظیر از خرید آنلاین را برای شما فراهم کنیم.',
    values_title: 'ارزش‌های ما',
    values_subtitle: 'اصولی که ما را در مسیر خدمت‌رسانی بهتر راهنمایی می‌کند',
    value_1_title: 'رضایت مشتری',
    value_1_description: 'رضایت و خوشحالی شما بالاترین اولویت ماست. ما تمام تلاش خود را می‌کنیم تا تجربه‌ی خرید شما عالی باشد.',
    value_2_title: 'کیفیت بی‌نظیر',
    value_2_description: 'همه محصولات با دقت انتخاب و کنترل کیفیت می‌شوند تا شما بهترین ها را دریافت کنید.',
    value_3_title: 'نوآوری مداوم',
    value_3_description: 'همیشه در حال بهبود و ارائه راه‌حل‌های جدید هستیم تا تجربه بهتری برای شما فراهم کنیم.',
    contact_title: 'با ما در تماس باشید',
    contact_subtitle: 'ما همیشه آماده پاسخگویی به سوالات شما هستیم',
    social_title: 'ما را در شبکه‌های اجتماعی دنبال کنید',
    social_subtitle: 'آخرین اخبار، محصولات جدید و تخفیف‌های ویژه را در شبکه‌های اجتماعی ما دنبال کنید'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/public-settings');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setSettings(prev => ({ ...prev, ...result.data }));
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  return (
    <>
      <Head>
        <link rel="canonical" href={`${baseUrl}/about`} />
        <meta name="robots" content="index, follow" />
      </Head>
      <style jsx global>{`
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
      <SEOManager 
        url="/about" 
        fallbackTitle={`درباره ${settings.site_name} - فروشگاه آنلاین`}
        fallbackDescription={settings.site_description || 'درباره ما و خدمات فروشگاه آنلاین'}
      >
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white py-16 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block p-1 px-4 bg-white/20 rounded-full backdrop-blur-sm mb-4 animate-fade-in-up">
            <span className="text-white font-semibold text-sm">{settings.hero_badge_text || 'به وب‌سایت ما خوش آمدید'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
            {settings.hero_title || `درباره ${settings.site_name}`}
          </h1>
          <p className="text-lg text-purple-100 max-w-2xl mx-auto animate-fade-in-up delay-200">
            {settings.hero_subtitle || settings.site_description}
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-3">{settings.story_subtitle || 'داستان موفقیت ما'}</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
              {settings.story_title || 'داستان ما'}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-left bg-gradient-to-br from-gray-50 to-indigo-50 p-8 rounded-3xl border border-indigo-100 shadow-lg shadow-indigo-100/20">
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                {settings.story_paragraph_1 && (
                  <p className="relative pr-6">
                    <span className="absolute right-0 top-0 text-indigo-600 font-bold text-xl">»</span>
                    {settings.story_paragraph_1}
                  </p>
                )}
                {settings.story_paragraph_2 && (
                  <p className="relative pr-6">
                    <span className="absolute right-0 top-0 text-indigo-600 font-bold text-xl">»</span>
                    {settings.story_paragraph_2}
                  </p>
                )}
                {settings.story_paragraph_3 && (
                  <p className="relative pr-6">
                    <span className="absolute right-0 top-0 text-indigo-600 font-bold text-xl">»</span>
                    {settings.story_paragraph_3}
                  </p>
                )}
              </div>
            </div>

            <div className="animate-fade-in-right">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform duration-300 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10"></div>
                <div className="text-center mb-6 relative z-10">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{settings.mission_title || 'ماموریت ما'}</h3>
                </div>
                <p className="text-white/90 text-center leading-relaxed relative z-10 text-sm">
                  {settings.mission_description || 'ما متعهد هستیم که بهترین محصولات را با بالاترین کیفیت و مناسب‌ترین قیمت‌ها به دست شما برسانیم و تجربه‌ای بی‌نظیر از خرید آنلاین را برای شما فراهم کنیم.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-3">اصول و باورهای ما</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
              {settings.values_title || 'ارزش‌های ما'}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mb-4"></div>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              {settings.values_subtitle || 'اصولی که ما را در مسیر خدمت‌رسانی بهتر راهنمایی می‌کند'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group animate-fade-in-up delay-200">
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-300 h-full flex flex-col">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{settings.value_1_title || 'رضایت مشتری'}</h3>
                <p className="text-gray-600 leading-relaxed flex-grow text-sm">
                  {settings.value_1_description || 'رضایت و خوشحالی شما بالاترین اولویت ماست. ما تمام تلاش خود را می‌کنیم تا تجربه‌ی خرید شما عالی باشد.'}
                </p>
                <div className="w-10 h-1 bg-blue-500 mt-4"></div>
              </div>
            </div>

            <div className="group animate-fade-in-up delay-300">
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100 hover:border-green-300 h-full flex flex-col">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{settings.value_2_title || 'کیفیت بی‌نظیر'}</h3>
                <p className="text-gray-600 leading-relaxed flex-grow text-sm">
                  {settings.value_2_description || 'همه محصولات با دقت انتخاب و کنترل کیفیت می‌شوند تا شما بهترین ها را دریافت کنید.'}
                </p>
                <div className="w-10 h-1 bg-green-500 mt-4"></div>
              </div>
            </div>

            <div className="group animate-fade-in-up delay-400">
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 hover:border-purple-300 h-full flex flex-col">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{settings.value_3_title || 'نوآوری مداوم'}</h3>
                <p className="text-gray-600 leading-relaxed flex-grow text-sm">
                  {settings.value_3_description || 'همیشه در حال بهبود و ارائه راه‌حل‌های جدید هستیم تا تجربه بهتری برای شما فراهم کنیم.'}
                </p>
                <div className="w-10 h-1 bg-purple-500 mt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-3">پشتیبانی و ارتباط</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700">
              {settings.contact_title || 'با ما در تماس باشید'}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 mx-auto mb-4"></div>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              {settings.contact_subtitle || 'ما همیشه آماده پاسخگویی به سوالات شما هستیم'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {settings.contact_email && (
              <div className="group animate-fade-in-up delay-200">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-pink-100 hover:border-pink-300 overflow-hidden relative h-full">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-100 to-red-50 rounded-full opacity-50 -mr-12 -mt-12"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 relative">ایمیل</h3>
                  <p className="text-gray-600 mb-3 relative font-medium hover:text-pink-600 transition-colors duration-300 text-sm">
                    <a href={`mailto:${settings.contact_email}`} className="inline-block">
                      {settings.contact_email}
                    </a>
                  </p>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
                </div>
              </div>
            )}

            {settings.contact_phone && (
              <div className="group animate-fade-in-up delay-300">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-100 hover:border-blue-300 overflow-hidden relative h-full">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-full opacity-50 -mr-12 -mt-12"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 relative">تلفن</h3>
                  <p className="text-gray-600 mb-3 relative font-medium hover:text-blue-600 transition-colors duration-300 text-sm">
                    <a href={`tel:${settings.contact_phone}`} className="inline-block" dir="ltr">
                      {settings.contact_phone}
                    </a>
                  </p>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                </div>
              </div>
            )}

            {settings.contact_address && (
              <div className="group animate-fade-in-up delay-400">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-100 hover:border-green-300 overflow-hidden relative h-full">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-50 rounded-full opacity-50 -mr-12 -mt-12"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 relative">آدرس</h3>
                  <p className="text-gray-600 mb-3 relative text-sm">{settings.contact_address}</p>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                </div>
              </div>
            )}
          </div>

          {/* Social Media Links */}
          <div className="mt-16 animate-fade-in-up delay-500 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-3">ارتباط با ما</div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700 mb-3">
                {settings.social_title || 'ما را در شبکه‌های اجتماعی دنبال کنید'}
              </h3>
              <div className="w-12 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">{settings.social_subtitle || 'آخرین اخبار، محصولات جدید و تخفیف‌های ویژه را در شبکه‌های اجتماعی ما دنبال کنید'}</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-700/20 rounded-xl transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  <div className="w-12 h-12 bg-white shadow-lg hover:shadow-blue-200/50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 transition-all duration-300 transform group-hover:translate-y-[-3px] relative">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="text-center mt-2 text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors duration-300">فیسبوک</div>
                </a>
              )}

              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-700/20 rounded-xl transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  <div className="w-12 h-12 bg-white shadow-lg hover:shadow-pink-200/50 border border-pink-100 rounded-xl flex items-center justify-center text-pink-600 transition-all duration-300 transform group-hover:translate-y-[-3px] relative">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 448 512">
                      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
                    </svg>
                  </div>
                  <div className="text-center mt-2 text-xs font-medium text-gray-600 group-hover:text-pink-600 transition-colors duration-300">اینستاگرام</div>
                </a>
              )}

              {settings.twitter_url && (
                <a
                  href={settings.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-300/20 to-cyan-600/20 rounded-xl transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  <div className="w-12 h-12 bg-white shadow-lg hover:shadow-blue-200/50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-400 transition-all duration-300 transform group-hover:translate-y-[-3px] relative">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <div className="text-center mt-2 text-xs font-medium text-gray-600 group-hover:text-blue-400 transition-colors duration-300">توییتر</div>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
      </div>
    </SEOManager>
    </>
  );
}
