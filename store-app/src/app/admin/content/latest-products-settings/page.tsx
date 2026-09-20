'use client';

import React, { useState, useEffect } from 'react';
import { FiSave, FiSettings, FiList, FiEye, FiEyeOff } from 'react-icons/fi';

interface LatestProductsSettings {
  title: string;
  subtitle: string;
  maxProducts: number;
  active: boolean;
  selectionMode: 'manual' | 'latest' | 'random' | 'most_viewed' | 'best_selling' | 'highest_rated';
  autoUpdateInterval: number;
  selectedProducts: string[];
  displayStyle: 'grid' | 'slider' | 'carousel';
  showDiscount: boolean;
  showRating: boolean;
  showQuickView: boolean;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  active: boolean;
}

export default function LatestProductsSettingsPage() {
  const [settings, setSettings] = useState<LatestProductsSettings>({
    title: 'جدیدترین محصولات',
    subtitle: 'آخرین محصولات اضافه شده به فروشگاه',
    maxProducts: 8,
    active: true,
    selectionMode: 'latest',
    autoUpdateInterval: 24,
    selectedProducts: [],
    displayStyle: 'grid',
    showDiscount: true,
    showRating: true,
    showQuickView: true,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchProducts();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/latest-products-settings');
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showMessage('error', 'خطا در دریافت تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?active=true&limit=100');
      const data = await response.json();
      
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/latest-products-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'تنظیمات با موفقیت ذخیره شد');
      } else {
        showMessage('error', 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleProductSelection = (productId: string) => {
    setSettings(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تنظیمات جدیدترین محصولات</h1>
                <p className="text-gray-600 mt-1">مدیریت نمایش جدیدترین محصولات در صفحه اصلی</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <FiSave />
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiSettings />
                تنظیمات پایه
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان بخش
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    زیرعنوان
                  </label>
                  <input
                    type="text"
                    value={settings.subtitle}
                    onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تعداد محصولات
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={settings.maxProducts}
                      onChange={(e) => setSettings({ ...settings, maxProducts: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      بازه بروزرسانی (ساعت)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.autoUpdateInterval}
                      onChange={(e) => setSettings({ ...settings, autoUpdateInterval: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع انتخاب محصولات
                  </label>
                  <select
                    value={settings.selectionMode}
                    onChange={(e) => setSettings({ ...settings, selectionMode: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="latest">جدیدترین</option>
                    <option value="best_selling">پرفروش‌ترین</option>
                    <option value="most_viewed">پربازدیدترین</option>
                    <option value="highest_rated">بیشترین امتیاز</option>
                    <option value="random">تصادفی</option>
                    <option value="manual">انتخاب دستی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع نمایش
                  </label>
                  <select
                    value={settings.displayStyle}
                    onChange={(e) => setSettings({ ...settings, displayStyle: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="grid">شبکه‌ای</option>
                    <option value="slider">اسلایدر</option>
                    <option value="carousel">کاروسل</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                گزینه‌های نمایش
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showDiscount}
                    onChange={(e) => setSettings({ ...settings, showDiscount: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">نمایش درصد تخفیف</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showRating}
                    onChange={(e) => setSettings({ ...settings, showRating: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">نمایش امتیاز محصولات</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showQuickView}
                    onChange={(e) => setSettings({ ...settings, showQuickView: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">دکمه مشاهده سریع</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.active}
                    onChange={(e) => setSettings({ ...settings, active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    {settings.active ? <FiEye className="text-green-600" /> : <FiEyeOff className="text-red-600" />}
                    <span className="text-gray-700 font-medium">فعال بودن بخش</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Manual Selection */}
            {settings.selectionMode === 'manual' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  انتخاب دستی محصولات ({settings.selectedProducts.length} انتخاب شده)
                </h2>
                
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {products.map(product => (
                    <label
                      key={product._id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        settings.selectedProducts.includes(product._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={settings.selectedProducts.includes(product._id)}
                        onChange={() => toggleProductSelection(product._id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.price.toLocaleString()} تومان</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">پیش‌نمایش</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">وضعیت:</span>
                  <span className={settings.active ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {settings.active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">تعداد محصولات:</span>
                  <span className="font-medium">{settings.maxProducts}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">نوع انتخاب:</span>
                  <span className="font-medium">
                    {settings.selectionMode === 'latest' && 'جدیدترین'}
                    {settings.selectionMode === 'best_selling' && 'پرفروش‌ترین'}
                    {settings.selectionMode === 'most_viewed' && 'پربازدیدترین'}
                    {settings.selectionMode === 'highest_rated' && 'بیشترین امتیاز'}
                    {settings.selectionMode === 'random' && 'تصادفی'}
                    {settings.selectionMode === 'manual' && 'دستی'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">نوع نمایش:</span>
                  <span className="font-medium">
                    {settings.displayStyle === 'grid' && 'شبکه‌ای'}
                    {settings.displayStyle === 'slider' && 'اسلایدر'}
                    {settings.displayStyle === 'carousel' && 'کاروسل'}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 این بخش به صورت خودکار هر {settings.autoUpdateInterval} ساعت بروزرسانی می‌شود.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
