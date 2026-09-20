'use client';

import React, { useState, useCallback, memo, useRef } from 'react';
import { ChevronDownIcon, ChevronUpIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId?: string;
  level: number;
}

// کامپوننت بازگشتی برای نمایش درخت دسته‌ها
const CategoryTreeItem: React.FC<{
  category: Category;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  level: number;
}> = ({ category, categories, selectedCategory, onCategoryChange, level }) => {
  // فقط دسته‌های اصلی (level 0) به صورت پیش‌فرض باز هستند
  const [isExpanded, setIsExpanded] = React.useState(level === 0);
  
  // پیدا کردن زیردسته‌های این دسته
  const children = categories.filter(cat => cat.parentId === category._id);
  const hasChildren = children.length > 0;
  
  // تعیین padding بر اساس سطح
  const paddingRight = level * 20 + 16; // 16px base + 20px per level
  
  // تعیین استایل بر اساس سطح و وضعیت انتخاب
  const getStyleClasses = (isSelected: boolean) => {
    const baseClasses = 'w-full text-right py-2.5 pl-4 rounded-xl transition-all duration-300 flex items-center gap-3';
    
    if (isSelected) {
      const gradients = {
        0: 'bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-500 text-white shadow-lg shadow-orange-200 scale-[1.02] border-2 border-orange-300',
        1: 'bg-gradient-to-br from-blue-500 via-blue-400 to-purple-500 text-white shadow-lg shadow-blue-200 scale-[1.02] border-2 border-blue-300',
        2: 'bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200 scale-[1.02] border-2 border-emerald-300',
        3: 'bg-gradient-to-br from-pink-500 via-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200 scale-[1.02] border-2 border-pink-300',
      };
      return `${baseClasses} ${gradients[Math.min(level, 3) as keyof typeof gradients] || gradients[3]}`;
    }
    
    const hoverClasses = {
      0: 'text-gray-800 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 hover:border-orange-200',
      1: 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-200',
      2: 'text-gray-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-200',
      3: 'text-gray-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:border-pink-200',
    };
    
    return `${baseClasses} border-2 border-transparent ${hoverClasses[Math.min(level, 3) as keyof typeof hoverClasses] || hoverClasses[3]} hover:shadow-md`;
  };

  // آیکون بر اساس وضعیت باز/بسته بودن
  const getIcon = () => {
    if (!hasChildren) return '📄'; // فایل برای دسته‌های بدون زیردسته
    return isExpanded ? '📂' : '📁'; // پوشه باز یا بسته
  };

  // رنگ خط کنار برای سطوح مختلف
  const getBorderColor = () => {
    const colors = {
      0: 'border-r-4 border-orange-400',
      1: 'border-r-4 border-blue-400',
      2: 'border-r-4 border-emerald-400',
      3: 'border-r-4 border-pink-400',
    };
    return colors[Math.min(level, 3) as keyof typeof colors] || colors[3];
  };

  return (
    <div className="space-y-1">
      {/* دکمه دسته */}
      <div className="relative group">
        <button
          onClick={() => {
            // همیشه دسته رو انتخاب کن (محصولات را فیلتر کن)
            onCategoryChange(category.name);
            
            // اگر زیردسته داشت، آن را باز کن
            if (hasChildren) {
              setIsExpanded(true);
            }
          }}
          style={{ 
            paddingRight: `${paddingRight}px`,
            paddingLeft: hasChildren ? '40px' : '16px' // فضا برای دکمه expand/collapse
          }}
          className={`${getStyleClasses(selectedCategory === category.name)} ${level > 0 ? getBorderColor() : ''}`}
        >
          {/* آیکون دسته */}
          <span className="text-lg flex-shrink-0">{getIcon()}</span>
          
          {/* نام دسته و تعداد زیردسته */}
          <div className="flex-grow flex items-center gap-2">
            <span className={`font-${level === 0 ? 'bold' : 'medium'} ${level === 0 ? 'text-base' : 'text-sm'}`}>
              {category.name}
            </span>
            {hasChildren && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.name
                  ? 'bg-white bg-opacity-30 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {children.length}
              </span>
            )}
          </div>
          
          {/* نشانگر انتخاب */}
          {selectedCategory === category.name && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold opacity-90">✓</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </button>
        
        {/* دکمه جداگانه برای بستن/باز کردن زیردسته‌ها */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
              selectedCategory === category.name
                ? 'bg-white bg-opacity-25 hover:bg-opacity-40'
                : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
            }`}
            aria-label={isExpanded ? 'بستن زیردسته‌ها' : 'باز کردن زیردسته‌ها'}
          >
            <svg 
              className={`w-3.5 h-3.5 transition-transform duration-500 ease-in-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* زیردسته‌های این دسته (بازگشتی با انیمیشن نرم) */}
      {hasChildren && (
        <div 
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-1 pt-1">
            {children.map(child => (
              <CategoryTreeItem
                key={child._id}
                category={child}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ProductFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: { min: number; max: number };
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalProducts: number;
  className?: string;
}

const sortOptions = [
  { label: 'پیشنهادی', value: 'featured' },
  { label: 'قیمت: کم به زیاد', value: 'price-asc' },
  { label: 'قیمت: زیاد به کم', value: 'price-desc' },
  { label: 'امتیاز مشتریان', value: 'rating' },
  { label: 'جدیدترین', value: 'newest' },
];

const pricePresets = [
  { label: 'زیر ۱ میلیون', min: 0, max: 1000000 },
  { label: '۱ تا ۵ میلیون', min: 1000000, max: 5000000 },
  { label: '۵ تا ۱۰ میلیون', min: 5000000, max: 10000000 },
  { label: '۱۰ تا ۲۰ میلیون', min: 10000000, max: 20000000 },
  { label: 'بالای ۲۰ میلیون', min: 20000000, max: 100000000 },
];

interface FilterContentProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: { min: number; max: number };
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalProducts: number;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  expandedSections: { categories: boolean; price: boolean; sort: boolean };
  toggleSection: (section: 'categories' | 'price' | 'sort') => void;
  minValue: string;
  maxValue: string;
  handleMinChange: (value: string) => void;
  handleMaxChange: (value: string) => void;
  applyPriceRange: () => void;
  handlePricePreset: (preset: typeof pricePresets[0]) => void;
  minInputRef?: React.RefObject<HTMLInputElement>;
  maxInputRef?: React.RefObject<HTMLInputElement>;
}

const FilterContent = memo<FilterContentProps>(function FilterContent({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  sortBy,
  onSortChange,
  totalProducts,
  hasActiveFilters,
  resetFilters,
  expandedSections,
  toggleSection,
  minValue,
  maxValue,
  handleMinChange,
  handleMaxChange,
  applyPriceRange,
  handlePricePreset,
  minInputRef,
  maxInputRef
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
          {selectedCategory !== 'همه' && (
            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
              {selectedCategory}
              <button
                onClick={() => onCategoryChange('همه')}
                className="hover:bg-orange-200 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {(priceRange.min !== 0 || priceRange.max !== 20000000) && (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {priceRange.min.toLocaleString('fa-IR')} - {priceRange.max.toLocaleString('fa-IR')} تومان
              <button
                onClick={() => resetFilters()}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>
    )}

    {/* Categories Section */}
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => toggleSection('categories')}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-gray-900">دسته‌بندی‌ها</span>
        {expandedSections.categories ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {expandedSections.categories && (
        <div className="p-4 bg-white">
          <div className="space-y-2">
            {/* دکمه همه محصولات */}
            <button
              onClick={() => onCategoryChange('همه')}
              className={`w-full text-right px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 border-2 ${
                selectedCategory === 'همه'
                  ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-purple-200 scale-[1.02] border-purple-400'
                  : 'text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 border-transparent hover:border-purple-200 hover:shadow-md'
              }`}
            >
              {/* آیکون */}
              <span className="text-xl">🏪</span>
              
              {/* متن */}
              <span className="font-bold text-base flex-grow">همه محصولات</span>
              
              {/* نشانگر انتخاب */}
              {selectedCategory === 'همه' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold opacity-90">✓</span>
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
            
            {/* خط جداکننده */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-500 font-medium">دسته‌بندی‌ها</span>
              </div>
            </div>

            {/* دسته‌های اصلی و زیردسته‌ها (بازگشتی - تمام سطوح) */}
            {categories
              .filter(cat => !cat.parentId) // فقط دسته‌های اصلی
              .map((category) => (
                <CategoryTreeItem
                  key={category._id}
                  category={category}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={onCategoryChange}
                  level={0}
                />
              ))}
          </div>
        </div>
      )}
    </div>

    {/* Price Range Section */}
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => toggleSection('price')}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-gray-900">محدوده قیمت</span>
        {expandedSections.price ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {expandedSections.price && (
        <div className="p-4 bg-white space-y-4">
          {/* Price Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">انتخاب سریع:</label>
            <div className="grid grid-cols-1 gap-2">
              {pricePresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePricePreset(preset)}
                  className={`text-sm px-3 py-2 rounded-lg border transition-all ${
                    priceRange.min === preset.min && priceRange.max === preset.max
                      ? 'bg-orange-100 border-orange-300 text-orange-800'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">محدوده دلخواه:</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">حداقل قیمت</label>
                <input
                  ref={minInputRef}
                  type="text"
                  inputMode="numeric"
                  value={minValue}
                  onChange={(e) => handleMinChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyPriceRange();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="حداقل قیمت "
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">حداکثر قیمت</label>
                <input
                  ref={maxInputRef}
                  type="text"
                  inputMode="numeric"
                  value={maxValue}
                  onChange={(e) => handleMaxChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyPriceRange();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="حداکثر قیمت"
                />
              </div>
            </div>
            <button
              onClick={applyPriceRange}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-2 rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all font-medium text-sm"
            >
              اعمال محدوده قیمت
            </button>
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

    {/* Results Summary */}
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-700">{totalProducts}</div>
        <div className="text-sm text-green-600">محصول یافت شد</div>
      </div>
    </div>
  </div>
  );
});

const ProductFilter: React.FC<ProductFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  totalProducts,
  className = ""
}) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    sort: true
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  // State های محلی مستقل از props - شروع با مقادیر خالی
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  // Ref ها برای حفظ focus
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // تبدیل اعداد فارسی به انگلیسی
  const convertPersianToEnglish = (str: string) => {
    const persianNumbers = '۰۱۲۳۴۵۶۷۸۹';
    const englishNumbers = '0123456789';
    return str.replace(/[۰-۹]/g, (char) => {
      return englishNumbers[persianNumbers.indexOf(char)];
    });
  };

  // بهینه شده با useCallback
  const handleMinChange = useCallback((value: string) => {
    const englishValue = convertPersianToEnglish(value);
    if (englishValue === '' || /^\d+$/.test(englishValue)) {
      setMinValue(englishValue);
    }
  }, []);

  const handleMaxChange = useCallback((value: string) => {
    const englishValue = convertPersianToEnglish(value);
    if (englishValue === '' || /^\d+$/.test(englishValue)) {
      setMaxValue(englishValue);
    }
  }, []);

  const applyPriceRange = useCallback(() => {
    const min = Number(minValue) || 0;
    const max = Number(maxValue) || 20000000;
    onPriceRangeChange({ min, max });
  }, [minValue, maxValue, onPriceRangeChange]);

  const handlePricePreset = useCallback((preset: typeof pricePresets[0]) => {
    setMinValue(String(preset.min));
    setMaxValue(String(preset.max));
    onPriceRangeChange({ min: preset.min, max: preset.max });
  }, [onPriceRangeChange]);

  const resetFilters = useCallback(() => {
    onCategoryChange('همه');
    setMinValue('');
    setMaxValue('');
    onPriceRangeChange({ min: 0, max: 20000000 });
    onSortChange('featured');
  }, [onCategoryChange, onPriceRangeChange, onSortChange]);

  const hasActiveFilters = selectedCategory !== 'همه' ||
    priceRange.min !== 0 ||
    priceRange.max !== 20000000 ||
    sortBy !== 'featured';


  return (
    <>
      {/* Desktop Filter */}
      <div className={`hidden lg:block ${className}`}>
        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
          <FilterContent
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            priceRange={priceRange}
            sortBy={sortBy}
            onSortChange={onSortChange}
            totalProducts={totalProducts}
            hasActiveFilters={hasActiveFilters}
            resetFilters={resetFilters}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            minValue={minValue}
            maxValue={maxValue}
            handleMinChange={handleMinChange}
            handleMaxChange={handleMaxChange}
            applyPriceRange={applyPriceRange}
            handlePricePreset={handlePricePreset}
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
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={onCategoryChange}
                  priceRange={priceRange}
                  sortBy={sortBy}
                  onSortChange={onSortChange}
                  totalProducts={totalProducts}
                  hasActiveFilters={hasActiveFilters}
                  resetFilters={resetFilters}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  minValue={minValue}
                  maxValue={maxValue}
                  handleMinChange={handleMinChange}
                  handleMaxChange={handleMaxChange}
                  applyPriceRange={applyPriceRange}
                  handlePricePreset={handlePricePreset}
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

export default ProductFilter;