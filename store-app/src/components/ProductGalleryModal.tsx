'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useImageGallery } from '@/contexts/ImageGalleryContext';

type ImageSource = 'admin' | 'blog';

interface ProductGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  source?: ImageSource;

  allowMultiple?: boolean;

  selectedImage?: string;
  selectedImages?: string[];

  onSelectImage?: (url: string) => void;
  onSelectImages?: (urls: string[]) => void;

  onConfirm?: (selectedImage?: string) => void;
}

export default function ProductGalleryModal({
  isOpen,
  onClose,
  title = 'انتخاب تصویر',
  source = 'admin',
  allowMultiple = false,
  selectedImage,
  selectedImages,
  onSelectImage,
  onSelectImages,
  onConfirm
}: ProductGalleryModalProps) {
  const { images, uploadImage, deleteImage, isLoading, error } = useImageGallery();

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localSelectedImage, setLocalSelectedImage] = useState<string>('');
  const [localSelectedImages, setLocalSelectedImages] = useState<string[]>([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; source: ImageSource } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLocalSelectedImage(selectedImage || '');
    setLocalSelectedImages(Array.isArray(selectedImages) ? [...selectedImages] : []);
  }, [isOpen, selectedImage, selectedImages]);

  const selectedSet = useMemo(() => new Set(localSelectedImages), [localSelectedImages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadImage(file, source);
      if (event.target) event.target.value = '';
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = (imageId: string, imageSource: ImageSource) => {
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
    onSelectImage?.(url);
  };

  const confirmSelection = () => {
    if (allowMultiple) {
      onConfirm?.();
      return;
    }

    onConfirm?.(localSelectedImage);
  };

  if (!isOpen) return null;

  return (
    <>
      {typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl h-[80vh] border border-gray-700 flex flex-col" dir="rtl">
              <div className="p-6 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="بستن">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z" />
                    </svg>
                    {uploading ? 'در حال آپلود...' : 'آپلود تصویر جدید'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                  <div className="text-xs text-gray-300">
                    {allowMultiple ? 'انتخاب چندگانه فعال است' : 'برای انتخاب روی تصویر کلیک کنید'}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <div className="w-8 h-8 border-t-2 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-2" />
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
                              target.style.opacity = '0.3';
                              target.style.backgroundColor = '#374151';
                            }}
                          />

                          <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 text-white text-xs rounded">
                            {image.source === 'admin' ? 'محصول' : 'بلاگ'}
                          </div>

                          {/* Select Overlay */}
                          <button
                            type="button"
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            onClick={() => toggleOrSelect(image.url)}
                            aria-label="انتخاب"
                          >
                            <span className="text-white text-sm font-medium">انتخاب</span>
                          </button>

                          {/* Selected Check */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs z-10">
                              ✓
                            </div>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteImage(image.id, (image.source || 'admin') as ImageSource);
                            }}
                            className="absolute top-2 left-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs z-10"
                            title="حذف تصویر"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">هیچ تصویری موجود نیست</p>
                    <p className="text-sm text-center">برای شروع، یک تصویر آپلود کنید</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-700 flex items-center justify-end gap-3 flex-shrink-0">
                <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
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
    </>
  );
}
