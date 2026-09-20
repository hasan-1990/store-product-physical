'use client';

import React from 'react';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';
import { Product } from '@/types';
import { generateProductUrl } from '@/lib/url-client';

interface ProductCardProps {
  product: Product | any; // Allow flexible product type for compatibility
  isTransitioning?: boolean;
  className?: string;
  onAddToCart?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isTransitioning = false,
  className = "",
  onAddToCart
}) => {
  const productUrl = generateProductUrl(product);
  
  // Debug: بررسی URL تولید شده
  if (typeof window !== 'undefined') {
    console.log('🔗 Product URL:', productUrl, '| Product:', {
      id: product.id,
      sequentialId: product.sequentialId,
      slug: product.slug,
      categoryPath: product.categoryPath
    });
  }

  return (
    <div
      className={`
        group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl
        transition-all duration-500 border border-purple-100 hover:border-purple-300
        min-h-[400px]
        ${isTransitioning ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}
        ${className}
      `}
    >
      {/* Image Section */}
      <div className="relative w-full h-48 min-h-[192px] overflow-hidden bg-gray-100">
        <Link
          href={productUrl}
          className="block w-full h-full"
        >
          <OptimizedImage
            className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
            src={product.imageUrl || product.image || '/placeholder.svg'}
            alt={product.name}
            enhancedAlt={`${typeof product.category === 'object' ? product.category?.name : product.category || ''} | خرید آنلاین با تخفیف ویژه و ارسال رایگان`}
            width={300}
            height={256}
            decoding="async"
          />
        </Link>

        {(product.isOnSale || (product.originalPrice && product.price < (product.originalPrice || 0))) && (
          <span className="absolute top-4 right-4 rounded-full bg-red-500 px-3 py-1 text-center text-sm font-bold text-white shadow-lg z-20">
            {product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0}%
          </span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20">
            <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold text-base shadow-2xl">
              ناموجود
            </span>
          </div>
        )}

        {/* Overlay Effect */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 z-10"></div>
      </div>

      {/* Content Section */}
      <div className="relative bg-white p-4">
        <p className="transition duration-300 text-sm leading-6 font-semibold line-clamp-2 min-h-[48px] pb-2 text-gray-800 group-hover:text-purple-600">
          <Link href={productUrl}>
            {product.name}
          </Link>
        </p>

        <div className="flex w-full items-end justify-between pb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-start gap-1">
              <span className="transition duration-300 text-lg leading-6 font-bold text-purple-600">
                {product.price.toLocaleString('fa-IR')}
              </span>
              <span className="transition duration-300 text-xs text-gray-600">تومان</span>
            </div>
            {product.originalPrice && product.originalPrice !== product.price && (
              <span className="text-xs text-gray-400 line-through">
                {product.originalPrice.toLocaleString('fa-IR')} تومان
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3.5">
            {product.rating && (
              <div className="flex items-center justify-center gap-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full px-2 py-1 border border-purple-200">
                <span className="transition duration-300 text-xs leading-5 font-bold text-purple-600">
                  {product.rating.toFixed(1)}
                </span>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className="text-purple-400" height="14" width="14">
                  <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Buttons - Slide up on hover */}
        <div className="flex items-center justify-center w-full gap-2 p-0 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
          <Link
            href={productUrl}
            className="h-[40px] flex-1"
          >
            <button className="cursor-pointer flex items-center justify-center gap-2 rounded-lg focus:outline-none bg-gradient-to-r from-purple-50 to-pink-50 h-full w-full p-0 text-xs font-bold text-purple-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-purple-200 hover:border-purple-300">
              <div className="flex items-center justify-center">👁️ پیش‌نمایش</div>
            </button>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onAddToCart) onAddToCart(product.id);
            }}
            disabled={product.stock === 0}
            className="font-semibold cursor-pointer flex items-center justify-center rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none gap-2 hover:from-purple-700 hover:to-pink-700 h-[40px] flex-1 bg-gradient-to-r from-purple-600 to-pink-600 p-0 text-xs text-white disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400"
          >
            <div className="flex items-center justify-center">🛒 افزودن</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
