'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface BannerData {
  id?: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  description: string;
  position: 'left' | 'right';
}

interface BannersData {
  leftBanner: BannerData;
  rightBanner: BannerData;
}

export default function PromoBannerSettingsPage() {
  const [bannersData, setBannersData] = useState<BannersData>({
    leftBanner: {
      title: '',
      imageUrl: '',
      linkUrl: '',
      isActive: false,
      description: '',
      position: 'left'
    },
    rightBanner: {
      title: '',
      imageUrl: '',
      linkUrl: '',
      isActive: false,
      description: '',
      position: 'right'
    }
  });
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

  useEffect(() => {
    fetchBannersData();
  }, []);

  const fetchBannersData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/promo-banner');
      
      if (response.ok) {
        const data = await response.json();
        setBannersData(data);
        if (data.leftBanner.imageUrl) {
          setImagePreviews(prev => ({ ...prev, left: data.leftBanner.imageUrl }));
        }
        if (data.rightBanner.imageUrl) {
          setImagePreviews(prev => ({ ...prev, right: data.rightBanner.imageUrl }));
        }
      }
    } catch (error) {
      console.error('Error fetching banners data:', error);
      toast.error('خطا در بارگذاری تنظیمات بنرها');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (position: 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFiles(prev => ({ ...prev, [position]: file }));
      
      // پیش‌نمایش تصویر
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
      
      console.log(`آپلود تصویر: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

      const response = await fetch('/api/upload/resize-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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
    setSaving(prev => ({ ...prev, [position]: true }));

    try {
      const bannerData = position === 'left' ? bannersData.leftBanner : bannersData.rightBanner;
      const imageFile = position === 'left' ? imageFiles.left : imageFiles.right;
      
      let imageUrl = bannerData.imageUrl;

      // اگر تصویر جدیدی انتخاب شده، آپلود کنیم
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setSaving(prev => ({ ...prev, [position]: false }));
          return; // خطا در آپلود
        }
      }

      // اعتبارسنجی
      if (!imageUrl) {
        toast.error('لطفاً تصویر بنر را انتخاب کنید');
        setSaving(prev => ({ ...prev, [position]: false }));
        return;
      }

      const dataToSave = {
        id: bannerData.id,
        title: bannerData.title,
        imageUrl,
        linkUrl: bannerData.linkUrl,
        isActive: bannerData.isActive,
        description: bannerData.description,
        position
      };

      const response = await fetch('/api/admin/promo-banner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`تنظیمات بنر ${position === 'left' ? 'چپ' : 'راست'} با موفقیت ذخیره شد`);
        
        // به‌روزرسانی داده‌ها
        setBannersData(prev => ({
          ...prev,
          [position === 'left' ? 'leftBanner' : 'rightBanner']: {
            ...prev[position === 'left' ? 'leftBanner' : 'rightBanner'],
            imageUrl,
            id: result.id || prev[position === 'left' ? 'leftBanner' : 'rightBanner'].id
          }
        }));
        setImageFiles(prev => ({ ...prev, [position]: null }));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving banner settings:', error);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(prev => ({ ...prev, [position]: false }));
    }
  };

  const handleInputChange = (position: 'left' | 'right', field: string, value: any) => {
    setBannersData(prev => ({
      ...prev,
      [position === 'left' ? 'leftBanner' : 'rightBanner']: {
        ...prev[position === 'left' ? 'leftBanner' : 'rightBanner'],
        [field]: value
      }
    }));
  };

  const renderBannerForm = (position: 'left' | 'right') => {
    const bannerData = position === 'left' ? bannersData.leftBanner : bannersData.rightBanner;
    const imagePreview = position === 'left' ? imagePreviews.left : imagePreviews.right;
    const isSaving = position === 'left' ? saving.left : saving.right;

    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(position); }} className="space-y-6">
        {/* وضعیت فعال/غیرفعال */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`isActive-${position}`}
            checked={bannerData.isActive}
            onChange={(e) => handleInputChange(position, 'isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`isActive-${position}`} className="mr-2 block text-sm font-medium text-gray-700">
            نمایش بنر {position === 'left' ? 'چپ' : 'راست'} در صفحه اصلی
          </label>
        </div>

        {/* عنوان بنر */}
        <div>
          <label htmlFor={`title-${position}`} className="block text-sm font-medium text-gray-700 mb-2">
            عنوان بنر (اختیاری)
          </label>
          <input
            type="text"
            id={`title-${position}`}
            value={bannerData.title}
            onChange={(e) => handleInputChange(position, 'title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="عنوان بنر را وارد کنید..."
          />
        </div>

        {/* تصویر بنر */}
        <div>
          <label htmlFor={`image-${position}`} className="block text-sm font-medium text-gray-700 mb-2">
            تصویر بنر <span className="text-red-500">*</span>
          </label>
          <div className="space-y-4">
            <input
              type="file"
              id={`image-${position}`}
              accept="image/*"
              onChange={(e) => handleImageChange(position, e)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500">
              ابعاد توصیه شده: 624x283 پیکسل | فرمت‌های مجاز: JPG, PNG, SVG
            </p>
            
            {/* پیش‌نمایش تصویر */}
            {imagePreview && (
              <div className="relative">
                <p className="text-sm font-medium text-gray-700 mb-2">پیش‌نمایش:</p>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <img
                    src={imagePreview}
                    alt={`پیش‌نمایش بنر ${position === 'left' ? 'چپ' : 'راست'}`}
                    className="w-full max-w-[624px] h-auto max-h-[283px] object-cover rounded-lg mx-auto"
                    style={{ aspectRatio: '624/283' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* لینک بنر */}
        <div>
          <label htmlFor={`linkUrl-${position}`} className="block text-sm font-medium text-gray-700 mb-2">
            لینک بنر (اختیاری)
          </label>
          <input
            type="url"
            id={`linkUrl-${position}`}
            value={bannerData.linkUrl}
            onChange={(e) => handleInputChange(position, 'linkUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com یا /products/category"
            dir="ltr"
          />
          <p className="mt-1 text-sm text-gray-500">
            می‌تواند لینک خارجی (https://) یا لینک داخلی (/products) باشد
          </p>
        </div>

        {/* توضیحات */}
        <div>
          <label htmlFor={`description-${position}`} className="block text-sm font-medium text-gray-700 mb-2">
            توضیحات (اختیاری)
          </label>
          <textarea
            id={`description-${position}`}
            value={bannerData.description}
            onChange={(e) => handleInputChange(position, 'description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="توضیحات اضافی در مورد بنر..."
          />
        </div>

        {/* دکمه ذخیره */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'در حال ذخیره...' : `ذخیره بنر ${position === 'left' ? 'چپ' : 'راست'}`}
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">تنظیمات بنرهای تبلیغاتی</h1>
            <p className="mt-2 text-gray-600">
              دو بنر تبلیغاتی کنار هم با ابعاد 624x283 پیکسل تنظیم کنید
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 space-x-reverse px-6">
              <button
                onClick={() => setActiveTab('left')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'left'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                بنر چپ
              </button>
              <button
                onClick={() => setActiveTab('right')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'right'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

          {/* نمایش پیش‌نمایش هر دو بنر در پایین */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">پیش‌نمایش بنرها</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">بنر چپ:</p>
                {imagePreviews.left ? (
                  <>
                  <img
                    src={imagePreviews.left}
                    alt="پیش‌نمایش بنر چپ"
                    className="w-full h-32 object-cover rounded border"
                  />
                  </>
                ) : (
                  <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center">
                    <span className="text-gray-500 text-sm">بنر چپ انتخاب نشده</span>
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  وضعیت: {bannersData.leftBanner.isActive ? 'فعال' : 'غیرفعال'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">بنر راست:</p>
                {imagePreviews.right ? (
                  <>
                  <img
                    src={imagePreviews.right}
                    alt="پیش‌نمایش بنر راست"
                    className="w-full h-32 object-cover rounded border"
                  />
                  </>
                ) : (
                  <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center">
                    <span className="text-gray-500 text-sm">بنر راست انتخاب نشده</span>
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  وضعیت: {bannersData.rightBanner.isActive ? 'فعال' : 'غیرفعال'}
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
        containerClassName=""
        containerStyle={{}}
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