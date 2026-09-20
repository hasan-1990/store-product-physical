'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useUrlTab } from '@/hooks/useUrlTab';
import FAQManagement from '@/components/admin/FAQManagement';
import { useToast, ToastContainer } from '@/components/ui/Toast';

interface HeroSlider {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}



interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  active: boolean;
  featured: boolean;
  productCount: number;
  _count?: {
    products: number;
  };
}

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  order: number;
  productCount: number;
}

const ContentManagementContent = () => {
  const [activeTab, setActiveTab] = useUrlTab('slider');
  const [heroSliders, setHeroSliders] = useState<HeroSlider[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [, setAdminCategories] = useState<AdminCategory[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const { toasts, removeToast, success, error } = useToast();
  const [loading, setLoading] = useState(true);
  // Category Section Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySettings, setCategorySettings] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  // Why Us Section Settings Modal
  const [, setShowWhyUsModal] = useState(false);
  const [whyUsSettings, setWhyUsSettings] = useState<any>(null);
  const [, setWhyUsLoading] = useState(false);

  // Load category section settings (dummy, replace with real API if needed)
  const loadCategorySettings = async () => {
    setCategoryLoading(true);
    try {
      const response = await fetch('/api/admin/category-section-settings');
      const data = await response.json();
      if (data.success && data.data) {
        setCategorySettings(data.data);
      } else {
        setCategorySettings({
          displayCount: 6,
          layout: 'grid',
          showCount: true,
          active: true,
          selectedCategories: []
        });
      }
    } finally {
      setCategoryLoading(false);
    }
  };
  const saveCategorySettings = async () => {
    setCategoryLoading(true);
    try {
      // حذف کلید _id از تنظیمات قبل از ارسال
      const { _id: _, ...settingsToSend } = categorySettings || {};
      console.log('ارسال تنظیمات دسته‌بندی:', settingsToSend);
      const response = await fetch('/api/admin/category-section-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSend)
      });
      const data = await response.json();
      if (data.success) {
        alert('تنظیمات دسته‌بندی ذخیره شد');
        await loadCategorySettings();
      }
    } catch {
      alert('خطا در ذخیره تنظیمات');
    } finally {
      setCategoryLoading(false);
      setShowCategoryModal(false);
    }
  };

  // Load Why Us section settings (dummy, replace with real API if needed)
  const loadWhyUsSettings = async () => {
    setWhyUsLoading(true);
    try {
      const response = await fetch('/api/admin/whyus-section-settings');
      const data = await response.json();
      if (data.success && data.data) {
        setWhyUsSettings(data.data);
      } else {
        setWhyUsSettings({
          title: 'چرا فروشگاه دیجیتال را انتخاب کنیم؟',
          subtitle: 'ما بهترین تجربه خرید را با این مزایای شگفت‌انگیز فراهم می‌کنیم',
          items: [
            { icon: 'fast', title: 'ارسال سریع', description: '' },
            { icon: 'quality', title: 'تضمین کیفیت', description: '' },
            { icon: 'support', title: 'پشتیبانی ۲۴/۷', description: '' }
          ]
        });
      }
    } finally {
      setWhyUsLoading(false);
    }
  };
  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadHeroSliders(),
      loadCategories(),
      loadAdminCategories(),
      loadSettings()
    ]).finally(() => setLoading(false));
  }, []);

  const loadHeroSliders = async () => {
    try {
      const response = await fetch('/api/admin/slider');
      const data = await response.json();
      if (data.success) {
        setHeroSliders(data.data);
      }
    } catch (error) {
      console.error('Error loading hero sliders:', error);
    }
  };



  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAdminCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      if (data.success) {
        setAdminCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading admin categories:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleSliderStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/slider/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !currentStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadHeroSliders();
      }
    } catch (error) {
      console.error('Error updating slider status:', error);
    }
  };


  const deleteSlider = async (id: string) => {
    if (!confirm('آیا از حذف این اسلاید اطمینان دارید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/slider/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await loadHeroSliders();
      }
    } catch (error) {
      console.error('Error deleting slider:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      });

      const data = await response.json();
      if (data.success) {
        success('تنظیمات با موفقیت ذخیره شد', 'موفق', 4000);
      } else {
        error('خطا در ذخیره تنظیمات: ' + (data.error || ''), 'خطا', 6000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      error('خطا در ذخیره تنظیمات', 'خطا', 6000);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const tabs = [
    { id: 'slider', name: 'اسلایدر اصلی', icon: '🖼️' },
    { id: 'sections', name: 'بخش‌های صفحه', icon: '📑' },
    { id: 'faq', name: 'سوالات متداول', icon: '❓' },
    { id: 'settings', name: 'تنظیمات', icon: '⚙️' }
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
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
          <h1 className="text-3xl font-bold text-white">محتوای صفحه اصلی</h1>
          <p className="text-gray-300 mt-1">مدیریت اسلایدرها، دسته‌بندی‌ها و بخش‌های صفحه اصلی</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          بازگشت به داشبورد
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-reverse space-x-1 bg-gray-800/50 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-reverse space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="font-medium">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Hero Slider Tab */}
        {activeTab === 'slider' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">مدیریت اسلایدر اصلی</h2>
              <Link
                href="/admin/slider/new"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 shadow-lg"
              >
                ➕ اسلاید جدید
              </Link>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {heroSliders.map((slider) => (
                <div key={slider.id} className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                  <div className="relative overflow-hidden rounded-xl mb-4">
                    <img
                      src={slider.imageUrl}
                      alt={slider.title}
                      className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                      slider.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {slider.active ? 'فعال' : 'غیرفعال'}
                    </div>
                    <div className="absolute top-3 left-3 px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
                      ترتیب: {slider.order}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white truncate">{slider.title}</h3>
                    <p className="text-gray-300 text-sm">{slider.subtitle}</p>
                    <p className="text-gray-400 text-xs line-clamp-2">{slider.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                      <div className="flex space-x-2 space-x-reverse">
                        <Link
                          href={`/admin/slider/${slider.id}/edit`}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded text-xs font-medium transition-colors"
                        >
                          ✏️ ویرایش
                        </Link>
                        <button
                          onClick={() => toggleSliderStatus(slider.id, slider.active)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            slider.active 
                              ? 'bg-orange-500 hover:bg-orange-400 text-white' 
                              : 'bg-green-500 hover:bg-green-400 text-white'
                          }`}
                        >
                          {slider.active ? '🔒 غیرفعال' : '✅ فعال'}
                        </button>
                      </div>
                      <button
                        onClick={() => deleteSlider(slider.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-400 text-white rounded text-xs font-medium transition-colors"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {heroSliders.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🖼️</div>
                <h3 className="text-xl font-bold text-white mb-2">هیچ اسلایدی تعریف نشده است</h3>
                <p className="text-gray-400 mb-6">برای شروع، اولین اسلاید خود را ایجاد کنید</p>
                <Link
                  href="/admin/slider/new"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 shadow-lg"
                >
                  ➕ ایجاد اسلاید جدید
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-6">
            {/* ...Site Header Section Card removed as requested... */}
            {/* Trend Section Card */}
            {/* Category Section Card */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <h3 className="text-lg font-bold text-white">تنظیمات خرید بر اساس دسته‌بندی</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">دسته‌بندی</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">مدیریت نمایش دسته‌بندی‌های محصولات در صفحه اصلی</p>
                </div>
                <div>
                  <button
                    onClick={() => { loadCategorySettings(); setShowCategoryModal(true); }}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded text-xs font-medium transition-colors"
                  >
                    تنظیمات
                  </button>
                </div>
              </div>
            </div>

            {/* Promo Banner Section Card */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <h3 className="text-lg font-bold text-white">تنظیمات بنرهای تبلیغاتی</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">بنر</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">مدیریت بخش‌های مختلف بنرهای تبلیغاتی در جایگاه‌های متنوع صفحه اصلی</p>
                </div>
                <div>
                  <Link
                    href="/admin/content/banner-sections"
                    className="px-3 py-1 bg-green-500 hover:bg-green-400 text-white rounded text-xs font-medium transition-colors"
                  >
                    🎯 مدیریت بخش‌ها
                  </Link>
                </div>
              </div>
            </div>


            {/* Modern Product Showcase Section Card */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <h3 className="text-lg font-bold text-white">✨ ویترین محصولات مدرن</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">تب‌های محصولات</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">مدیریت نمایش محصولات در قالب تب‌های مختلف با پنل تبلیغاتی سفارشی</p>
                  <div className="flex items-center space-x-reverse space-x-4 mt-2">
                    <span className="text-xs text-orange-300">• تب‌های قابل تنظیم</span>
                    <span className="text-xs text-orange-300">• پنل تبلیغاتی سفارشی</span>
                    <span className="text-xs text-orange-300">• آمار و اطلاعات</span>
                  </div>
                </div>
                <div>
                  <Link
                    href="/admin/content/modern-showcase"
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-orange-500/25"
                  >
                    🎨 تنظیمات پیشرفته
                  </Link>
                </div>
              </div>
            </div>

            {/* Category Section Modal */}
            {showCategoryModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-500/30 max-w-xl w-full mx-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">تنظیمات خرید بر اساس دسته‌بندی</h3>
                    <button
                      onClick={() => setShowCategoryModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {categoryLoading || !categorySettings ? (
                    <div className="text-center py-8 text-white">در حال بارگذاری...</div>
                  ) : (
                    <form className="space-y-4" onSubmit={e => { e.preventDefault(); saveCategorySettings(); }}>
                      <div>
                        <label className="block text-gray-300 mb-2">تعداد دسته‌بندی نمایش</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={categorySettings.displayCount}
                          onChange={e => setCategorySettings({ ...categorySettings, displayCount: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">نوع نمایش</label>
                        <select
                          value={categorySettings.layout}
                          onChange={e => setCategorySettings({ ...categorySettings, layout: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white"
                        >
                          <option value="grid">شبکه‌ای (Grid)</option>
                          <option value="animated_grid">شبکه انیمیشنی</option>
                          <option value="carousel">اسلایدر</option>
                          <option value="list">فهرستی</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">انتخاب دسته‌بندی‌های قابل نمایش</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center space-x-reverse space-x-2 mb-2">
                            <input
                              type="checkbox"
                              id="selectAllCategories"
                              checked={categorySettings.selectedCategories.length === 0}
                              onChange={e => {
                                if (e.target.checked) {
                                  setCategorySettings({ ...categorySettings, selectedCategories: [] });
                                } else {
                                  setCategorySettings({ ...categorySettings, selectedCategories: categories.map(cat => cat.id) });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="selectAllCategories" className="text-gray-300 text-sm font-medium">همه دسته‌بندی‌ها (پیش‌فرض)</label>
                          </div>
                          <hr className="border-gray-600 my-2" />
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center space-x-reverse space-x-2">
                              <input
                                type="checkbox"
                                id={`cat_${category.id}`}
                                checked={categorySettings.selectedCategories.includes(category.id)}
                                onChange={e => {
                                  const currentSelected = categorySettings.selectedCategories;
                                  let newSelected;
                                  if (e.target.checked) {
                                    newSelected = [...currentSelected, category.id];
                                  } else {
                                    newSelected = currentSelected.filter((id: string) => id !== category.id);
                                  }
                                  setCategorySettings({ ...categorySettings, selectedCategories: newSelected });
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                              />
                              <label htmlFor={`cat_${category.id}`} className="text-gray-300 text-sm flex-1 flex justify-between">
                                <span>{category.name}</span>
                                <span className="text-gray-500">({category.productCount ?? 0} محصول)</span>
                              </label>
                              {!category.active && (
                                <span className="text-red-400 text-xs">(غیرفعال)</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          انتخاب &quot;همه دسته‌بندی‌ها&quot; برای نمایش تمام دسته‌بندی‌های فعال، یا دسته‌بندی‌های خاص را انتخاب کنید
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 mt-2">
                        <input
                          type="checkbox"
                          id="showCount"
                          checked={categorySettings.showCount ?? true}
                          onChange={e => setCategorySettings({ ...categorySettings, showCount: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showCount" className="text-gray-300 text-sm">نمایش تعداد محصولات هر دسته‌بندی</label>
                      </div>
                      <div className="flex items-center space-x-3 mt-2">
                        <input
                          type="checkbox"
                          id="active"
                          checked={categorySettings.active ?? true}
                          onChange={e => setCategorySettings({ ...categorySettings, active: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="active" className="text-gray-300 text-sm">فعال بودن بخش</label>
                      </div>
                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(false)}
                          className="px-4 py-2 text-gray-300 hover:text-white"
                        >لغو</button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 ml-2"
                          disabled={categoryLoading}
                        >{categoryLoading ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Discount Products Section Card */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <h3 className="text-lg font-bold text-white">🏷️ محصولات تخفیفی</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">اسلایدر</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">نمایش محصولات با تخفیف در قالب اسلایدر با دکمه‌های جابجایی</p>
                  <div className="flex items-center space-x-reverse space-x-4 mt-2">
                    <span className="text-xs text-orange-300">• نمایش درصد تخفیف</span>
                    <span className="text-xs text-orange-300">• دکمه‌های راست و چپ</span>
                    <span className="text-xs text-orange-300">• امکان ایجاد بخش‌های متعدد</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/admin/content/multiple-discount-sections"
                    className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-xs font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                  >
                    ✨ بخش‌های متعدد
                  </Link>
                </div>
              </div>
            </div>

            {/* Hover Products Sections Card */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <h3 className="text-lg font-bold text-white">✨ محصولات ویژه با افکت خاص</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">جدید</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">نمایش محصولات با انیمیشن و افکت هاور پیشرفته</p>
                  <div className="flex items-center space-x-reverse space-x-4 mt-2">
                    <span className="text-xs text-yellow-300">• انیمیشن هاور زیبا</span>
                    <span className="text-xs text-yellow-300">• اسلایدر تدریجی</span>
                    <span className="text-xs text-yellow-300">• امکان ایجاد بخش‌های متعدد</span>
                    <span className="text-xs text-yellow-300">• سفارشی‌سازی کامل</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/admin/content/hover-products-sections"
                    className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg text-xs font-medium transition-all duration-300 shadow-lg hover:shadow-yellow-500/25"
                  >
                    ⚡ مدیریت بخش‌ها
                  </Link>
                </div>
              </div>
            </div>

            {/* Why Us Section Settings Card */}
            <div className="bg-gradient-to-r from-purple-700 to-pink-700 rounded-2xl p-6 border border-purple-500/30 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-white">تنظیمات بخش چرا فروشگاه ما؟</h2>
                <Link
                  href="/admin/whyus-section-settings"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >تنظیمات</Link>
              </div>
              <p className="text-gray-300">مدیریت عنوان، زیرعنوان و متن مزایا در صفحه اصلی</p>
            </div>

            {/* About Page Settings Card */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <h3 className="text-lg font-bold text-white">📄 مدیریت صفحه درباره ما</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">صفحات</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">ویرایش کامل محتوای صفحه درباره ما شامل عناوین، توضیحات و ارزش‌های شرکت</p>
                  <div className="flex items-center space-x-reverse space-x-4 mt-2">
                    <span className="text-xs text-emerald-300">• ویرایش بخش اصلی</span>
                    <span className="text-xs text-emerald-300">• داستان شرکت</span>
                    <span className="text-xs text-emerald-300">• ارزش‌ها و ماموریت</span>
                    <span className="text-xs text-emerald-300">• اطلاعات تماس کامل</span>
                  </div>
                </div>
                <div>
                  <Link
                    href="/admin/content/about-page"
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
                  >
                    📝 ویرایش صفحه
                  </Link>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <FAQManagement />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="space-y-6">
              {/* General Settings */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-4">تنظیمات عمومی</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">نام فروشگاه</label>
                    <input
                      type="text"
                      value={settings.site_name || ''}
                      onChange={(e) => updateSetting('site_name', e.target.value)}
                      placeholder="نام فروشگاه"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">توضیحات سایت</label>
                    <textarea
                      rows={3}
                      value={settings.site_description || ''}
                      onChange={(e) => updateSetting('site_description', e.target.value)}
                      placeholder="توضیحات سایت"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">متن درباره ما برای پاورقی</label>
                    <textarea
                      rows={3}
                      value={settings.about_text || ''}
                      onChange={(e) => updateSetting('about_text', e.target.value)}
                      placeholder="متن کوتاه درباره فروشگاه برای نمایش در پاورقی"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-4">شبکه‌های اجتماعی</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">اینستاگرام</label>
                    <input
                      type="text"
                      value={settings.instagram || ''}
                      onChange={(e) => updateSetting('instagram', e.target.value)}
                      placeholder="@your_instagram"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">تلگرام</label>
                    <input
                      type="text"
                      value={settings.telegram || ''}
                      onChange={(e) => updateSetting('telegram', e.target.value)}
                      placeholder="@your_telegram"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">واتساپ</label>
                    <input
                      type="text"
                      value={settings.whatsapp || ''}
                      onChange={(e) => updateSetting('whatsapp', e.target.value)}
                      placeholder="09123456789"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Content */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-4">محتوای پاورقی</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">متن درباره ما</label>
                    <textarea
                      rows={4}
                      value={settings.about_text || ''}
                      onChange={(e) => updateSetting('about_text', e.target.value)}
                      placeholder="متن درباره ما"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">متن درباره ما برای پاورقی</label>
                    <textarea
                      rows={3}
                      value={settings.about_text || ''}
                      onChange={(e) => updateSetting('about_text', e.target.value)}
                      placeholder="متن کوتاه درباره فروشگاه برای نمایش در پاورقی"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-4">تنظیمات SEO</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">کلمات کلیدی</label>
                    <input
                      type="text"
                      value={settings.seo_keywords || ''}
                      onChange={(e) => updateSetting('seo_keywords', e.target.value)}
                      placeholder="کلمات کلیدی، با کاما جدا شده"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">توضیحات متا</label>
                    <textarea
                      rows={3}
                      value={settings.seo_description || ''}
                      onChange={(e) => updateSetting('seo_description', e.target.value)}
                      placeholder="توضیحات متا برای موتورهای جستجو"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={saveSettings}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                💾 ذخیره تنظیمات
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

const ContentManagement = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <ContentManagementContent />
    </Suspense>
  );
};

export default ContentManagement;
