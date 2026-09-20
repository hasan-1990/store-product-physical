'use client';

import { useState, useEffect } from 'react';

interface TabbedProductsSettings {
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

export default function TabbedProductsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'featured' | 'latest'>('featured');
  
  const [settings, setSettings] = useState<TabbedProductsSettings>({
    title: 'مجموعه محصولات ما',
    subtitle: 'بهترین و جدیدترین محصولات را کشف کنید',
    active: true,
    featuredSection: {
      title: 'محصولات ویژه',
      subtitle: 'محصولات برتر و پرفروش ما',
      active: true,
      count: 8
    },
    latestSection: {
      title: 'جدیدترین محصولات',
      subtitle: 'محصولات تازه رسیده! اولین نفری باشید که جدیدترین محصولات ما را تجربه می‌کند.',
      active: true,
      count: 8
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tabbed-products-settings');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/tabbed-products-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('تنظیمات با موفقیت ذخیره شد');
        } else {
          throw new Error(result.error || 'خطا در ذخیره تنظیمات');
        }
      } else {
        throw new Error('خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('خطا در ذخیره تنظیمات: ' + (error instanceof Error ? error.message : 'خطای نامشخص'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-2xl border border-white border-opacity-20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold mb-2">
              مدیریت محتوای صفحه اصلی
            </h1>
            <p className="text-white text-opacity-90">
              مدیریت محصولات ویژه صفحه اصلی
            </p>
          </div>

          <div className="p-8">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-white bg-opacity-20 rounded-full p-2 backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab('featured')}
                  className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                    activeTab === 'featured'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  ⭐ محصولات ویژه
                </button>
                
                <button
                  onClick={() => setActiveTab('latest')}
                  className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                    activeTab === 'latest'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  🆕 جدیدترین محصولات
                </button>
              </div>
            </div>

            {/* Settings Form */}
            <div className="space-y-8">
              {/* General Settings */}
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  تنظیمات عمومی
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      عنوان کلی بخش
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) => setSettings({
                        ...settings,
                        title: e.target.value
                      })}
                      className="w-full px-4 py-3 border border-white border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white placeholder-opacity-70"
                      placeholder="عنوان کلی بخش را وارد کنید"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      زیرعنوان کلی
                    </label>
                    <input
                      type="text"
                      value={settings.subtitle}
                      onChange={(e) => setSettings({
                        ...settings,
                        subtitle: e.target.value
                      })}
                      className="w-full px-4 py-3 border border-white border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white placeholder-opacity-70"
                      placeholder="زیرعنوان کلی را وارد کنید"
                    />
                  </div>
                </div>
              </div>

              {/* Tab-specific Settings */}
              {activeTab === 'featured' ? (
                <div className="bg-purple-500 bg-opacity-30 backdrop-blur-sm rounded-xl p-6 border border-purple-300 border-opacity-50">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    تنظیمات محصولات ویژه
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                          عنوان تب محصولات ویژه
                        </label>
                        <input
                          type="text"
                          value={settings.featuredSection.title}
                          onChange={(e) => setSettings({
                            ...settings,
                            featuredSection: {
                              ...settings.featuredSection,
                              title: e.target.value
                            }
                          })}
                          className="w-full px-4 py-3 border border-purple-300 border-opacity-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white placeholder-opacity-70"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                          تعداد محصولات ویژه
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={settings.featuredSection.count}
                          onChange={(e) => setSettings({
                            ...settings,
                            featuredSection: {
                              ...settings.featuredSection,
                              count: parseInt(e.target.value) || 8
                            }
                          })}
                          className="w-full px-4 py-3 border border-purple-300 border-opacity-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all bg-white bg-opacity-20 backdrop-blur-sm text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">
                        زیرعنوان محصولات ویژه
                      </label>
                      <textarea
                        rows={3}
                        value={settings.featuredSection.subtitle}
                        onChange={(e) => setSettings({
                          ...settings,
                          featuredSection: {
                            ...settings.featuredSection,
                            subtitle: e.target.value
                          }
                        })}
                        className="w-full px-4 py-3 border border-purple-300 border-opacity-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white placeholder-opacity-70"
                        placeholder="زیرعنوان برای محصولات ویژه..."
                      />
                    </div>

                    {/* Featured Section Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-xl">
                      <div>
                        <h4 className="text-white font-semibold">نمایش محصولات ویژه</h4>
                        <p className="text-white text-opacity-70 text-sm">آیا تب محصولات ویژه نمایش داده شود؟</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.featuredSection.active}
                          onChange={(e) => setSettings({
                            ...settings,
                            featuredSection: {
                              ...settings.featuredSection,
                              active: e.target.checked
                            }
                          })}
                          className="sr-only"
                        />
                        <div className={`relative inline-block w-16 h-8 rounded-full transition-colors duration-200 ${
                          settings.featuredSection.active ? 'bg-green-500' : 'bg-gray-400 bg-opacity-50'
                        }`}>
                          <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow-md ${
                            settings.featuredSection.active ? 'transform translate-x-8' : ''
                          }`}></div>
                        </div>
                        <span className={`mr-4 text-sm font-semibold ${
                          settings.featuredSection.active ? 'text-green-400' : 'text-white text-opacity-70'
                        }`}>
                          {settings.featuredSection.active ? '✅ فعال' : '❌ غیرفعال'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-500 bg-opacity-30 backdrop-blur-sm rounded-xl p-6 border border-blue-300 border-opacity-50">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    تنظیمات جدیدترین محصولات
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                          عنوان تب جدیدترین محصولات
                        </label>
                        <input
                          type="text"
                          value={settings.latestSection.title}
                          onChange={(e) => setSettings({
                            ...settings,
                            latestSection: {
                              ...settings.latestSection,
                              title: e.target.value
                            }
                          })}
                          className="w-full px-4 py-3 border border-blue-300 border-opacity-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white placeholder-opacity-70"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                          تعداد جدیدترین محصولات
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={settings.latestSection.count}
                          onChange={(e) => setSettings({
                            ...settings,
                            latestSection: {
                              ...settings.latestSection,
                              count: parseInt(e.target.value) || 8
                            }
                          })}
                          className="w-full px-4 py-3 border border-blue-300 border-opacity-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all bg-white bg-opacity-20 backdrop-blur-sm text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">
                        زیرعنوان جدیدترین محصولات
                      </label>
                      <textarea
                        rows={3}
                        value={settings.latestSection.subtitle}
                        onChange={(e) => setSettings({
                          ...settings,
                          latestSection: {
                            ...settings.latestSection,
                            subtitle: e.target.value
                          }
                        })}
                        className="w-full px-4 py-3 border border-blue-300 border-opacity-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white placeholder-opacity-70"
                        placeholder="زیرعنوان برای جدیدترین محصولات..."
                      />
                    </div>

                    {/* Latest Section Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-xl">
                      <div>
                        <h4 className="text-white font-semibold">نمایش جدیدترین محصولات</h4>
                        <p className="text-white text-opacity-70 text-sm">آیا تب جدیدترین محصولات نمایش داده شود؟</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.latestSection.active}
                          onChange={(e) => setSettings({
                            ...settings,
                            latestSection: {
                              ...settings.latestSection,
                              active: e.target.checked
                            }
                          })}
                          className="sr-only"
                        />
                        <div className={`relative inline-block w-16 h-8 rounded-full transition-colors duration-200 ${
                          settings.latestSection.active ? 'bg-green-500' : 'bg-gray-400 bg-opacity-50'
                        }`}>
                          <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow-md ${
                            settings.latestSection.active ? 'transform translate-x-8' : ''
                          }`}></div>
                        </div>
                        <span className={`mr-4 text-sm font-semibold ${
                          settings.latestSection.active ? 'text-green-400' : 'text-white text-opacity-70'
                        }`}>
                          {settings.latestSection.active ? '✅ فعال' : '❌ غیرفعال'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* General Active Toggle */}
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      وضعیت کلی بخش
                    </h3>
                    <p className="text-sm text-white text-opacity-80">
                      آیا کل بخش محصولات تب‌دار در صفحه اصلی نمایش داده شود؟
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.active}
                      onChange={(e) => setSettings({
                        ...settings,
                        active: e.target.checked
                      })}
                      className="sr-only"
                    />
                    <div className={`relative inline-block w-16 h-8 rounded-full transition-colors duration-200 ${
                      settings.active ? 'bg-green-500' : 'bg-gray-400 bg-opacity-50'
                    }`}>
                      <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow-md ${
                        settings.active ? 'transform translate-x-8' : ''
                      }`}></div>
                    </div>
                    <span className={`mr-4 text-sm font-semibold ${
                      settings.active ? 'text-green-400' : 'text-white text-opacity-70'
                    }`}>
                      {settings.active ? '✅ فعال' : '❌ غیرفعال'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-12 py-4 rounded-xl text-gray-500 font-bold text-lg shadow-lg transition-all duration-200 ${
                    saving
                      ? 'bg-gray-400 bg-opacity-50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-white to-white bg-opacity-20 border border-white border-opacity-30 hover:bg-opacity-30 hover:scale-105 hover:shadow-xl backdrop-blur-sm'
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      در حال ذخیره...
                    </span>
                  ) : (
                    '💾 ذخیره تنظیمات محصولات تب‌دار'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
