'use client';
import { useDynamicContent } from '@/contexts/DynamicContentContext';
import Link from 'next/link';

/**
 * مثال استفاده از محتوای داینامیک در فوتر
 * این کامپوننت متن‌های خود را از دیتابیس می‌خواند
 */
export default function DynamicFooterExample() {
  const { getContent, loading } = useDynamicContent();

  if (loading) {
    return (
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white py-10 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {getContent('site_name', 'فروشگاه آنلاین')}
            </h3>
            
            <p className="text-gray-300 text-sm leading-relaxed">
              {getContent('footer_about', 'درباره فروشگاه ما...')}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span className="text-gray-300">
                  {getContent('contact_email', 'info@example.com')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span className="text-gray-300">
                  {getContent('contact_phone', '021-12345678')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span className="text-gray-300">
                  {getContent('contact_address', 'آدرس شما')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-3 flex items-center">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full ml-2"></span>
              دسترسی سریع
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-purple-400 transition-colors">
                  درباره ما
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-purple-400 transition-colors">
                  تماس با ما
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-purple-400 transition-colors">
                  سوالات متداول
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="text-gray-300 hover:text-purple-400 transition-colors">
                  قوانین بازگشت
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-3 flex items-center">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full ml-2"></span>
              خدمات مشتریان
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/track-order" className="text-gray-300 hover:text-purple-400 transition-colors">
                  پیگیری سفارش
                </Link>
              </li>
              <li>
                <Link href="/shipping-info" className="text-gray-300 hover:text-purple-400 transition-colors">
                  اطلاعات ارسال
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-purple-400 transition-colors">
                  قوانین و مقررات
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-purple-400 transition-colors">
                  حریم خصوصی
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            {getContent('footer_copyright', `© ${new Date().getFullYear()} تمامی حقوق محفوظ است.`)}
          </p>
        </div>
      </div>
    </footer>
  );
}
