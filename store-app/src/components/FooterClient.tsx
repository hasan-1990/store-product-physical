'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface FooterClientProps {}

const FooterClient: React.FC<FooterClientProps> = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [trustBadge, setTrustBadge] = useState<{ enabled: boolean; code: string; position: 'left' | 'right' } | null>(null);

  // بارگذاری تنظیمات نماد اعتماد
  useEffect(() => {
    const fetchTrustBadge = async () => {
      try {
        const response = await fetch('/api/admin/trust-badge');
        const result = await response.json();
        if (result.success && result.data && result.data.enabled) {
          setTrustBadge(result.data);
        }
      } catch (error) {
        console.error('Error fetching trust badge:', error);
      }
    };
    fetchTrustBadge();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setSubscribeStatus('loading');
    
    // شبیه‌سازی ارسال - می‌تونی بعداً API واقعی وصل کنی
    setTimeout(() => {
      setSubscribeStatus('success');
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white py-10 px-4">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">فروشگاه دیجیتال</h3>
            </div>
            
            {/* توضیحات از تنظیمات سایت خوانده می‌شود - می‌توان اضافه کرد */}

            {/* Support Links */}
            <div className="pt-2">
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full ml-2"></span>
                دسترسی سریع
              </h4>
              <ul className="grid grid-cols-2 gap-2">
                <li>
                  <Link 
                    href="/about" 
                    className="text-gray-300 hover:text-purple-400 transition-colors duration-200 text-base"
                  >
                    درباره ما
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="text-gray-300 hover:text-purple-400 transition-colors duration-200 text-base"
                  >
                    تماس با ما
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/faq" 
                    className="text-gray-300 hover:text-purple-400 transition-colors duration-200 text-base"
                  >
                    سوالات متداول
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/return-policy" 
                    className="text-gray-300 hover:text-purple-400 transition-colors duration-200 text-base"
                  >
                    شرایط مرجوعی
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Subscription */}
          <div className="space-y-3 max-w-md">
            <div>
              <h4 className="text-lg font-semibold mb-2 flex items-center">
                <span className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full ml-2"></span>
                عضویت در خبرنامه
              </h4>
              <p className="text-gray-400 text-sm mb-3">
                از جدیدترین محصولات و تخفیف‌های ویژه باخبر شوید
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ایمیل خود را وارد کنید"
                  className="flex-1 px-3 py-2 rounded-md bg-white/10 border border-purple-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-sm"
                  disabled={subscribeStatus === 'loading'}
                />
                <button
                  type="submit"
                  disabled={subscribeStatus === 'loading' || !email}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-md font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {subscribeStatus === 'loading' ? 'در حال ارسال...' : 'عضویت'}
                </button>
              </div>
              
              {subscribeStatus === 'success' && (
                <p className="text-green-400 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  با موفقیت عضو خبرنامه شدید!
                </p>
              )}
            </form>

            {/* Social Links */}
            <div className="pt-4">
              <p className="text-gray-400 text-sm mb-3">ما را دنبال کنید:</p>
              <div className="flex gap-3">
                <a 
                  href="#" 
                  className="w-10 h-10 bg-white/10 hover:bg-purple-500/20 rounded-lg flex items-center justify-center transition-all duration-200 group"
                  title="اینستاگرام"
                >
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-white/10 hover:bg-blue-500/20 rounded-lg flex items-center justify-center transition-all duration-200 group"
                  title="تلگرام"
                >
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-white/10 hover:bg-green-500/20 rounded-lg flex items-center justify-center transition-all duration-200 group"
                  title="واتساپ"
                >
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700/50 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Trust Badge - Left */}
            {trustBadge && trustBadge.position === 'left' && (
              <div 
                className="trust-badge-container"
                dangerouslySetInnerHTML={{ __html: trustBadge.code }}
              />
            )}

            {/* Copyright */}
            <div className="flex-1 text-center">
              <p className="text-gray-400 text-sm">
                © {currentYear} تمامی حقوق محفوظ است
              </p>
              
              <div className="flex justify-center gap-4 text-sm mt-2">
                <Link 
                  href="/privacy-policy" 
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  حریم خصوصی
                </Link>
                <span className="text-gray-600">•</span>
                <Link 
                  href="/terms-of-service" 
                  className="text-gray-400 hover:text-purple-400 transition-colors"
                >
                  شرایط استفاده
                </Link>
              </div>
            </div>

            {/* Trust Badge - Right */}
            {trustBadge && trustBadge.position === 'right' && (
              <div 
                className="trust-badge-container"
                dangerouslySetInnerHTML={{ __html: trustBadge.code }}
              />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterClient;
