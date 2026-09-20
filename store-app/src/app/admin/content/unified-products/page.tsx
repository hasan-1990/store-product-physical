'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface TabbedSettings {
  featuredTab: {
    title: string;
    subtitle: string;
    displayCount: number;
    selectedProducts: string[];
    sortOrder: 'manual' | 'random' | 'latest' | 'popular';
  };
  latestTab: {
    title: string;
    subtitle: string;
    displayCount: number;
    selectedProducts: string[];
    sortOrder: 'manual' | 'latest' | 'popular' | 'random';
  };
  active: boolean;
}

const UnifiedProductsManagement = () => {
  const [activeMainTab, setActiveMainTab] = useState<'tabbed1'>('tabbed1');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states for product selection
  const [featuredFilter, setFeaturedFilter] = useState({
    category: '',
    search: ''
  });
  const [latestFilter, setLatestFilter] = useState({
    category: '',
    search: ''
  });
  
  // Tabbed Products State
  const [tabbedSettings, setTabbedSettings] = useState<TabbedSettings>({
    featuredTab: {
      title: 'محصولات ویژه',
      subtitle: 'محصولات منتخب ما',
      displayCount: 8,
      selectedProducts: [],
      sortOrder: 'manual'
    },
    latestTab: {
      title: 'جدیدترین محصولات',
      subtitle: 'آخرین محصولات اضافه شده',
      displayCount: 8,
      selectedProducts: [],
      sortOrder: 'latest'
    },
    active: true
  });

  const [saving, setSaving] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load products
      const productsRes = await fetch('/api/admin/products');
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const productsList = productsData.products || [];
        setProducts(productsList);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(productsList.map((p: Product) => p.category))].filter(Boolean) as string[];
        setCategories(uniqueCategories);
      }

      // Load tabbed settings
      const tabbedRes = await fetch('/api/admin/tabbed-products-settings');
      if (tabbedRes.ok) {
        const tabbedData = await tabbedRes.json();
        if (tabbedData.settings) {
          setTabbedSettings(tabbedData.settings);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTabbedSettings = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving tabbed settings:', tabbedSettings);
      
      const response = await fetch('/api/admin/tabbed-products-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tabbedSettings)
      });

      console.log('📡 Response status:', response.status);
      const responseData = await response.json();
      console.log('📋 Response data:', responseData);

      if (response.ok && responseData.success) {
        alert('تنظیمات محصولات با موفقیت ذخیره شد');
      } else {
        throw new Error(responseData.error || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving tabbed settings:', error);
      alert('خطا در ذخیره تنظیمات محصولات: ' + (error instanceof Error ? error.message : 'نامشخص'));
    } finally {
      setSaving(false);
    }
  };

  const toggleProductSelection = (productId: string, type: 'tabbedFeatured' | 'tabbedLatest') => {
    if (type === 'tabbedFeatured') {
      const newSelected = tabbedSettings.featuredTab.selectedProducts.includes(productId)
        ? tabbedSettings.featuredTab.selectedProducts.filter(id => id !== productId)
        : [...tabbedSettings.featuredTab.selectedProducts, productId];
      
      setTabbedSettings({
        ...tabbedSettings,
        featuredTab: {
          ...tabbedSettings.featuredTab,
          selectedProducts: newSelected
        }
      });
    } else if (type === 'tabbedLatest') {
      const newSelected = tabbedSettings.latestTab.selectedProducts.includes(productId)
        ? tabbedSettings.latestTab.selectedProducts.filter(id => id !== productId)
        : [...tabbedSettings.latestTab.selectedProducts, productId];
      
      setTabbedSettings({
        ...tabbedSettings,
        latestTab: {
          ...tabbedSettings.latestTab,
          selectedProducts: newSelected
        }
      });
    }
  };

  // Filter products based on category and search
  const getFilteredProducts = (filterType: 'featured' | 'latest') => {
    const filter = filterType === 'featured' ? featuredFilter : latestFilter;
    
    return products.filter(product => {
      const matchesCategory = !filter.category || product.category === filter.category;
      const matchesSearch = !filter.search || 
        product.name.toLowerCase().includes(filter.search.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  };

  // Select all products from a category
  const selectCategoryProducts = (category: string, type: 'tabbedFeatured' | 'tabbedLatest') => {
    const categoryProducts = products.filter(p => p.category === category);
    const productIds = categoryProducts.map(p => p.id);
    
    if (type === 'tabbedFeatured') {
      const currentSelected = tabbedSettings.featuredTab.selectedProducts;
      const newSelected = [...new Set([...currentSelected, ...productIds])];
      
      setTabbedSettings({
        ...tabbedSettings,
        featuredTab: {
          ...tabbedSettings.featuredTab,
          selectedProducts: newSelected
        }
      });
    } else if (type === 'tabbedLatest') {
      const currentSelected = tabbedSettings.latestTab.selectedProducts;
      const newSelected = [...new Set([...currentSelected, ...productIds])];
      
      setTabbedSettings({
        ...tabbedSettings,
        latestTab: {
          ...tabbedSettings.latestTab,
          selectedProducts: newSelected
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت محصولات</h1>
          <p className="text-gray-400">تنظیمات محصولات ویژه و محصولات تب‌دار</p>
        </div>
        <Link
          href="/admin/content"
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          بازگشت
        </Link>
      </div>

      {/* Main Tabs */}
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
        <div className="border-b border-purple-500/30 mb-6">
          <nav className="-mb-px flex space-x-8 space-x-reverse" aria-label="Tabs">
            <button
              onClick={() => setActiveMainTab('tabbed1')}
              className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeMainTab === 'tabbed1'
                  ? 'border-yellow-400 text-yellow-400'
                  : 'border-transparent text-purple-300 hover:text-white hover:border-purple-300'
              }`}
            >
              ⭐ تب محصولات ویژه
            </button>
          </nav>
        </div>

      {/* Content */}
      {activeMainTab === 'tabbed1' && (
      <div>
        <h2 className="text-xl font-bold text-white mb-4">مدیریت محصولات ویژه و جدیدترین</h2>
        
        {/* General Settings */}
        <div className="mb-6">
          <label className="flex items-center space-x-reverse space-x-2 mb-4">
            <input
              type="checkbox"
              checked={tabbedSettings.active}
              onChange={(e) => setTabbedSettings({...tabbedSettings, active: e.target.checked})}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            <span className="text-gray-300">فعال بودن بخش تب‌دار</span>
          </label>
        </div>

        {/* Combined Tab Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Featured Tab Settings */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="mr-2">⭐</span>
              تب محصولات ویژه
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">عنوان تب</label>
                <input
                  type="text"
                  value={tabbedSettings.featuredTab.title}
                  onChange={(e) => setTabbedSettings({
                    ...tabbedSettings,
                    featuredTab: {...tabbedSettings.featuredTab, title: e.target.value}
                  })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-yellow-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">زیرعنوان</label>
                <input
                  type="text"
                  value={tabbedSettings.featuredTab.subtitle}
                  onChange={(e) => setTabbedSettings({
                    ...tabbedSettings,
                    featuredTab: {...tabbedSettings.featuredTab, subtitle: e.target.value}
                  })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-yellow-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">تعداد نمایش</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tabbedSettings.featuredTab.displayCount}
                  onChange={(e) => setTabbedSettings({
                    ...tabbedSettings,
                    featuredTab: {...tabbedSettings.featuredTab, displayCount: parseInt(e.target.value)}
                  })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-yellow-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">نوع چینش</label>
                <select
                  value={tabbedSettings.featuredTab.sortOrder}
                  onChange={(e) => setTabbedSettings({
                    ...tabbedSettings,
                    featuredTab: {...tabbedSettings.featuredTab, sortOrder: e.target.value as any}
                  })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-yellow-500/30 rounded-lg text-white"
                >
                  <option value="manual">انتخاب دستی</option>
                  <option value="random">تصادفی</option>
                  <option value="latest">جدیدترین</option>
                  <option value="popular">پربازدیدترین</option>
                </select>
              </div>

              {tabbedSettings.featuredTab.sortOrder === 'manual' && (
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-4">انتخاب دستی محصولات ویژه</h4>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                    <div>
                      <label className="block text-yellow-300 text-sm mb-2">فیلتر بر اساس دسته‌بندی</label>
                      <select
                        value={featuredFilter.category}
                        onChange={(e) => setFeaturedFilter({...featuredFilter, category: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-yellow-500/30 rounded text-white text-sm"
                      >
                        <option value="">همه دسته‌ها</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      {featuredFilter.category && (
                        <button
                          onClick={() => selectCategoryProducts(featuredFilter.category, 'tabbedFeatured')}
                          className="mt-2 w-full px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 rounded text-xs transition-colors"
                        >
                          ➕ انتخاب کل دسته &quot;{featuredFilter.category}&quot;
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-yellow-300 text-sm mb-2">جستجو در محصولات</label>
                      <input
                        type="text"
                        value={featuredFilter.search}
                        onChange={(e) => setFeaturedFilter({...featuredFilter, search: e.target.value})}
                        placeholder="نام محصول را جستجو کنید..."
                        className="w-full px-3 py-2 bg-gray-700 border border-yellow-500/30 rounded text-white text-sm placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Selected Products Count */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-yellow-300 text-sm">
                      📋 {tabbedSettings.featuredTab.selectedProducts.length} محصول انتخاب شده
                    </span>
                    {tabbedSettings.featuredTab.selectedProducts.length > 0 && (
                      <button
                        onClick={() => setTabbedSettings({
                          ...tabbedSettings,
                          featuredTab: {...tabbedSettings.featuredTab, selectedProducts: []}
                        })}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded text-xs transition-colors"
                      >
                        🗑️ پاک کردن همه
                      </button>
                    )}
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto border border-yellow-500/20 rounded-lg p-2">
                    {getFilteredProducts('featured').map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          tabbedSettings.featuredTab.selectedProducts.includes(product.id)
                            ? 'border-yellow-500 bg-yellow-500/20 shadow-md'
                            : 'border-gray-600 bg-gray-800/50 hover:border-yellow-400 hover:bg-gray-700/50'
                        }`}
                        onClick={() => toggleProductSelection(product.id, 'tabbedFeatured')}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-white text-sm font-medium truncate">{product.name}</h5>
                            <p className="text-gray-400 text-xs">{product.price.toLocaleString()} تومان</p>
                            <p className="text-yellow-400 text-xs">📁 {product.category}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {tabbedSettings.featuredTab.selectedProducts.includes(product.id) ? (
                              <span className="text-yellow-500 text-lg">✅</span>
                            ) : (
                              <span className="text-gray-500 text-lg">⬜</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {getFilteredProducts('featured').length === 0 && (
                      <div className="col-span-2 text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">🔍</div>
                        <p>هیچ محصولی با این فیلتر یافت نشد</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tabbedSettings.featuredTab.sortOrder !== 'manual' && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    {tabbedSettings.featuredTab.sortOrder === 'random' && '📋 محصولات به صورت تصادفی انتخاب و نمایش داده می‌شوند'}
                    {tabbedSettings.featuredTab.sortOrder === 'latest' && '🕒 جدیدترین محصولات به صورت خودکار انتخاب می‌شوند'}
                    {tabbedSettings.featuredTab.sortOrder === 'popular' && '👁️ پربازدیدترین محصولات به صورت خودکار انتخاب می‌شوند'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Latest Tab Settings */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="mr-2">🆕</span>
              تب جدیدترین محصولات
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">عنوان تب</label>
                <input
                  type="text"
                  value={tabbedSettings.latestTab.title}
                  onChange={(e) => setTabbedSettings({
                    ...tabbedSettings,
                    latestTab: {...tabbedSettings.latestTab, title: e.target.value}
                  })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">زیرعنوان</label>
                <input
                  type="text"
                  value={tabbedSettings.latestTab.subtitle}
                  onChange={(e) => setTabbedSettings({
                    ...tabbedSettings,
                    latestTab: {...tabbedSettings.latestTab, subtitle: e.target.value}
                  })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">تعداد نمایش</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tabbedSettings.latestTab.displayCount}
                  onChange={(e) => setTabbedSettings({
                    ...tabbedSettings,
                    latestTab: {...tabbedSettings.latestTab, displayCount: parseInt(e.target.value)}
                  })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">نوع چینش</label>
                <select
                  value={tabbedSettings.latestTab.sortOrder}
                  onChange={(e) => setTabbedSettings({
                    ...tabbedSettings,
                    latestTab: {...tabbedSettings.latestTab, sortOrder: e.target.value as any}
                  })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white"
                >
                  <option value="manual">انتخاب دستی</option>
                  <option value="random">تصادفی</option>
                  <option value="latest">جدیدترین</option>
                  <option value="popular">پربازدیدترین</option>
                </select>
              </div>

              {tabbedSettings.latestTab.sortOrder === 'manual' && (
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-4">انتخاب دستی محصولات جدید</h4>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                    <div>
                      <label className="block text-purple-300 text-sm mb-2">فیلتر بر اساس دسته‌بندی</label>
                      <select
                        value={latestFilter.category}
                        onChange={(e) => setLatestFilter({...latestFilter, category: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-purple-500/30 rounded text-white text-sm"
                      >
                        <option value="">همه دسته‌ها</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      {latestFilter.category && (
                        <button
                          onClick={() => selectCategoryProducts(latestFilter.category, 'tabbedLatest')}
                          className="mt-2 w-full px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded text-xs transition-colors"
                        >
                          ➕ انتخاب کل دسته &quot;{latestFilter.category}&quot;
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-purple-300 text-sm mb-2">جستجو در محصولات</label>
                      <input
                        type="text"
                        value={latestFilter.search}
                        onChange={(e) => setLatestFilter({...latestFilter, search: e.target.value})}
                        placeholder="نام محصول را جستجو کنید..."
                        className="w-full px-3 py-2 bg-gray-700 border border-purple-500/30 rounded text-white text-sm placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Selected Products Count */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-purple-300 text-sm">
                      📋 {tabbedSettings.latestTab.selectedProducts.length} محصول انتخاب شده
                    </span>
                    {tabbedSettings.latestTab.selectedProducts.length > 0 && (
                      <button
                        onClick={() => setTabbedSettings({
                          ...tabbedSettings,
                          latestTab: {...tabbedSettings.latestTab, selectedProducts: []}
                        })}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded text-xs transition-colors"
                      >
                        🗑️ پاک کردن همه
                      </button>
                    )}
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto border border-purple-500/20 rounded-lg p-2">
                    {getFilteredProducts('latest').map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          tabbedSettings.latestTab.selectedProducts.includes(product.id)
                            ? 'border-purple-500 bg-purple-500/20 shadow-md'
                            : 'border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-gray-700/50'
                        }`}
                        onClick={() => toggleProductSelection(product.id, 'tabbedLatest')}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-white text-sm font-medium truncate">{product.name}</h5>
                            <p className="text-gray-400 text-xs">{product.price.toLocaleString()} تومان</p>
                            <p className="text-purple-400 text-xs">📁 {product.category}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {tabbedSettings.latestTab.selectedProducts.includes(product.id) ? (
                              <span className="text-purple-500 text-lg">✅</span>
                            ) : (
                              <span className="text-gray-500 text-lg">⬜</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {getFilteredProducts('latest').length === 0 && (
                      <div className="col-span-2 text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">🔍</div>
                        <p>هیچ محصولی با این فیلتر یافت نشد</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tabbedSettings.latestTab.sortOrder !== 'manual' && (
              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-purple-300 text-sm">
                  {tabbedSettings.latestTab.sortOrder === 'latest' && '🕒 جدیدترین محصولات بر اساس تاریخ ایجاد انتخاب می‌شوند'}
                  {tabbedSettings.latestTab.sortOrder === 'popular' && '👁️ پربازدیدترین محصولات بر اساس تعداد بازدید انتخاب می‌شوند'}
                  {tabbedSettings.latestTab.sortOrder === 'random' && '📋 محصولات به صورت تصادفی انتخاب و نمایش داده می‌شوند'}
                </p>
              </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={saveTabbedSettings}
            disabled={saving}
            className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-purple-500 hover:from-yellow-400 hover:to-purple-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات محصولات ویژه'}
          </button>
        </div>
      </div>
      )}
      </div>
    </div>
  );
};

export default UnifiedProductsManagement;
