'use client';

import Link from 'next/link';
import { Category } from '@/types';

interface AnimatedCategoriesProps {
  categories: Category[];
}

const AnimatedCategories = ({ categories }: AnimatedCategoriesProps) => {
  const getCategoryIcon = (categoryName: string) => {
    const icons: { [key: string]: string } = {
      Electronics: "📱",
      Clothing: "👔", 
      Home: "🏠",
      Sports: "⚽",
      Books: "📚",
      Beauty: "💄",
      Toys: "🧸",
      Automotive: "🚗",
      "الکترونیک": "📱",
      "پوشاک": "👔", 
      "خانه و آشپزخانه": "🏠",
      "ورزش": "⚽",
      "کتاب": "📚",
      "زیبایی": "💄",
      "اسباب‌بازی": "🧸",
      "خودرو": "🚗"
    };
    return icons[categoryName] || "🛍️";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/products/${category.slug || category.id}`}
          className="group relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-700 hover:scale-110 hover:-rotate-1 hover:shadow-2xl hover:shadow-purple-500/25 block animate-fade-in-up bg-gradient-to-br from-white to-gray-50 hover:from-purple-50 hover:to-pink-50"
          style={{ 
            animationDelay: `${index * 150}ms`,
            animationFillMode: 'both'
          }}
        >
          <div className="p-6 h-full transition-all duration-700 relative text-gray-800 flex flex-col justify-center items-center text-center min-h-[160px]">
            {/* Sparkle Effects */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute top-2 left-2 w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-100"></div>
              <div className="absolute bottom-6 left-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-200"></div>
              <div className="absolute bottom-3 right-3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-300"></div>
            </div>

            {/* Category Icon */}
            <div className="text-4xl mb-4 transition-all duration-500 transform relative z-10 group-hover:scale-125 group-hover:rotate-6 group-hover:animate-pulse">
              <span className="inline-block transition-all duration-500 group-hover:drop-shadow-lg">
                {getCategoryIcon(category.name)}
              </span>
            </div>

            {/* Category Name */}
            <h3 className="font-bold text-lg mb-2 transition-all duration-500 transform relative z-10 text-gray-800 group-hover:text-purple-600 group-hover:scale-105">
              <span className="inline-block transition-all duration-500 group-hover:translate-y-[-2px]">
                {category.name}
              </span>
            </h3>

            {/* Product Count */}
            <p className="text-sm transition-all duration-500 transform relative z-10 text-gray-500 group-hover:text-purple-500">
              <span className="inline-block transition-all duration-500 group-hover:translate-x-1">
                {(category as any).productCount || (category as any)._count?.products || 0} محصول
              </span>
            </p>

            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 transition-all duration-500 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100"></div>

            {/* Animated Border */}
            <div className="absolute inset-0 border-2 rounded-2xl transition-all duration-500 border-transparent group-hover:border-purple-300 group-hover:shadow-inner"></div>

            {/* Floating Particles */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400/30 rounded-full animate-float"></div>
              <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-float-delay"></div>
              <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-blue-400/30 rounded-full animate-float-slow"></div>
            </div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-500 delay-100 animate-pulse"></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-500 delay-200"></div>
        </Link>
      ))}
      </div>
    </div>
  );
};

export default AnimatedCategories;