'use client';

import React, { useState } from 'react';
import { SharedImageGallery } from '@/components';

export default function ExampleUsage() {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageAlts, setImageAlts] = useState<Record<string, string>>({});

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowGallery(false);
  };

  const handleUpdateAlt = (imageUrl: string, altText: string) => {
    setImageAlts(prev => ({
      ...prev,
      [imageUrl]: altText
    }));
    console.log('Alt text updated:', { imageUrl, altText });
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen" dir="rtl">
      <h1 className="text-2xl font-bold text-white mb-6">نمونه استفاده از گالری مشترک</h1>
      
      {/* برای بخش محصولات */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-4">بخش محصولات</h2>
        <button
          onClick={() => setShowGallery(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          انتخاب تصویر محصول
        </button>
        
        {selectedImage && (
          <div className="mt-4">
            <p className="text-gray-300 mb-2">تصویر انتخاب شده:</p>
            <img 
              src={selectedImage} 
              alt={imageAlts[selectedImage] || 'Selected'} 
              className="w-32 h-32 object-cover rounded-lg border-2 border-purple-500"
            />
            {imageAlts[selectedImage] && (
              <div className="mt-2 p-2 bg-gray-700 rounded">
                <p className="text-sm text-gray-400">Alt Text:</p>
                <p className="text-white">{imageAlts[selectedImage]}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* گالری مشترک با قابلیت Alt Text */}
      <SharedImageGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelectImage={handleSelectImage}
        title="انتخاب تصویر"
        source="admin" // برای محصولات از 'admin' استفاده کنید، برای بلاگ از 'blog'
        imageAlts={imageAlts}
        onUpdateAlt={handleUpdateAlt}
      />
    </div>
  );
}