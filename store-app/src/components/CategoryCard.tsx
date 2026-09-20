'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getCategoryHubUrl,
  getSubcategoryProductUrl,
} from '@/lib/category-urls';

interface CategoryCardProps {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  featured?: boolean;
  productCount: number;
  subcategoryCount: number;
  subcategories?: { name: string; slug: string }[];
  currentPath?: string; // مسیر فعلی برای ساخت لینک کامل
}

export default function CategoryCard({
  _id,
  name,
  slug,
  description,
  image,
  icon,
  featured,
  productCount,
  subcategoryCount,
  subcategories = [],
  currentPath = ''
}: CategoryCardProps) {
  const categoryUrl = getCategoryHubUrl(currentPath, slug, subcategoryCount);
  const subcategoryUrl = (subSlug: string) =>
    getSubcategoryProductUrl(currentPath, slug, subSlug);

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-500 border border-purple-100 hover:border-purple-300 min-h-[400px]"
    >
      {/* Image Section */}
      <div className="relative w-full h-48 min-h-[192px] overflow-hidden bg-gray-100">
        <Link href={categoryUrl} className="block w-full h-full">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
              <div className="text-8xl opacity-30 filter grayscale group-hover:grayscale-0 transition-all duration-700">
                {icon || '📦'}
              </div>
            </div>
          )}
        </Link>

        {/* Featured Badge */}
        {featured && (
          <span className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 text-center text-sm font-bold text-yellow-900 shadow-lg z-20">
            ⭐ ویژه
          </span>
        )}

        {/* Overlay Effect */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 z-10"></div>
      </div>

      {/* Content Section */}
      <div className="relative bg-white p-4">
        <p className="transition duration-300 text-sm leading-6 font-semibold line-clamp-2 min-h-[48px] pb-2 text-gray-800 group-hover:text-purple-600">
          <Link href={categoryUrl}>
            {name}
          </Link>
        </p>

        {/* Stats */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            {productCount} محصول
          </span>
          {subcategoryCount > 0 && (
            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium">
              {subcategoryCount} زیردسته
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Subcategories */}
        {subcategories && subcategories.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {subcategories.slice(0, 3).map((sub, idx) => (
                <Link
                  key={idx}
                  href={subcategoryUrl(sub.slug)}
                  className="text-xs bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 px-2 py-1 rounded transition-colors"
                >
                  {sub.name}
                </Link>
              ))}
              {subcategoryCount > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{subcategoryCount - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* View Button */}
        <Link
          href={categoryUrl}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-95"
        >
          <span>{subcategoryCount > 0 ? 'مشاهده زیردسته‌ها' : 'مشاهده محصولات'}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

