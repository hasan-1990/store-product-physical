'use client';

import React, { useState, useEffect } from 'react';

interface TabbedProductsSettings {
  type: string;
  title: string;
  subtitle: string;
  active: boolean;
  featuredSection: {
    title: string;
    subtitle: string;
    active: boolean;
    count: number;
  };
  latestSection: {
    title: string;
    subtitle: string;
    active: boolean;
    count: number;
  };
}

const TabbedProductsSettingsPage = () => {
  const [settings, setSettings] = useState<TabbedProductsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'featured' | 'latest'>('main');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tabbed-products-settings');
      const result = await response.json();

      if (result.success) {
        setSettings(result.data);
      } else {
        setMessage('خطا در دریافت تنظیمات');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('خطا در دریافت تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/tabbed-products-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('تنظیمات با موفقیت ذخیره شد');
        setTimeout(() => setMessage(''), 3000);
        
        // به‌روزرسانی cache browser
        if (typeof window !== 'undefined') {
          // اجبار به refresh cache
          window.location.reload();
        }
      } else {
        setMessage(result.error || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (path: string, value: any) => {
    if (!settings) return;

    setSettings(prev => {
      if (!prev) return prev;
      
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center text-red-600 p-8">
        خطا در بارگذاری تنظیمات
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            تنظیمات بخش محصولات ویژه و جدیدترین
          </h1>
          <p className="text-gray-600 mt-1">
            مدیریت محتوای صفحه اصلی - بخش محصولات ویژه و جدیدترین
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-md ${
            message.includes('موفقیت') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 space-x-reverse">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'main'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              تنظیمات اصلی
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'featured'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              محصولات ویژه
            </button>
            <button
              onClick={() => setActiveTab('latest')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'latest'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              جدیدترین محصولات
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Main Settings Tab */}
          {activeTab === 'main' && (
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={settings.active}
                  onChange={(e) => updateSettings('active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-3"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  فعال بودن این بخش در صفحه اصلی
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان اصلی بخش
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => updateSettings('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="عنوان اصلی بخش را وارد کنید"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  زیرنویس اصلی بخش
                </label>
                <textarea
                  value={settings.subtitle}
                  onChange={(e) => updateSettings('subtitle', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="زیرنویس اصلی بخش را وارد کنید"
                />
              </div>
            </div>
          )}

          {/* Featured Products Tab */}
          {activeTab === 'featured' && (
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featuredActive"
                  checked={settings.featuredSection.active}
                  onChange={(e) => updateSettings('featuredSection.active', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ml-3"
                />
                <label htmlFor="featuredActive" className="text-sm font-medium text-gray-700">
                  نمایش بخش محصولات ویژه
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان بخش محصولات ویژه
                </label>
                <input
                  type="text"
                  value={settings.featuredSection.title}
                  onChange={(e) => updateSettings('featuredSection.title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="عنوان بخش محصولات ویژه"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  زیرنویس بخش محصولات ویژه
                </label>
                <textarea
                  value={settings.featuredSection.subtitle}
                  onChange={(e) => updateSettings('featuredSection.subtitle', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="زیرنویس بخش محصولات ویژه"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تعداد محصولات نمایش داده شده
                </label>
                <select
                  value={settings.featuredSection.count}
                  onChange={(e) => updateSettings('featuredSection.count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={4}>4 محصول</option>
                  <option value={6}>6 محصول</option>
                  <option value={8}>8 محصول</option>
                  <option value={12}>12 محصول</option>
                </select>
              </div>
            </div>
          )}

          {/* Latest Products Tab */}
          {activeTab === 'latest' && (
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="latestActive"
                  checked={settings.latestSection.active}
                  onChange={(e) => updateSettings('latestSection.active', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded ml-3"
                />
                <label htmlFor="latestActive" className="text-sm font-medium text-gray-700">
                  نمایش بخش جدیدترین محصولات
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان بخش جدیدترین محصولات
                </label>
                <input
                  type="text"
                  value={settings.latestSection.title}
                  onChange={(e) => updateSettings('latestSection.title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="عنوان بخش جدیدترین محصولات"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  زیرنویس بخش جدیدترین محصولات
                </label>
                <textarea
                  value={settings.latestSection.subtitle}
                  onChange={(e) => updateSettings('latestSection.subtitle', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="زیرنویس بخش جدیدترین محصولات"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تعداد محصولات نمایش داده شده
                </label>
                <select
                  value={settings.latestSection.count}
                  onChange={(e) => updateSettings('latestSection.count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={4}>4 محصول</option>
                  <option value={6}>6 محصول</option>
                  <option value={8}>8 محصول</option>
                  <option value={12}>12 محصول</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={saveSettings}
            disabled={saving}
            className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabbedProductsSettingsPage;
