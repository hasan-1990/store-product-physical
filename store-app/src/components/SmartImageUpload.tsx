'use client';

import { useState, useRef } from 'react';
import { uploadAndResizeImage, formatFileSize, isValidImageFormat } from '@/utils/imageUpload';

interface SmartImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  type?: 'banner' | 'product' | 'thumbnail' | 'hero';
  width?: number;
  height?: number;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function SmartImageUpload({
  currentImageUrl,
  onImageUploaded,
  type = 'banner',
  width,
  height,
  className = '',
  label = 'تصویر',
  required = false
}: SmartImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploadInfo, setUploadInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // بررسی نوع فایل
    if (!isValidImageFormat(file)) {
      alert('فقط فایل‌های تصویری مجاز هستند');
      return;
    }

    // بررسی اندازه فایل (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('حداکثر اندازه فایل 10 مگابایت است');
      return;
    }

    // نمایش پیش‌نمایش
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // شروع آپلود
    setUploading(true);
    setProgress(0);
    setUploadInfo(null);

    try {
      const result = await uploadAndResizeImage(file, {
        type,
        width,
        height,
        onProgress: setProgress
      });

      if (result.success && result.data) {
        setUploadInfo(result.data);
        onImageUploaded(result.data.url);
        
        // نمایش اطلاعات موفقیت
        if (result.data.resized) {
          console.log('تصویر با موفقیت resize شد:', result.data);
        }
      } else {
        alert(result.message || 'خطا در آپلود تصویر');
        setPreview(currentImageUrl || null);
      }
    } catch (error) {
      console.error('خطا در آپلود:', error);
      alert('خطا در آپلود تصویر');
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setUploadInfo(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRecommendedSize = () => {
    const sizes = {
      banner: '1200x600',
      product: '800x800', 
      thumbnail: '300x300',
      hero: '1920x1080'
    };
    return sizes[type] || '1200x600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* منطقه آپلود */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
        {preview ? (
          <div className="space-y-4">
            {/* پیش‌نمایش تصویر */}
            <div className="relative">
              <img
                src={preview}
                alt="پیش‌نمایش"
                className="w-full max-w-md h-auto max-h-64 object-cover rounded-lg mx-auto border border-gray-200"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <div>آپلود در حال انجام...</div>
                    <div className="text-sm">{progress}%</div>
                  </div>
                </div>
              )}
            </div>

            {/* اطلاعات تصویر */}
            {uploadInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-green-800 mb-2">
                  ✅ {uploadInfo.resized ? 'تصویر resize شد' : 'تصویر بهینه‌سازی شد'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-green-700">
                  <div>اندازه اصلی: {uploadInfo.originalSize.width}×{uploadInfo.originalSize.height}</div>
                  <div>اندازه نهایی: {uploadInfo.processedSize.width}×{uploadInfo.processedSize.height}</div>
                  <div>حجم اصلی: {formatFileSize(uploadInfo.originalSize.size)}</div>
                  <div>حجم نهایی: {formatFileSize(uploadInfo.processedSize.size)}</div>
                </div>
                {uploadInfo.compressionRatio > 0 && (
                  <div className="text-green-600 text-xs mt-1">
                    🗜️ فشرده‌سازی: {uploadInfo.compressionRatio}%
                  </div>
                )}
              </div>
            )}

            {/* دکمه‌های عمل */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                تغییر تصویر
              </button>
              <button
                onClick={handleRemoveImage}
                disabled={uploading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
              >
                حذف تصویر
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-gray-600 mb-4">
              <p className="font-medium">تصویر خود را انتخاب کنید</p>
              <p className="text-sm">یا اینجا بکشید و رها کنید</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              انتخاب فایل
            </button>
          </div>
        )}
      </div>

      {/* فیلد فایل مخفی */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* راهنمایی */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>📐 ابعاد توصیه شده: {getRecommendedSize()} پیکسل</div>
        <div>🔄 تصاویر بزرگ به طور خودکار resize می‌شوند</div>
        <div>📁 حداکثر حجم: 10MB | فرمت‌های مجاز: JPG, PNG, WebP</div>
      </div>
    </div>
  );
}