'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  parentId: string | null;
  level: number;
  active: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number;
}

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    active: true,
    order: 0
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch categories from API
  const fetchCategories = async (bypassCache = false) => {
    try {
      setLoading(true);
      const url = `/api/categories?limit=1000&t=${Date.now()}`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const result = await response.json();
      console.log('Fetched categories:', result.data?.length || 0, 'items');
      if (result.success && Array.isArray(result.data)) {
        const items: Category[] = result.data.map((c: any) => ({
          _id: c._id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? '',
          imageUrl: c.imageUrl ?? '',
          imageAlt: c.imageAlt ?? '',
          parentId: c.parentId ?? null,
          level: typeof c.level === 'number' ? c.level : 0,
          active: !!c.active,
          order: typeof c.order === 'number' ? c.order : 0,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          productCount: typeof c.productCount === 'number' ? c.productCount : 0,
        }))
        // Sort by level, order, then name for stable tree-like list
        items.sort((a, b) => (a.level - b.level) || (a.order - b.order) || a.name.localeCompare(b.name))
        setCategories(items);
      } else {
        console.error('خطا در دریافت دسته‌بندی‌ها:', result.error);
      }
    } catch (error) {
      console.error('خطا در ارتباط با سرور:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // const handleAddCategory = async () => {
  //   // This function is no longer needed since we redirect to add page
  //   // Keep for compatibility but won't be used
  // };

  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name.trim() || !formData.slug.trim()) {
      alert('نام و شناسه یکتا الزامی است');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/categories/by-id/${selectedCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchCategories(true); // Force bypass cache
        setShowEditModal(false);
        setSelectedCategory(null);
        setFormData({ name: '', slug: '', description: '', imageUrl: '', active: true, order: 0 });
        setImagePreview('');
        alert('دسته‌بندی با موفقیت بروزرسانی شد');
      } else {
        alert(`خطا: ${result.error}`);
      }
    } catch (error) {
      console.error('خطا در ویرایش دسته‌بندی:', error);
      alert('خطا در ارتباط با سرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/categories/by-id/${selectedCategory._id}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      const result = await response.json();

      if (result.success) {
        console.log('Category deleted successfully, refreshing list...');
        // Immediately remove from local state
        setCategories(prev => prev.filter(cat => cat._id !== selectedCategory._id));
        
        // Force complete cache bypass
        setTimeout(async () => {
          await fetchCategories(true);
        }, 100);
        
        setShowDeleteModal(false);
        setSelectedCategory(null);
        alert('دسته‌بندی با موفقیت حذف شد');
      } else {
        console.error('Delete failed:', result.error);
        alert(`خطا: ${result.error}`);
      }
    } catch (error) {
      console.error('خطا در حذف دسته‌بندی:', error);
      alert('خطا در ارتباط با سرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategoryStatus = async (categoryId: string) => {
    const category = categories.find(c => c._id === categoryId);
    if (!category) return;

    try {
  const response = await fetch(`/api/categories/by-id/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !category.active
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchCategories(true); // Force bypass cache
      } else {
        alert(`خطا: ${result.error}`);
      }
    } catch (error) {
      console.error('خطا در تغییر وضعیت:', error);
      alert('خطا در ارتباط با سرور');
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      active: category.active,
      order: category.order
    });
    setImagePreview(category.imageUrl || '');
    setShowEditModal(true);
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('لطفاً فقط فایل تصویری انتخاب کنید');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم فایل نباید بیشتر از 5 مگابایت باشد');
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
    // Clear file inputs
    const fileInputAdd = document.getElementById('imageUploadAdd') as HTMLInputElement;
    const fileInputEdit = document.getElementById('imageUploadEdit') as HTMLInputElement;
    if (fileInputAdd) {
      fileInputAdd.value = '';
    }
    if (fileInputEdit) {
      fileInputEdit.value = '';
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
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

  // Map for parent lookup and display (must be before any early returns to keep hooks order stable)
  // const categoryMap = useMemo(() => {
  //   const m = new Map<string, Category>();
  //   categories.forEach(c => m.set(c._id, c));
  //   return m;
  // }, [categories]);

  // Build hierarchical category tree for display
  const categoryTree = useMemo(() => {
    const buildTree = (parentId: string | null): (Category & { children: any[]; hasChildren: boolean })[] => {
      const children = categories
        .filter(c => c.parentId === parentId)
        .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
      
      return children.map(cat => {
        const subChildren = buildTree(cat._id);
        return {
          ...cat,
          children: subChildren,
          hasChildren: subChildren.length > 0
        };
      });
    };

    return buildTree(null); // Start with root categories (parentId = null)
  }, [categories]);

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">مدیریت دسته‌بندی‌ها</h1>
          <p className="text-gray-300 mt-1">محصولات خود را با دسته‌بندی‌ها سازماندهی کنید</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchCategories(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'در حال بارگذاری...' : 'تازه‌سازی'}
          </button>
          <Link
            href="/admin/categories/add"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            افزودن دسته‌بندی جدید
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30">
          <div className="text-2xl font-bold text-white">{categories.length}</div>
          <div className="text-gray-300 text-sm">کل دسته‌بندی‌ها</div>
        </div>
        <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30">
          <div className="text-2xl font-bold text-green-400">{categories.filter(c => c.active).length}</div>
          <div className="text-gray-300 text-sm">فعال</div>
        </div>
        <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30">
          <div className="text-2xl font-bold text-blue-400">{categories.filter(c => c.level === 0).length}</div>
          <div className="text-gray-300 text-sm">دسته‌بندی‌های اصلی</div>
        </div>
        <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30">
          <div className="text-2xl font-bold text-purple-400">
            {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
          </div>
          <div className="text-gray-300 text-sm">کل محصولات</div>
        </div>
      </div>

      {/* Categories List - Mega Menu Style */}
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30 p-6">
        <div className="space-y-6">
          {categoryTree.map((category) => (
            <CategoryMegaBlock
              key={category._id}
              category={category}
              level={0}
              expandedCategories={expandedCategories}
              toggleExpanded={toggleExpanded}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onToggleStatus={toggleCategoryStatus}
            />
          ))}
        </div>
      </div>      {/* Edit Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">ویرایش دسته‌بندی</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">نام</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  placeholder="نام دسته‌بندی را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">شناسه یکتا (Slug)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  placeholder="category-slug"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">توضیحات</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  rows={3}
                  placeholder="توضیحات دسته‌بندی را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">تصویر دسته‌بندی (اختیاری)</label>
                <div className="space-y-3">
                  <input
                    id="imageUploadEdit"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600 file:cursor-pointer"
                  />
                  <p className="text-gray-400 text-xs">
                    فرمت‌های مجاز: JPG, PNG, GIF - حداکثر حجم: 5MB
                  </p>
                  
                  {imagePreview && (
                    <div className="flex items-center space-x-3">
                      <div className="relative w-20 h-20">
                        <Image
                          src={imagePreview}
                          alt="پیش‌نمایش"
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                      >
                        حذف تصویر
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">ترتیب</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-purple-500 bg-gray-800 border-purple-500 rounded focus:ring-purple-500"
                />
                <label htmlFor="editActive" className="mr-2 text-gray-300">فعال</label>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleEditCategory}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isSubmitting ? 'در حال بروزرسانی...' : 'بروزرسانی دسته‌بندی'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCategory(null);
                  setFormData({ name: '', slug: '', description: '', imageUrl: '', active: true, order: 0 });
                  setImagePreview('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">حذف دسته‌بندی</h3>
            <p className="text-gray-300 mb-6">
              آیا مطمئن هستید که می‌خواهید &quot;{selectedCategory.name}&quot; را حذف کنید؟ این عمل قابل برگشت نیست.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteCategory}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'در حال حذف...' : 'حذف'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// CategoryMegaBlock component for mega menu style display
interface CategoryMegaBlockProps {
  category: Category & { children: any[]; hasChildren: boolean };
  level: number;
  expandedCategories: Set<string>;
  toggleExpanded: (id: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleStatus: (id: string) => void;
}

const CategoryMegaBlock: React.FC<CategoryMegaBlockProps> = ({ 
  category, 
  level, 
  expandedCategories, 
  toggleExpanded, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}) => {
  const isExpanded = expandedCategories.has(category._id);

  return (
    <div className="space-y-4">
      {/* Main Category - Large Button Style */}
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        level === 0 
          ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-purple-400/50 shadow-lg' 
          : 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/40'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            {/* Left Side - Category Info */}
            <div className="flex items-center space-x-6">
              {/* Category Icon & Image */}
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${
                  level === 0 ? 'bg-purple-500/30' : 'bg-blue-500/30'
                }`}>
                  {category.imageUrl ? (
                    <div className="relative w-12 h-12">
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="rounded-xl object-cover"
                      />
                    </div>
                  ) : (
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  )}
                </div>

                {/* Category Details */}
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className={`font-bold ${
                      level === 0 ? 'text-2xl text-white' : 'text-xl text-white'
                    }`}>
                      {category.name}
                    </h3>
                    
                    {category.hasChildren && (
                      <span className="px-3 py-1 bg-blue-500/30 text-blue-200 rounded-full text-sm font-medium">
                        {category.children.length} زیردسته
                      </span>
                    )}

                    <button
                      onClick={() => onToggleStatus(category._id)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        category.active
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                          : 'bg-red-500/20 text-red-300 border border-red-400/30'
                      }`}
                    >
                      {category.active ? 'فعال' : 'غیرفعال'}
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                    <span>شناسه: {category.slug}</span>
                    <span>محصولات: {category.productCount || 0}</span>
                  </div>
                  
                  {category.description && (
                    <p className="text-gray-400 text-sm mt-2 max-w-lg">{category.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-3">
              {/* Expand/Collapse Button */}
              {category.hasChildren && (
                <button
                  onClick={() => toggleExpanded(category._id)}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    isExpanded 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  }`}
                  title={isExpanded ? 'بستن' : 'باز کردن'}
                >
                  <svg 
                    className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {/* Action Buttons */}
              <button
                onClick={() => onEdit(category)}
                className="p-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-xl transition-colors"
                title="ویرایش"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              <Link
                href={`/admin/categories/add?parentId=${category._id}`}
                className="p-3 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-xl transition-colors"
                title="افزودن زیر دسته"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
              </Link>

              <button
                onClick={() => onDelete(category)}
                className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-colors"
                title="حذف"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories - Vertical Rows Below Parent */}
      {isExpanded && category.children.length > 0 && (
        <div className="animate-slideDown space-y-3 mr-8">
          {category.children.map((child) => (
            <div key={child._id} className="space-y-3">
              {/* Child Category Row */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-xl p-4 hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-300/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  {/* Left Side - Child Category Info */}
                  <div className="flex items-center space-x-4">
                    {/* Expand Button for Child */}
                    {child.hasChildren && (
                      <button
                        onClick={() => toggleExpanded(child._id)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          expandedCategories.has(child._id)
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                        }`}
                        title={expandedCategories.has(child._id) ? 'بستن' : 'باز کردن'}
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${
                            expandedCategories.has(child._id) ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}

                    {/* Child Image */}
                    {child.imageUrl ? (
                      <div className="relative w-10 h-10">
                        <Image
                          src={child.imageUrl}
                          alt={child.name}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-blue-500/30 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Child Details */}
                    <div>
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-white text-lg">{child.name}</h4>
                        
                        {child.hasChildren && (
                          <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded-full text-xs font-medium">
                            {child.children.length} زیردسته
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-1 text-sm text-gray-300">
                        <span>شناسه: {child.slug}</span>
                        <span>محصولات: {child.productCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Child Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onToggleStatus(child._id)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        child.active
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                          : 'bg-red-500/20 text-red-300 border border-red-400/30'
                      }`}
                    >
                      {child.active ? 'فعال' : 'غیرفعال'}
                    </button>

                    <button
                      onClick={() => onEdit(child)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="ویرایش"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <Link
                      href={`/admin/categories/add?parentId=${child._id}`}
                      className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                      title="افزودن زیر دسته"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                      </svg>
                    </Link>

                    <button
                      onClick={() => onDelete(child)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="flex items-center space-x-1 text-xs">
                      <a 
                        href={`/products/${child.slug}`}
                        className="text-blue-400 hover:text-blue-300 underline"
                        target="_blank"
                      >
                        مشاهده
                      </a>
                      <span className="text-gray-500">•</span>
                      <a 
                        href={`/products/${child.slug}`}
                        className="text-green-400 hover:text-green-300 underline"
                        target="_blank"
                      >
                        محصولات
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third Level (Grandchildren) - Rows Below Child */}
              {expandedCategories.has(child._id) && child.children.length > 0 && (
                <div className="space-y-2 mr-8">
                  {child.children.map((grandChild: Category & { children: any[]; hasChildren: boolean }) => (
                    <div key={grandChild._id} className="bg-gradient-to-r from-green-600/15 to-blue-600/15 border border-green-400/20 rounded-lg p-3 hover:from-green-600/25 hover:to-blue-600/25 hover:border-green-300/40 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        {/* Left Side - Grandchild Info */}
                        <div className="flex items-center space-x-3">
                          {grandChild.imageUrl ? (
                            <div className="relative w-8 h-8">
                              <Image
                                src={grandChild.imageUrl}
                                alt={grandChild.name}
                                fill
                                className="rounded object-cover"
                              />
                            </div>
                          ) : (
                            <div className="p-1.5 bg-green-500/30 rounded">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          
                          <div>
                            <h5 className="text-base font-medium text-white">{grandChild.name}</h5>
                            <div className="flex items-center space-x-3 text-xs text-gray-400">
                              <span>شناسه: {grandChild.slug}</span>
                              <span>محصولات: {grandChild.productCount || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Grandchild Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onToggleStatus(grandChild._id)}
                            className={`px-2 py-1 text-xs rounded ${
                              grandChild.active
                                ? 'bg-green-600/20 text-green-300'
                                : 'bg-red-600/20 text-red-300'
                            }`}
                          >
                            {grandChild.active ? 'فعال' : 'غیرفعال'}
                          </button>

                          <button
                            onClick={() => onEdit(grandChild)}
                            className="p-1.5 text-blue-400 hover:text-blue-300 rounded"
                            title="ویرایش"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => onDelete(grandChild)}
                            className="p-1.5 text-red-400 hover:text-red-300 rounded"
                            title="حذف"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                          <div className="flex items-center space-x-1 text-xs">
                            <a 
                              href={`/products/${grandChild.slug}`}
                              className="text-blue-400 hover:text-blue-300 underline"
                              target="_blank"
                            >
                              مشاهده
                            </a>
                            <span className="text-gray-500">•</span>
                            <a 
                              href={`/products/${grandChild.slug}`}
                              className="text-green-400 hover:text-green-300 underline"
                              target="_blank"
                            >
                              محصولات
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesAdmin;

const styles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
