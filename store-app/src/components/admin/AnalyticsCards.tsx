'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnalyticsData {
  metrics: {
    totalPageViews: number;
    totalUsers: number;
    totalRevenue: number;
    onlineUsers: number;
    avgSessionDuration: number;
    bounceRate: number;
    pagesBeingViewed: number;
  };
  visitorTracking: {
    todayVisitors: number;
    todayPageViews: number;
    activePages: Array<{ page: string; views: number }>;
  };
  businessMetrics: {
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    lowStockProducts: number;
    totalSessions: number;
  };
  realTime: {
    currentPageViews: number;
    sessionsToday: number;
    activeUsers: number;
  };
  topPages: Array<{ path: string; views: number; title?: string }>;
  trafficSources: Array<{ source: string; visits: number; percentage: number }>;
  lastUpdated: string;
  note?: string;
}

const AnalyticsCards = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      if (!analytics) setLoading(true);
      const response = await fetch('/api/admin/analytics?type=full');
      const result = await response.json();
      
      if (result.success) {
        // حذف فیلد success و period که جزو interface AnalyticsData نیستند
        const { success, period, ...analyticsData } = result;
        setAnalytics(analyticsData as AnalyticsData);
        setError(null);
      } else {
        setError(result.error || 'خطا در دریافت آمار');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-600 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-600 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-lg bg-red-500/10 rounded-2xl p-6 border border-red-500/30 text-center">
        <div className="text-red-400 mb-2">⚠️</div>
        <p className="text-red-300">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="mt-2 px-4 py-2 bg-red-500/20 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const analyticsCards = [
    {
      title: 'بازدیدکنندگان امروز',
      value: (analytics.visitorTracking?.todayVisitors || 0).toLocaleString('fa-IR'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      subtitle: `${analytics.realTime?.sessionsToday || 0} جلسه`,
      href: '/admin/analytics?tab=visitors'
    },
    {
      title: 'بازدید صفحات امروز', 
      value: (analytics.visitorTracking?.todayPageViews || 0).toLocaleString('fa-IR'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
      subtitle: `${analytics.metrics?.pagesBeingViewed || 0} صفحه فعال`,
      href: '/admin/analytics?tab=pages'
    },
    {
      title: 'کاربران آنلاین',
      value: (analytics.metrics?.onlineUsers || 0).toLocaleString('fa-IR'),
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      subtitle: 'در حال حاضر',
      href: '/admin/analytics?tab=realtime'
    },
    {
      title: 'کل سفارشات',
      value: (analytics.businessMetrics?.totalOrders || 0).toLocaleString('fa-IR'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-orange-500 to-orange-600',
      subtitle: `${analytics.businessMetrics?.pendingOrders || 0} در انتظار`,
      href: '/admin/orders'
    },
    {
      title: 'کل کاربران',
      value: (analytics.metrics?.totalUsers || 0).toLocaleString('fa-IR'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'from-pink-500 to-pink-600',
      subtitle: 'ثبت نام شده',
      href: '/admin/users'
    },
    {
      title: 'کل محصولات',
      value: (analytics.businessMetrics?.totalProducts || 0).toLocaleString('fa-IR'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'from-indigo-500 to-indigo-600',
      subtitle: `${analytics.businessMetrics?.lowStockProducts || 0} کم موجود`,
      href: '/admin/products'
    }
  ];

  return (
    <div className="space-y-4">
      {/* آمار اصلی - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {analyticsCards.map((card, index) => (
          <Link key={index} href={card.href}>
            <div className="backdrop-blur-lg bg-white/10 rounded-xl p-3 border border-purple-500/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center text-xl mb-2`}>
                  {card.icon}
                </div>
                <p className="text-gray-300 text-[10px] leading-tight">{card.title}</p>
                <p className="text-lg font-bold text-white mt-1">{card.value}</p>
                <p className="text-gray-400 text-[9px] mt-0.5">{card.subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* آمار تفصیلی - Compact */}
      {analytics.businessMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="backdrop-blur-lg bg-white/10 rounded-xl p-3 border border-purple-500/30">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-white">{Math.floor((analytics.metrics?.avgSessionDuration || 0) / 60)}</p>
              <p className="text-gray-400 text-[10px] leading-tight">میانگین مدت جلسه (دقیقه)</p>
              <p className="text-gray-500 text-[9px] mt-0.5">زمان صرف شده</p>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-xl p-3 border border-purple-500/30">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-lg font-bold text-white">{analytics.metrics?.bounceRate || 0}%</p>
              <p className="text-gray-400 text-[10px] leading-tight">نرخ پرش</p>
              <p className="text-gray-500 text-[9px] mt-0.5">تک صفحه‌ای</p>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-xl p-3 border border-purple-500/30">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-white">{(analytics.metrics?.totalRevenue || 0).toLocaleString('fa-IR')}</p>
              <p className="text-gray-400 text-[10px] leading-tight">کل درآمد</p>
              <p className="text-gray-500 text-[9px] mt-0.5">تومان</p>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-xl p-3 border border-purple-500/30">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-white">{analytics.businessMetrics?.totalSessions || 0}</p>
              <p className="text-gray-400 text-[10px] leading-tight">کل جلسات</p>
              <p className="text-gray-500 text-[9px] mt-0.5">بازدیدها</p>
            </div>
          </div>
        </div>
      )}

      {/* منابع ترافیک - Compact */}
      {analytics.trafficSources && analytics.trafficSources.length > 0 && (
        <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-white">منابع ترافیک واقعی</h3>
            <Link
              href="/admin/analytics?tab=traffic"
              className="text-purple-400 hover:text-purple-300 text-xs font-medium"
            >
              مشاهده همه ←
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {analytics.trafficSources.slice(0, 4).map((source, index) => {
              const getSourceIcon = () => {
                if (source.source === 'مستقیم') {
                  return (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  );
                } else if (source.source === 'جستجوی گوگل') {
                  return (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  );
                } else if (source.source === 'شبکه‌های اجتماعی') {
                  return (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  );
                } else {
                  return (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );
                }
              };
              
              return (
                <div key={index} className="text-center p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="flex justify-center mb-1">
                    {getSourceIcon()}
                  </div>
                  <p className="text-white text-sm font-bold">{source.visits.toLocaleString('fa-IR')}</p>
                  <p className="text-gray-400 text-[10px] leading-tight">{source.source}</p>
                  <p className="text-purple-300 text-[9px] mt-0.5">{source.percentage}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* آخرین به‌روزرسانی */}
      <div className="text-center">
        <p className="text-gray-400 text-xs">
          آخرین به‌روزرسانی: {analytics.lastUpdated ? (() => {
            try {
              const date = new Date(analytics.lastUpdated);
              if (isNaN(date.getTime())) return 'نامشخص';
              const formatted = date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
              return formatted;
            } catch {
              return 'نامشخص';
            }
          })() : 'نامشخص'}
        </p>
        <button 
          onClick={fetchAnalytics}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50 flex items-center justify-center mx-auto space-x-2 space-x-reverse"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>در حال به‌روزرسانی...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>به‌روزرسانی آمار</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AnalyticsCards;