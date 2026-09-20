'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { GuaranteeSettings, Guarantee } from '@/types';

export default function GuaranteeSettingsPage() {
  const [settings, setSettings] = useState<GuaranteeSettings>({
    sectionTitle: 'تضمین خرید امن',
    sectionSubtitle: 'خرید از فروشگاه ما با اطمینان کامل',
    showSection: true,
    backgroundColor: '#f8f9fa',
    guarantees: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Guarantee>>({
    title: '',
    description: '',
    icon: '✅',
    iconType: 'emoji',
    active: true,
    order: 1
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/guarantee-settings');
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
      const response = await fetch('/api/admin/guarantee-settings', {
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

  const addGuarantee = () => {
    if (!formData.title || !formData.description) {
      toast.error('لطفاً عنوان و توضیحات را وارد کنید');
      return;
    }

    const newGuarantee: Guarantee = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      icon: formData.icon || '✅',
      iconType: formData.iconType || 'emoji',
      active: formData.active ?? true,
      order: formData.order || settings.guarantees.length + 1
    };

    setSettings(prev => ({
      ...prev,
      guarantees: [...prev.guarantees, newGuarantee]
    }));

    resetForm();
    toast.success('گارانتی اضافه شد');
  };

  const updateGuarantee = () => {
    if (!editingId || !formData.title || !formData.description) {
      toast.error('لطفاً عنوان و توضیحات را وارد کنید');
      return;
    }

    setSettings(prev => ({
      ...prev,
      guarantees: prev.guarantees.map(g => 
        g.id === editingId 
          ? { ...g, ...formData } as Guarantee
          : g
      )
    }));

    resetForm();
    toast.success('گارانتی بروزرسانی شد');
  };

  const deleteGuarantee = (id: string) => {
    if (confirm('آیا از حذف این گارانتی اطمینان دارید؟')) {
      setSettings(prev => ({
        ...prev,
        guarantees: prev.guarantees.filter(g => g.id !== id)
      }));
      toast.success('گارانتی حذف شد');
    }
  };

  const editGuarantee = (guarantee: Guarantee) => {
    setEditingId(guarantee.id || null);
    setFormData(guarantee);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      icon: '✅',
      iconType: 'emoji',
      active: true,
      order: settings.guarantees.length + 1
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
        <h1 className="text-3xl font-bold mb-8">مدیریت بخش گارانتی‌ها</h1>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">رنگ پس‌زمینه</label>
              <input
                type="color"
                value={settings.backgroundColor || '#f8f9fa'}
                onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showSection}
                  onChange={(e) => setSettings(prev => ({ ...prev, showSection: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="mr-2">نمایش بخش در سایت</span>
              </label>
            </div>
          </div>
        </div>

        {/* فرم افزودن/ویرایش */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'ویرایش گارانتی' : 'افزودن گارانتی جدید'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: گارانتی اصالت کالا"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">آیکون (Emoji)</label>
              <input
                type="text"
                value={formData.icon || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: ✅ 🔒 💬"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">توضیحات</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="توضیحات کامل در مورد این گارانتی"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  onClick={updateGuarantee}
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
                onClick={addGuarantee}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                افزودن گارانتی
              </button>
            )}
          </div>
        </div>

        {/* لیست گارانتی‌ها */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">لیست گارانتی‌ها ({settings.guarantees.length})</h2>

          <div className="space-y-3">
            {settings.guarantees.length === 0 ? (
              <p className="text-gray-400 text-center py-8">هنوز گارانتی‌ای اضافه نشده است</p>
            ) : (
              settings.guarantees
                .sort((a, b) => a.order - b.order)
                .map((guarantee) => (
                  <div 
                    key={guarantee.id}
                    className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl">{guarantee.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{guarantee.title}</h3>
                        <p className="text-sm text-gray-400">{guarantee.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-gray-500">ترتیب: {guarantee.order}</span>
                          {guarantee.active ? (
                            <span className="text-xs text-green-400">● فعال</span>
                          ) : (
                            <span className="text-xs text-red-400">● غیرفعال</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => editGuarantee(guarantee)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => deleteGuarantee(guarantee.id || '')}
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
