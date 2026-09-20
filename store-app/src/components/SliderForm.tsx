'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SliderFormData {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  order: number;
  active: boolean;
}

interface SliderFormProps {
  params?: Promise<{ id?: string }>;
}

const SliderForm = ({ params }: SliderFormProps) => {
  const router = useRouter();
  const [paramId, setParamId] = useState<string | undefined>(undefined);
  const [isEdit, setIsEdit] = useState(false);
  
  const [formData, setFormData] = useState<SliderFormData>({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    buttonText: '',
    buttonLink: '',
    order: 0,
    active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Handle async params
  useEffect(() => {
    const resolveParams = async () => {
      if (params) {
        const resolvedParams = await params;
        setParamId(resolvedParams.id);
        setIsEdit(!!resolvedParams.id);
        if (resolvedParams.id) {
          setLoadingData(true);
        }
      }
    };
    
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (isEdit && paramId) {
      loadSliderData(paramId);
    }
  }, [isEdit, paramId]);

  const loadSliderData = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/slider/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setFormData(data.data);
      } else {
        alert('خطا در بارگذاری اطلاعات اسلاید');
        router.push('/admin/content');
      }
    } catch (error) {
      console.error('Error loading slider:', error);
      alert('خطا در بارگذاری اطلاعات اسلاید');
      router.push('/admin/content');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit ? `/api/admin/slider/${paramId}` : '/api/admin/slider';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(isEdit ? 'اسلاید با موفقیت بروزرسانی شد' : 'اسلاید با موفقیت ایجاد شد');
        
        // Dispatch custom event to refresh slides
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sliderUpdated'));
        }
        
        router.push('/admin/content');
      } else {
        alert(data.error || 'خطا در ذخیره اطلاعات');
      }
    } catch (error) {
      console.error('Error saving slider:', error);
      alert('خطا در ذخیره اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SliderFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isEdit ? 'ویرایش اسلاید' : 'افزودن اسلاید جدید'}
          </h1>
          <p className="text-gray-300 mt-1">
            {isEdit ? 'ویرایش اطلاعات اسلاید موجود' : 'ایجاد اسلاید جدید برای صفحه اصلی'}
          </p>
        </div>
        <Link
          href="/admin/content"
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          بازگشت
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4">اطلاعات اصلی</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">عنوان اصلی *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="عنوان اصلی اسلاید"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">زیرعنوان</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="زیرعنوان اسلاید"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">توضیحات</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="توضیحات کامل اسلاید"
                  />
                </div>
              </div>
            </div>

            {/* Button Settings */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4">تنظیمات دکمه</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">متن دکمه *</label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => handleInputChange('buttonText', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="مثال: خرید کنید"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">لینک دکمه *</label>
                  <input
                    type="text"
                    value={formData.buttonLink}
                    onChange={(e) => handleInputChange('buttonLink', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="مثال: /products یا https://example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Image */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4">تصویر اسلاید</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">آدرس تصویر *</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Image Preview */}
                {formData.imageUrl && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">پیش‌نمایش</label>
                    <div className="relative">
                      <img
                        src={formData.imageUrl}
                        alt="پیش‌نمایش"
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4">تنظیمات</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">ترتیب نمایش</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="0"
                  />
                  <p className="text-gray-400 text-xs mt-1">عدد کمتر = اولویت بیشتر</p>
                </div>

                <div className="flex items-center space-x-reverse space-x-3">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => handleInputChange('active', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="active" className="text-gray-300 text-sm font-medium">
                    فعال (در صفحه اصلی نمایش داده شود)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-reverse space-x-4">
          <Link
            href="/admin/content"
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            لغو
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 text-white rounded-lg transition-colors"
          >
            {loading ? 'در حال ذخیره...' : (isEdit ? 'بروزرسانی' : 'ایجاد اسلاید')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SliderForm;
