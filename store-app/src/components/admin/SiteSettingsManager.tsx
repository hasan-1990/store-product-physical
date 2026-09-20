'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SiteSettings {
  site_name: string;
  site_description: string;
  seo_description: string;
  seo_keywords: string;
}

export default function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: '',
    site_description: '',
    seo_description: '',
    seo_keywords: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // بارگذاری تنظیمات
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/site-settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('خطا در بارگذاری تنظیمات:', error);
      toast.error('خطا در بارگذاری تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('تنظیمات با موفقیت ذخیره شد');
      } else {
        toast.error(data.error || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        تنظیمات کلی سایت
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* نام سایت */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            نام سایت *
          </label>
          <input
            type="text"
            value={settings.site_name}
            onChange={(e) => handleChange('site_name', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="مثال: فروشگاه هاب"
            required
          />
        </div>

        {/* توضیحات سایت */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            توضیحات سایت (برای عنوان صفحه) *
          </label>
          <input
            type="text"
            value={settings.site_description}
            onChange={(e) => handleChange('site_description', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="مثال: تامین کننده قالب های وردپرس و افزونه های وب"
            required
          />
          <p className="mt-2 text-sm text-gray-400">
            این متن در عنوان تب مرورگر نمایش داده می‌شود: {settings.site_name} - {settings.site_description}
          </p>
        </div>

        {/* توضیحات SEO */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            توضیحات SEO
          </label>
          <textarea
            value={settings.seo_description}
            onChange={(e) => handleChange('seo_description', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="توضیحات کامل برای موتورهای جستجو..."
          />
          <p className="mt-2 text-sm text-gray-400">
            {settings.seo_description.length} کاراکتر (توصیه: 150-160 کاراکتر)
          </p>
        </div>

        {/* کلمات کلیدی */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            کلمات کلیدی SEO
          </label>
          <input
            type="text"
            value={settings.seo_keywords}
            onChange={(e) => handleChange('seo_keywords', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="کلمات را با کاما جدا کنید"
          />
          <p className="mt-2 text-sm text-gray-400">
            مثال: تجارت الکترونیک, خرید آنلاین, فروشگاه اینترنتی
          </p>
        </div>

        {/* دکمه ذخیره */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={loadSettings}
            disabled={saving}
            className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            بازنشانی
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                در حال ذخیره...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ذخیره تنظیمات
              </>
            )}
          </button>
        </div>
      </form>

      {/* راهنما */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">نکته:</p>
            <p>این تنظیمات در فایل <code className="px-2 py-1 bg-gray-700 rounded">data/site-settings.json</code> ذخیره می‌شود و برای تمام صفحات سایت اعمال می‌گردد.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
