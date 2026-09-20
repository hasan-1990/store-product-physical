'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DiscountProductsSettings = () => {
  const [settings, setSettings] = useState({
    active: true,
    title: 'محصولات تخفیفی',
    subtitle: 'بهترین پیشنهادات ویژه برای شما',
    maxProducts: 6,
    showDiscountBadge: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/discount-products-settings');
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/discount-products-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      if (data.success) {
        alert('تنظیمات با موفقیت ذخیره شد!');
      } else {
        alert('خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-white mt-4">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">تنظیمات محصولات تخفیفی</h1>
          <p className="text-gray-300 mt-1">مدیریت نمایش و تنظیمات بخش محصولات تخفیفی در صفحه اصلی</p>
        </div>
        <Link
          href="/admin/content"
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          بازگشت
        </Link>
      </div>

      {/* Settings Form */}
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-orange-500/30">
        <div className="space-y-6">
          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-white">فعال بودن بخش</h3>
              <p className="text-gray-400 text-sm">نمایش یا عدم نمایش بخش محصولات تخفیفی در صفحه اصلی</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.active}
                onChange={(e) => updateSetting('active', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">عنوان بخش</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => updateSetting('title', e.target.value)}
              placeholder="محصولات تخفیفی"
              className="w-full px-4 py-3 bg-gray-800/50 border border-orange-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">زیرعنوان بخش</label>
            <input
              type="text"
              value={settings.subtitle}
              onChange={(e) => updateSetting('subtitle', e.target.value)}
              placeholder="بهترین پیشنهادات ویژه برای شما"
              className="w-full px-4 py-3 bg-gray-800/50 border border-orange-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Max Products */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">حداکثر تعداد محصولات</label>
            <select
              value={settings.maxProducts}
              onChange={(e) => updateSetting('maxProducts', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-gray-800/50 border border-orange-500/30 rounded-lg text-white focus:outline-none focus:border-orange-400 transition-colors"
            >
              <option value={6}>6 محصول</option>
              <option value={12}>12 محصول</option>
              <option value={18}>18 محصول</option>
              <option value={24}>24 محصول</option>
            </select>
            <p className="text-gray-400 text-xs mt-1">تعداد محصولات قابل نمایش در هر صفحه اسلایدر</p>
          </div>

          {/* Show Discount Badge */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-white">نمایش برچسب تخفیف</h3>
              <p className="text-gray-400 text-sm">نمایش درصد تخفیف روی کارت محصولات</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showDiscountBadge}
                onChange={(e) => updateSetting('showDiscountBadge', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Preview Section */}
          <div className="border-t border-gray-600 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">پیش‌نمایش تنظیمات</h3>
            <div className="bg-gray-800/30 rounded-lg p-6 space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{settings.title}</h2>
                <p className="text-gray-300">{settings.subtitle}</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {Array.from({ length: Math.min(settings.maxProducts, 6) }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg aspect-square flex flex-col relative">
                    {settings.showDiscountBadge && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                        %{20 + index * 5}
                      </div>
                    )}
                    <div className="flex-1 p-2">
                      <div className="w-full h-full bg-gray-200 rounded"></div>
                    </div>
                    <div className="p-2 pt-1">
                      <h4 className="text-xs font-medium text-gray-900 text-center line-clamp-2">محصول نمونه {index + 1}</h4>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-600 mt-8">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {saving ? 'در حال ذخیره...' : '💾 ذخیره تنظیمات'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountProductsSettings;