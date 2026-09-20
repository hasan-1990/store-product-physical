'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CategoryCard from '@/components/CategoryCard';
import CategoryFilter from '@/components/CategoryFilter';

interface CategoryWithStats {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  active: boolean;
  featured?: boolean;
  order?: number;
  productCount: number;
  subcategoryCount: number;
  subcategories: { name: string; slug: string }[];
}

interface CategoriesClientProps {
  initialCategories: CategoryWithStats[];
  parentCategory?: { name: string; slug: string } | null;
  currentPath?: string;
}

export default function CategoriesClient({ initialCategories, parentCategory, currentPath = '' }: CategoriesClientProps) {
  const [categories, setCategories] = useState<CategoryWithStats[]>(initialCategories);
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithStats[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('order');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // وقتی route/searchParams عوض می‌شود، props جدید می‌آید ولی state قبلی باقی می‌ماند.
  // این sync باعث می‌شود با کلیک روی دسته مادر، لیست همان‌جا آپدیت شود.
  useEffect(() => {
    setCategories(initialCategories);
    setFilteredCategories(initialCategories);
    setIsTransitioning(false);
    setSearchQuery('');
    setSortBy('order');
    setShowFeaturedOnly(false);
  }, [initialCategories, parentCategory?.slug, currentPath]);

  // Filter and sort categories
  useEffect(() => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      let result = [...categories];

      // Search filter
      if (searchQuery.trim()) {
        result = result.filter(cat =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Featured filter
      if (showFeaturedOnly) {
        result = result.filter(cat => cat.featured);
      }

      // Sort
      switch (sortBy) {
        case 'order':
          result.sort((a, b) => (a.order || 999) - (b.order || 999));
          break;
        case 'name':
          result.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
          break;
        case 'products':
          result.sort((a, b) => b.productCount - a.productCount);
          break;
        case 'subcategories':
          result.sort((a, b) => b.subcategoryCount - a.subcategoryCount);
          break;
      }

      setFilteredCategories(result);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 100);
  }, [categories, searchQuery, sortBy, showFeaturedOnly]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filter Section */}
          <div className="lg:w-1/4">
            <CategoryFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              showFeaturedOnly={showFeaturedOnly}
              onFeaturedChange={setShowFeaturedOnly}
              totalCategories={filteredCategories.length}
            />
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Breadcrumb / Back Button */}
            {parentCategory && (
              <div className="mb-4">
                {currentPath && currentPath.includes('/') ? (
                  <Link
                    href={`/categories/${currentPath.split('/').slice(0, -1).join('/')}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-all text-sm font-medium text-purple-700 hover:text-purple-900 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>بازگشت</span>
                  </Link>
                ) : (
                  <Link
                    href="/categories"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-all text-sm font-medium text-purple-700 hover:text-purple-900 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>بازگشت به همه دسته‌بندی‌ها</span>
                  </Link>
                )}
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Link href="/categories" className="hover:text-purple-600 transition-colors">همه دسته‌ها</Link>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-semibold text-purple-700">{parentCategory.name}</span>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-6 border border-purple-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {parentCategory ? `🔖 زیردسته‌های ${parentCategory.name}` : '🏷️ دسته‌بندی محصولات'}
                  </h2>
                  <p className="text-purple-100">
                    ✨ {filteredCategories.length} دسته‌بندی موجود است
                  </p>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {filteredCategories.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-purple-100">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">😔 هیچ دسته‌بندی یافت نشد</h3>
                  <p className="text-gray-600 mb-6">متأسفانه دسته‌بندی با فیلترهای انتخابی شما پیدا نشد.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSortBy('order');
                      setShowFeaturedOnly(false);
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    پاک کردن فیلترها
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                style={{ 
                  opacity: isTransitioning ? 0 : 1,
                  transition: 'opacity 0.1s ease-in-out'
                }}
              >
                {filteredCategories.map((category, index) => (
                  <div
                    key={category._id}
                    className="transition-all duration-300"
                    style={{
                      opacity: isTransitioning ? 0 : 1,
                      transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
                      transition: `opacity 0.4s ease-out ${index * 0.03}s, transform 0.4s ease-out ${index * 0.03}s`
                    }}
                  >
                    <CategoryCard {...category} currentPath={currentPath} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
