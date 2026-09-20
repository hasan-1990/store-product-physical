'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { SharedImageGallery } from '@/components';

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
}

export default function EditBannerSectionPage() {
  const params = useParams();
  const sectionId = params?.id as string;
  
  const [section, setSection] = useState<BannerSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ left: false, right: false });
  const [imageFiles, setImageFiles] = useState<{ left: File | null, right: File | null }>({
    left: null,
    right: null
  });
  const [imagePreviews, setImagePreviews] = useState<{ left: string | null, right: string | null }>({
    left: null,
    right: null
  });
  const [activeTab, setActiveTab] = useState<'left' | 'right'>('left');
  const [showImageGallery, setShowImageGallery] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (sectionId) {
      fetchSection();
    }
  }, [sectionId]);

  const fetchSection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/banner-sections/${sectionId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSection(data.section);
          if (data.section.leftBanner.imageUrl) {
            setImagePreviews(prev => ({ ...prev, left: data.section.leftBanner.imageUrl }));
          }
          if (data.section.rightBanner.imageUrl) {
            setImagePreviews(prev => ({ ...prev, right: data.section.rightBanner.imageUrl }));
          }
        }
      } else {
        toast.error('خطا در بارگذاری اطلاعات بخش');
      }
    } catch (error) {
      console.error('Error fetching section:', error);
      toast.error('خطا در بارگذاری اطلاعات بخش');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (position: 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFiles(prev => ({ ...prev, [position]: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => ({ ...prev, [position]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'banner'); // نوع تصویر برای resize مناسب
      
      // نمایش اطلاعات تصویر در کنسول
      console.log(`آپلود تصویر: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

      const response = await fetch('/api/upload/resize-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // نمایش اطلاعات تغییرات تصویر
          if (data.data.resized) {
            toast.success(
              `تصویر با موفقیت resize شد!\n` +
              `اندازه اصلی: ${data.data.originalSize.width}x${data.data.originalSize.height}\n` +
              `اندازه جدید: ${data.data.processedSize.width}x${data.data.processedSize.height}\n` +
              `فشرده‌سازی: ${data.data.compressionRatio}%`,
              { duration: 4000 }
            );
          } else {
            toast.success('تصویر بهینه‌سازی و ذخیره شد');
          }
          return data.data.url;
        }
      }
      
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('خطا در آپلود و پردازش تصویر');
      return null;
    }
  };

  const handleSubmit = async (position: 'left' | 'right') => {
    if (!section) return;

    setSaving(prev => ({ ...prev, [position]: true }));

    try {
      const bannerData = position === 'left' ? section.leftBanner : section.rightBanner;
      const imageFile = position === 'left' ? imageFiles.left : imageFiles.right;
      
      let imageUrl = bannerData.imageUrl;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setSaving(prev => ({ ...prev, [position]: false }));
          return;
        }
      }

      if (!imageUrl) {
        toast.error('لطفاً تصویر بنر را انتخاب کنید');
        setSaving(prev => ({ ...prev, [position]: false }));
        return;
      }

      const updatedBannerData = {
        ...bannerData,
        imageUrl
      };

      const response = await fetch(`/api/admin/banner-sections/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bannerPosition: position,
          bannerData: updatedBannerData
        }),
      });

      if (response.ok) {
        toast.success(`بنر ${position === 'left' ? 'چپ' : 'راست'} با موفقیت ذخیره شد`);
        
        setSection(prev => prev ? {
          ...prev,
          [position === 'left' ? 'leftBanner' : 'rightBanner']: updatedBannerData
        } : null);
        
        setImageFiles(prev => ({ ...prev, [position]: null }));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(prev => ({ ...prev, [position]: false }));
    }
  };

  const handleInputChange = (position: 'left' | 'right', field: string, value: any) => {
    if (!section) return;

    setSection(prev => prev ? {
      ...prev,
      [position === 'left' ? 'leftBanner' : 'rightBanner']: {
        ...prev[position === 'left' ? 'leftBanner' : 'rightBanner'],
        [field]: value
      }
    } : null);
  };

  const renderBannerForm = (position: 'left' | 'right') => {
    if (!section) return null;

    const bannerData = position === 'left' ? section.leftBanner : section.rightBanner;
    const imagePreview = position === 'left' ? imagePreviews.left : imagePreviews.right;
    const isSaving = position === 'left' ? saving.left : saving.right;

    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(position); }} className="space-y-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`isActive-${position}`}
            checked={bannerData.isActive}
            onChange={(e) => handleInputChange(position, 'isActive', e.target.checked)}
            className="h-4 w-4 text-purple-600 bg-gray-800 border-purple-500 rounded focus:ring-purple-500 focus:ring-2"
          />
          <label htmlFor={`isActive-${position}`} className="mr-2 block text-sm font-medium text-purple-200">
            نمایش بنر {position === 'left' ? 'چپ' : 'راست'}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            عنوان بنر (اختیاری)
          </label>
          <input
            type="text"
            value={bannerData.title}
            onChange={(e) => handleInputChange(position, 'title', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="عنوان بنر را وارد کنید..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            تصویر بنر <span className="text-red-400">*</span>
          </label>
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowImageGallery(position)}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                انتخاب از گالری
              </button>
              
              <label className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-blue-500/25">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                آپلود تصویر
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(position, e)}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-purple-300">
              ابعاد توصیه شده: 1200x600 پیکسل | تصاویر بزرگ به طور خودکار resize می‌شوند | حداکثر 10MB | فرمت‌های مجاز: JPG, PNG, WebP
            </p>
            
            {imagePreview && (
              <div className="relative">
                <p className="text-sm font-medium text-purple-200 mb-2">پیش‌نمایش:</p>
                <div className="border border-purple-500/30 rounded-lg p-4 bg-gray-800/30">
                  <div className="relative w-full max-w-[624px] mx-auto" style={{ aspectRatio: '624/283' }}>
                    <Image
                      src={imagePreview}
                      alt={`پیش‌نمایش بنر ${position === 'left' ? 'چپ' : 'راست'}`}
                      fill
                      className="object-cover rounded-lg"
                      unoptimized={imagePreview.startsWith('data:')}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            لینک بنر (اختیاری)
          </label>
          <input
            type="url"
            value={bannerData.linkUrl}
            onChange={(e) => handleInputChange(position, 'linkUrl', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="https://example.com یا /products/category"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            توضیحات (اختیاری)
          </label>
          <textarea
            value={bannerData.description}
            onChange={(e) => handleInputChange(position, 'description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="توضیحات اضافی در مورد بنر..."
          />
        </div>

        <div className="flex justify-end pt-6 border-t border-purple-500/30">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
          >
            {isSaving ? 'در حال ذخیره...' : `ذخیره بنر ${position === 'left' ? 'چپ' : 'راست'}`}
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-purple-300/20 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-purple-300/20 rounded"></div>
                <div className="h-32 bg-purple-300/20 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30 p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">بخش یافت نشد</h2>
              <p className="text-purple-200">بخش مورد نظر وجود ندارد یا حذف شده است.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30 shadow-2xl">
          <div className="px-6 py-4 border-b border-purple-500/30 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h1 className="text-2xl font-bold text-white">تنظیم بنرهای {section.title}</h1>
              <p className="mt-2 text-purple-200">
                موقعیت: {section.position} | نام: {section.name}
              </p>
            </div>
            <Link
              href="/admin/content/banner-sections"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors shrink-0"
            >
              بازگشت
            </Link>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-purple-500/30">
            <nav className="flex space-x-8 space-x-reverse px-6">
              <button
                onClick={() => setActiveTab('left')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'left'
                    ? 'border-purple-500 text-purple-300'
                    : 'border-transparent text-purple-200 hover:text-white hover:border-purple-400'
                }`}
              >
                بنر چپ
              </button>
              <button
                onClick={() => setActiveTab('right')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'right'
                    ? 'border-purple-500 text-purple-300'
                    : 'border-transparent text-purple-200 hover:text-white hover:border-purple-400'
                }`}
              >
                بنر راست
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderBannerForm(activeTab)}
          </div>

          {/* پیش‌نمایش */}
          <div className="px-6 py-4 border-t border-purple-500/30 bg-gray-800/20">
            <h3 className="text-lg font-medium text-white mb-4">پیش‌نمایش بنرها</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-purple-200 mb-2">بنر چپ:</p>
                {imagePreviews.left ? (
                  <div className="relative w-full h-32 rounded-lg border border-purple-500/30 overflow-hidden">
                    <Image
                      src={imagePreviews.left}
                      alt="پیش‌نمایش بنر چپ"
                      fill
                      className="object-cover"
                      unoptimized={imagePreviews.left.startsWith('data:')}
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-800/50 rounded-lg border border-purple-500/30 flex items-center justify-center">
                    <span className="text-purple-300 text-sm">بنر چپ انتخاب نشده</span>
                  </div>
                )}
                <div className="mt-1 text-xs text-purple-300">
                  وضعیت: {section.leftBanner.isActive ? 'فعال' : 'غیرفعال'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-200 mb-2">بنر راست:</p>
                {imagePreviews.right ? (
                  <div className="relative w-full h-32 rounded-lg border border-purple-500/30 overflow-hidden">
                    <Image
                      src={imagePreviews.right}
                      alt="پیش‌نمایش بنر راست"
                      fill
                      className="object-cover"
                      unoptimized={imagePreviews.right.startsWith('data:')}
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-800/50 rounded-lg border border-purple-500/30 flex items-center justify-center">
                    <span className="text-purple-300 text-sm">بنر راست انتخاب نشده</span>
                  </div>
                )}
                <div className="mt-1 text-xs text-purple-300">
                  وضعیت: {section.rightBanner.isActive ? 'فعال' : 'غیرفعال'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Image Gallery Modal */}
      {showImageGallery && section && (
        <SharedImageGallery
          isOpen={true}
          onClose={() => setShowImageGallery(null)}
          onSelectImage={(imageUrl: string) => {
            if (showImageGallery === 'left') {
              setSection({
                ...section,
                leftBanner: { ...section.leftBanner, imageUrl }
              });
              setImagePreviews(prev => ({ ...prev, left: imageUrl }));
            } else {
              setSection({
                ...section,
                rightBanner: { ...section.rightBanner, imageUrl }
              });
              setImagePreviews(prev => ({ ...prev, right: imageUrl }));
            }
            setShowImageGallery(null);
          }}
          title={`انتخاب تصویر بنر ${showImageGallery === 'left' ? 'چپ' : 'راست'}`}
          source="admin"
        />
      )}
    </div>
  );
}