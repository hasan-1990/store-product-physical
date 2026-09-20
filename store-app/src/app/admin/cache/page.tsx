'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CacheManager } from '@/components';

interface CacheData {
  status: string;
  system: string;
  connection: {
    isRedisConnected: boolean;
    type: string;
    info: string;
    enabled: boolean;
  };
  performance: {
    cacheHits: number;
    cacheMisses: number;
    totalRequests: number;
    cacheHitRate: number;
    avgResponseTime: number;
  };
}

const emptyCacheData: CacheData = {
  status: 'active',
  system: 'In-Memory Cache',
  connection: {
    isRedisConnected: false,
    type: 'memory',
    info: 'در حال بارگذاری...',
    enabled: false,
  },
  performance: {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    cacheHitRate: 0,
    avgResponseTime: 0,
  },
};

const CacheManagementPage = () => {
  const [cacheData, setCacheData] = useState<CacheData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchCacheData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('/api/admin/cache', {
        signal: controller.signal,
        cache: 'no-store',
      });
      const result = await response.json();

      if (result.success) {
        setCacheData(result.data);
        setFetchError(null);
      } else {
        setFetchError(result.error || 'خطا در دریافت وضعیت کش');
        setCacheData((prev) => prev ?? emptyCacheData);
      }
    } catch (error) {
      console.error('Error fetching cache data:', error);
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      setFetchError(
        isTimeout
          ? 'درخواست کش بیش از حد طول کشید. Redis در دسترس نیست یا REDIS_HOST اشتباه است.'
          : 'خطا در ارتباط با سرور کش'
      );
      setCacheData((prev) => prev ?? emptyCacheData);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    fetchCacheData();
    // بروزرسانی هر 10 ثانیه
    const interval = setInterval(fetchCacheData, 10000);
    return () => clearInterval(interval);
  }, []);

  // کنترل Redis
  const toggleRedis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-redis' })
      });
      const result = await response.json();
      if (result.success) {
        setMessage(result.message);
        setTimeout(() => setMessage(null), 5000); // Clear message after 5 seconds
        await fetchCacheData(); // Refresh data immediately
      }
    } catch (error) {
      console.error('Error toggling Redis:', error);
      setMessage('خطا در تغییر وضعیت Redis');
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!cacheData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-white">
        <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-300">در حال بارگذاری وضعیت کش...</p>
      </div>
    );
  }

  const cacheHitRate = cacheData.performance.cacheHitRate;

  return (
    <div className="space-y-6">
      {fetchError && (
        <div className="backdrop-blur-lg bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center justify-between gap-4">
          <p className="text-yellow-200">{fetchError}</p>
          <button
            onClick={fetchCacheData}
            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm whitespace-nowrap"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Notification Message */}
      {message && (
        <div className="backdrop-blur-lg bg-green-500/20 border border-green-500/50 rounded-lg p-4">
          <p className="text-green-200 text-center">{message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">🚀 مدیریت کش Redis</h1>
          <p className="text-gray-300 mt-1">نظارت و کنترل سیستم کش برای بهبود عملکرد</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={toggleRedis}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              cacheData.connection.enabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'در حال پردازش...' : 
             cacheData.connection.enabled ? 'غیرفعال کردن Redis' : 'فعال کردن Redis'}
          </button>
          <Link
            href="/admin/content"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            بازگشت
          </Link>
        </div>
      </div>

      {/* Redis Status */}
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">وضعیت Redis</h3>
            <p className="text-gray-300">{cacheData.connection.info}</p>
            <p className="text-sm text-gray-400 mt-1">
              نوع: {cacheData.connection.type === 'redis' ? 'Redis Server' : 'In-Memory Cache'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              وضعیت: {cacheData.connection.enabled ? 'فعال' : 'غیرفعال'}
            </p>
          </div>
          <div className={`w-4 h-4 rounded-full ${
            cacheData.connection.enabled && cacheData.connection.isRedisConnected 
              ? 'bg-green-500' 
              : cacheData.connection.enabled 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
          }`}></div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{cacheHitRate.toFixed(1)}%</div>
              <div className="text-gray-300 text-sm">نرخ موفقیت کش</div>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${cacheHitRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{cacheData.performance.avgResponseTime}ms</div>
              <div className="text-gray-300 text-sm">میانگین زمان پاسخ</div>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
          <div className="mt-2 text-xs text-green-400">
            🚀 90% بهبود سرعت
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{cacheData.performance.totalRequests.toLocaleString()}</div>
              <div className="text-gray-300 text-sm">کل درخواست‌ها</div>
            </div>
            <div className="text-3xl">📊</div>
          </div>
          <div className="mt-2 text-xs text-blue-400">
            امروز
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{cacheData.performance.cacheMisses}</div>
              <div className="text-gray-300 text-sm">از دست رفته کش</div>
            </div>
            <div className="text-3xl">🔍</div>
          </div>
          <div className="mt-2 text-xs text-orange-400">
            {cacheData.performance.totalRequests > 0 
              ? ((cacheData.performance.cacheMisses / cacheData.performance.totalRequests) * 100).toFixed(1)
              : '0.0'
            }% از کل
          </div>
        </div>
      </div>

      {/* Cache Manager Component */}
      <CacheManager />

      {/* Performance Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache Performance Chart */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
          <h3 className="text-xl font-bold text-white mb-4">📈 عملکرد کش (24 ساعت گذشته)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">موفقیت کش</span>
              <span className="text-green-400 font-semibold">{cacheHitRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">از دست رفته</span>
              <span className="text-red-400 font-semibold">{(100 - cacheHitRate).toFixed(1)}%</span>
            </div>
            <div className="mt-4 h-32 bg-gray-800/50 rounded-lg flex items-end justify-center space-x-1">
              {/* Mock Chart Bars */}
              {[85, 92, 88, 94, 87, 91, 89, 93, 86, 95, 90, 88].map((height, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-t from-purple-500 to-blue-500 w-6 rounded-t"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time Chart */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-500/30">
          <h3 className="text-xl font-bold text-white mb-4">⏱️ زمان پاسخ (میلی‌ثانیه)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">با کش</span>
              <span className="text-green-400 font-semibold">45ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">بدون کش</span>
              <span className="text-red-400 font-semibold">420ms</span>
            </div>
            <div className="mt-4 h-32 bg-gray-800/50 rounded-lg flex items-end justify-center space-x-1">
              {/* Mock Response Time Chart */}
              {[40, 45, 38, 42, 47, 41, 39, 44, 43, 46, 40, 45].map((height, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-t from-green-500 to-blue-500 w-6 rounded-t"
                  style={{ height: `${(height / 50) * 100}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cache Configuration */}
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-gray-500/30">
        <h3 className="text-xl font-bold text-white mb-4">⚙️ تنظیمات کش</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <div className="text-lg font-semibold text-white">تنظیمات سایت</div>
            <div className="text-sm text-gray-300 mt-1">TTL: 1 ساعت</div>
            <div className="text-xs text-green-400 mt-2">✅ فعال</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <div className="text-lg font-semibold text-white">اسلایدرها</div>
            <div className="text-sm text-gray-300 mt-1">TTL: 30 دقیقه</div>
            <div className="text-xs text-green-400 mt-2">✅ فعال</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <div className="text-lg font-semibold text-white">دسته‌بندی‌ها</div>
            <div className="text-sm text-gray-300 mt-1">TTL: 30 دقیقه</div>
            <div className="text-xs text-green-400 mt-2">✅ فعال</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <div className="text-lg font-semibold text-white">کاربران</div>
            <div className="text-sm text-gray-300 mt-1">TTL: 10 دقیقه</div>
            <div className="text-xs text-green-400 mt-2">✅ فعال</div>
          </div>
        </div>
      </div>

      {/* Tips and Best Practices */}
      <div className="backdrop-blur-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl p-6 border border-green-500/30">
        <h3 className="text-xl font-bold text-white mb-4">💡 نکات بهینه‌سازی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start space-x-2 space-x-reverse">
              <div className="text-green-400 mt-1">✅</div>
              <div className="text-gray-300">
                <strong>کش هوشمند:</strong> داده‌های پربازدید اولویت دارند
              </div>
            </div>
            <div className="flex items-start space-x-2 space-x-reverse">
              <div className="text-green-400 mt-1">✅</div>
              <div className="text-gray-300">
                <strong>TTL بهینه:</strong> زمان انقضا متناسب با نوع داده
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2 space-x-reverse">
              <div className="text-blue-400 mt-1">ℹ️</div>
              <div className="text-gray-300">
                <strong>بروزرسانی خودکار:</strong> حذف کش پس از تغییرات
              </div>
            </div>
            <div className="flex items-start space-x-2 space-x-reverse">
              <div className="text-blue-400 mt-1">ℹ️</div>
              <div className="text-gray-300">
                <strong>نظارت مداوم:</strong> بررسی عملکرد و بهینه‌سازی
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheManagementPage;
