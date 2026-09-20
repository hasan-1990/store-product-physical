'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  href: string;
  subcategories?: Category[];
}

interface CategoryMenuProps {
  categories: Category[];
  className?: string;
}

const CategoryMenu = ({ categories, className = '' }: CategoryMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className={`relative ${className}`}>
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-8 space-x-reverse">
              <span className="text-sm font-medium">دسته‌بندی‌ها:</span>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    href={category.href}
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center"
                  >
                    {category.name}
                    {category.subcategories && category.subcategories.length > 0 && (
                      <svg 
                        className="mr-1 h-4 w-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 9l-7 7-7-7" 
                        />
                      </svg>
                    )}
                  </Link>

                  {/* Dropdown Menu */}
                  {category.subcategories && 
                   category.subcategories.length > 0 && 
                   activeCategory === category.id && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        {category.subcategories.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={subcategory.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View All Categories Link */}
            <Link
              href="/products"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              ← مشاهده همه
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CategoryMenu;
