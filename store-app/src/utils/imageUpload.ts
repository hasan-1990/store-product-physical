/**
 * Utility functions for image upload and resize
 */

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    url: string;
    originalSize: {
      width: number;
      height: number;
      size: number;
    };
    processedSize: {
      width: number;
      height: number;
      size: number;
    };
    resized: boolean;
    compressionRatio: number;
  };
  error?: string;
}

interface UploadOptions {
  type?: 'banner' | 'product' | 'thumbnail' | 'hero';
  width?: number;
  height?: number;
  onProgress?: (progress: number) => void;
}

/**
 * آپلود و resize خودکار تصویر
 */
export async function uploadAndResizeImage(
  file: File, 
  options: UploadOptions = {}
): Promise<UploadResponse> {
  const { type = 'banner', width, height, onProgress } = options;

  try {
    // بررسی نوع فایل
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        message: 'فقط فایل‌های تصویری مجاز هستند',
        error: 'invalid_file_type'
      };
    }

    // بررسی اندازه فایل (حداکثر 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: 'حداکثر اندازه فایل 10 مگابایت است',
        error: 'file_too_large'
      };
    }

    // ایجاد FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    if (width) {
      formData.append('width', width.toString());
    }
    
    if (height) {
      formData.append('height', height.toString());
    }

    // شروع پیشرفت
    if (onProgress) {
      onProgress(10);
    }

    // ارسال درخواست
    const response = await fetch('/api/upload/resize-image', {
      method: 'POST',
      body: formData,
    });

    if (onProgress) {
      onProgress(90);
    }

    const result: UploadResponse = await response.json();

    if (onProgress) {
      onProgress(100);
    }

    return result;

  } catch (error) {
    console.error('خطا در آپلود تصویر:', error);
    return {
      success: false,
      message: 'خطا در آپلود تصویر',
      error: 'upload_failed'
    };
  }
}

/**
 * دریافت پیکربندی‌های پیش‌فرض
 */
export async function getImageConfigs() {
  try {
    const response = await fetch('/api/upload/resize-image');
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('خطا در دریافت تنظیمات:', error);
    return null;
  }
}

/**
 * تبدیل اندازه فایل به فرمت قابل خواندن
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * بررسی پشتیبانی فرمت تصویر
 */
export function isValidImageFormat(file: File): boolean {
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return supportedFormats.includes(file.type);
}

/**
 * دریافت پیش‌نمایش تصویر
 */
export function getImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsDataURL(file);
  });
}