'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export default function EditBlogCategory() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category>({
    _id: '',
    name: '',
    slug: '',
    description: '',
    color: '#6b46c1'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/blog/categories?id=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setCategory(data);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category.name.trim()) {
      alert('لطفاً نام دسته‌بندی را وارد کنید');
      return;
    }

    setSaving(true);

    try {
      const categoryData = {
        ...category,
        slug: generateSlug(category.name)
      };

      const response = await fetch('/api/blog/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: categoryId, ...categoryData }),
      });

      if (response.ok) {
        router.push('/admin/blog/categories');
      } else {
        const error = await response.text();
        alert(`خطا در ذخیره دسته‌بندی: ${error}`);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('خطا در ذخیره دسته‌بندی');
    } finally {
      setSaving(false);
    }
  };

  const colorOptions = [
    '#6b46c1', '#7c3aed', '#db2777', '#dc2626', 
    '#ea580c', '#d97706', '#65a30d', '#16a34a',
    '#059669', '#0891b2', '#0284c7', '#2563eb',
    '#4f46e5', '#7c2d12', '#a21caf', '#be123c'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">ویرایش دسته‌بندی</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          بازگشت
        </button>
      </div>

      <div className="max-w-2xl">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                نام دسته‌بندی *
              </label>
              <input
                type="text"
                value={category.name}
                onChange={(e) => setCategory({...category, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                placeholder="نام دسته‌بندی را وارد کنید..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                توضیحات
              </label>
              <textarea
                value={category.description}
                onChange={(e) => setCategory({...category, description: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                placeholder="توضیحات دسته‌بندی..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                رنگ دسته‌بندی
              </label>
              <div className="grid grid-cols-8 gap-3 mb-4">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategory({...category, color})}
                    className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                      category.color === color 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => setCategory({...category, color: e.target.value})}
                  className="w-12 h-10 rounded-lg bg-transparent border border-purple-500/30 cursor-pointer"
                />
                <span className="text-gray-300">یا رنگ دلخواه انتخاب کنید</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                پیش‌نمایش
              </label>
              <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name.charAt(0) || 'د'}
                </div>
                <div>
                  <h3 className="text-white font-medium">{category.name || 'نام دسته‌بندی'}</h3>
                  <p className="text-gray-400 text-sm">{category.description || 'توضیحات دسته‌بندی'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium disabled:opacity-50 disabled:transform-none"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}