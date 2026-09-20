'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  selectedImage: string;
  onImageSelect: (imageUrl: string) => void;
  className?: string;
}

interface ImageItem {
  name: string;
  url: string;
  path: string;
}

export default function BlogImageGallery({ selectedImage, onImageSelect, className = '' }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images from server
  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blog/images');
      const data = await response.json();
      
      if (data.success) {
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Upload new image
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/blog/images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setImages(prev => [data.image, ...prev]);
        onImageSelect(data.image.url);
      } else {
        alert('خطا در آپلود تصویر: ' + data.error);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('خطا در آپلود تصویر');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete image
  const handleDeleteImage = async (image: ImageItem) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این تصویر را حذف کنید؟')) return;

    try {
      const response = await fetch(`/api/blog/images?filename=${image.name}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setImages(prev => prev.filter(img => img.name !== image.name));
        if (selectedImage === image.url) {
          onImageSelect('');
        }
      } else {
        alert('خطا در حذف تصویر: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('خطا در حذف تصویر');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  return (
    <div className={className}>
      {/* Selected Image Preview */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          تصویر شاخص *
        </label>
        
        <div 
          onClick={() => setIsOpen(true)}
          className="relative w-full h-80 sm:h-96 md:h-[28rem] lg:h-[32rem] bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors group"
        >
          {selectedImage ? (
            <div className="relative w-full h-full">
              <Image
                src={selectedImage}
                alt="تصویر شاخص"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 800px, 1000px"
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-purple-400 transition-colors">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-lg sm:text-xl font-medium">انتخاب تصویر شاخص</span>
              <span className="text-sm text-gray-500 mt-2">برای مشاهده گالری کلیک کنید</span>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
              <h3 className="text-lg sm:text-xl font-bold text-white">گالری تصاویر</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Upload Section */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm sm:text-base font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {uploading ? 'در حال آپلود...' : 'آپلود تصویر جدید'}
              </button>
            </div>

            {/* Images Grid */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>هیچ تصویری یافت نشد</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
                  {images.map((image) => (
                    <div key={image.name} className="group relative">
                      <div 
                        className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === image.url 
                            ? 'border-purple-500 ring-2 ring-purple-500/50' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => {
                          onImageSelect(image.url);
                          setIsOpen(false);
                        }}
                      >
                        <Image
                          src={image.url}
                          alt={image.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                          className="object-cover"
                        />
                        
                        {/* Selected Indicator */}
                        {selectedImage === image.url && (
                          <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(image);
                            }}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Image Name */}
                      <p className="text-sm text-gray-300 mt-3 truncate font-medium">{image.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}