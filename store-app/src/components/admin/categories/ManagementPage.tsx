"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function ManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/categories?limit=100", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        const organized = organizeCategories(result.data || []);
        setCategories(organized);
        const allIds = new Set<string>();
        const collectIds = (cats: Category[]) => {
          cats.forEach(cat => {
            allIds.add(cat._id);
            if (cat.children) collectIds(cat.children);
          });
        };
        collectIds(organized);
        setExpandedCategories(allIds);
      } else {
        setError("خطا در دریافت دسته‌بندی‌ها");
      }
    } catch (err) {
      setError("خطا در دریافت دسته‌بندی‌ها");
    } finally {
      setLoading(false);
    }
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

    const sortCategories = (categories: Category[]): Category[] => {
      return categories.sort((a, b) => a.order - b.order).map(cat => ({
        ...cat,
        children: cat.children ? sortCategories(cat.children) : []
      }));
    };

    return sortCategories(rootCategories);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("آیا از حذف این دسته‌بندی مطمئن هستید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/by-id/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("دسته‌بندی با موفقیت حذف شد");
        fetchCategories();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const result = await response.json();
        setError(result.error || "خطا در حذف دسته‌بندی");
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      setError("خطا در حذف دسته‌بندی");
      setTimeout(() => setError(""), 5000);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryItem = (category: Category, depth = 0) => {
    return (
      <div key={category._id} className="relative">
        <div 
          className="flex items-center justify-between p-3 backdrop-blur-lg bg-white/10 border border-purple-500/30 rounded-xl mb-2 hover:bg-white/20 transition-all duration-300"
          style={{ marginRight: `${depth * 24}px` }}
        >
          <div className="flex items-center flex-1">
            {category.children && category.children.length > 0 && depth === 0 && (
              <button
                onClick={() => toggleCategoryExpansion(category._id)}
                className="mr-2 p-1 hover:bg-gray-200/20 rounded"
              >
                <svg 
                  className={`w-4 h-4 transition-transform text-white ${expandedCategories.has(category._id) ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <div className="mr-2">
              {category.level === 0 && <span className="text-blue-400 text-lg">📁</span>}
              {category.level === 1 && <span className="text-green-400 text-lg">📂</span>}
              {category.level === 2 && <span className="text-orange-400 text-lg">📄</span>}
            </div>

            {category.imageUrl && (
              <div className="relative w-8 h-8 mr-3">
                <img
                  src={category.imageUrl}
                  alt={category.imageAlt || category.name}
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center">
                <h3 className={`font-semibold text-white ${
                  category.level === 0 ? 'text-lg' : 
                  category.level === 1 ? 'text-base' : 'text-sm'
                }`}>
                  {category.name}
                </h3>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  category.level === 0 ? 'bg-blue-500/20 text-blue-300' :
                  category.level === 1 ? 'bg-green-500/20 text-green-300' :
                  'bg-orange-500/20 text-orange-300'
                }`}>
                  {category.level === 0 ? 'اصلی' : 
                   category.level === 1 ? 'زیردسته' : 'زیرزیردسته'}
                </span>
                {!category.active && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full">
                    غیرفعال
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <span>شناسه: {category.slug}</span>
                {category.productCount !== undefined && (
                  <span className="ml-4">{category.productCount} محصول</span>
                )}
                <span className="ml-4">ترتیب: {category.order}</span>
              </div>
              {category.description && (
                <p className="text-xs text-gray-500 mt-1 truncate max-w-md">{category.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/admin/categories/edit/${category._id}`}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              ویرایش
            </Link>
            
            {category.level < 2 && (
              <Link
                href={`/admin/categories/create?parent=${category._id}`}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                + زیردسته
              </Link>
            )}
            
            <button
              onClick={() => handleDeleteCategory(category._id)}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              حذف
            </button>
          </div>
        </div>

        {category.children && 
         category.children.length > 0 && 
         expandedCategories.has(category._id) && (
          <div className="relative">
            {category.children.map(child => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === null || category.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getAllCategories = (cats: Category[]): Category[] => {
    let allCats: Category[] = [];
    cats.forEach(cat => {
      allCats.push(cat);
      if (cat.children) {
        allCats = allCats.concat(getAllCategories(cat.children));
      }
    });
    return allCats;
  };

  const allCategories = getAllCategories(categories);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">مدیریت دسته‌بندی‌ها</h1>
          <p className="text-gray-300">مدیریت دسته‌بندی‌های سه‌سطحه محصولات</p>
        </div>
        <Link
          href="/admin/categories/create"
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center"
        >
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          افزودن دسته‌بندی جدید
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg backdrop-blur-lg">
          {success}
        </div>
      )}

      <div className="backdrop-blur-lg bg-white/10 border border-purple-500/30 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">جستجو</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="نام یا شناسه دسته‌بندی..."
              className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">فیلتر سطح</label>
            <select
              value={filterLevel ?? ''}
              onChange={(e) => setFilterLevel(e.target.value === '' ? null : parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">همه سطوح</option>
              <option value="0">دسته‌های اصلی</option>
              <option value="1">زیردسته‌ها</option>
              <option value="2">زیر زیردسته‌ها</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterLevel(null);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              پاک کردن فیلترها
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-lg bg-white/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <span className="text-2xl">📁</span>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-300">دسته‌های اصلی</p>
              <p className="text-2xl font-bold text-white">
                {allCategories.filter(c => c.level === 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/20 rounded-full">
              <span className="text-2xl">📂</span>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-300">زیردسته‌ها</p>
              <p className="text-2xl font-bold text-white">
                {allCategories.filter(c => c.level === 1).length}
              </p>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-500/20 rounded-full">
              <span className="text-2xl">📄</span>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-300">زیر زیردسته‌ها</p>
              <p className="text-2xl font-bold text-white">
                {allCategories.filter(c => c.level === 2).length}
              </p>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/20 rounded-full">
              <span className="text-2xl">📊</span>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-300">کل دسته‌بندی‌ها</p>
              <p className="text-2xl font-bold text-white">
                {allCategories.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-lg bg-white/10 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            لیست دسته‌بندی‌ها ({filteredCategories.length})
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchCategories()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              بروزرسانی
            </button>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📂</span>
            <h3 className="text-lg font-medium text-white mb-2">هیچ دسته‌بندی‌ای یافت نشد</h3>
            <p className="text-gray-400 mb-4">برای شروع اولین دسته‌بندی را ایجاد کنید</p>
            <Link
              href="/admin/categories/create"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              افزودن دسته‌بندی جدید
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCategories.map(category => renderCategoryItem(category))}
          </div>
        )}
      </div>
    </div>
  );
}
