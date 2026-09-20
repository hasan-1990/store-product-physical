'use client';
import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import { AdvancedSchemaGenerator } from '@/lib/advanced-schema';

interface BreadcrumbItem {
  name: string;
  url?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
  separator?: 'chevron' | 'slash' | 'arrow';
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  showHome = true, 
  className = '',
  separator = 'chevron'
}) => {
  // تولید Schema Markup
  const schemaData = AdvancedSchemaGenerator.generateBreadcrumbSchema(items);

  const getSeparator = () => {
    switch (separator) {
      case 'slash':
        return <span className="text-gray-400 mx-2">/</span>;
      case 'arrow':
        return <span className="text-gray-400 mx-2">→</span>;
      case 'chevron':
      default:
        return <ChevronLeftIcon className="w-4 h-4 text-gray-400 mx-1" />;
    }
  };

  const allItems = showHome 
    ? [{ name: 'خانه', url: '/' }, ...items]
    : items;

  return (
    <>
      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData)
        }}
      />
      
      {/* Breadcrumb UI */}
      <nav 
        className={`flex items-center space-x-1 space-x-reverse text-sm ${className}`}
        aria-label="مسیر صفحه"
      >
        <ol className="flex items-center space-x-1 space-x-reverse">
          {allItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && getSeparator()}
              
              {item.url && !item.current ? (
                <Link
                  href={item.url}
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
                >
                  {index === 0 && showHome && (
                    <HomeIcon className="w-4 h-4 ml-1" />
                  )}
                  {item.name}
                </Link>
              ) : (
                <span 
                  className={`${
                    item.current 
                      ? 'text-gray-700 font-medium' 
                      : 'text-gray-500'
                  } flex items-center`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {index === 0 && showHome && (
                    <HomeIcon className="w-4 h-4 ml-1" />
                  )}
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

// Hook برای استفاده آسان‌تر در صفحات
export const useBreadcrumb = () => {
  const addBreadcrumb = React.useCallback((items: BreadcrumbItem[]) => {
    // می‌تونه در آینده با context یا state management استفاده بشه
    return items;
  }, []);

  return { addBreadcrumb };
};

// مثال‌هایی از کاربرد
export const BreadcrumbExamples = {
  // صفحه محصول
  product: (categoryName: string, productName: string) => [
    { name: 'محصولات', url: '/products' },
    { name: categoryName, url: `/products/${categoryName}` },
    { name: productName, current: true }
  ],

  // صفحه دسته‌بندی
  category: (categoryName: string) => [
    { name: 'محصولات', url: '/products' },
    { name: categoryName, current: true }
  ],

  // صفحه بلاگ
  blogPost: (postTitle: string) => [
    { name: 'بلاگ', url: '/blog' },
    { name: postTitle, current: true }
  ],

  // صفحه حساب کاربری
  account: (section: string) => [
    { name: 'حساب کاربری', url: '/account' },
    { name: section, current: true }
  ]
};

export default Breadcrumb;