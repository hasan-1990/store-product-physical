'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useImageGallery } from '@/contexts/ImageGalleryContext';

interface SharedImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  title?: string;
  source?: 'admin' | 'blog';
  
  // قابلیت‌های اضافی برای سازگاری کامل
  allowMultiple?: boolean;
  selectedImage?: string;
  selectedImages?: string[];
  onSelectImages?: (urls: string[]) => void;
  onConfirm?: (selectedImage?: string) => void;
  
  // قابلیت alt text
  imageAlts?: Record<string, string>; // { imageUrl: altText }
  onUpdateAlt?: (imageUrl: string, altText: string) => void;
}

export default function SharedImageGallery({
  isOpen,
  onClose,
  onSelectImage,
  title = 'انتخاب تصویر',
  source = 'admin',
  allowMultiple = false,
  selectedImage,
  selectedImages,
  onSelectImages,
  onConfirm,
  imageAlts = {},
  onUpdateAlt
}: SharedImageGalleryProps) {
  const { images, uploadImage, deleteImage, isLoading, error } = useImageGallery();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; source: 'admin' | 'blog' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // مدیریت انتخاب محلی
  const [localSelectedImage, setLocalSelectedImage] = useState<string>('');
  const [localSelectedImages, setLocalSelectedImages] = useState<string[]>([]);

  // مدیریت alt text modal
  const [showAltModal, setShowAltModal] = useState(false);
  const [altEditTarget, setAltEditTarget] = useState<string | null>(null);
  const [altInputValue, setAltInputValue] = useState<string>('');
  
  // state داخلی برای alt text اگر از خارج پاس داده نشود
  const [internalImageAlts, setInternalImageAlts] = useState<Record<string, string>>({});
  
  // استفاده از imageAlts از props یا state داخلی
  const currentImageAlts = Object.keys(imageAlts).length > 0 ? imageAlts : internalImageAlts;
  const currentOnUpdateAlt = onUpdateAlt || ((imageUrl: string, altText: string) => {
    setInternalImageAlts(prev => ({ ...prev, [imageUrl]: altText }));
  });

  // همگام‌سازی state محلی با props
  React.useEffect(() => {
    if (!isOpen) return;
    setLocalSelectedImage(selectedImage || '');
    setLocalSelectedImages(Array.isArray(selectedImages) ? [...selectedImages] : []);
  }, [isOpen, selectedImage, selectedImages]);

  const selectedSet = React.useMemo(() => new Set(localSelectedImages), [localSelectedImages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedImage = await uploadImage(file, source);
      if (uploadedImage) {
        // Reset file input
        if (event.target) {
          event.target.value = '';
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = (imageId: string, imageSource: 'admin' | 'blog') => {
    setDeleteTarget({ id: imageId, source: imageSource });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const success = await deleteImage(deleteTarget.id, deleteTarget.source);
    if (success) {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const toggleOrSelect = (url: string) => {
    if (allowMultiple) {
      const next = selectedSet.has(url)
        ? localSelectedImages.filter((u) => u !== url)
        : [...localSelectedImages, url];
      setLocalSelectedImages(next);
      onSelectImages?.(next);
      return;
    }
    setLocalSelectedImage(url);
    onSelectImage(url);
  };

  const confirmSelection = () => {
    if (allowMultiple) {
      onConfirm?.();
    } else {
      onConfirm?.(localSelectedImage);
    }
  };

  const handleOpenAltModal = (imageUrl: string) => {
    setAltEditTarget(imageUrl);
    setAltInputValue(currentImageAlts[imageUrl] || '');
    setShowAltModal(true);
  };

  const handleSaveAlt = () => {
    if (altEditTarget) {
      currentOnUpdateAlt(altEditTarget, altInputValue);
    }
    setShowAltModal(false);
    setAltEditTarget(null);
    setAltInputValue('');
  };

  const handleCancelAlt = () => {
    setShowAltModal(false);
    setAltEditTarget(null);
    setAltInputValue('');
  };

  if (!isOpen) return null;

  return (
    <>
      {typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl h-[80vh] border border-gray-700 flex flex-col" dir="rtl">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                  </svg>
                </button>
              </div>
              
              {/* Upload Button */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z"/>
                  </svg>
                  {uploading ? 'در حال آپلود...' : 'آپلود تصویر جدید'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {allowMultiple && (
                  <div className="text-xs text-gray-300">
                    انتخاب چندگانه فعال است
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
            
            {/* Gallery Content */}
            <div className="p-6 flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <div className="w-8 h-8 border-t-2 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
                    <p>در حال بارگیری...</p>
                  </div>
                </div>
              ) : images.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
                  {images.map((image) => {
                    const isSelected = allowMultiple 
                      ? selectedSet.has(image.url) 
                      : localSelectedImage === image.url;
                    
                    return (
                    <div
                      key={image.id}
                      className={
                        'group relative aspect-square bg-gray-700 rounded-lg overflow-hidden transition-all w-32 h-32 border ' +
                        (isSelected ? 'border-purple-500 ring-2 ring-purple-500/60' : 'border-transparent')
                      }
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error('❌ Image load error:', image.url);
                          // Show placeholder
                          target.style.opacity = '0.3';
                          target.style.backgroundColor = '#374151';
                        }}
                        onLoad={(e) => {
                          console.log('✅ Image loaded:', image.url);
                        }}
                      />
                      
                      {/* Source Badge */}
                      <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 text-white text-xs rounded">
                        {image.source === 'admin' ? 'محصول' : 'بلاگ'}
                      </div>
                      
                      {/* Select Overlay - فقط برای تصاویر انتخاب نشده */}
                      {!isSelected && (
                        <button
                          type="button"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={() => toggleOrSelect(image.url)}
                        >
                          <span className="text-white text-sm font-medium">انتخاب</span>
                        </button>
                      )}
                      
                      {/* Selected Check */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs z-10">
                          ✓
                        </div>
                      )}
                      
                      {/* Deselect Button - برای تصاویر انتخاب شده */}
                      {isSelected && (
                        <button
                          type="button"
                          className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-5"
                          onClick={() => toggleOrSelect(image.url)}
                        >
                          <span className="text-white text-sm font-medium">لغو انتخاب</span>
                        </button>
                      )}
                      
                      {/* Alt Text Edit Button - فقط برای تصاویر انتخاب شده */}
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenAltModal(image.url);
                          }}
                          className="absolute bottom-2 right-2 w-9 h-9 bg-blue-600 hover:bg-blue-700 hover:scale-110 text-white rounded-full transition-all flex items-center justify-center shadow-xl z-30 border-2 border-white/20"
                          title="ویرایش Alt Text"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteImage(image.id, image.source || 'admin');
                        }}
                        className="absolute top-2 left-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs z-10"
                        title="حذف تصویر"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                        </svg>
                      </button>
                    </div>
                  );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                  </svg>
                  <p className="text-lg font-medium mb-2">هیچ تصویری موجود نیست</p>
                  <p className="text-sm text-center">
                    برای شروع، یک تصویر آپلود کنید
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer با دکمه تایید */}
            {onConfirm && (
              <div className="p-4 border-t border-gray-700 flex items-center justify-end gap-3 flex-shrink-0">
                <button 
                  onClick={onClose} 
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  بستن
                </button>
                <button
                  onClick={confirmSelection}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:bg-purple-400"
                  disabled={!allowMultiple && !localSelectedImage}
                >
                  تایید انتخاب
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10001] flex items-center justify-center p-4" dir="rtl">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">حذف تصویر</h3>
                    <p className="text-gray-300 text-sm">آیا مطمئن هستید که می‌خواهید این تصویر را حذف کنید؟</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={cancelDelete} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    لغو
                  </button>
                  <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    حذف
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Alt Text Edit Modal */}
      {showAltModal &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10002] flex items-center justify-center p-4" dir="rtl">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">ویرایش Alt Text تصویر</h3>
                    <p className="text-gray-300 text-sm">متن جایگزین (Alt Text) را برای این تصویر وارد کنید</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Alt Text:
                  </label>
                  <textarea
                    value={altInputValue}
                    onChange={(e) => setAltInputValue(e.target.value)}
                    placeholder="توضیح کوتاهی درباره تصویر وارد کنید..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    dir="rtl"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Alt text به بهبود سئو و دسترسی‌پذیری تصویر کمک می‌کند
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    onClick={handleCancelAlt} 
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    لغو
                  </button>
                  <button 
                    onClick={handleSaveAlt} 
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    ذخیره
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}