'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

interface PromoSettings {
  title: string;
  subtitle: string;
  buttonText: string;
  link: string;
  backgroundColor: string;
  backgroundImage?: string; // تصویر پس‌زمینه (اختیاری)
  useImage?: boolean; // استفاده از تصویر به جای رنگ
}

interface TabSettings {
  id: string;
  label: string;
  apiType: 'latest' | 'best_selling' | 'highest_rated' | 'most_viewed';
  active: boolean;
  color: string;
  promo: PromoSettings;
}

interface StatisticsData {
  products: { value: string; label: string };
  customers: { value: string; label: string };
  rating: { value: string; label: string };
  support: { value: string; label: string };
}

interface ModernShowcaseSettings {
  active: boolean;
  title: string;
  subtitle: string;
  showStatistics: boolean;
  statisticsData: StatisticsData;
  tabs: TabSettings[];
}

const presetColors = [
  { name: 'نارنجی', value: '#ff6b35' },
  { name: 'کهربایی', value: '#f59e0b' },
  { name: 'زرد', value: '#eab308' },
  { name: 'لیمویی', value: '#84cc16' },
  { name: 'سبز', value: '#059669' },
  { name: 'فیروزه‌ای', value: '#06b6d4' },
  { name: 'آبی آسمانی', value: '#0ea5e9' },
  { name: 'آبی', value: '#4f46e5' },
  { name: 'بنفش', value: '#7c3aed' },
  { name: 'ارغوانی', value: '#8b5cf6' },
  { name: 'صورتی', value: '#ec4899' },
  { name: 'قرمز', value: '#dc2626' },
];

function normalizeHex(color: string): string {
  return color.trim().toLowerCase();
}

function TabColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selected =
    presetColors.find((color) => normalizeHex(color.value) === normalizeHex(value)) ??
    null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-xl text-white hover:border-purple-400 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-6 h-6 rounded-full border border-white/25 shrink-0"
            style={{ backgroundColor: selected?.value ?? value }}
          />
          <span className="text-sm truncate">{selected?.name ?? 'انتخاب رنگ'}</span>
        </div>
        <svg
          className={`w-4 h-4 text-purple-300 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full bg-gray-900/95 backdrop-blur border border-purple-500/40 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1">
            {presetColors.map((color) => {
              const isSelected = normalizeHex(value) === normalizeHex(color.value);

              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    onChange(color.value);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white transition-colors ${
                    isSelected
                      ? 'bg-purple-500/30 ring-1 ring-purple-400'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 border border-white/20"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="truncate">{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModernShowcaseSettingsPage() {
  const [settings, setSettings] = useState<ModernShowcaseSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [currentImageSelectionTab, setCurrentImageSelectionTab] = useState<number | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchExistingImages();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/modern-showcase-settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
      } else {
        toast.error('خطا در بارگذاری تنظیمات');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('خطا در بارگذاری تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/modern-showcase-settings', {
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
      console.error('Error saving settings:', error);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const updateTabSettings = (index: number, field: keyof TabSettings, value: any) => {
    if (!settings) return;
    
    const newTabs = [...settings.tabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setSettings({ ...settings, tabs: newTabs });
  };

  const updateTabPromo = (index: number, field: keyof PromoSettings, value: string | boolean) => {
    if (!settings) return;
    
    const newTabs = [...settings.tabs];
    newTabs[index] = {
      ...newTabs[index],
      promo: { ...newTabs[index].promo, [field]: value }
    };
    setSettings({ ...settings, tabs: newTabs });
  };

  // بارگذاری لیست تصاویر موجود از سرور
  const fetchExistingImages = async () => {
    try {
      const response = await fetch('/api/admin/images');
      const data = await response.json();
      
      if (data.success) {
        setExistingImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  // باز کردن modal گالری برای انتخاب تصویر
  const openGalleryForTab = (tabIndex: number) => {
    setCurrentImageSelectionTab(tabIndex);
    setIsGalleryModalOpen(true);
  };

  // انتخاب تصویر از گالری
  const selectImageFromGallery = (imageUrl: string) => {
    if (currentImageSelectionTab !== null) {
      updateTabPromo(currentImageSelectionTab, 'backgroundImage', imageUrl);
      setIsGalleryModalOpen(false);
      setCurrentImageSelectionTab(null);
      toast.success('تصویر با موفقیت انتخاب شد');
    }
  };

  // آپلود تصویر جدید به گالری
  const uploadFilesToGallery = async (files: FileList) => {
    if (files.length === 0) return;

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      formData.append('type', 'gallery');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success && data.urls && data.urls.length > 0) {
        toast.success(`${data.urls.length} تصویر با موفقیت آپلود شد`);
        await fetchExistingImages(); // بارگذاری مجدد لیست تصاویر
      } else {
        toast.error(data.error || 'خطا در آپلود تصاویر');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('خطا در آپلود تصاویر');
    }
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // بررسی نوع فایل
    if (!file.type.startsWith('image/')) {
      toast.error('لطفاً فقط فایل تصویری انتخاب کنید');
      return;
    }

    // بررسی حجم فایل (حداکثر 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از 2 مگابایت باشد');
      return;
    }

    // تبدیل به Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      updateTabPromo(index, 'backgroundImage', reader.result as string);
      toast.success('تصویر با موفقیت بارگذاری شد');
    };
    reader.onerror = () => {
      toast.error('خطا در بارگذاری تصویر');
    };
    reader.readAsDataURL(file);
  };

  const updateStatistics = (key: keyof StatisticsData, field: 'value' | 'label', value: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      statisticsData: {
        ...settings.statisticsData,
        [key]: { ...settings.statisticsData[key], [field]: value }
      }
    });
  };

  const addNewTab = () => {
    if (!settings) return;
    
    const newTab = {
      id: `tab-${Date.now()}`,
      label: 'تب جدید',
      apiType: 'latest' as any,
      active: true,
      color: '#8b5cf6',
      promo: {
        title: 'عنوان جدید',
        subtitle: 'توضیحات جدید',
        buttonText: 'مشاهده بیشتر',
        link: '/categories',
        backgroundColor: '#8b5cf6'
      }
    };
    
    setSettings({
      ...settings,
      tabs: [...settings.tabs, newTab]
    });
    
    // Switch to the new tab
    setActiveTabIndex(settings.tabs.length);
    toast.success('تب جدید با موفقیت اضافه شد');
  };

  const removeTab = (index: number) => {
    if (!settings || settings.tabs.length <= 1) {
      toast.error('حداقل یک تب باید وجود داشته باشد');
      return;
    }
    
    const tabName = settings.tabs[index].label;
    if (window.confirm(`آیا از حذف تب "${tabName}" اطمینان دارید؟`)) {
      const newTabs = settings.tabs.filter((_, i) => i !== index);
      setSettings({ ...settings, tabs: newTabs });
      
      // Adjust active tab index if necessary
      if (activeTabIndex >= newTabs.length) {
        setActiveTabIndex(newTabs.length - 1);
      } else if (activeTabIndex > index) {
        setActiveTabIndex(activeTabIndex - 1);
      }
      
      toast.success(`تب "${tabName}" با موفقیت حذف شد`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl">خطا در بارگذاری تنظیمات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                ✨ ویترین محصولات مدرن
              </h1>
              <p className="text-purple-200">
                مدیریت نمایش محصولات در قالب تب‌های مختلف با پنل تبلیغاتی
              </p>
            </div>
            <Link
              href="/admin/content"
              className="px-4 py-2 bg-gray-800/50 text-purple-300 rounded-lg hover:bg-gray-700/50 transition-colors border border-purple-500/30"
            >
              ← بازگشت
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Settings */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">تنظیمات کلی</h2>
              </div>

              <div className="space-y-6">
                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-purple-500/20">
                  <div>
                    <h3 className="text-white font-medium">فعال بودن بخش</h3>
                    <p className="text-purple-200 text-sm">نمایش این بخش در صفحه اصلی</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.active}
                      onChange={(e) => setSettings({ ...settings, active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      عنوان اصلی
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="عنوان بخش..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      زیرعنوان
                    </label>
                    <input
                      type="text"
                      value={settings.subtitle}
                      onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="زیرعنوان..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Settings */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">تنظیمات تب‌ها</h2>
                </div>
                <button
                  onClick={addNewTab}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-medium shadow-lg"
                >
                  + تب جدید
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 mb-6">
                {settings.tabs.map((tab, index) => (
                  <div key={tab.id} className="flex items-center">
                    <button
                      onClick={() => setActiveTabIndex(index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTabIndex === index
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'bg-gray-800/50 text-purple-200 hover:bg-gray-700/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                    {settings.tabs.length > 1 && (
                      <button
                        onClick={() => removeTab(index)}
                        className="ml-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                        title="حذف تب"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Tab Settings */}
              {settings.tabs[activeTabIndex] && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        نام تب
                      </label>
                      <input
                        type="text"
                        value={settings.tabs[activeTabIndex].label}
                        onChange={(e) => updateTabSettings(activeTabIndex, 'label', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        نوع محصولات
                      </label>
                      <select
                        value={settings.tabs[activeTabIndex].apiType}
                        onChange={(e) => updateTabSettings(activeTabIndex, 'apiType', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="latest">جدیدترین</option>
                        <option value="best_selling">پرفروش‌ترین</option>
                        <option value="highest_rated">بالاترین امتیاز</option>
                        <option value="most_viewed">پربازدیدترین</option>
                      </select>
                    </div>
                  </div>

                  {/* نوع محصولات تعیین می‌کند که کدام محصولات نمایش داده شوند */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
                    <p className="text-blue-200 text-xs">
                      💡 <strong>نوع محصولات</strong> تعیین می‌کند که محصولات بر اساس کدام معیار مرتب شوند:
                      <br/>• جدیدترین = تاریخ اضافه شدن
                      <br/>• پرفروش‌ترین = تعداد فروش
                      <br/>• بالاترین امتیاز = امتیاز کاربران
                      <br/>• پربازدیدترین = تعداد بازدید
                    </p>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      رنگ تب
                    </label>
                    <TabColorPicker
                      value={settings.tabs[activeTabIndex].color}
                      onChange={(color) => updateTabSettings(activeTabIndex, 'color', color)}
                    />
                  </div>

                  {/* Promo Settings */}
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-purple-500/20">
                    <h3 className="text-white font-medium mb-4">تنظیمات پنل تبلیغاتی</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-purple-200 mb-2">عنوان تبلیغات</label>
                          <input
                            type="text"
                            value={settings.tabs[activeTabIndex].promo.title}
                            onChange={(e) => updateTabPromo(activeTabIndex, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-purple-200 mb-2">زیرعنوان</label>
                          <input
                            type="text"
                            value={settings.tabs[activeTabIndex].promo.subtitle}
                            onChange={(e) => updateTabPromo(activeTabIndex, 'subtitle', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-purple-200 mb-2">متن دکمه</label>
                          <input
                            type="text"
                            value={settings.tabs[activeTabIndex].promo.buttonText}
                            onChange={(e) => updateTabPromo(activeTabIndex, 'buttonText', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-purple-200 mb-2">لینک</label>
                          <input
                            type="text"
                            value={settings.tabs[activeTabIndex].promo.link}
                            onChange={(e) => updateTabPromo(activeTabIndex, 'link', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Image Upload Section */}
                      <div className="border-t border-purple-500/20 pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm text-purple-200">استفاده از تصویر پس‌زمینه</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.tabs[activeTabIndex].promo.useImage || false}
                              onChange={(e) => updateTabPromo(activeTabIndex, 'useImage', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>

                        {settings.tabs[activeTabIndex].promo.useImage && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-purple-200 mb-2">
                                انتخاب تصویر از گالری
                              </label>
                              <button
                                type="button"
                                onClick={() => openGalleryForTab(activeTabIndex)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                باز کردن گالری تصاویر
                              </button>
                            </div>

                            {settings.tabs[activeTabIndex].promo.backgroundImage && (
                              <div className="relative">
                                <img
                                  src={settings.tabs[activeTabIndex].promo.backgroundImage}
                                  alt="پیش‌نمایش بنر"
                                  className="w-full h-32 object-cover rounded-lg border border-purple-500/30"
                                />
                                <button
                                  onClick={() => {
                                    updateTabPromo(activeTabIndex, 'backgroundImage', '');
                                    toast.success('تصویر حذف شد');
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  title="حذف تصویر"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {!settings.tabs[activeTabIndex].promo.useImage && (
                          <div>
                            <label className="block text-sm text-purple-200 mb-2">رنگ پس‌زمینه</label>
                            <input
                              type="color"
                              value={settings.tabs[activeTabIndex].promo.backgroundColor}
                              onChange={(e) => updateTabPromo(activeTabIndex, 'backgroundColor', e.target.value)}
                              className="w-full h-10 px-2 py-1 bg-gray-800/50 border border-purple-500/30 rounded-lg cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tab Active Toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                    <span className="text-white text-sm">فعال بودن تب</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.tabs[activeTabIndex].active}
                        onChange={(e) => updateTabSettings(activeTabIndex, 'active', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">پیش‌نمایش</h3>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-white font-bold text-lg">{settings.title}</h4>
                  <p className="text-purple-200 text-sm">{settings.subtitle}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {settings.tabs.filter(tab => tab.active).map((tab) => (
                    <div
                      key={tab.id}
                      className="px-3 py-1 rounded-full text-xs text-white"
                      style={{ backgroundColor: tab.color }}
                    >
                      {tab.label}
                    </div>
                  ))}
                </div>

                {settings.showStatistics && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                      <div className="text-orange-400 font-bold text-sm">{settings.statisticsData.rating.value}</div>
                      <div className="text-purple-200 text-xs">{settings.statisticsData.rating.label}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                      <div className="text-orange-400 font-bold text-sm">{settings.statisticsData.support.value}</div>
                      <div className="text-purple-200 text-xs">{settings.statisticsData.support.label}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                      <div className="text-orange-400 font-bold text-sm">{settings.statisticsData.customers.value}</div>
                      <div className="text-purple-200 text-xs">{settings.statisticsData.customers.label}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                      <div className="text-orange-400 font-bold text-sm">{settings.statisticsData.products.value}</div>
                      <div className="text-purple-200 text-xs">{settings.statisticsData.products.label}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Settings */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">آمار</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                  <span className="text-white text-sm">نمایش آمار</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showStatistics}
                      onChange={(e) => setSettings({ ...settings, showStatistics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {settings.showStatistics && (
                  <div className="space-y-3">
                    {Object.entries(settings.statisticsData).map(([key, data]) => (
                      <div key={key} className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={data.value}
                          onChange={(e) => updateStatistics(key as keyof StatisticsData, 'value', e.target.value)}
                          className="px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="مقدار"
                        />
                        <input
                          type="text"
                          value={data.label}
                          onChange={(e) => updateStatistics(key as keyof StatisticsData, 'label', e.target.value)}
                          className="px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="برچسب"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  در حال ذخیره...
                </div>
              ) : (
                '💾 ذخیره تنظیمات'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-6xl h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">گالری تصاویر</h3>
                <span className="text-gray-400">({existingImages.length} تصویر)</span>
              </div>
              <button
                onClick={() => {
                  setIsGalleryModalOpen(false);
                  setCurrentImageSelectionTab(null);
                }}
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Upload Section */}
            <div className="p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => document.getElementById('gallery-upload-input')?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  آپلود جدید
                </button>
                <input
                  id="gallery-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      uploadFilesToGallery(e.target.files);
                      e.target.value = ''; // Reset input
                    }
                  }}
                  className="hidden"
                />
                <span className="text-sm text-gray-400">
                  تصاویر برای بنر تبلیغاتی تب‌ها
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                فایل‌های انتخاب شده خودکار آپلود خواهند شد
              </p>
            </div>

            {/* Images Grid */}
            <div className="p-6 overflow-y-auto flex-1">
              {existingImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {existingImages.map((imageUrl, index) => {
                    const isSelected = settings?.tabs[currentImageSelectionTab || 0]?.promo.backgroundImage === imageUrl;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => selectImageFromGallery(imageUrl)}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group transition-all ${
                          isSelected 
                            ? 'ring-4 ring-green-500 scale-95' 
                            : 'hover:ring-2 hover:ring-purple-500 hover:scale-105'
                        }`}
                      >
                        <img
                          src={imageUrl}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay on hover */}
                        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {isSelected ? (
                            <div className="bg-green-500 rounded-full p-2">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <span className="text-white text-sm font-medium">انتخاب</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg">هیچ تصویری در گالری موجود نیست</p>
                  <p className="text-sm mt-2">با کلیک روی "آپلود جدید" تصاویر خود را اضافه کنید</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setIsGalleryModalOpen(false);
                  setCurrentImageSelectionTab(null);
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #6366f1',
          },
          success: {
            duration: 3000,
            style: {
              background: '#059669',
              color: '#fff',
            },
          },
          error: {
            duration: 3000,
            style: {
              background: '#dc2626',
              color: '#fff',
            },
          },
        }}
      />
    </div>
  );
}