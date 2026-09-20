'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useURLSettings } from '@/contexts/URLSettingsContext';

interface InstagramSliderProps {
  products: Product[];
}

const InstagramSlider = ({ products }: InstagramSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { generateProductUrl } = useURLSettings();

  // Debug log
  console.log('InstagramSlider received products:', products?.length || 0);

  useEffect(() => {
    if (products && products.length > 0) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % products.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [products?.length]);

  // Handle empty products
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg">هیچ محصولی برای نمایش وجود ندارد</div>
      </div>
    );
  }

  const handleStoryClick = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Stories Navigation */}
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {products.filter(product => product.image && product.image.trim() !== '').map((product, index) => (
          <button
            key={product.id}
            onClick={() => handleStoryClick(index)}
            className={`flex-shrink-0 relative ${
              index === activeIndex ? 'scale-110' : 'scale-100'
            } transition-transform duration-300`}
          >
            <div className={`w-20 h-20 rounded-full p-1 ${
              index === activeIndex 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : 'bg-gray-300'
            } transition-all duration-300`}>
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-1">
                <Image
                  src={product.image!}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
            <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'bg-purple-500 scale-100' 
                : 'bg-gray-300 scale-75'
            }`}></div>
          </button>
        ))}
      </div>

      {/* Active Story Content */}
      <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-3000 ease-linear"
            style={{ width: `${((activeIndex + 1) / products.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-6 lg:space-x-reverse mt-4">
          {products[activeIndex]?.image && (
            <div className="relative group w-full lg:w-auto flex justify-center">
              <Image
                src={products[activeIndex].image}
                alt={products[activeIndex]?.name || 'محصول'}
                width={200}
                height={200}
                className="w-48 h-48 lg:w-52 lg:h-52 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          )}
          
          <div className="flex-1 text-center lg:text-right">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              {products[activeIndex]?.name}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-3 text-sm lg:text-base">
              {products[activeIndex]?.description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-between space-y-3 sm:space-y-0">
              <span className="text-2xl lg:text-3xl font-bold text-purple-600">
                {products[activeIndex]?.price?.toLocaleString('fa-IR')} تومان
              </span>
              <Link 
                href={generateProductUrl(products[activeIndex])}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl inline-block text-sm lg:text-base"
              >
                مشاهده محصول
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramSlider;
