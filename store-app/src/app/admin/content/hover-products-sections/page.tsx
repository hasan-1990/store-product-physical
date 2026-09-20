'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HoverProductsSection {
  _id?: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  maxProducts: number;
  active: boolean;
  position: string;
  order: number;
  productType: 'latest' | 'random' | 'manual' | 'category';
  selectedCategories: string[];
  selectedProducts: string[];
}

const positions = [
  { value: 'home-top', label: 'صفحه اصلی - بالا' },
  { value: 'home-middle', label: 'صفحه اصلی - وسط' },
  { value: 'home-bottom', label: 'صفحه اصلی - پایین' },
  { value: 'shop-top', label: 'صفحه فروشگاه - بالا' },
  { value: 'shop-bottom', label: 'صفحه فروشگاه - پایین' },
];

const backgroundColors = [
  { value: 'bg-white', label: 'سفید', preview: 'bg-white' },
  { value: 'bg-gray-50', label: 'خاکستری روشن', preview: 'bg-gray-50' },
  { value: 'bg-gray-100', label: 'خاکستری', preview: 'bg-gray-100' },
  { value: 'bg-gradient-to-b from-gray-50 to-white', label: 'گرادیانت خاکستری', preview: 'bg-gradient-to-b from-gray-50 to-white' },
  { value: 'bg-gradient-to-br from-blue-50 to-indigo-100', label: 'گرادیانت آبی', preview: 'bg-gradient-to-br from-blue-50 to-indigo-100' },
  { value: 'bg-gradient-to-br from-orange-50 to-yellow-100', label: 'گرادیانت نارنجی', preview: 'bg-gradient-to-br from-orange-50 to-yellow-100' },
];

const productTypes = [
  { value: 'latest', label: 'جدیدترین محصولات', icon: '🆕' },
  { value: 'random', label: 'تصادفی', icon: '🎲' },
  { value: 'manual', label: 'انتخاب دستی', icon: '✋' },
  { value: 'category', label: 'بر اساس دسته‌بندی', icon: '📁' },
];

export default function HoverProductsSectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<HoverProductsSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<HoverProductsSection | null>(null);
  const [view, setView] = useState<'list' | 'edit'>('list');

  const defaultSection: HoverProductsSection = {
    title: 'جدیدترین محصولات',
    subtitle: 'کشف کنید، انتخاب کنید و لذت ببرید',
    backgroundColor: 'bg-white',
    maxProducts: 8,
    active: true,
    position: 'home-top',
    order: 1,
    productType: 'latest',
    selectedCategories: [],
    selectedProducts: [],
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/hover-products-sections');
      const data = await response.json();
      if (data.success) {
        setSections(data.data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingSection) return;

    try {
      const url = '/api/admin/hover-products-sections';
      const method = editingSection._id ? 'PUT' : 'POST';

      // تبدیل _id به id برای API
      const payload = editingSection._id 
        ? { ...editingSection, id: editingSection._id }
        : editingSection;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(editingSection._id ? 'بخش با موفقیت بروزرسانی شد' : 'بخش با موفقیت ایجاد شد');
        setView('list');
        setEditingSection(null);
        fetchSections();
      } else {
        alert('خطا: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      alert('خطا در ذخیره بخش');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این بخش اطمینان دارید؟')) return;

    try {
      const response = await fetch(`/api/admin/hover-products-sections?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('بخش با موفقیت حذف شد');
        fetchSections();
      } else {
        alert('خطا: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('خطا در حذف بخش');
    }
  };

  const startEdit = (section?: HoverProductsSection) => {
    setEditingSection(section || defaultSection);
    setView('edit');
  };

  const cancelEdit = () => {
    setView('list');
    setEditingSection(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/10 rounded-xl w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <Link
                    href="/admin/content"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold text-white">✨ محصولات ویژه با افکت خاص</h1>
                    <p className="text-purple-200 mt-1">مدیریت بخش‌های مختلف نمایش محصولات با انیمیشن پیشرفته</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => startEdit()}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/25 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                افزودن بخش جدید
              </button>
            </div>
          </div>

          {/* Sections List */}
          {sections.length === 0 ? (
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-white mb-2">هیچ بخشی ایجاد نشده است</h2>
              <p className="text-purple-200 mb-6">برای شروع، اولین بخش خود را ایجاد کنید</p>
              <button
                onClick={() => startEdit()}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-all duration-300"
              >
                ایجاد اولین بخش
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sections.map((section) => (
                <div
                  key={section._id}
                  className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-white">{section.title}</h3>
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            section.active
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}
                        >
                          {section.active ? '✓ فعال' : '✕ غیرفعال'}
                        </span>
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          📍 {positions.find((p) => p.value === section.position)?.label}
                        </span>
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          #{section.order}
                        </span>
                      </div>
                      <p className="text-purple-200 text-sm mb-4">{section.subtitle}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                          <span className="text-white text-sm font-medium">
                            📦 {section.maxProducts} محصول
                          </span>
                        </div>
                        <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                          <span className="text-white text-sm font-medium">
                            {productTypes.find((t) => t.value === section.productType)?.icon}{' '}
                            {productTypes.find((t) => t.value === section.productType)?.label}
                          </span>
                        </div>
                        <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                          <span className="text-white text-sm font-medium">
                            🎨 {backgroundColors.find((b) => b.value === section.backgroundColor)?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(section)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors border border-blue-500/30 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        ویرایش
                      </button>
                      <button
                        onClick={() => section._id && handleDelete(section._id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors border border-red-500/30 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={cancelEdit}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {editingSection?._id ? '✏️ ویرایش بخش' : '➕ افزودن بخش جدید'}
                </h1>
                <p className="text-purple-200 mt-1">
                  {editingSection?._id ? 'ویرایش تنظیمات بخش موجود' : 'ایجاد بخش جدید با تنظیمات دلخواه'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20">
          <div className="space-y-6">
            {/* عنوان و زیرعنوان */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  عنوان بخش *
                </label>
                <input
                  type="text"
                  value={editingSection?.title || ''}
                  onChange={(e) =>
                    editingSection && setEditingSection({ ...editingSection, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="مثال: جدیدترین محصولات"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  زیرعنوان
                </label>
                <input
                  type="text"
                  value={editingSection?.subtitle || ''}
                  onChange={(e) =>
                    editingSection && setEditingSection({ ...editingSection, subtitle: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="مثال: کشف کنید، انتخاب کنید و لذت ببرید"
                />
              </div>
            </div>

            {/* موقعیت و تعداد */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  📍 موقعیت نمایش *
                </label>
                <select
                  value={editingSection?.position || 'home-top'}
                  onChange={(e) =>
                    editingSection && setEditingSection({ ...editingSection, position: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value} className="bg-slate-800">
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  📦 تعداد محصولات
                </label>
                <input
                  type="number"
                  value={editingSection?.maxProducts || 8}
                  onChange={(e) =>
                    editingSection &&
                    setEditingSection({
                      ...editingSection,
                      maxProducts: parseInt(e.target.value) || 8,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  min="4"
                  max="20"
                />
              </div>
            </div>

            {/* نوع محصولات */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                📋 نوع انتخاب محصولات
              </label>
              <div className="grid grid-cols-2 gap-3">
                {productTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() =>
                      editingSection &&
                      setEditingSection({
                        ...editingSection,
                        productType: type.value as any,
                      })
                    }
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      editingSection?.productType === type.value
                        ? 'bg-purple-500/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/20 text-purple-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* رنگ پس‌زمینه */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                🎨 رنگ پس‌زمینه
              </label>
              <div className="grid grid-cols-3 gap-3">
                {backgroundColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      editingSection &&
                      setEditingSection({ ...editingSection, backgroundColor: color.value })
                    }
                    className={`p-4 rounded-xl border-2 transition-all ${
                      editingSection?.backgroundColor === color.value
                        ? 'border-purple-500 ring-2 ring-purple-500/50'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className={`w-full h-12 rounded-lg mb-2 ${color.preview}`}></div>
                    <div className="text-xs font-medium text-white">{color.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ترتیب نمایش */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                🔢 ترتیب نمایش
              </label>
              <input
                type="number"
                value={editingSection?.order || 1}
                onChange={(e) =>
                  editingSection &&
                  setEditingSection({
                    ...editingSection,
                    order: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                min="1"
              />
              <p className="text-sm text-purple-300 mt-2">
                💡 عدد کوچکتر = اولویت بیشتر در نمایش
              </p>
            </div>

            {/* وضعیت فعال */}
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/20">
              <input
                type="checkbox"
                id="active"
                checked={editingSection?.active || false}
                onChange={(e) =>
                  editingSection &&
                  setEditingSection({ ...editingSection, active: e.target.checked })
                }
                className="w-6 h-6 text-purple-600 border-white/30 rounded focus:ring-purple-500"
              />
              <label htmlFor="active" className="text-sm font-bold text-white flex-1">
                ✅ فعال بودن بخش در سایت
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-white/20">
            <button
              onClick={cancelEdit}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/20"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              💾 ذخیره تنظیمات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
