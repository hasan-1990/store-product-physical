'use client';

import { useState } from 'react';

interface CacheStats {
  status: string;
  system: string;
  stats: {
    totalKeys: number;
    memoryUsage: string;
    cacheType: string;
  };
  keys: string[];
  message: string;
  timestamp: string;
}

const CacheManager = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [message, setMessage] = useState<string>('');

  const fetchCacheStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cache');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
        setMessage('✅ وضعیت کش دریافت شد');
      } else {
        setMessage('❌ خطا در دریافت وضعیت کش');
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      setMessage('❌ خطا در دریافت وضعیت کش');
    } finally {
      setLoading(false);
    }
  };

  const clearAllCache = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cache', {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage('🧹 تمام کش‌ها پاک شدند');
        await fetchCacheStats(); // Refresh stats
      } else {
        setMessage('❌ خطا در پاک کردن کش');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      setMessage('❌ خطا در پاک کردن کش');
    } finally {
      setLoading(false);
    }
  };

  const warmCache = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cache/warm', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage('🔥 کش‌ها گرم شدند');
        await fetchCacheStats(); // Refresh stats
      } else {
        setMessage('❌ خطا در گرم کردن کش');
      }
    } catch (error) {
      console.error('Error warming cache:', error);
      setMessage('❌ خطا در گرم کردن کش');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">🚀 مدیریت کش Redis</h2>
          <p className="text-gray-300 mt-1">مدیریت و نظارت بر سیستم کش</p>
        </div>
        <button
          onClick={fetchCacheStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
        >
          {loading ? '⏳' : '🔄'} بررسی وضعیت
        </button>
      </div>

      {/* Cache Stats */}
      {stats && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">📊 وضعیت کش</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.stats.totalKeys}</div>
              <div className="text-sm text-gray-300">کلیدهای کش</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.stats.memoryUsage}</div>
              <div className="text-sm text-gray-300">استفاده از حافظه</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.system}</div>
              <div className="text-sm text-gray-300">نوع کش</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.status}</div>
              <div className="text-sm text-gray-300">وضعیت</div>
            </div>
          </div>
          
          {/* Cache Keys Preview */}
          {stats.keys && stats.keys.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h4 className="text-sm font-semibold text-white mb-2">🔑 کلیدهای موجود در کش:</h4>
              <div className="bg-gray-900/50 rounded p-3 max-h-32 overflow-y-auto">
                {stats.keys.map((key, index) => (
                  <div key={index} className="text-xs text-gray-300 font-mono py-1 border-b border-gray-700 last:border-b-0">
                    {key}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cache Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={clearAllCache}
          disabled={loading}
          className="p-4 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-500/20 border border-red-500/50 rounded-lg transition-colors text-white"
        >
          <div className="text-2xl mb-2">🧹</div>
          <div className="font-medium">پاک کردن تمام کش‌ها</div>
          <div className="text-sm text-gray-300 mt-1">
            حذف تمام داده‌های کش شده
          </div>
        </button>

        <button
          onClick={warmCache}
          disabled={loading}
          className="p-4 bg-orange-500/20 hover:bg-orange-500/30 disabled:bg-gray-500/20 border border-orange-500/50 rounded-lg transition-colors text-white"
        >
          <div className="text-2xl mb-2">🔥</div>
          <div className="font-medium">گرم کردن کش‌ها</div>
          <div className="text-sm text-gray-300 mt-1">
            پیش‌بارگذاری داده‌های مهم
          </div>
        </button>
      </div>

      {/* Cache Types Info */}
      <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">📋 انواع کش‌های فعال</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="text-center p-2 bg-purple-500/20 rounded border border-purple-500/30">
            <div className="text-purple-300">⚙️ تنظیمات</div>
            <div className="text-xs text-gray-400 mt-1">1 ساعت</div>
          </div>
          <div className="text-center p-2 bg-blue-500/20 rounded border border-blue-500/30">
            <div className="text-blue-300">🖼️ اسلایدرها</div>
            <div className="text-xs text-gray-400 mt-1">30 دقیقه</div>
          </div>
          <div className="text-center p-2 bg-green-500/20 rounded border border-green-500/30">
            <div className="text-green-300">📂 دسته‌بندی‌ها</div>
            <div className="text-xs text-gray-400 mt-1">30 دقیقه</div>
          </div>
          <div className="text-center p-2 bg-yellow-500/20 rounded border border-yellow-500/30">
            <div className="text-yellow-300">👥 کاربران</div>
            <div className="text-xs text-gray-400 mt-1">10 دقیقه</div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
          <div className="text-white text-sm">{message}</div>
        </div>
      )}

      {/* Performance Benefits */}
      <div className="mt-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">⚡ مزایای کش Redis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-green-400 font-medium">🚀 سرعت بیشتر</div>
            <div className="text-gray-300">کاهش 90% زمان پاسخ</div>
          </div>
          <div>
            <div className="text-blue-400 font-medium">💾 کاهش بار دیتابیس</div>
            <div className="text-gray-300">کمتر از 10% درخواست به MongoDB</div>
          </div>
          <div>
            <div className="text-purple-400 font-medium">🎯 تجربه بهتر</div>
            <div className="text-gray-300">بارگذاری فوری صفحات</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheManager;
