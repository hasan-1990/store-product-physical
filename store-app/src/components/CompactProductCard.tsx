'use client';

import OptimizedImage from './OptimizedImage';
import Link from 'next/link';
import { useState } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { useURLSettings } from '@/contexts/URLSettingsContext';

export interface Product {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  reviewsCount?: number;
  category?: string | {
    id?: string;
    _id?: string;
    name: string;
    slug?: string;
  };
  isOnSale?: boolean;
  stock?: number;
  soldCount?: number; // تعداد فروش
}

interface CompactProductCardProps {
  product: Product;
  className?: string;
  onAddToCart?: (productId: string) => void;
  isAddingToCart?: boolean;
}

const CompactProductCard = ({ product, className = '', onAddToCart, isAddingToCart: externalLoading }: CompactProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCartContext();
  const { generateProductUrl } = useURLSettings();
  
  // Use external loading state if provided, otherwise use internal state
  const isLoading = externalLoading || isAdding;
  
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  
  // اگر soldCount نباشد، یک عدد تصادفی برای نمایش (فقط برای تست)
  const displaySoldCount = product.soldCount ?? Math.floor(Math.random() * 500) + 10;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // استفاده از _id برای سبد خرید (نه id که ممکنه sequentialId باشه)
    const productId = product._id || product.id;
    console.log('🛒 Product data:', { 
      _id: product._id,
      id: product.id,
      using: productId,
      fullProduct: product 
    });
    
    if (!productId) {
      console.error('❌ Product ID not found in product:', product);
      return;
    }
    
    // Ensure productId is a string
    const productIdStr = String(productId);
    console.log('🛒 Adding product to cart (string):', productIdStr, 'Type:', typeof productIdStr);
    
    setIsAdding(true);
    try {
      // Use CartContext for automatic event triggering
      const result = await addToCart(productIdStr, 1);
      
      if (result.success) {
        console.log('✅ محصول با موفقیت اضافه شد');
      } else {
        console.error('❌ خطا در اضافه کردن:', result.error);
      }
      
      // Still call the callback if provided for backward compatibility
      if (onAddToCart) {
        await onAddToCart(productIdStr);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={`relative flex w-full flex-col overflow-hidden bg-white border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition-all duration-200 min-h-[280px] ${className}`}>
      <Link href={generateProductUrl(product)} className="relative flex h-36 sm:h-40 min-h-[144px] sm:min-h-[160px] overflow-hidden bg-gray-50 rounded-t-lg">
        <OptimizedImage
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105 rounded-t-lg"
          src={product.imageUrl || product.image || '/placeholder.svg'}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          decoding="async"
        />
        {(product.isOnSale || discountPercentage > 0) && (
          <span className="absolute top-0 left-0 rounded-full bg-orange-500 px-1 py-0.5 text-xs font-bold text-white">
            -{discountPercentage}%
          </span>
        )}
        
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-1.5 py-0.5 rounded text-xs font-bold">
              ناموجود
            </span>
          </div>
        )}
      </Link>
      
      <div className="p-1.5 flex flex-col justify-between flex-1">
        <div>
          <Link href={generateProductUrl(product)}>
            <h5 className="text-sm font-medium text-slate-900 hover:text-orange-600 transition-colors duration-200 line-clamp-2 mb-1.5">
              {product.name}
            </h5>
          </Link>
          
          <div className="flex flex-col gap-1">
            {/* ردیف قیمت و آیکون سبد خرید */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-base font-bold text-orange-600">
                  {product.price.toLocaleString('fa-IR')} تومان
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-gray-500 line-through">
                    {product.originalPrice.toLocaleString('fa-IR')} تومان
                  </span>
                )}
              </div>
              
              {/* آیکون سبد خرید با تعداد فروش - سمت چپ */}
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-1.5 py-0.5 rounded-lg border border-blue-200/50 shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                <span className="text-[10px] font-bold">
                  {displaySoldCount.toLocaleString('fa-IR')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isLoading}
          className={`mt-2 w-full py-2 px-2 text-sm font-medium rounded transition-all duration-300 ${
            product.stock === 0 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isLoading
              ? 'bg-yellow-400 text-yellow-800 cursor-wait'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {product.stock === 0 
            ? 'ناموجود' 
            : isLoading 
            ? '...' 
            : 'افزودن به سبد'
          }
        </button>
      </div>
    </div>
  );
};

export default CompactProductCard;