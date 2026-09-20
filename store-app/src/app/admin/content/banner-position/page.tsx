'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface PositionSettings {
  position: string;
  isActive: boolean;
}

export default function BannerPositionSettingsPage() {
  const [settings, setSettings] = useState<PositionSettings>({
    position: 'after-hero',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const positions = [
    { value: 'before-hero', label: 'قبل از اسلایدر اصلی (Hero Slider)', description: 'بنرها در بالای صفحه قبل از اسلایدر اصلی نمایش داده می‌شوند' },
    { value: 'after-hero', label: 'بعد از اسلایدر اصلی (پیش‌فرض)', description: 'بنرها بلافاصله بعد از اسلایدر اصلی نمایش داده می‌شوند' },
    { value: 'before-categories', label: 'قبل از بخش دسته‌بندی‌ها', description: 'بنرها قبل از بخش خرید بر اساس دسته‌بندی نمایش داده می‌شوند' },
    { value: 'after-categories', label: 'بعد از بخش دسته‌بندی‌ها', description: 'بنرها بعد از بخش خرید بر اساس دسته‌بندی نمایش داده می‌شوند' },
    { value: 'before-products', label: 'قبل از محصولات ویژه', description: 'بنرها قبل از بخش محصولات ویژه نمایش داده می‌شوند' },
    { value: 'after-products', label: 'بعد از محصولات ویژه', description: 'بنرها بعد از بخش محصولات ویژه نمایش داده می‌شوند' },
    { value: 'before-whyus', label: 'قبل از بخش چرا ما', description: 'بنرها قبل از بخش "چرا ما را انتخاب کنیم" نمایش داده می‌شوند' },
    { value: 'after-whyus', label: 'بعد از بخش چرا ما', description: 'بنرها بعد از بخش "چرا ما را انتخاب کنیم" نمایش داده می‌شوند' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/banner-position');
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching position settings:', error);
      toast.error('خطا در بارگذاری تنظیمات موقعیت');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/banner-position', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('تنظیمات موقعیت بنرها با موفقیت ذخیره شد');
        // صفحه را ریلود کنیم تا تغییرات اعمال شود
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving position settings:', error);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">تنظیمات موقعیت بنرهای تبلیغاتی</h1>
            <p className="mt-2 text-gray-600">
              محل نمایش بنرهای تبلیغاتی در صفحه اصلی را تعیین کنید
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* وضعیت فعال/غیرفعال */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={settings.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="mr-2 block text-sm font-medium text-gray-700">
                نمایش بنرهای تبلیغاتی در صفحه اصلی
              </label>
            </div>

            {/* انتخاب موقعیت */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                موقعیت نمایش بنرها در صفحه اصلی
              </label>
              <div className="space-y-3">
                {positions.map((pos) => (
                  <div key={pos.value} className="relative">
                    <label className="flex items-start cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="position"
                        value={pos.value}
                        checked={settings.position === pos.value}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="mr-3">
                        <div className="text-sm font-medium text-gray-900">
                          {pos.label}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {pos.description}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* نمایش موقعیت انتخاب شده */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    موقعیت انتخاب شده
                  </h3>
                  <div className="mt-1 text-sm text-blue-700">
                    {positions.find(p => p.value === settings.position)?.label}
                  </div>
                  <div className="mt-1 text-sm text-blue-600">
                    {positions.find(p => p.value === settings.position)?.description}
                  </div>
                </div>
              </div>
            </div>

            {/* راهنمای ترتیب صفحه */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">ترتیب بخش‌های صفحه اصلی:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>1. اسلایدر اصلی (Hero Slider)</div>
                <div>2. بخش خرید بر اساس دسته‌بندی</div>
                <div>3. محصولات ویژه و جدیدترین</div>
                <div>4. بخش &quot;چرا ما را انتخاب کنیم&quot;</div>
                <div>5. خبرنامه (Newsletter)</div>
              </div>
            </div>

            {/* دکمه‌های عمل */}
            <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#4ade80',
            },
          },
          error: {
            duration: 3000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}