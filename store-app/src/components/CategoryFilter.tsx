'use client';

import React, { useState, useCallback, memo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CategoryFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  showFeaturedOnly: boolean;
  onFeaturedChange: (featured: boolean) => void;
  totalCategories: number;
  className?: string;
}

const sortOptions = [
  { label: 'ترتیب پیش‌فرض', value: 'order' },
  { label: 'نام (الفبا)', value: 'name' },
  { label: 'تعداد محصولات', value: 'products' },
  { label: 'تعداد زیردسته', value: 'subcategories' }
];

interface FilterContentProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  showFeaturedOnly: boolean;
  onFeaturedChange: (featured: boolean) => void;
  totalCategories: number;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  expandedSections: { search: boolean; sort: boolean; featured: boolean };
  toggleSection: (section: 'search' | 'sort' | 'featured') => void;
}

const FilterContent = memo<FilterContentProps>(function FilterContent({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  showFeaturedOnly,
  onFeaturedChange,
  totalCategories,
  hasActiveFilters,
  resetFilters,
  expandedSections,
  toggleSection
}) {
  return (
    <div className="space-y-6">
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">فیلترها</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            پاک کردن همه
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3">
          <div className="text-sm text-gray-700 mb-2">فیلترهای فعال:</div>
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                جستجو: {searchQuery}
                <button
                  onClick={() => onSearchChange('')}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {showFeaturedOnly && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                فقط ویژه
                <button
                  onClick={() => onFeaturedChange(false)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('search')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="font-semibold text-gray-900">جستجو</span>
          {expandedSections.search ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.search && (
          <div className="p-4 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجوی دسته‌بندی..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <svg 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Sort Section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('sort')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="font-semibold text-gray-900">مرتب‌سازی</span>
          {expandedSections.sort ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.sort && (
          <div className="p-4 bg-white">
            <div className="space-y-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={`w-full text-right px-4 py-3 rounded-lg transition-all duration-200 ${
                    sortBy === option.value
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    {sortBy === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Featured Filter Section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('featured')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="font-semibold text-gray-900">نمایش</span>
          {expandedSections.featured ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {expandedSections.featured && (
          <div className="p-4 bg-white">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => onFeaturedChange(e.target.checked)}
                className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">
                فقط دسته‌های ویژه
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">{totalCategories}</div>
          <div className="text-sm text-green-600">دسته‌بندی یافت شد</div>
        </div>
      </div>
    </div>
  );
});

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  showFeaturedOnly,
  onFeaturedChange,
  totalCategories,
  className = ""
}) => {
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    sort: true,
    featured: true
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const resetFilters = useCallback(() => {
    onSearchChange('');
    onFeaturedChange(false);
    onSortChange('order');
  }, [onSearchChange, onFeaturedChange, onSortChange]);

  const hasActiveFilters = searchQuery !== '' ||
    showFeaturedOnly ||
    sortBy !== 'order';

  return (
    <>
      {/* Desktop Filter */}
      <div className={`hidden lg:block ${className}`}>
        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
          <FilterContent
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            sortBy={sortBy}
            onSortChange={onSortChange}
            showFeaturedOnly={showFeaturedOnly}
            onFeaturedChange={onFeaturedChange}
            totalCategories={totalCategories}
            hasActiveFilters={hasActiveFilters}
            resetFilters={resetFilters}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        </div>
      </div>

      {/* Mobile Filter */}
      <div className="lg:hidden">
        {/* Mobile Filter Toggle Button */}
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">فیلترها و مرتب‌سازی</span>
          </div>
          {hasActiveFilters && (
            <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              !
            </div>
          )}
        </button>

        {/* Mobile Filter Modal */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div className="bg-white w-full max-h-[80vh] rounded-t-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">فیلترها</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                <FilterContent
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  sortBy={sortBy}
                  onSortChange={onSortChange}
                  showFeaturedOnly={showFeaturedOnly}
                  onFeaturedChange={onFeaturedChange}
                  totalCategories={totalCategories}
                  hasActiveFilters={hasActiveFilters}
                  resetFilters={resetFilters}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                />
              </div>
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-lg font-semibold"
                >
                  اعمال فیلترها
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CategoryFilter;
