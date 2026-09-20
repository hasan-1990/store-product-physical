'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

interface BannerData {
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  description: string;
}

interface BannerSection {
  _id: string;
  name: string;
  title: string;
  position: string;
  leftBanner: BannerData;
  rightBanner: BannerData;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function BannerSectionsPage() {
  const [sections, setSections] = useState<BannerSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSection, setEditingSection] = useState<BannerSection | null>(null);
  const [newSection, setNewSection] = useState({
    name: '',
    title: '',
    position: 'after-hero',
    isActive: true
  });

  const positionOptions = [
    { value: 'before-hero', label: 'قبل از اسلایدر اصلی' },
    { value: 'after-hero', label: 'بعد از اسلایدر اصلی' },
    { value: 'after-categories', label: 'بعد از دسته‌بندی‌ها' },
    { value: 'after-products', label: 'بعد از محصولات ویژه' },
    { value: 'before-whyus', label: 'قبل از بخش چرا ما' },
    { value: 'before-footer', label: 'قبل از پاورقی' }
  ];

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/banner-sections');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSections(data.sections);
        }
      }
    } catch (error) {
      console.error('Error fetching banner sections:', error);
      toast.error('خطا در بارگذاری بخش‌های بنر');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    if (!newSection.name.trim()) {
      toast.error('نام بخش الزامی است');
      return;
    }

    try {
      const response = await fetch('/api/admin/banner-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSection),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('بخش جدید با موفقیت ایجاد شد');
          setShowCreateModal(false);
          setNewSection({
            name: '',
            title: '',
            position: 'after-hero',
            isActive: true
          });
          fetchSections();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'خطا در ایجاد بخش');
      }
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('خطا در ایجاد بخش');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('آیا از حذف این بخش اطمینان دارید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/banner-sections?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('بخش با موفقیت حذف شد');
          fetchSections();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'خطا در حذف بخش');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('خطا در حذف بخش');
    }
  };

  const toggleSectionStatus = async (id: string, currentStatus: boolean) => {
    try {
      const section = sections.find(s => s._id === id);
      if (!section) return;

      const response = await fetch('/api/admin/banner-sections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          name: section.name,
          title: section.title,
          position: section.position,
          leftBanner: section.leftBanner,
          rightBanner: section.rightBanner,
          isActive: !currentStatus,
          order: section.order
        }),
      });

      if (response.ok) {
        toast.success(`بخش ${!currentStatus ? 'فعال' : 'غیرفعال'} شد`);
        fetchSections();
      }
    } catch (error) {
      console.error('Error toggling section status:', error);
      toast.error('خطا در تغییر وضعیت بخش');
    }
  };

  const handleEditSection = (section: BannerSection) => {
    setEditingSection(section);
    setShowEditModal(true);
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;

    try {
      const response = await fetch('/api/admin/banner-sections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingSection._id,
          name: editingSection.name,
          title: editingSection.title,
          position: editingSection.position,
          leftBanner: editingSection.leftBanner,
          rightBanner: editingSection.rightBanner,
          isActive: editingSection.isActive,
          order: editingSection.order
        }),
      });

      if (response.ok) {
        toast.success('بخش با موفقیت بروزرسانی شد');
        setShowEditModal(false);
        setEditingSection(null);
        fetchSections();
      } else {
        toast.error('خطا در بروزرسانی بخش');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('خطا در بروزرسانی بخش');
    }
  };

  const getPositionLabel = (position: string) => {
    const option = positionOptions.find(opt => opt.value === position);
    return option ? option.label : position;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-purple-300/20 rounded mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-purple-300/20 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">مدیریت بخش‌های بنر</h1>
            <p className="mt-2 text-purple-200">
              ایجاد و مدیریت بخش‌های مختلف بنر در نقاط مختلف صفحه اصلی
            </p>
          </div>
          <Link
            href="/admin/content"
            className="shrink-0 px-4 py-2 bg-gray-800/50 text-purple-200 rounded-lg hover:bg-gray-700/50 transition-colors border border-purple-500/30"
          >
            ← بازگشت
          </Link>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30 shadow-2xl">
          <div className="px-6 py-4 border-b border-purple-500/30 flex justify-end items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg"
            >
              + بخش جدید
            </button>
          </div>

          {/* لیست بخش‌های موجود */}
          <div className="p-6">
            {sections.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-white mb-2">هیچ بخشی تعریف نشده است</h3>
                <p className="text-purple-200 mb-6">برای شروع، اولین بخش بنر خود را ایجاد کنید</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg"
                >
                  + ایجاد بخش جدید
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                  <div key={section._id} className="backdrop-blur-lg bg-white/10 border border-purple-500/30 rounded-xl p-4 hover:shadow-xl hover:bg-white/15 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{section.title}</h3>
                        <p className="text-sm text-purple-200">{section.name}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        section.isActive ? 'bg-green-500/30 text-green-100 border border-green-400/50' : 'bg-gray-500/30 text-gray-200 border border-gray-400/50'
                      }`}>
                        {section.isActive ? 'فعال' : 'غیرفعال'}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-purple-200">
                        <span className="font-medium text-white">موقعیت:</span> {getPositionLabel(section.position)}
                      </p>
                      <p className="text-sm text-purple-200">
                        <span className="font-medium text-white">ترتیب:</span> {section.order}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`p-2 rounded border ${
                          section.leftBanner.isActive ? 'border-green-400/50 bg-green-500/20 text-green-100' : 'border-gray-400/50 bg-gray-500/20 text-gray-200'
                        }`}>
                          بنر چپ: {section.leftBanner.isActive ? 'فعال' : 'غیرفعال'}
                        </div>
                        <div className={`p-2 rounded border ${
                          section.rightBanner.isActive ? 'border-green-400/50 bg-green-500/20 text-green-100' : 'border-gray-400/50 bg-gray-500/20 text-gray-200'
                        }`}>
                          بنر راست: {section.rightBanner.isActive ? 'فعال' : 'غیرفعال'}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between gap-2">
                      <Link
                        href={`/admin/content/banner-sections/${section._id}`}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center rounded text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg"
                      >
                        تنظیم بنرها
                      </Link>
                      <button
                        onClick={() => handleEditSection(section)}
                        className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded text-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => toggleSectionStatus(section._id, section.isActive)}
                        className={`px-3 py-2 rounded text-sm transition-all duration-300 shadow-lg ${
                          section.isActive 
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                        }`}
                      >
                        {section.isActive ? 'غیرفعال' : 'فعال'}
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section._id)}
                        className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded text-sm hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* مودال ایجاد بخش جدید */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="backdrop-blur-lg bg-gray-900/90 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">ایجاد بخش جدید</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  نام بخش <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newSection.name}
                  onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="مثال: banner-section-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  عنوان نمایشی
                </label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="عنوان نمایشی بخش"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  موقعیت در صفحه
                </label>
                <select
                  value={newSection.position}
                  onChange={(e) => setNewSection(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {positionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newSection.isActive}
                  onChange={(e) => setNewSection(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-purple-600 bg-gray-800 border-purple-500 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="isActive" className="mr-2 block text-sm font-medium text-purple-200">
                  فعال بودن بخش
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-purple-500/30">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-purple-300 border border-purple-500/30 rounded-md hover:bg-purple-900/30 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateSection}
                className="px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
              >
                ایجاد بخش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال ویرایش بخش */}
      {showEditModal && editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="backdrop-blur-lg bg-gray-900/90 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">ویرایش بخش</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  نام بخش <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingSection.name}
                  onChange={(e) => setEditingSection(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="مثال: banner-section-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  عنوان نمایشی
                </label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="عنوان نمایشی بخش"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  موقعیت در صفحه
                </label>
                <select
                  value={editingSection.position}
                  onChange={(e) => setEditingSection(prev => prev ? ({ ...prev, position: e.target.value }) : null)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {positionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  ترتیب نمایش
                </label>
                <input
                  type="number"
                  value={editingSection.order}
                  onChange={(e) => setEditingSection(prev => prev ? ({ ...prev, order: parseInt(e.target.value) || 1 }) : null)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingSection.isActive}
                  onChange={(e) => setEditingSection(prev => prev ? ({ ...prev, isActive: e.target.checked }) : null)}
                  className="h-4 w-4 text-purple-600 bg-gray-800 border-purple-500 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="editIsActive" className="mr-2 block text-sm font-medium text-purple-200">
                  فعال بودن بخش
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-purple-500/30">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm text-purple-300 border border-purple-500/30 rounded-md hover:bg-purple-900/30 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleUpdateSection}
                className="px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
              >
                بروزرسانی بخش
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#4ade80',
            },
          },
          error: {
            duration: 3000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}