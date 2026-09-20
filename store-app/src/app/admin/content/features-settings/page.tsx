'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { FeaturesSettings, Feature } from '@/types';

export default function FeaturesSettingsPage() {
  const [settings, setSettings] = useState<FeaturesSettings>({
    sectionTitle: 'چرا ما را انتخاب کنید؟',
    sectionSubtitle: 'مزایای خرید از فروشگاه ما',
    showSection: true,
    layout: 'grid',
    columns: 4,
    backgroundColor: '#f8f9fa',
    features: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Feature>>({
    title: '',
    description: '',
    icon: '🚚',
    iconType: 'emoji',
    iconColor: '#3b82f6',
    active: true,
    order: 1
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/features-settings');
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('خطا در بارگذاری تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/features-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
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

  const addFeature = () => {
    if (!formData.title || !formData.description) {
      toast.error('لطفاً عنوان و توضیحات را وارد کنید');
      return;
    }

    const newFeature: Feature = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      icon: formData.icon || '🚚',
      iconType: formData.iconType || 'emoji',
      iconColor: formData.iconColor || '#3b82f6',
      active: formData.active ?? true,
      order: formData.order || settings.features.length + 1
    };

    setSettings(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));

    resetForm();
    toast.success('ویژگی اضافه شد');
  };

  const updateFeature = () => {
    if (!editingId || !formData.title || !formData.description) {
      toast.error('لطفاً عنوان و توضیحات را وارد کنید');
      return;
    }

    setSettings(prev => ({
      ...prev,
      features: prev.features.map(f => 
        f.id === editingId 
          ? { ...f, ...formData } as Feature
          : f
      )
    }));

    resetForm();
    toast.success('ویژگی بروزرسانی شد');
  };

  const deleteFeature = (id: string) => {
    if (confirm('آیا از حذف این ویژگی اطمینان دارید؟')) {
      setSettings(prev => ({
        ...prev,
        features: prev.features.filter(f => f.id !== id)
      }));
      toast.success('ویژگی حذف شد');
    }
  };

  const editFeature = (feature: Feature) => {
    setEditingId(feature.id || null);
    setFormData(feature);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      icon: '🚚',
      iconType: 'emoji',
      iconColor: '#3b82f6',
      active: true,
      order: settings.features.length + 1
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">مدیریت ویژگی‌های فروشگاه</h1>

        {/* تنظیمات کلی */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">تنظیمات کلی</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان بخش</label>
              <input
                type="text"
                value={settings.sectionTitle}
                onChange={(e) => setSettings(prev => ({ ...prev, sectionTitle: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">زیرعنوان بخش</label>
              <input
                type="text"
                value={settings.sectionSubtitle || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, sectionSubtitle: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">رنگ پس‌زمینه</label>
              <input
                type="color"
                value={settings.backgroundColor || '#f8f9fa'}
                onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نوع چیدمان</label>
              <select
                value={settings.layout || 'grid'}
                onChange={(e) => setSettings(prev => ({ ...prev, layout: e.target.value as 'grid' | 'list' | 'cards' }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="grid">Grid (شبکه)</option>
                <option value="list">List (لیست)</option>
                <option value="cards">Cards (کارت)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">تعداد ستون‌ها</label>
              <select
                value={settings.columns || 4}
                onChange={(e) => setSettings(prev => ({ ...prev, columns: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>2 ستون</option>
                <option value={3}>3 ستون</option>
                <option value={4}>4 ستون</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showSection}
                  onChange={(e) => setSettings(prev => ({ ...prev, showSection: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="mr-2">نمایش بخش</span>
              </label>
            </div>
          </div>
        </div>

        {/* فرم افزودن/ویرایش */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'ویرایش ویژگی' : 'افزودن ویژگی جدید'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: ارسال سریع"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">آیکون (Emoji)</label>
              <input
                type="text"
                value={formData.icon || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: 🚚 💬 ⭐"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">توضیحات *</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="توضیحات کامل در مورد این ویژگی"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">رنگ آیکون</label>
              <input
                type="color"
                value={formData.iconColor || '#3b82f6'}
                onChange={(e) => setFormData(prev => ({ ...prev, iconColor: e.target.value }))}
                className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ترتیب نمایش</label>
              <input
                type="number"
                value={formData.order || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active ?? true}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="mr-2">فعال</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            {editingId ? (
              <>
                <button
                  onClick={updateFeature}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  بروزرسانی
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  انصراف
                </button>
              </>
            ) : (
              <button
                onClick={addFeature}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                افزودن ویژگی
              </button>
            )}
          </div>
        </div>

        {/* لیست ویژگی‌ها */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">لیست ویژگی‌ها ({settings.features.length})</h2>

          <div className="space-y-3">
            {settings.features.length === 0 ? (
              <p className="text-gray-400 text-center py-8">هنوز ویژگی‌ای اضافه نشده است</p>
            ) : (
              settings.features
                .sort((a, b) => a.order - b.order)
                .map((feature) => (
                  <div 
                    key={feature.id}
                    className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl"
                        style={{ 
                          backgroundColor: `${feature.iconColor}20`,
                          color: feature.iconColor 
                        }}
                      >
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-gray-500">ترتیب: {feature.order}</span>
                          {feature.active ? (
                            <span className="text-xs text-green-400">● فعال</span>
                          ) : (
                            <span className="text-xs text-red-400">● غیرفعال</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => editFeature(feature)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => deleteFeature(feature.id || '')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* دکمه ذخیره نهایی */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </div>
      </div>
    </div>
  );
}
