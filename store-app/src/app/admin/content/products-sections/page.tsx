'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CustomSection {
  id: string;
  active: boolean;
  title: string;
  subtitle: string;
  tabs: CustomTab[];
  displayMode: 'tabs' | 'separate';
  position: number;
}

interface CustomTab {
  id: string;
  active: boolean;
  title: string;
  subtitle: string;
  maxProducts: number;
  selectionMode: 'manual' | 'latest' | 'random' | 'most_viewed' | 'best_selling' | 'highest_rated';
  selectedProducts: string[];
}

interface Product {
  _id: string;
  id?: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  active: boolean;
}

export default function ProductsSectionsPage(): React.JSX.Element {
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [showCustomSectionModal, setShowCustomSectionModal] = useState(false);
  const [editingCustomSection, setEditingCustomSection] = useState<CustomSection | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // بارگذاری محصولات
      const productsRes = await fetch('/api/admin/products');
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }

      // بارگذاری بخش‌های سفارشی
      const customRes = await fetch('/api/admin/custom-sections');
      if (customRes.ok) {
        const customData = await customRes.json();
        if (customData.success && customData.sections) {
          setCustomSections(customData.sections);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // const saveSettings = async () => {
  //   // This function is no longer needed for featured/latest sections
  //   console.log('Settings function removed - only custom sections are managed');
  // };

  // const handleProductToggle = (productId: string, section: string) => {
  //   // This function is no longer needed for featured/latest sections
  //   console.log('Product toggle function removed - only custom sections are managed');
  // };

  const createNewCustomSection = () => {
    const newSection: CustomSection = {
      id: `custom_${Date.now()}`,
      active: true,
      title: 'بخش جدید',
      subtitle: 'توضیحات بخش جدید',
      displayMode: 'tabs',
      position: customSections.length + 1,
      tabs: [
        {
          id: `tab_${Date.now()}`,
          active: true,
          title: 'تب اول',
          subtitle: 'توضیحات تب اول',
          maxProducts: 8,
          selectionMode: 'latest',
          selectedProducts: []
        }
      ]
    };
    setEditingCustomSection(newSection);
    setShowCustomSectionModal(true);
  };

  const editCustomSection = (section: CustomSection) => {
    setEditingCustomSection(section);
    setShowCustomSectionModal(true);
  };

  const saveCustomSection = async () => {
    if (!editingCustomSection) return;

    try {
      const isNew = !customSections.find(s => s.id === editingCustomSection.id);
      
      let updatedSections;
      if (isNew) {
        updatedSections = [...customSections, editingCustomSection];
      } else {
        updatedSections = customSections.map(s => 
          s.id === editingCustomSection.id ? editingCustomSection : s
        );
      }

      setCustomSections(updatedSections);

      // ذخیره در دیتابیس
      const response = await fetch('/api/admin/custom-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections })
      });

      if (response.ok) {
        alert('بخش سفارشی ذخیره شد');
        
        // ارسال event برای بروزرسانی real-time
        window.dispatchEvent(new CustomEvent('customSectionsUpdated', {
          detail: { timestamp: Date.now() }
        }));
        
        // بروزرسانی localStorage برای sync
        localStorage.setItem('customSectionsLastUpdate', Date.now().toString());
      }

      setShowCustomSectionModal(false);
      setEditingCustomSection(null);
    } catch (error) {
      console.error('Error saving custom section:', error);
      alert('خطا در ذخیره بخش سفارشی');
    }
  };

  const deleteCustomSection = async (sectionId: string) => {
    if (!confirm('آیا از حذف این بخش اطمینان دارید؟')) return;

    const updatedSections = customSections.filter(s => s.id !== sectionId);
    setCustomSections(updatedSections);
    
    try {
      const response = await fetch('/api/admin/custom-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections })
      });
      
      if (response.ok) {
        // ارسال event برای بروزرسانی real-time
        window.dispatchEvent(new CustomEvent('customSectionsUpdated', {
          detail: { timestamp: Date.now() }
        }));
        
        // بروزرسانی localStorage برای sync
        localStorage.setItem('customSectionsLastUpdate', Date.now().toString());
      }
    } catch (error) {
      console.error('Error deleting custom section:', error);
    }
  };

  const addTabToCustomSection = () => {
    if (!editingCustomSection) return;
    
    const newTab: CustomTab = {
      id: `tab_${Date.now()}`,
      active: true,
      title: `تب ${editingCustomSection.tabs.length + 1}`,
      subtitle: 'توضیحات تب جدید',
      maxProducts: 8,
      selectionMode: 'latest',
      selectedProducts: []
    };

    setEditingCustomSection({
      ...editingCustomSection,
      tabs: [...editingCustomSection.tabs, newTab]
    });
  };

  const removeTabFromCustomSection = (tabId: string) => {
    if (!editingCustomSection) return;
    
    setEditingCustomSection({
      ...editingCustomSection,
      tabs: editingCustomSection.tabs.filter(tab => tab.id !== tabId)
    });
  };

  const updateCustomSectionTab = (tabId: string, updates: Partial<CustomTab>) => {
    if (!editingCustomSection) return;
    
    setEditingCustomSection({
      ...editingCustomSection,
      tabs: editingCustomSection.tabs.map(tab =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    });
  };

  // const filteredProducts = (section: string) => {
  //   // This function is simplified since we only work with custom sections now
  //   return products.filter(product => product.active);
  // };

  // const categories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  مدیریت بخش‌های محصولات
                </h1>
                <p className="text-slate-600 text-lg">
                  تنظیمات یکپارچه و هوشمند برای نمایش محصولات در سایت
                </p>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-0"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                بازگشت به ادمین
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Custom Sections Management */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  مدیریت بخش‌های محصولات
                </h2>
                <p className="text-slate-600 mt-1">ایجاد و مدیریت بخش‌های قابل تنظیم با چندین تب</p>
              </div>
            </div>
            <button
              onClick={createNewCustomSection}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ایجاد بخش جدید
            </button>
          </div>

          {/* Custom Sections List */}
          <div className="space-y-4">
            {customSections.map((section) => (
              <div key={section.id} className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">{section.title}</h3>
                    <p className="text-slate-600 text-sm">{section.subtitle}</p>
                    <div className="flex items-center space-x-4 space-x-reverse mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        section.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {section.active ? 'فعال' : 'غیرفعال'}
                      </span>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                        {section.tabs.length} تب
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {section.displayMode === 'tabs' ? 'تب‌دار' : 'جداگانه'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => editCustomSection(section)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => deleteCustomSection(section.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
                
                {/* Tabs Preview */}
                <div className="border-t border-indigo-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.tabs.map((tab) => (
                      <div key={tab.id} className="bg-white rounded-lg p-3 border border-indigo-100">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-700">{tab.title}</h4>
                          <span className={`w-3 h-3 rounded-full ${
                            tab.active ? 'bg-green-400' : 'bg-gray-300'
                          }`}></span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{tab.subtitle}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                          <span>حداکثر: {tab.maxProducts}</span>
                          <span>{tab.selectedProducts.length} انتخاب شده</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {customSections.length === 0 && (
              <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl border-2 border-dashed border-indigo-200">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">هیچ بخش سفارشی تعریف نشده</h3>
                <p className="text-slate-500 mb-6">برای شروع، اولین بخش سفارشی خود را ایجاد کنید</p>
                <button
                  onClick={createNewCustomSection}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  ایجاد بخش جدید
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Button - Only for Custom Sections */}
        <div className="flex justify-center pt-8">
          <button
            onClick={saveCustomSection}
            disabled={!editingCustomSection}
            className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300/50 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <svg className="w-5 h-5 mr-2 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="relative z-10">مدیریت بخش‌های سفارشی</span>
          </button>
        </div>

        {/* Custom Section Modal */}
        {showCustomSectionModal && editingCustomSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">
                  {customSections.find(s => s.id === editingCustomSection.id) ? 'ویرایش بخش سفارشی' : 'ایجاد بخش سفارشی جدید'}
                </h3>
                <button
                  onClick={() => {
                    setShowCustomSectionModal(false);
                    setEditingCustomSection(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Section Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">عنوان بخش</label>
                  <input
                    type="text"
                    value={editingCustomSection.title}
                    onChange={(e) => setEditingCustomSection({
                      ...editingCustomSection,
                      title: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="مثال: محصولات پیشنهادی"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">زیرعنوان بخش</label>
                  <input
                    type="text"
                    value={editingCustomSection.subtitle}
                    onChange={(e) => setEditingCustomSection({
                      ...editingCustomSection,
                      subtitle: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="مثال: بهترین انتخاب‌های ما برای شما"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">حالت نمایش</label>
                  <select
                    value={editingCustomSection.displayMode}
                    onChange={(e) => setEditingCustomSection({
                      ...editingCustomSection,
                      displayMode: e.target.value as 'tabs' | 'separate'
                    })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  >
                    <option value="tabs">تب‌دار</option>
                    <option value="separate">جداگانه</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCustomSection.active}
                      onChange={(e) => setEditingCustomSection({
                        ...editingCustomSection,
                        active: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ml-3 text-sm font-medium text-slate-700">فعال بودن بخش</span>
                  </label>
                </div>
              </div>

              {/* Tabs Management */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-slate-800">مدیریت تب‌ها</h4>
                  <button
                    onClick={addTabToCustomSection}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    افزودن تب
                  </button>
                </div>

                <div className="space-y-4">
                  {editingCustomSection.tabs.map((tab, index) => (
                    <div key={tab.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-md font-semibold text-slate-800">تب {index + 1}</h5>
                        {editingCustomSection.tabs.length > 1 && (
                          <button
                            onClick={() => removeTabFromCustomSection(tab.id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
                          >
                            حذف تب
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">عنوان تب</label>
                          <input
                            type="text"
                            value={tab.title}
                            onChange={(e) => updateCustomSectionTab(tab.id, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="عنوان تب"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">زیرعنوان تب</label>
                          <input
                            type="text"
                            value={tab.subtitle}
                            onChange={(e) => updateCustomSectionTab(tab.id, { subtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="زیرعنوان تب"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">نحوه انتخاب محصولات</label>
                          <select
                            value={tab.selectionMode}
                            onChange={(e) => updateCustomSectionTab(tab.id, { selectionMode: e.target.value as any })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="manual">انتخاب دستی</option>
                            <option value="latest">جدیدترین</option>
                            <option value="best_selling">پرفروش‌ترین</option>
                            <option value="most_viewed">پربازدیدترین</option>
                            <option value="highest_rated">بالاترین امتیاز</option>
                            <option value="random">تصادفی</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">حداکثر تعداد</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={tab.maxProducts}
                            onChange={(e) => updateCustomSectionTab(tab.id, { maxProducts: parseInt(e.target.value) || 8 })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tab.active}
                            onChange={(e) => updateCustomSectionTab(tab.id, { active: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          <span className="ml-3 text-sm font-medium text-slate-700">فعال بودن تب</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t border-slate-200 mt-6">
                <button
                  onClick={() => {
                    setShowCustomSectionModal(false);
                    setEditingCustomSection(null);
                  }}
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                >
                  لغو
                </button>
                <button
                  onClick={saveCustomSection}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  ذخیره بخش
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
