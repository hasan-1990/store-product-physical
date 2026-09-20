'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface AnalyticsData {
  metrics: {
    totalPageViews: number;
    totalUsers: number;
    totalRevenue: number;
    onlineUsers: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  visitorTracking: {
    todayVisitors: number;
    todayPageViews: number;
    activePages: Array<{ page: string; views: number }>;
  };
  topPages: Array<{ path: string; views: number; title?: string }>;
  trafficSources: Array<{ source: string; visits: number; percentage: number }>;
  realTime: {
    currentPageViews: number;
    sessionsToday: number;
    activeUsers: number;
  };
  lastUpdated: string;
  note?: string;
}

interface ComprehensiveAnalytics {
  daily: Array<{
    date: string;
    uniqueVisitors: number;
    totalPageViews: number;
    topPages: Array<{ page: string; views: number }>;
  }>;
  weekly: {
    uniqueVisitors: number;
    totalPageViews: number;
    topPages: Array<{ page: string; views: number }>;
  };
  monthly: {
    uniqueVisitors: number;
    totalPageViews: number;
    topPages: Array<{ page: string; views: number }>;
  };
}

const AnalyticsPage = () => {
  // const searchParams = useSearchParams();
  // const activeTab = searchParams.get('tab') || 'overview';

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchAnalytics();
    fetchComprehensiveAnalytics();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchAnalytics();
      if (selectedPeriod === 'daily') {
        fetchComprehensiveAnalytics();
      }
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      const raw = await response.json();

      // API returns { success: true, data: {...} } OR previously we stored whole raw
      const payload = raw?.data && raw.success ? raw.data : raw;

      // Ensure lastUpdated exists and is valid ISO
      if (!payload.lastUpdated) {
        payload.lastUpdated = new Date().toISOString();
      } else {
        const d = new Date(payload.lastUpdated);
        if (isNaN(d.getTime())) {
          payload.lastUpdated = new Date().toISOString();
        }
      }

      if (raw.success) {
        setAnalytics(payload);
        setError(null);
      } else {
        setError(raw.error || 'خطا در دریافت آمار');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComprehensiveAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics?type=visitor-tracking&period=comprehensive');
      const data = await response.json();
      
      if (data.success) {
        setComprehensiveData(data.data);
      }
    } catch (err) {
      console.error('Error fetching comprehensive analytics:', err);
    }
  };

  // const tabs = [
  //   { id: 'overview', name: 'نمای کلی', icon: '📊' },
  //   { id: 'visitors', name: 'بازدیدکنندگان', icon: '👥' },
  //   { id: 'pages', name: 'صفحات', icon: '📄' },
  //   { id: 'realtime', name: 'زمان واقعی', icon: '🟢' },
  //   { id: 'traffic', name: 'منابع ترافیک', icon: '🚀' }
  // ];

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">آمار و تحلیل‌ها</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 animate-pulse">
              <div className="h-20 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">آمار و تحلیل‌ها</h1>
        <div className="backdrop-blur-lg bg-red-500/10 rounded-2xl p-6 border border-red-500/30 text-center">
          <div className="text-red-400 mb-2 text-4xl">⚠️</div>
          <p className="text-red-300 text-lg">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-6 py-3 bg-red-500/20 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">بازدیدکنندگان امروز</p>
              <p className="text-3xl font-bold text-white mt-2">{(analytics.visitorTracking?.todayVisitors || 0).toLocaleString('fa-IR')}</p>
              <p className="text-gray-400 text-xs mt-1">IP منحصربفرد</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-2xl">
              👥
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">بازدید صفحات امروز</p>
              <p className="text-3xl font-bold text-white mt-2">{(analytics.visitorTracking?.todayPageViews || 0).toLocaleString('fa-IR')}</p>
              <p className="text-gray-400 text-xs mt-1">تعداد کل صفحات</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-2xl">
              📊
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">کاربران آنلاین</p>
              <p className="text-3xl font-bold text-white mt-2">{(analytics.metrics?.onlineUsers || 0).toLocaleString('fa-IR')}</p>
              <p className="text-gray-400 text-xs mt-1">در حال حاضر</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-2xl">
              🟢
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">نرخ پرش</p>
              <p className="text-3xl font-bold text-white mt-2">{analytics.metrics?.bounceRate || 0}%</p>
              <p className="text-gray-400 text-xs mt-1">میانگین</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-2xl">
              📈
            </div>
          </div>
        </div>
      </div>

      {/* صفحات پربازدید امروز */}
      {analytics.visitorTracking?.activePages && analytics.visitorTracking.activePages.length > 0 && (
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
          <h3 className="text-xl font-bold text-white mb-6">📄 صفحات پربازدید امروز</h3>
          <div className="space-y-3">
            {analytics.visitorTracking.activePages.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-lg font-bold text-purple-300">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{page.page}</p>
                    <p className="text-gray-400 text-sm">
                      {page.page === '/' ? 'صفحه اصلی' : 
                       page.page.includes('/products') ? 'محصولات' :
                       page.page.includes('/blog') ? 'وبلاگ' :
                       page.page.includes('/categories') ? 'دسته‌بندی‌ها' :
                       page.page.includes('/profile') ? 'پروفایل' :
                       page.page.includes('/login') ? 'ورود' :
                       page.page.includes('/wishlist') ? 'علاقه‌مندی‌ها' :
                       page.page}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-white text-xl font-bold">{page.views.toLocaleString('fa-IR')}</p>
                  <p className="text-gray-400 text-sm">بازدید</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* نمودار روزانه */}
      {comprehensiveData && (
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">📊 آمار ۷ روز گذشته</h3>
            <div className="flex space-x-2 space-x-reverse">
              {['daily', 'weekly', 'monthly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period as any)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedPeriod === period
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                  }`}
                >
                  {period === 'daily' ? 'روزانه' : period === 'weekly' ? 'هفتگی' : 'ماهانه'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {comprehensiveData.daily.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="text-2xl">📅</div>
                  <div>
                    <p className="text-white font-medium">{new Date(day.date).toLocaleDateString('fa-IR')}</p>
                    <p className="text-gray-400 text-sm">{day.date}</p>
                  </div>
                </div>
                <div className="flex space-x-8 space-x-reverse">
                  <div className="text-center">
                    <p className="text-white font-bold">{day.uniqueVisitors.toLocaleString('fa-IR')}</p>
                    <p className="text-gray-400 text-xs">بازدیدکننده</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold">{day.totalPageViews.toLocaleString('fa-IR')}</p>
                    <p className="text-gray-400 text-xs">بازدید صفحه</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Helper: safe date formatting (prevents "Invalid Date" flash)
  const formatLastUpdated = (value: string | undefined) => {
    if (!value) return null;
    // Accept ISO, timestamp numbers, or Date-like strings
    let d: Date | null = null;
    if (/^\d+$/.test(value)) {
      // numeric timestamp (ms or seconds)
      const num = Number(value);
      d = new Date(num > 1e12 ? num : num * 1000);
    } else {
      d = new Date(value);
    }
    if (!d || isNaN(d.getTime())) return null;
    try {
      return d.toLocaleString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return d.toISOString();
    }
  };

  const lastUpdatedFormatted = formatLastUpdated(analytics.lastUpdated);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">آمار بازدید سایت</h1>
          {lastUpdatedFormatted ? (
            <p className="text-gray-300 mt-1">آخرین به‌روزرسانی: {lastUpdatedFormatted}</p>
          ) : (
            <p className="text-gray-400 mt-1">زمان به‌روزرسانی نامعتبر - در حال بازسازی...</p>
          )}
        </div>
        <button 
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-4 py-2 bg-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
        </button>
      </div>

      {/* Main Overview */}
      {renderOverviewTab()}

      {/* Note */}
      {analytics.note && (
        <div className="backdrop-blur-lg bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="text-amber-400">ℹ️</div>
            <p className="text-amber-300 text-sm">{analytics.note}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;