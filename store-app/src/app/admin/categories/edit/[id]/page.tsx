"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import React from "react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  active: boolean;
  order: number;
  parentId?: string | null;
  level: number;
  productCount?: number;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  parentId: string;
  active: boolean;
  order: number;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    imageAlt: '',
    parentId: '',
    active: true,
    order: 0
  });

  useEffect(() => {
    fetchCategories();
    fetchCurrentCategory();
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?limit=100");
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data || []);
      } else {
        setError("خطا در دریافت دسته‌بندی‌ها");
      }
    } catch {
      setError("خطا در دریافت دسته‌بندی‌ها");
    }
  };

  const fetchCurrentCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/categories/${categoryId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const category = result.data;
        setCurrentCategory(category);
        setFormData({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          imageUrl: category.imageUrl || '',
          imageAlt: category.imageAlt || '',
          parentId: category.parentId || '',
          active: category.active ?? true,
          order: category.order || 0
        });
        setImagePreview(category.imageUrl || '');
      } else {
        setError("دسته‌بندی یافت نشد");
      }
    } catch {
      setError("خطا در دریافت اطلاعات دسته‌بندی");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('لطفاً فقط فایل تصویری انتخاب کنید');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('حجم فایل نباید بیشتر از 5 مگابایت باشد');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        setFormData(prev => ({
          ...prev,
          imageUrl: imageUrl
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('نام و شناسه یکتا الزامی است');
      return;
    }

    // بررسی اینکه دسته‌بندی والد خودش نباشد
    if (formData.parentId === categoryId) {
      setError('دسته‌بندی نمی‌تواند والد خودش باشد');
      return;
    }

    // محاسبه سطح جدید
    let newLevel = 0;
    if (formData.parentId) {
      const parentCategory = categories.find(c => c._id === formData.parentId);
      if (parentCategory) {
        newLevel = parentCategory.level + 1;
        if (newLevel > 2) {
          setError('حداکثر سطح دسته‌بندی 3 است');
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const submitData = {
        ...formData,
        level: newLevel,
        parentId: formData.parentId || null
      };

      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('دسته‌بندی با موفقیت بروزرسانی شد');
        setTimeout(() => {
          router.push('/admin/categories');
        }, 2000);
      } else {
        setError(`خطا: ${result.error}`);
      }
    } catch (error) {
      console.error('خطا در بروزرسانی دسته‌بندی:', error);
      setError('خطا در ارتباط با سرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableParents = (): Category[] => {
    if (!currentCategory) return categories.filter(cat => cat.level < 2);
    
    // حذف خود دسته‌بندی و فرزندانش از لیست والدین
    const excludeIds = new Set([categoryId]);
    
    const addChildren = (cat: Category) => {
      if (cat.children) {
        cat.children.forEach(child => {
          excludeIds.add(child._id);
          addChildren(child);
        });
      }
    };
    
    addChildren(currentCategory);
    
    return categories.filter(cat => 
      !excludeIds.has(cat._id) && 
      cat.level < 2
    );
  };

  const renderCategoryOption = (category: Category, depth = 0): React.ReactElement[] => {
    const prefix = '—'.repeat(depth);
    const options: React.ReactElement[] = [
      <option key={category._id} value={category._id}>
        {prefix} {category.name} ({category.level === 0 ? 'دسته اصلی' : 'زیردسته'})
      </option>
    ];

    if (category.children) {
      category.children.forEach(child => {
        if (child.level < 2) {
          options.push(...renderCategoryOption(child, depth + 1));
        }
      });
    }

    return options;
  };

  const organizeCategories = (cats: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    cats.forEach(cat => {
      categoryMap.set(cat._id, { ...cat, children: [] });
    });

    cats.forEach(cat => {
      const category = categoryMap.get(cat._id)!;
      
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(category);
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  };

  const organizedCategories = organizeCategories(getAvailableParents());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">دسته‌بندی یافت نشد</h2>
        <Link
          href="/admin/categories"
          className="text-purple-400 hover:text-purple-300"
        >
          بازگشت به لیست دسته‌بندی‌ها
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">ویرایش دسته‌بندی</h1>
          <p className="text-gray-300">ویرایش اطلاعات دسته‌بندی: {currentCategory.name}</p>
        </div>
        <Link
          href="/admin/categories"
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          بازگشت به لیست
        </Link>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg backdrop-blur-lg">
          {success}
        </div>
      )}

      {/* اطلاعات کنونی دسته‌بندی */}
      <div className="backdrop-blur-lg bg-white/5 border border-gray-600/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">اطلاعات کنونی</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">سطح فعلی:</span>
            <div className="flex items-center mt-1">
              {currentCategory.level === 0 && <span className="text-blue-400 text-lg mr-2">📁</span>}
              {currentCategory.level === 1 && <span className="text-green-400 text-lg mr-2">📂</span>}
              {currentCategory.level === 2 && <span className="text-orange-400 text-lg mr-2">📄</span>}
              <span className="text-white">
                {currentCategory.level === 0 ? 'دسته اصلی' : 
                 currentCategory.level === 1 ? 'زیردسته' : 'زیر زیردسته'}
              </span>
            </div>
          </div>
          <div>
            <span className="text-gray-400">تعداد محصولات:</span>
            <p className="text-white mt-1">{currentCategory.productCount || 0}</p>
          </div>
          <div>
            <span className="text-gray-400">تاریخ ایجاد:</span>
            <p className="text-white mt-1">
              {currentCategory.createdAt ? new Date(currentCategory.createdAt).toLocaleDateString('fa-IR') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* فرم ویرایش دسته‌بندی */}
      <div className="backdrop-blur-lg bg-white/10 border border-purple-500/30 rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* نام دسته‌بندی */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                نام دسته‌بندی <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                placeholder="نام دسته‌بندی را وارد کنید"
                required
              />
            </div>

            {/* شناسه یکتا */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                شناسه یکتا (Slug) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                placeholder="category-slug"
                required
              />
            </div>
          </div>

          {/* دسته والد */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              دسته والد (اختیاری)
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">هیچ کدام (دسته اصلی)</option>
              {organizedCategories.map(category => renderCategoryOption(category))}
            </select>
            <p className="text-gray-400 text-xs mt-1">
              تغییر والد ممکن است سطح دسته‌بندی را تغییر دهد
            </p>
          </div>

          {/* توضیحات */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              توضیحات
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
              rows={4}
              placeholder="توضیحات دسته‌بندی را وارد کنید"
            />
          </div>

          {/* تصویر دسته‌بندی */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              تصویر دسته‌بندی (اختیاری)
            </label>
            <div className="space-y-4">
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600 file:cursor-pointer"
              />
              <p className="text-gray-400 text-xs">
                فرمت‌های مجاز: JPG, PNG, GIF - حداکثر حجم: 5MB
              </p>
              
              {imagePreview && (
                <div className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg">
                  <div className="relative w-20 h-20">
                    <img
                      src={imagePreview}
                      alt="پیش‌نمایش"
                      className="w-full h-full rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">تصویر کنونی</p>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                    >
                      حذف تصویر
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alt text for image */}
          {formData.imageUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                متن جایگزین تصویر (Alt Text)
              </label>
              <input
                type="text"
                value={formData.imageAlt}
                onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                placeholder="توضیح مختصری از تصویر برای بهبود SEO"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ترتیب */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ترتیب نمایش
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                placeholder="0"
                min="0"
              />
            </div>

            {/* وضعیت */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                وضعیت
              </label>
              <div className="flex items-center mt-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-purple-500 bg-gray-800 border-purple-500 rounded focus:ring-purple-500"
                />
                <label htmlFor="active" className="mr-3 text-gray-300">
                  دسته‌بندی فعال باشد
                </label>
              </div>
            </div>
          </div>

          {/* دکمه‌های عملیات */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <Link
              href="/admin/categories"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              انصراف
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'در حال بروزرسانی...' : 'بروزرسانی دسته‌بندی'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
