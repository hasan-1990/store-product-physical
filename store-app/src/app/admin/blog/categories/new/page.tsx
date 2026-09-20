'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    active: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Auto-generate slug from name
      if (name === 'name') {
        const slug = value
          .toLowerCase()
          .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        setFormData(prev => ({
          ...prev,
          slug: slug
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('خطا در ایجاد دسته‌بندی');
      }

      router.push('/admin/blog');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('خطا در ایجاد دسته‌بندی');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog/categories"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            بازگشت
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">ایجاد دسته‌بندی جدید</h1>
            <p className="text-gray-400 mt-1">دسته‌بندی جدید برای مقالات ایجاد کنید</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              نام دسته‌بندی *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              placeholder="نام دسته‌بندی را وارد کنید..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              نامک (Slug) *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              placeholder="url-friendly-name"
            />
            <p className="text-sm text-gray-400 mt-2">
              آدرس URL دسته‌بندی: /blog/category/{formData.slug || '...'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              توضیحات
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none"
              placeholder="توضیحات دسته‌بندی..."
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-3 p-4 bg-gray-700/30 rounded-lg border border-purple-500/20">
            <input
              type="checkbox"
              name="active"
              id="active"
              checked={formData.active}
              onChange={handleInputChange}
              className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-2 focus:ring-purple-500/50 bg-gray-700 cursor-pointer"
            />
            <label htmlFor="active" className="text-sm font-medium text-white cursor-pointer select-none">
              دسته‌بندی فعال باشد
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال ذخیره...
                </span>
              ) : (
                'ایجاد دسته‌بندی'
              )}
            </button>
            
            <Link
              href="/admin/blog/categories"
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-all duration-300 font-medium text-center flex items-center justify-center"
            >
              لغو
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}