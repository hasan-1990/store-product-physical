'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DiscountSection {
  id: string;
  title: string;
  subtitle: string;
  active: boolean;
  maxProducts: number;
  showDiscountBadge: boolean;
  position: string;
  productType: 'newest' | 'latest' | 'random' | 'discounted' | 'manual';
  selectedCategories: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Position options for discount sections
const positionOptions = [
  { value: 'home-top', label: 'صفحه اصلی - بالا', description: 'بعد از اسلایدر اصلی' },
  { value: 'home-middle', label: 'صفحه اصلی - وسط', description: 'بین سایر بخش‌ها' },
  { value: 'home-bottom', label: 'صفحه اصلی - پایین', description: 'قبل از فوتر' },
  { value: 'category-top', label: 'صفحات دسته‌بندی - بالا', description: 'بالای لیست محصولات' },
  { value: 'category-sidebar', label: 'صفحات دسته‌بندی - کناری', description: 'در sidebar صفحه' },
  { value: 'product-related', label: 'صفحه محصول - پیشنهادی', description: 'در قسمت محصولات مرتبط' },
  { value: 'cart-suggestions', label: 'صفحه سبد خرید - پیشنهادی', description: 'پیشنهادات در سبد خرید' }
];

const MultipleDiscountSections = () => {
  const [sections, setSections] = useState<DiscountSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSection, setEditingSection] = useState<DiscountSection | null>(null);
  const [newSection, setNewSection] = useState({
    title: '',
    subtitle: '',
    active: true,
    maxProducts: 6,
    showDiscountBadge: true,
    position: 'home-top',
    productType: 'newest' as 'newest' | 'latest' | 'random' | 'discounted' | 'manual',
    selectedCategories: [] as string[]
  });

  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  // Function to show notification
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    loadSections();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch('/api/admin/discount-sections');
      const data = await response.json();
      if (data.success) {
        setSections(data.data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSection = async () => {
    try {
      console.log('🚀 Creating new section:', newSection);
      
      const response = await fetch('/api/admin/discount-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSection)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        setSections([...sections, data.data]);
        setShowCreateModal(false);
        setNewSection({
          title: '',
          subtitle: '',
          active: true,
          maxProducts: 6,
          showDiscountBadge: true,
          position: 'home-top',
          productType: 'newest' as 'newest' | 'latest' | 'random' | 'manual',
          selectedCategories: [] as string[]
        });
        showNotification('success', 'موفقیت آمیز!', 'بخش جدید با موفقیت ایجاد شد');
      } else {
        console.error('❌ Server returned error:', data.error);
        showNotification('error', 'خطا در ایجاد بخش', data.error || 'خطای ناشناخته');
      }
    } catch (error) {
      console.error('❌ Network or client error:', error);
      showNotification('error', 'خطا در ایجاد بخش', error instanceof Error ? error.message : 'خطای شبکه');
    }
  };

  const updateSection = async (section: DiscountSection) => {
    try {
      const response = await fetch(`/api/admin/discount-sections/${section.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(section)
      });

      const data = await response.json();
      if (data.success) {
        setSections(sections.map(s => s.id === section.id ? section : s));
        setEditingSection(null);
        showNotification('success', 'به‌روزرسانی شد!', 'تغییرات با موفقیت ذخیره شد');
      } else {
        showNotification('error', 'خطا در به‌روزرسانی', 'لطفاً دوباره تلاش کنید');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      showNotification('error', 'خطا در به‌روزرسانی', 'لطفاً اتصال اینترنت را بررسی کنید');
    }
  };

  const deleteSection = async (sectionId: string) => {
    // Custom confirmation modal instead of browser confirm
    const shouldDelete = window.confirm('آیا از حذف این بخش اطمینان دارید؟');
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discount-sections/${sectionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setSections(sections.filter(s => s.id !== sectionId));
        showNotification('success', 'حذف شد!', 'بخش با موفقیت حذف شد');
      } else {
        showNotification('error', 'خطا در حذف', 'امکان حذف این بخش وجود ندارد');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      showNotification('error', 'خطا در حذف', 'لطفاً اتصال اینترنت را بررسی کنید');
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
    
    // Update order in database
    updateSectionsOrder(newSections);
  };

  const updateSectionsOrder = async (orderedSections: DiscountSection[]) => {
    try {
      const response = await fetch('/api/admin/discount-sections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sections: orderedSections })
      });

      if (!response.ok) {
        console.error('Failed to update sections order');
      }
    } catch (error) {
      console.error('Error updating sections order:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-white mt-4">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .animate-slide-in {
          animation: slideInRight 0.3s ease-out forwards;
        }
        
        .animate-slide-out {
          animation: slideOutRight 0.3s ease-in forwards;
        }
      `}</style>

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div className={`
            backdrop-blur-lg rounded-2xl p-4 shadow-2xl border max-w-md
            ${notification.type === 'success' 
              ? 'bg-green-500/20 border-green-500/30 text-green-100' 
              : notification.type === 'error'
              ? 'bg-red-500/20 border-red-500/30 text-red-100'
              : 'bg-blue-500/20 border-blue-500/30 text-blue-100'
            }
          `}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {notification.type === 'error' && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {notification.type === 'info' && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-sm opacity-90 mt-1">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">بخش‌های محصولات تخفیفی</h1>
          <p className="text-gray-300 mt-1">مدیریت چندین بخش محصولات تخفیفی در صفحه اصلی</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            ➕ ایجاد بخش جدید
          </button>
          <Link
            href="/admin/content"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            بازگشت
          </Link>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-orange-500/30 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">هیچ بخشی تعریف نشده است</h3>
            <p className="text-gray-300 mb-4">برای شروع، اولین بخش محصولات تخفیفی خود را ایجاد کنید</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all duration-300"
            >
              ایجاد اولین بخش
            </button>
          </div>
        ) : (
          sections.map((section, index) => (
            <div key={section.id} className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      section.active 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {section.active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{section.subtitle}</p>
                  <div className="flex gap-4 text-xs text-gray-400 mb-2">
                    <span>تعداد محصولات: {section.maxProducts}</span>
                    <span>نمایش برچسب تخفیف: {section.showDiscountBadge ? 'بله' : 'خیر'}</span>
                    <span>نوع محصولات: {
                      section.productType === 'newest' ? 'جدیدترین' :
                      section.productType === 'latest' ? 'آخرین' :
                      section.productType === 'random' ? 'تصادفی' :
                      section.productType === 'discounted' ? 'فقط تخفیف‌دار' :
                      section.productType === 'manual' ? 'انتخاب دستی' : 'نامشخص'
                    }</span>
                  </div>
                  {section.productType === 'manual' && section.selectedCategories && section.selectedCategories.length > 0 && (
                    <div className="text-xs text-blue-400 mb-2">
                      🏷️ دسته‌بندی‌های انتخاب شده: {section.selectedCategories.map(catId => {
                        const cat = categories.find(c => c.id === catId);
                        return cat ? cat.name : catId;
                      }).join('، ')}
                    </div>
                  )}
                  <div className="text-xs text-blue-400">
                    📍 محل نمایش: {positionOptions.find(opt => opt.value === section.position)?.label || section.position}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Move buttons */}
                  <button
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="انتقال به بالا"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === sections.length - 1}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="انتقال به پایین"
                  >
                    ⬇️
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => setEditingSection(section)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                  >
                    ✏️ ویرایش
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">ایجاد بخش جدید</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {/* Row 1: Title and Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">عنوان بخش</label>
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">زیرعنوان</label>
                  <input
                    type="text"
                    value={newSection.subtitle}
                    onChange={(e) => setNewSection({...newSection, subtitle: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Position and Product Count */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">موقعیت نمایش</label>
                  <select
                    value={newSection.position}
                    onChange={(e) => setNewSection({...newSection, position: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  >
                    {positionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">تعداد محصولات</label>
                  <select
                    value={newSection.maxProducts}
                    onChange={(e) => setNewSection({...newSection, maxProducts: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value={6}>6 محصول</option>
                    <option value={12}>12 محصول</option>
                    <option value={18}>18 محصول</option>
                    <option value={24}>24 محصول</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Product Type */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">نوع انتخاب محصولات</label>
                <select
                  value={newSection.productType}
                  onChange={(e) => setNewSection({...newSection, productType: e.target.value as any})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                >
                  <option value="newest">جدیدترین محصولات</option>
                  <option value="latest">آخرین محصولات</option>
                  <option value="random">محصولات تصادفی</option>
                  <option value="discounted">فقط محصولات تخفیف‌دار</option>
                  <option value="manual">انتخاب دستی دسته‌بندی‌ها</option>
                </select>
              </div>

              {/* Categories Selection - Only when manual */}
              {newSection.productType === 'manual' && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">انتخاب دسته‌بندی‌ها</label>
                  <div className="max-h-32 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-2">
                    <div className="grid grid-cols-2 gap-1">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center gap-2 p-1 hover:bg-gray-600 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newSection.selectedCategories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewSection({
                                  ...newSection, 
                                  selectedCategories: [...newSection.selectedCategories, category.id]
                                });
                              } else {
                                setNewSection({
                                  ...newSection, 
                                  selectedCategories: newSection.selectedCategories.filter(id => id !== category.id)
                                });
                              }
                            }}
                            className="rounded w-3 h-3"
                          />
                          <span className="text-white text-xs">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Row 4: Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300 text-sm">فعال بودن بخش</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSection.active}
                      onChange={(e) => setNewSection({...newSection, active: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300 text-sm">نمایش برچسب تخفیف</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSection.showDiscountBadge}
                      onChange={(e) => setNewSection({...newSection, showDiscountBadge: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-800 px-6 py-4 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={createSection}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  ایجاد بخش
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">ویرایش بخش</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {/* Row 1: Title and Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">عنوان بخش</label>
                  <input
                    type="text"
                    value={editingSection.title}
                    onChange={(e) => setEditingSection({...editingSection, title: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">زیرعنوان</label>
                  <input
                    type="text"
                    value={editingSection.subtitle}
                    onChange={(e) => setEditingSection({...editingSection, subtitle: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Position and Product Count */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">موقعیت نمایش</label>
                  <select
                    value={editingSection.position}
                    onChange={(e) => setEditingSection({...editingSection, position: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  >
                    {positionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">تعداد محصولات</label>
                  <select
                    value={editingSection.maxProducts}
                    onChange={(e) => setEditingSection({...editingSection, maxProducts: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                  >
                    <option value={6}>6 محصول</option>
                    <option value={12}>12 محصول</option>
                    <option value={18}>18 محصول</option>
                    <option value={24}>24 محصول</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Product Type */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">نوع انتخاب محصولات</label>
                <select
                  value={editingSection.productType}
                  onChange={(e) => setEditingSection({...editingSection, productType: e.target.value as any})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                >
                  <option value="newest">جدیدترین محصولات</option>
                  <option value="latest">آخرین محصولات</option>
                  <option value="random">محصولات تصادفی</option>
                  <option value="discounted">فقط محصولات تخفیف‌دار</option>
                  <option value="manual">انتخاب دستی دسته‌بندی‌ها</option>
                </select>
              </div>

              {/* Categories Selection - Only when manual */}
              {editingSection.productType === 'manual' && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">انتخاب دسته‌بندی‌ها</label>
                  <div className="max-h-32 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-2">
                    <div className="grid grid-cols-2 gap-1">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center gap-2 p-1 hover:bg-gray-600 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingSection.selectedCategories?.includes(category.id) || false}
                            onChange={(e) => {
                              const currentCategories = editingSection.selectedCategories || [];
                              if (e.target.checked) {
                                setEditingSection({
                                  ...editingSection, 
                                  selectedCategories: [...currentCategories, category.id]
                                });
                              } else {
                                setEditingSection({
                                  ...editingSection, 
                                  selectedCategories: currentCategories.filter(id => id !== category.id)
                                });
                              }
                            }}
                            className="rounded w-3 h-3"
                          />
                          <span className="text-white text-xs">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Row 4: Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300 text-sm">فعال بودن بخش</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSection.active}
                      onChange={(e) => setEditingSection({...editingSection, active: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300 text-sm">نمایش برچسب تخفیف</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSection.showDiscountBadge}
                      onChange={(e) => setEditingSection({...editingSection, showDiscountBadge: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-800 px-6 py-4 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => updateSection(editingSection)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  ذخیره تغییرات
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleDiscountSections;