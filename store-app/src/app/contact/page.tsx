'use client';

import React from 'react';
import { useSEO } from '@/hooks/useSEO';
import Head from 'next/head';

export default function ContactPage() {
  // استفاده از hook SEO
  const { seoData, loading } = useSEO('/contact');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 py-16">
      {/* Meta tags برای SEO */}
      <Head>
        <title>{seoData?.title || 'تماس با ما - فروشگاه آنلاین'}</title>
        <meta name="description" content={seoData?.description || 'راه‌های ارتباط با تیم پشتیبانی و فرم تماس'} />
        {seoData?.keywords && <meta name="keywords" content={seoData.keywords} />}
        <link rel="canonical" href={`${baseUrl}/contact`} />
        <meta name="robots" content="index, follow" />
      </Head>

      {/* عناصر SEO ثابت در HTML - همیشه موجود */}
      <h1 style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {seoData?.h1Title || 'تماس با ما - ارتباط با تیم پشتیبانی'}
      </h1>
      <h2 style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {seoData?.h2Title || 'راه‌های ارتباط و فرم تماس'}
      </h2>
      
      {/* محتوای SEO ثابت */}
      {seoData?.content && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div dangerouslySetInnerHTML={{ __html: seoData.content }} />
        </div>
      )}

      {/* عنوان اصلی صفحه برای نمایش به کاربر (div به جای h1) */}
      <div className="text-4xl font-bold text-purple-700 mb-4 text-center">
        {seoData?.h1Title || 'تماس با ما'}
      </div>
      
      {/* عنوان فرعی برای نمایش به کاربر (div به جای h2) */}
      <div className="text-xl text-gray-700 mb-8 text-center font-semibold">
        {seoData?.h2Title || 'راه‌های ارتباط با تیم پشتیبانی'}
      </div>
      
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up">
        <h3 className="text-2xl font-bold text-purple-700 mb-6 text-center">فرم تماس</h3>
        <p className="text-gray-600 mb-8 text-center">برای ارتباط با تیم پشتیبانی یا ارسال پیام، فرم زیر را پر کنید یا از اطلاعات تماس استفاده کنید.</p>
        <form className="space-y-6">
          <div>
            <label htmlFor="contact-name" className="block text-right text-gray-700 mb-2">نام شما</label>
            <input
              id="contact-name"
              name="contact-name"
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="نام"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-right text-gray-700 mb-2">ایمیل</label>
            <input
              id="contact-email"
              name="contact-email"
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="ایمیل"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-right text-gray-700 mb-2">پیام شما</label>
            <textarea
              id="contact-message"
              name="contact-message"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              rows={4}
              placeholder="متن پیام"
            />
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300">ارسال پیام</button>
        </form>
        <div className="mt-8 text-center text-gray-500 text-sm">
          <div>ایمیل: support@example.com</div>
          <div>تلفن: 021-12345678</div>
        </div>
      </div>
    </div>
  );
}
