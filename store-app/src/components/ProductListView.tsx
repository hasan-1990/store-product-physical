'use client';

import OptimizedImage from './OptimizedImage';
import Link from 'next/link';
import { Product } from '@/types';
import { useURLSettings } from '@/contexts/URLSettingsContext';

export type ViewMode = 'list' | 'grid' | 'compact';

interface ProductListViewProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  viewMode?: ViewMode;
}

const ProductListView = ({ products, title, subtitle, viewMode = 'list' }: ProductListViewProps) => {
  const { generateProductUrl } = useURLSettings();
  
  // Handle empty products
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg">هیچ محصولی برای نمایش وجود ندارد</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
      )}
      
      {viewMode === 'list' && (
        <div className="space-y-4">
          {products.filter(product => product.image && product.image.trim() !== '').map((product) => (
            <div 
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-4 group"
            >
              <div className="flex items-center space-x-4 space-x-reverse">
                {/* Product Image */}
                <div className="relative flex-shrink-0">
                  <OptimizedImage
                    src={product.image!}
                    alt={product.name}
                    enhancedAlt={`${typeof product.category === 'object' ? product.category?.name : product.category || ''}`}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover group-hover:scale-110 transition-transform duration-300"
                    decoding="async"
                  />
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      تخفیف
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors duration-200">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {product.description}
                  </p>
                  
                  {/* Category */}
                  <div className="text-xs text-gray-500 mb-2">
                    دسته‌بندی: {typeof product.category === 'object' ? product.category?.name : product.category}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 space-x-reverse mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">({product.reviewsCount} نظر)</span>
                  </div>
                </div>

                {/* Price and Action */}
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-left">
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="text-sm text-gray-400 line-through">
                        {product.originalPrice.toLocaleString('fa-IR')} تومان
                      </div>
                    )}
                    <div className="text-lg font-bold text-purple-600">
                      {product.price.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                  
                  <Link 
                    href={generateProductUrl(product)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    مشاهده محصول
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {products.filter(product => product.image && product.image.trim() !== '').map((product) => (
            <div 
              key={product.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              {/* Product Image */}
              <div className="relative">
                <OptimizedImage
                  src={product.image!}
                  alt={product.name}
                  enhancedAlt={`${typeof product.category === 'object' ? product.category?.name : product.category} | فروشگاه آنلاین`}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  decoding="async"
                />
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    تخفیف
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-200 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {product.description}
                </p>
                
                {/* Rating */}
                <div className="flex items-center space-x-1 space-x-reverse mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">({product.reviewsCount})</span>
                </div>

                {/* Price and Action */}
                <div className="flex flex-col space-y-3">
                  <div className="text-center">
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="text-sm text-gray-400 line-through">
                        {product.originalPrice.toLocaleString('fa-IR')} تومان
                      </div>
                    )}
                    <div className="text-lg font-bold text-purple-600">
                      {product.price.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                  
                  <Link 
                    href={generateProductUrl(product)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-center block"
                  >
                    مشاهده محصول
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'compact' && (
        <div className="space-y-2">
          {products.filter(product => product.image && product.image.trim() !== '').map((product) => (
            <div 
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-3 group"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                {/* Product Image */}
                <div className="relative flex-shrink-0">
                  <OptimizedImage
                    src={product.image!}
                    alt={product.name}
                    enhancedAlt={`${typeof product.category === 'object' ? product.category?.name : product.category} | خرید سریع`}
                    width={50}
                    height={50}
                    className="rounded-md object-cover group-hover:scale-110 transition-transform duration-300"
                    decoding="async"
                  />
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                      %
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-500">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(product.rating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span>({product.reviewsCount})</span>
                  </div>
                </div>

                {/* Price and Action */}
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="text-right">
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="text-xs text-gray-400 line-through">
                        {product.originalPrice.toLocaleString('fa-IR')}
                      </div>
                    )}
                    <div className="text-sm font-bold text-purple-600">
                      {product.price.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                  
                  <Link 
                    href={generateProductUrl(product)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-1.5 rounded-md text-xs font-medium transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    مشاهده
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductListView;
