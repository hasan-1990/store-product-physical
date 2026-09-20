'use client';

import React, { useState, useEffect } from 'react';
import MultipleDiscountSectionsClient from './MultipleDiscountSectionsClient';

interface DiscountSection {
  id: string;
  title: string;
  subtitle: string;
  active: boolean;
  maxProducts: number;
  showDiscountBadge: boolean;
  position: string;
  productType: 'newest' | 'latest' | 'random' | 'manual';
  selectedCategories: string[];
  order: number;
}

interface Product {
  id: string;
  sequentialId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercentage: number;
  imageUrl: string;
  slug: string;
  category?: string;
  sectionId?: string;
}

interface MultipleDiscountSectionsFallbackProps {
  position?: string;
}

export default function MultipleDiscountSectionsFallback({ position = 'home-top' }: MultipleDiscountSectionsFallbackProps) {
  const [data, setData] = useState<{sections: DiscountSection[], products: Product[]}>({ sections: [], products: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the API route to get data
        const response = await fetch(`/api/discount-sections-with-products?position=${position}`);
        const result = await response.json();
        
        if (result.success) {
          setData({
            sections: result.sections || [],
            products: result.products || []
          });
        }
      } catch (error) {
        console.error('Error fetching discount sections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="py-12 bg-gradient-to-b from-gray-50 to-white rounded-2xl shadow-sm">
              <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    محصولات تخفیفی جدید
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                      مشاهده همه
                    </span>
                  </div>
                </div>

                {/* Products Grid Placeholder */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col h-[320px] w-full rounded-3xl bg-white overflow-hidden shadow-sm border border-gray-100">
                      {/* Image Placeholder */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 p-3">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-200 animate-pulse">
                          {/* Discount Badge Placeholder */}
                          <div className="absolute top-2 left-2 z-10">
                            <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                              <span className="drop-shadow-sm">25% تخفیف</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Product Info Placeholder */}
                      <div className="flex-1 flex flex-col justify-between p-4 bg-white min-h-[120px]">
                        {/* Product Name Placeholder */}
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </div>
                        
                        {/* Divider */}
                        <div className="border-t border-gray-100 mb-3 mt-3"></div>
                        
                        {/* Price Placeholder */}
                        <div className="mb-3">
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse mb-1"></div>
                          <div className="h-4 bg-red-200 rounded w-2/3 animate-pulse"></div>
                        </div>
                        
                        {/* Action Hint Placeholder */}
                        <div className="border-t border-gray-100 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                            <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data.sections.length === 0) {
    return null;
  }

  return (
    <MultipleDiscountSectionsClient 
      sections={data.sections}
      products={data.products}
      position={position}
    />
  );
}