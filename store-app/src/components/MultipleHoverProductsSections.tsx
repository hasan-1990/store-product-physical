'use client';

import React, { useState, useEffect } from 'react';
import ModernHoverProductsSection from './ModernHoverProductsSection';

interface HoverProductsSection {
  _id: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  maxProducts: number;
  active: boolean;
  position: string;
  order: number;
  productType: 'latest' | 'random' | 'manual' | 'category';
  selectedCategories: string[];
  selectedProducts: string[];
}

interface MultipleHoverProductsSectionsProps {
  position?: string;
}

const MultipleHoverProductsSections = ({ position = 'home-top' }: MultipleHoverProductsSectionsProps) => {
  const [sections, setSections] = useState<HoverProductsSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, [position]);

  const fetchSections = async () => {
    try {
      const response = await fetch(`/api/admin/hover-products-sections?position=${position}`);
      const data = await response.json();

      if (data.success) {
        // فقط بخش‌های فعال را فیلتر کن و بر اساس order مرتب کن
        const activeSections = data.data
          .filter((section: HoverProductsSection) => section.active)
          .sort((a: HoverProductsSection, b: HoverProductsSection) => a.order - b.order);
        setSections(activeSections);
      }
    } catch (error) {
      console.error('Error fetching hover products sections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-16 py-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="max-w-7xl mx-auto px-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-12"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="bg-gray-200 rounded-lg h-96"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-16">
      {sections.map((section) => (
        <ModernHoverProductsSection
          key={section._id}
          title={section.title}
          subtitle={section.subtitle}
          backgroundColor={section.backgroundColor}
          maxProducts={section.maxProducts}
          className="transition-all duration-500"
        />
      ))}
    </div>
  );
};

export default MultipleHoverProductsSections;
