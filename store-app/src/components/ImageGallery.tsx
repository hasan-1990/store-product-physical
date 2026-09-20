'use client';
import { useState } from 'react';
import Image from 'next/image';
import { SharedImageGallery } from '@/components';

interface ImageGalleryProps {
  selectedImage: string;
  onImageSelect: (imageUrl: string) => void;
  className?: string;
  source?: 'admin' | 'blog';
  title?: string;
  imageType?: 'banner' | 'product' | 'thumbnail' | 'hero';
  autoResize?: boolean;
  imageAlts?: Record<string, string>;
  onUpdateAlt?: (imageUrl: string, altText: string) => void;
}

export default function ImageGallery({ 
  selectedImage, 
  onImageSelect, 
  className = '',
  source = 'blog',
  title = 'انتخاب تصویر شاخص',
  imageType = 'banner',
  autoResize = true,
  imageAlts = {},
  onUpdateAlt
}: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const resizeAndUploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsResizing(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', imageType);
      
      const response = await fetch('/api/upload/resize-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data.url;
      } else {
        console.error('Error resizing image:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error resizing image:', error);
      return null;
    } finally {
      setIsResizing(false);
    }
  };

  const handleImageSelect = async (imageUrl: string) => {
    // اگر تصویر از گالری انتخاب شده است (URL محلی)، مستقیماً استفاده کن
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/images/')) {
      onImageSelect(imageUrl);
      setIsOpen(false);
      return;
    }

    // اگر تصویر جدید آپلود شده و نیاز به ریسایز دارد
    if (autoResize && imageUrl.startsWith('blob:')) {
      try {
        // تبدیل blob URL به فایل
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'uploaded-image.jpg', { type: blob.type });
        
        const resizedUrl = await resizeAndUploadImage(file);
        if (resizedUrl) {
          onImageSelect(resizedUrl);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        onImageSelect(imageUrl); // در صورت خطا، تصویر اصلی را استفاده کن
      }
    } else {
      onImageSelect(imageUrl);
    }
    
    setIsOpen(false);
  };

  // تنظیم ابعاد container بر اساس نوع تصویر
  const getContainerClasses = () => {
    switch (imageType) {
      case 'banner':
        return 'h-48 sm:h-56 md:h-64'; // بلندتر برای banner
      case 'product':
        return 'h-64 sm:h-72 md:h-80'; // بلندتر برای product
      case 'thumbnail':
        return 'h-40 sm:h-48 md:h-56'; // بلندتر برای thumbnail
      case 'hero':
        return 'h-56 sm:h-64 md:h-72'; // بلندتر برای hero
      default:
        return 'h-48 sm:h-56 md:h-64'; // پیش‌فرض بلندتر
    }
  };

  const getImageDimensions = () => {
    switch (imageType) {
      case 'banner': return '1200×600';
      case 'product': return '800×800';
      case 'thumbnail': return '300×300';
      case 'hero': return '1920×1080';
      default: return '1200×600';
    }
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          تصویر شاخص *
          {autoResize && (
            <span className="text-xs text-purple-400 mr-2">
              (ریسایز خودکار فعال)
            </span>
          )}
        </label>
        
        <div 
          onClick={() => setIsOpen(true)}
          className={`relative max-w-2xl ${getContainerClasses()} bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors group`}
        >
          {isResizing && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center z-10">
              <div className="flex flex-col items-center text-white">
                <div className="w-8 h-8 border-t-2 border-purple-500 border-solid rounded-full animate-spin mb-2"></div>
                <span className="text-sm">در حال ریسایز...</span>
              </div>
            </div>
          )}
          
          {selectedImage ? (
            <div className="relative w-full h-full">
              <Image
                src={selectedImage}
                alt="تصویر شاخص"
                fill
                sizes="(max-width: 768px) 300px, (max-width: 1024px) 400px, 500px"
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="w-6 h-6 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">تغییر تصویر</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-purple-400 transition-colors">
              <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-center text-xs">
                انتخاب تصویر شاخص
                <br />
                <span className="text-xs text-gray-500">
                  (ابعاد بهینه: {getImageDimensions()})
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <SharedImageGallery
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelectImage={handleImageSelect}
        title={title}
        source={source}
        imageAlts={imageAlts}
        onUpdateAlt={onUpdateAlt}
      />
    </div>
  );
}
