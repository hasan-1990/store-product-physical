'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[];
  image?: string;
  category?: any;
  rating?: number;
  reviewCount?: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  imageAlt?: string;
  productCount?: number;
  subcategoryCount?: number;
  categoryPath?: Array<{slug: string, name: string}>;
}

interface CategoryClientProps {
  category: Category;
  products: Product[];
  subcategories?: Category[];
  slug: string;
}

const CategoryClient: React.FC<CategoryClientProps> = ({ category, products, subcategories = [], slug }) => {
  const [sortBy, setSortBy] = useState('newest');
  const [sortedProducts, setSortedProducts] = useState(products);

  // تشخیص اینکه باید زیردسته نمایش داده شود یا محصولات
  const hasSubcategories = subcategories && subcategories.length > 0;
  const shouldShowProducts = !hasSubcategories && products.length > 0;

  // مرتب‌سازی محصولات
  const handleSort = (sortType: string) => {
    setSortBy(sortType);
    let sorted = [...products];

    switch (sortType) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
        break;
      case 'newest':
      default:
        // ترتیب پیش‌فرض
        sorted = [...products];
        break;
    }

    setSortedProducts(sorted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section - More Compact */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-base md:text-lg text-purple-100 mb-6">
                {category.description}
              </p>
            )}
            
            {/* Breadcrumb */}
            <nav className="flex justify-center items-center space-x-2 space-x-reverse text-sm">
              <Link 
                href="/" 
                className="text-purple-200 hover:text-white transition-colors"
              >
                خانه
              </Link>
              <span className="text-purple-300">/</span>
              <Link 
                href="/categories" 
                className="text-purple-200 hover:text-white transition-colors"
              >
                دسته‌بندی‌ها
              </Link>
              <span className="text-purple-300">/</span>
              <span className="text-white font-semibold">{category.name}</span>
            </nav>
          </div>
        </div>
        
        {/* Wave Divider - Smaller */}
        <div className="relative h-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <svg 
            className="absolute bottom-0 w-full h-6 text-purple-600" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
            style={{ transform: 'rotate(180deg)' }}
          >
            <path 
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
              fill="currentColor"
            ></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Compact Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-purple-100/50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {hasSubcategories ? subcategories.length : products.length}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {hasSubcategories ? 'زیردسته' : 'محصول'}
              </span>
            </div>
            
            {hasSubcategories && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {subcategories.reduce((sum, cat) => sum + ((cat as any).productCount || 0), 0)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700">محصول کل</span>
              </div>
            )}
          </div>
          
          {shouldShowProducts && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="bg-transparent text-gray-800 text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="newest">جدیدترین</option>
                <option value="price-low">ارزان‌ترین</option>
                <option value="price-high">گران‌ترین</option>
                <option value="name">الفبا</option>
              </select>
            </div>
          )}
        </div>

        {/* زیردسته‌بندی‌ها - Modern Compact Design */}
        {hasSubcategories ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {subcategories.map((subcat, index) => {
              // ساخت URL با استفاده از categoryPath
              const subcatUrl = subcat.categoryPath && subcat.categoryPath.length > 0
                ? `/products/${subcat.categoryPath.map(c => c.slug).join('/')}`
                : `/products/${subcat.slug}`;
              
              return (
                <Link
                  key={subcat._id}
                  href={subcatUrl}
                  className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                >
                {/* Compact Image Area */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
                  {(subcat.image || (subcat as any).imageUrl) ? (
                    <Image
                      src={(subcat as any).imageUrl || subcat.image || ''}
                      alt={(subcat as any).imageAlt || subcat.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl opacity-20 group-hover:opacity-30 transition-opacity">
                        📦
                      </div>
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                  {/* Floating Badge */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {(subcat as any).productCount !== undefined && (
                      <span className="text-xs bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-purple-700 font-bold shadow-md">
                        {(subcat as any).productCount} محصول
                      </span>
                    )}
                    {(subcat as any).subcategoryCount !== undefined && (subcat as any).subcategoryCount > 0 && (
                      <span className="text-xs bg-purple-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-white font-bold shadow-md">
                        {(subcat as any).subcategoryCount}+
                      </span>
                    )}
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-base font-bold text-white drop-shadow-lg line-clamp-1">
                      {subcat.name}
                    </h3>
                  </div>
                </div>

                {/* Compact Body */}
                <div className="p-4 flex flex-col flex-grow">
                  {subcat.description && (
                    <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">
                      {subcat.description}
                    </p>
                  )}
                  
                  {/* CTA Button */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-600 text-white py-2.5 rounded-xl transition-all shadow-md group-hover:shadow-lg">
                      <span className="text-sm font-bold">مشاهده</span>
                      <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        ) : shouldShowProducts ? (
          // محصولات - Compact Modern Cards
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedProducts.map((product, index) => {
              const productImage = product.images?.[0] || product.image || '/images/products/placeholder.svg';
              
              return (
                <Link
                  key={product._id}
                  href={`/products/${product.slug || product._id}`}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  {/* Compact Product Image */}
                  <div className="relative h-44 overflow-hidden bg-gray-50">
                    <Image
                      src={productImage}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    
                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-sm font-bold text-purple-600">مشاهده</span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Product Info */}
                  <div className="p-3 flex flex-col flex-grow">
                    <h3 className="text-sm font-bold text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="mt-auto">
                      <div className="text-lg font-bold text-purple-600 mb-2">
                        {product.price.toLocaleString('fa-IR')}
                        <span className="text-xs font-normal text-gray-500 mr-1">تومان</span>
                      </div>

                      {/* Compact Rating */}
                      {product.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          <div className="flex items-center">
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
                          {product.reviewCount && product.reviewCount > 0 && (
                            <span className="text-[10px] text-gray-500">
                              ({product.reviewCount})
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Mini CTA */}
                      <div className="flex items-center justify-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-600 text-white py-2 rounded-lg transition-all text-xs font-bold">
                        <span>خرید</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="max-w-md mx-auto text-center py-20">
            <div className="text-8xl mb-6">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              هنوز محصولی وجود ندارد
            </h2>
            <p className="text-gray-600 mb-8">
              در حال حاضر محصولی در این دسته‌بندی موجود نیست
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              مشاهده همه محصولات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryClient;
