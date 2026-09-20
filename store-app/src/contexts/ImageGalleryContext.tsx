'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { deleteImage as deleteImageHelper } from '@/utils/image-helper';

interface ImageData {
  id: string;
  name: string;
  url: string;
  size?: string;
  type?: string;
  source?: 'admin' | 'blog'; // برای مشخص کردن منبع تصویر
}

interface ImageGalleryContextType {
  images: ImageData[];
  isLoading: boolean;
  uploadImage: (file: File, source?: 'admin' | 'blog') => Promise<ImageData | null>;
  deleteImage: (imageId: string, source?: 'admin' | 'blog') => Promise<boolean>;
  refreshImages: () => Promise<void>;
  error: string | null;
}

const ImageGalleryContext = createContext<ImageGalleryContextType | undefined>(undefined);

interface ImageGalleryProviderProps {
  children: ReactNode;
}

export function ImageGalleryProvider({ children }: ImageGalleryProviderProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // دریافت تصاویر از هر دو API
  const fetchImages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [adminResponse, blogResponse] = await Promise.allSettled([
        fetch('/api/admin/upload'),
        fetch('/api/blog/images')
      ]);

      const allImages: ImageData[] = [];

      // پردازش تصاویر admin
      if (adminResponse.status === 'fulfilled' && adminResponse.value.ok) {
        const adminData = await adminResponse.value.json();
        console.log('🔍 Admin API Response:', adminData);
        if (adminData.success && adminData.data) {
          const adminImages = adminData.data.map((img: any) => ({
            id: img.id || img.name,
            name: img.name,
            url: img.url,
            size: img.size,
            type: img.type,
            source: 'admin' as const
          }));
          console.log('✅ Admin Images Processed:', adminImages.length);
          allImages.push(...adminImages);
        }
      } else {
        console.error('❌ Admin API Failed:', adminResponse);
      }

      // پردازش تصاویر blog
      if (blogResponse.status === 'fulfilled' && blogResponse.value.ok) {
        const blogData = await blogResponse.value.json();
        if (blogData.success && blogData.images) {
          const blogImages = blogData.images.map((img: any) => ({
            id: img.name,
            name: img.name,
            url: img.url,
            source: 'blog' as const
          }));
          allImages.push(...blogImages);
        }
      }

      console.log('📦 Total Images:', allImages.length);
      setImages(allImages);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('خطا در دریافت تصاویر');
    } finally {
      setIsLoading(false);
    }
  };

  // آپلود تصویر
  const uploadImage = async (file: File, source: 'admin' | 'blog' = 'admin'): Promise<ImageData | null> => {
    setError(null);

    try {
      const formData = new FormData();
      const fieldName = source === 'admin' ? 'file' : 'file';
      formData.append(fieldName, file);

      const apiUrl = source === 'admin' ? '/api/admin/upload' : '/api/blog/images';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the entire image list from API to ensure consistency
        await fetchImages();
        
        // Return the uploaded image data
        let newImage: ImageData;
        
        if (source === 'admin') {
          newImage = {
            ...data.data,
            source: 'admin'
          };
        } else {
          newImage = {
            id: data.image.name,
            name: data.image.name,
            url: data.image.url,
            source: 'blog'
          };
        }

        return newImage;
      } else {
        setError(data.error || 'خطا در آپلود فایل');
        return null;
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('خطا در آپلود فایل');
      return null;
    }
  };

  // حذف تصویر
  const deleteImage = async (imageId: string, source: 'admin' | 'blog' = 'admin'): Promise<boolean> => {
    setError(null);

    try {
      console.log('🗑️ حذف عکس از گالری:', imageId, source);
      
      // استفاده از helper جدید که هم فایل و هم دیتابیس را حذف می‌کند
      const result = await deleteImageHelper({
        imageUrl: imageId.startsWith('/') ? imageId : `/${imageId}`,
        // نوع را بر اساس source تشخیص می‌دهیم
        // اگر source='blog' باشد type='blog' و اگر 'admin' باشد نوع را خودکار تشخیص می‌دهد
      });

      if (result.success) {
        // حذف از لیست محلی
        setImages(prev => prev.filter(img => img.id !== imageId && img.url !== imageId));
        console.log('✅ عکس با موفقیت حذف شد:', result);
        return true;
      } else {
        setError(result.error || 'خطا در حذف فایل');
        console.error('❌ خطا در حذف:', result.error);
        return false;
      }
    } catch (err) {
      console.error('💥 خطا در حذف عکس:', err);
      setError('خطا در حذف فایل');
      return false;
    }
  };

  // رفرش تصاویر
  const refreshImages = async () => {
    await fetchImages();
  };

  // بارگیری اولیه تصاویر
  useEffect(() => {
    fetchImages();
  }, []);

  const value: ImageGalleryContextType = {
    images,
    isLoading,
    uploadImage,
    deleteImage,
    refreshImages,
    error,
  };

  return (
    <ImageGalleryContext.Provider value={value}>
      {children}
    </ImageGalleryContext.Provider>
  );
}

// Hook برای استفاده از Context
export function useImageGallery() {
  const context = useContext(ImageGalleryContext);
  if (context === undefined) {
    throw new Error('useImageGallery must be used within an ImageGalleryProvider');
  }
  return context;
}

export default ImageGalleryContext;