'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { TestimonialSettings, Testimonial } from '@/types';

export default function TestimonialSettingsPage() {
  const [settings, setSettings] = useState<TestimonialSettings>({
    sectionTitle: 'نظرات مشتریان',
    sectionSubtitle: 'آنچه مشتریان درباره ما می‌گویند',
    showSection: true,
    autoPlay: true,
    autoPlayInterval: 5000,
    backgroundColor: '#ffffff',
    testimonials: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Testimonial>>({
    customerName: '',
    customerRole: '',
    customerAvatar: '',
    rating: 5,
    comment: '',
    productName: '',
    verified: true,
    featured: false,
    active: true,
    order: 1
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/testimonial-settings');
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
      const response = await fetch('/api/admin/testimonial-settings', {
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

  const addTestimonial = () => {
    if (!formData.customerName || !formData.comment) {
      toast.error('لطفاً نام مشتری و متن نظر را وارد کنید');
      return;
    }

    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      customerName: formData.customerName,
      customerRole: formData.customerRole || '',
      customerAvatar: formData.customerAvatar || '',
      rating: formData.rating || 5,
      comment: formData.comment,
      productName: formData.productName || '',
      verified: formData.verified ?? true,
      featured: formData.featured ?? false,
      active: formData.active ?? true,
      order: formData.order || settings.testimonials.length + 1
    };

    setSettings(prev => ({
      ...prev,
      testimonials: [...prev.testimonials, newTestimonial]
    }));

    resetForm();
    toast.success('نظر اضافه شد');
  };

  const updateTestimonial = () => {
    if (!editingId || !formData.customerName || !formData.comment) {
      toast.error('لطفاً نام مشتری و متن نظر را وارد کنید');
      return;
    }

    setSettings(prev => ({
      ...prev,
      testimonials: prev.testimonials.map(t => 
        t.id === editingId 
          ? { ...t, ...formData } as Testimonial
          : t
      )
    }));

    resetForm();
    toast.success('نظر بروزرسانی شد');
  };

  const deleteTestimonial = (id: string) => {
    if (confirm('آیا از حذف این نظر اطمینان دارید؟')) {
      setSettings(prev => ({
        ...prev,
        testimonials: prev.testimonials.filter(t => t.id !== id)
      }));
      toast.success('نظر حذف شد');
    }
  };

  const editTestimonial = (testimonial: Testimonial) => {
    setEditingId(testimonial.id || null);
    setFormData(testimonial);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      customerName: '',
      customerRole: '',
      customerAvatar: '',
      rating: 5,
      comment: '',
      productName: '',
      verified: true,
      featured: false,
      active: true,
      order: settings.testimonials.length + 1
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
        <h1 className="text-3xl font-bold mb-8">مدیریت نظرات مشتریان</h1>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">رنگ پس‌زمینه</label>
              <input
                type="color"
                value={settings.backgroundColor || '#ffffff'}
                onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">فاصله اسلاید (میلی‌ثانیه)</label>
              <input
                type="number"
                value={settings.autoPlayInterval || 5000}
                onChange={(e) => setSettings(prev => ({ ...prev, autoPlayInterval: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1000"
                step="1000"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showSection}
                  onChange={(e) => setSettings(prev => ({ ...prev, showSection: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="mr-2">نمایش بخش</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoPlay}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoPlay: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="mr-2">اسلاید خودکار</span>
              </label>
            </div>
          </div>
        </div>

        {/* فرم افزودن/ویرایش */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'ویرایش نظر' : 'افزودن نظر جدید'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">نام مشتری *</label>
              <input
                type="text"
                value={formData.customerName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: احمد محمدی"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نقش/شغل</label>
              <input
                type="text"
                value={formData.customerRole || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, customerRole: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: مدیر فروش"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">تصویر مشتری (URL)</label>
              <input
                type="text"
                value={formData.customerAvatar || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, customerAvatar: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نام محصول (اختیاری)</label>
              <input
                type="text"
                value={formData.productName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="محصولی که نظر درباره آن است"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">متن نظر *</label>
            <textarea
              value={formData.comment || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="نظر مشتری درباره محصول یا خدمات"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">امتیاز (1-5)</label>
              <select
                value={formData.rating || 5}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} ⭐</option>
                ))}
              </select>
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
                  checked={formData.verified ?? true}
                  onChange={(e) => setFormData(prev => ({ ...prev, verified: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="mr-2">تایید شده</span>
              </label>
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
                  onClick={updateTestimonial}
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
                onClick={addTestimonial}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                افزودن نظر
              </button>
            )}
          </div>
        </div>

        {/* لیست نظرات */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">لیست نظرات ({settings.testimonials.length})</h2>

          <div className="space-y-3">
            {settings.testimonials.length === 0 ? (
              <p className="text-gray-400 text-center py-8">هنوز نظری اضافه نشده است</p>
            ) : (
              settings.testimonials
                .sort((a, b) => a.order - b.order)
                .map((testimonial) => (
                  <div 
                    key={testimonial.id}
                    className="bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{testimonial.customerName}</h3>
                        {testimonial.customerRole && (
                          <p className="text-sm text-gray-400">{testimonial.customerRole}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-400">
                            {'⭐'.repeat(testimonial.rating)}
                          </span>
                          <span className="text-xs text-gray-500">ترتیب: {testimonial.order}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => editTestimonial(testimonial)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => deleteTestimonial(testimonial.id || '')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-2">{testimonial.comment}</p>
                    
                    <div className="flex gap-2 flex-wrap">
                      {testimonial.verified && (
                        <span className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded">✓ تایید شده</span>
                      )}
                      {testimonial.active ? (
                        <span className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded">● فعال</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded">● غیرفعال</span>
                      )}
                      {testimonial.productName && (
                        <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded">محصول: {testimonial.productName}</span>
                      )}
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
