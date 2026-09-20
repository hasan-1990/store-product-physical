'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useModules } from '@/hooks/useModules';

const ModulesPage = () => {
  const { modules, loading, error, toggleModule } = useModules();
  const [toggling, setToggling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const moduleConfigs = [
    {
      key: 'seo',
      name: 'سئو و بهینه‌سازی',
      description: 'مدیریت تنظیمات سئو، تحلیل صفحات و بهینه‌سازی موتورهای جستجو',
      href: '/admin/seo',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-purple-600',
    },
    {
      key: 'analytics',
      name: 'آنالیتیکس و گزارش',
      description: 'تحلیل آمار سایت، رفتار کاربران و گزارشات فروش',
      href: '/admin/analytics',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'from-green-500 to-teal-600',
    },
    {
      key: 'cache',
      name: 'مدیریت کش',
      description: 'مدیریت کش Redis، پاک‌سازی و بهینه‌سازی سرعت',
      href: '/admin/cache',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      color: 'from-orange-500 to-red-600',
    },
    {
      key: 'content',
      name: 'مدیریت محتوا',
      description: 'مدیریت صفحات، بلاگ و محتوای سایت',
      href: '/admin/content',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-600',
    },
    {
      key: 'sms',
      name: 'پیامک و اطلاع‌رسانی',
      description: 'ارسال پیامک، ایمیل و اطلاع‌رسانی به کاربران',
      href: '/admin/sms',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-cyan-500 to-blue-600',
    },
    {
      key: 'blog',
      name: 'بلاگ',
      description: 'مدیریت مطالب، نویسندگان و دسته‌بندی‌های بلاگ',
      href: '/admin/blog',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-600',
    },
    {
      key: 'shipping',
      name: 'حمل و نقل',
      description: 'مدیریت روش‌های ارسال، قیمت‌گذاری و تنظیمات حمل و نقل',
      href: '/admin/shipping',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      color: 'from-emerald-500 to-green-600',
    },
    {
      key: 'discounts',
      name: 'کدهای تخفیف',
      description: 'مدیریت کدهای تخفیف، تنظیم محدودیت‌ها و تحلیل آمار استفاده',
      href: '/admin/discount-codes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'from-yellow-500 to-orange-600',
    },
    {
      key: 'security',
      name: 'مدیریت امنیت',
      description: 'تنظیمات امنیتی، لاگ‌ها و نظارت بر سیستم',
      href: '/admin/security',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'from-red-500 to-pink-600',
    },
    {
      key: 'paymentGateway',
      name: 'درگاه پرداخت',
      description: 'مدیریت درگاه‌های پرداخت، تنظیمات و گزارشات تراکنش‌ها',
      href: '/admin/payment-gateway',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'from-teal-500 to-cyan-600',
    },
    {
      key: 'trustBadge',
      name: 'نماد اعتماد',
      description: 'مدیریت نمایش نماد اعتماد الکترونیکی در فوتر سایت',
      href: '/admin/trust-badge',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'from-green-500 to-emerald-600',
    },
    {
      key: 'brands',
      name: 'مدیریت برندها',
      description: 'مدیریت برندهای محصولات، لوگوها و اطلاعات برندها',
      href: '/admin/modules/brands',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'from-pink-500 to-rose-600',
    },
    {
      key: 'cronJobs',
      name: 'وظایف خودکار (Cron Jobs)',
      description: 'مدیریت وظایف زمان‌بندی شده، اتوماسیون فرآیندها و نظارت بر اجرای وظایف',
      href: '/admin/cron-jobs',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-violet-500 to-purple-600',
    }
  ];

  const handleToggleModule = async (moduleKey: string, currentStatus: boolean) => {
    setToggling(moduleKey);
    const success = await toggleModule(moduleKey, !currentStatus);
    if (success) {
      // ریفرش صفحه برای به‌روزرسانی منو
      window.location.reload();
    }
    setToggling(null);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-white text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-red-400 text-lg">خطا: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">مدیریت ماژول‌ها</h1>
            <p className="text-gray-300">فعال‌سازی، غیرفعال‌سازی و مدیریت ماژول‌های سیستم</p>
          </div>
          
          {/* دکمه‌های تغییر نمایش */}
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              شبکه‌ای
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              لیستی
            </button>
          </div>
        </div>
      </div>

      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" 
        : "space-y-4"
      }>
        {moduleConfigs.map((moduleConfig) => {
          const moduleData = modules[moduleConfig.key];
          const isEnabled = moduleData?.enabled ?? true;
          const isToggling = toggling === moduleConfig.key;
          const canOpenModule = isEnabled || moduleConfig.key === 'cache';

          return viewMode === 'grid' ? (
            // نمایش شبکه‌ای
            <div
              key={moduleConfig.key}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${moduleConfig.color} p-6 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                isEnabled ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white">
                    {moduleConfig.icon}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isEnabled 
                        ? 'bg-green-500/30 text-green-200 border border-green-400/50' 
                        : 'bg-red-500/30 text-red-200 border border-red-400/50'
                    }`}>
                      {isEnabled ? 'فعال' : 'غیرفعال'}
                    </span>
                    <button
                      onClick={() => handleToggleModule(moduleConfig.key, isEnabled)}
                      disabled={isToggling}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        isEnabled 
                          ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                          : 'bg-gray-500 shadow-lg shadow-gray-500/30'
                      } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      {isToggling ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      )}
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{moduleConfig.name}</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">{moduleConfig.description}</p>
                
                {canOpenModule && (
                  <Link
                    href={moduleConfig.href}
                    className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    ورود به ماژول
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12l5-5m0 0l-5-5m5 5H9" />
                    </svg>
                  </Link>
                )}
              </div>
              
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full transform -translate-x-6 translate-y-6 group-hover:scale-125 transition-transform duration-500"></div>
              
              {/* Disabled overlay */}
              {!isEnabled && moduleConfig.key !== 'cache' && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="text-white/60 text-sm font-medium">غیرفعال</div>
                </div>
              )}
            </div>
          ) : (
            // نمایش لیستی
            <div
              key={moduleConfig.key}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-r ${moduleConfig.color} p-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
                isEnabled ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-white p-2 bg-white/20 rounded-lg">
                    {moduleConfig.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{moduleConfig.name}</h3>
                    <p className="text-white/80 text-sm">{moduleConfig.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isEnabled 
                      ? 'bg-green-500/30 text-green-200 border border-green-400/50' 
                      : 'bg-red-500/30 text-red-200 border border-red-400/50'
                  }`}>
                    {isEnabled ? 'فعال' : 'غیرفعال'}
                  </span>
                  
                  <button
                    onClick={() => handleToggleModule(moduleConfig.key, isEnabled)}
                    disabled={isToggling}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      isEnabled 
                        ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                        : 'bg-gray-500 shadow-lg shadow-gray-500/30'
                    } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                  >
                    {isToggling ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    )}
                  </button>
                  
                  {canOpenModule && (
                    <Link
                      href={moduleConfig.href}
                      className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                      ورود به ماژول
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12l5-5m0 0l-5-5m5 5H9" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Disabled overlay */}
              {!isEnabled && moduleConfig.key !== 'cache' && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="text-white/60 text-sm font-medium">غیرفعال</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* آمار کلی */}
        <div className="p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            آمار ماژول‌ها
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-500/20 rounded-xl border border-green-500/30">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {Object.values(modules).filter(m => m.enabled).length}
              </div>
              <div className="text-green-300 text-sm">ماژول فعال</div>
            </div>
            <div className="text-center p-4 bg-red-500/20 rounded-xl border border-red-500/30">
              <div className="text-3xl font-bold text-red-400 mb-1">
                {Object.values(modules).filter(m => !m.enabled).length}
              </div>
              <div className="text-red-300 text-sm">ماژول غیرفعال</div>
            </div>
          </div>
        </div>

        {/* راهنما */}
        <div className="p-6 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            راهنما
          </h2>
          <ul className="space-y-3 text-gray-300 text-sm">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
              <span>ماژول‌های فعال در منوی کناری نمایش داده می‌شوند</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
              <span>ماژول‌های غیرفعال از منو حذف می‌شوند</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
              <span>تغییرات بلافاصله اعمال می‌شود</span>
            </li>
          </ul>
        </div>

        {/* تنظیمات نمایش */}
        <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl border border-indigo-500/30 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            تنظیمات نمایش
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <span className="text-gray-300 text-sm">حالت نمایش فعلی:</span>
              <span className="text-white font-medium">
                {viewMode === 'grid' ? 'شبکه‌ای' : 'لیستی'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <span className="text-gray-300 text-sm">تعداد ستون‌ها (شبکه‌ای):</span>
              <span className="text-white font-medium">5 ستون</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulesPage;