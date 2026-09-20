'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category?: string;
  categorySlug?: string;
  rating?: number;
  reviewCount?: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface CategoryProductsViewProps {
  category: Category;
  products: Product[];
  slug: string;
}

const CategoryProductsView: React.FC<CategoryProductsViewProps> = ({ category, products, slug }) => {
  const [sortBy, setSortBy] = useState('newest');
  const [sortedProducts, setSortedProducts] = useState(products);

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
        sorted = [...products];
        break;
    }

    setSortedProducts(sorted);
  };

  React.useEffect(() => {
    setSortedProducts(products);
  }, [products]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {category.image && (
            <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-6">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1 className="text-4xl font-bold text-white mb-2">{category.name}</h1>
                {category.description && (
                  <p className="text-gray-200">{category.description}</p>
                )}
              </div>
            </div>
          )}

          {!category.image && (
            <>
              <h1 className="text-4xl font-bold text-white mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-gray-300">{category.description}</p>
              )}
            </>
          )}

          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 space-x-reverse text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              خانه
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-white transition-colors">
              محصولات
            </Link>
            <span>/</span>
            <span className="text-white">{category.name}</span>
          </nav>

          {/* تعداد محصولات و مرتب‌سازی */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-500/20">
            <div className="text-white">
              <span className="font-bold">{sortedProducts.length}</span> محصول یافت شد
            </div>

            <div className="flex items-center gap-4">
              <label className="text-gray-300">مرتب‌سازی:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:outline-none focus:border-purple-400"
              >
                <option value="newest">جدیدترین</option>
                <option value="price-low">ارزان‌ترین</option>
                <option value="price-high">گران‌ترین</option>
                <option value="name">نام (الفبا)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* محصولات */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product, index) => {
              const productImage = product.images?.[0] || product.image || '/images/products/placeholder.svg';
              
              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/products/${product.slug || product._id}`}>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
                      {/* تصویر محصول */}
                      <div className="relative h-64 w-full bg-slate-800">
                        <Image
                          src={productImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* اطلاعات محصول */}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                          {product.name}
                        </h3>

                        {/* قیمت */}
                        <div className="flex items-center justify-between">
                          <div className="text-xl font-bold text-purple-400">
                            {product.price.toLocaleString('fa-IR')} تومان
                          </div>
                        </div>

                        {/* رتبه و نظرات */}
                        {product.rating && product.rating > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(product.rating || 0)
                                      ? 'text-yellow-400'
                                      : 'text-gray-600'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            {product.reviewCount && product.reviewCount > 0 && (
                              <span className="text-xs text-gray-400">
                                ({product.reviewCount.toLocaleString('fa-IR')} نظر)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-gray-400 mb-6">
              <svg
                className="w-24 h-24 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              محصولی در این دسته‌بندی یافت نشد
            </h3>
            <p className="text-gray-400 mb-8">
              به زودی محصولات جدید اضافه خواهند شد
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200"
            >
              مشاهده همه محصولات
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CategoryProductsView;
