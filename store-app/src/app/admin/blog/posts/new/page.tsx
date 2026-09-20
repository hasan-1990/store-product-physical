'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import ImageGallery from '@/components/ImageGallery';
import TiptapRichEditor from '@/components/TiptapRichEditor';

export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image: '',
    category: '',
    tags: [] as string[],
    status: 'draft',
    featured: false,
    readTime: 5
  });

  // Fetch categories and tags
  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const response = await fetch(`/api/blog/categories`, { cache: 'no-store' });
      if (!response.ok) throw new Error('خطا در دریافت دسته‌بندی‌ها');
      return response.json();
    },
  });

  const { data: tagsData } = useQuery({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const response = await fetch(`/api/blog/tags`, { cache: 'no-store' });
      if (!response.ok) throw new Error('خطا در دریافت برچسب‌ها');
      return response.json();
    },
  });

  const categories = categoriesData?.data || [];
  const availableTags = tagsData?.data || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      
      // Auto-generate slug from title
      if (name === 'title') {
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

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  // محاسبه زمان مطالعه (تقریبی)
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const handleSubmit = async (
    e: React.FormEvent | React.MouseEvent,
    statusOverride?: 'draft' | 'published'
  ) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('لطفاً عنوان و محتوای مقاله را وارد کنید');
      return;
    }
    setIsSubmitting(true);

    const effectiveStatus = statusOverride || (formData.status as 'draft' | 'published' | 'scheduled');

    try {
      const payload = {
        ...formData,
        status: effectiveStatus,
        readTime: calculateReadTime(formData.content),
        author: 'مدیر سایت', // TODO: دریافت از auth/session
        publishedAt: effectiveStatus === 'published' ? new Date().toISOString() : null,
      } as any;

      // اگر وضعیت زمان‌بندی شده است، بعداً می‌توان فیلد scheduledAt اضافه کرد
      if (effectiveStatus === 'scheduled' && !(payload as any).scheduledAt) {
        // placeholder: فعلاً بدون scheduledAt ذخیره می‌شود
      }

      const response = await fetch(`/api/blog/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('خطا در ایجاد مقاله');

      await response.json();
      router.push('/admin/blog/posts');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('خطا در ایجاد مقاله');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" dir="rtl">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm shadow-lg border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/blog"
                className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                بازگشت
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">ایجاد مقاله جدید</h1>
                <p className="text-gray-300 mt-1">مقاله جدید خود را ایجاد کنید</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {previewMode ? 'ویرایش' : 'پیش‌نمایش'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!previewMode ? (
          // Edit Mode
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  عنوان مقاله *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg text-white placeholder-gray-400"
                  placeholder="عنوان مقاله خود را وارد کنید..."
                />
              </div>

              {/* Slug */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  نامک (Slug) *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="url-friendly-name"
                />
                <p className="text-sm text-gray-400 mt-2">
                  آدرس URL مقاله: /blog/{formData.slug}
                </p>
              </div>

              {/* Excerpt */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  خلاصه مقاله
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="خلاصه‌ای کوتاه از مقاله..."
                />
              </div>

              {/* Content */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  محتوای مقاله *
                </label>
                <TiptapRichEditor
                  value={formData.content}
                  onChange={(value: string) => setFormData(prev => ({ ...prev, content: value }))}
                  placeholder="محتوای کامل مقاله خود را اینجا بنویسید..."
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Options */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">تنظیمات انتشار</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      وضعیت
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                    >
                      <option value="draft">پیش‌نویس</option>
                      <option value="published">منتشر شده</option>
                      <option value="scheduled">زمان‌بندی شده</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      زمان مطالعه (دقیقه)
                    </label>
                    <input
                      type="number"
                      name="readTime"
                      value={formData.readTime}
                      onChange={handleInputChange}
                      min="1"
                      max="60"
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="rounded border-gray-600 bg-gray-900/50 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                    />
                    <label className="mr-3 text-sm font-medium text-gray-300">
                      مقاله ویژه
                    </label>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">تصویر شاخص</h3>
                
                <ImageGallery
                  selectedImage={formData.image}
                  onImageSelect={(imageUrl: string) => setFormData(prev => ({ ...prev, image: imageUrl }))}
                  imageType="banner"
                  autoResize={true}
                  title="انتخاب تصویر شاخص بلاگ"
                />
              </div>

              {/* Category */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">دسته‌بندی</h3>
                
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map((category: any) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">برچسب‌ها</h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableTags.map((tag: any) => (
                    <label key={tag._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.tags.includes(tag._id)}
                        onChange={() => handleTagToggle(tag._id)}
                        className="rounded border-gray-600 bg-gray-900/50 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                      />
                      <span className="mr-3 text-sm text-gray-300">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, 'draft')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-lg shadow"
                >
                  {isSubmitting ? 'در حال ذخیره...' : 'ذخیره به عنوان پیش‌نویس'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, 'published')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg"
                >
                  {isSubmitting ? 'در حال انتشار...' : 'انتشار فوری'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          // Preview Mode
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-gray-700/50">
            <article className="prose prose-lg max-w-none text-gray-100" dir="rtl">
              {formData.image && (
                <Image
                  src={formData.image}
                  alt={formData.title}
                  width={800}
                  height={400}
                  className="w-full h-64 object-cover rounded-lg mb-8 border border-gray-600"
                />
              )}
              
              <header className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">
                  {formData.title || 'عنوان مقاله'}
                </h1>
                {formData.excerpt && (
                  <p className="text-xl text-gray-300 leading-relaxed">
                    {formData.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
                  <span>زمان مطالعه: {formData.readTime} دقیقه</span>
                  <span>وضعیت: {formData.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}</span>
                  {formData.featured && <span className="text-yellow-400">⭐ ویژه</span>}
                </div>
              </header>
              
              <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                {formData.content || 'محتوای مقاله در اینجا نمایش داده می‌شود...'}
              </div>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}