'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import ProductCard from './ProductCard';
import { useCustomSections, useProductsByType } from '@/hooks/useApi';

// Lazy load Swiper wrapper
const SwiperWrapper = dynamic(
  () => import('./SwiperProductWrapper'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-100 h-96 rounded-lg" />
  }
);

interface CustomTab {
  id: string;
  active: boolean;
  title: string;
  subtitle: string;
  maxProducts: number;
  selectionMode: 'manual' | 'latest' | 'random' | 'most_viewed' | 'best_selling' | 'highest_rated';
  selectedProducts: string[];
}

interface CustomSection {
  id: string;
  active: boolean;
  title: string;
  subtitle: string;
  tabs: CustomTab[];
  displayMode: 'tabs' | 'separate';
  position: number;
}

interface Product {
  _id: string;
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  active: boolean;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  featured?: boolean;
  discount?: number;
  colors?: string[];
  sizes?: string[];
  description?: string;
}

const CustomSections: React.FC = () => {
  const [activeTab, setActiveTab] = useState<{ [key: string]: string }>({});
  
  // استفاده از React Query برای دریافت بخش‌های سفارشی
  const { data: sectionsData, isLoading, error } = useCustomSections();
  
  const customSections = useMemo(() => {
    return sectionsData?.sections?.filter((section: CustomSection) => section.active)
      .sort((a: CustomSection, b: CustomSection) => a.position - b.position) || [];
  }, [sectionsData]);

  // تنظیم تب فعال اولیه
  useEffect(() => {
    if (customSections.length > 0) {
      const initialActiveTabs: { [key: string]: string } = {};
      customSections.forEach((section: CustomSection) => {
        const firstActiveTab = section.tabs.find(tab => tab.active);
        if (firstActiveTab) {
          initialActiveTabs[section.id] = firstActiveTab.id;
        }
      });
      setActiveTab(initialActiveTabs);
    }
  }, [customSections]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-96"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading custom sections:', error);
    return null;
  }

  if (customSections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-20">
      {customSections.map((section: CustomSection) => {
        const activeTabs = section.tabs.filter(tab => tab.active);
        
        if (activeTabs.length === 0) return null;

        if (section.displayMode === 'tabs') {
          // نمایش تب‌دار
          return (
            <TabsSection 
              key={section.id} 
              section={section} 
              activeTabs={activeTabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          );
        } else {
          // نمایش جداگانه
          return (
            <SeparateSection 
              key={section.id} 
              section={section} 
              activeTabs={activeTabs}
            />
          );
        }
      })}
    </div>
  );
};

// کامپوننت نمایش تب‌دار
const TabsSection: React.FC<{
  section: CustomSection;
  activeTabs: CustomTab[];
  activeTab: { [key: string]: string };
  setActiveTab: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}> = ({ section, activeTabs, activeTab, setActiveTab }) => {
  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block p-3 bg-blue-100 rounded-full mb-6">
            <span className="text-3xl">🛍️</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {section.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {section.subtitle}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-white rounded-xl p-1 shadow-lg overflow-x-auto">
            {activeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(prev => ({ ...prev, [section.id]: tab.id }))}
                className={`px-8 py-4 rounded-lg font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab[section.id] === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTabs.map((tab) => (
          <TabContent 
            key={tab.id}
            tab={tab}
            isActive={activeTab[section.id] === tab.id}
            sectionId={section.id}
          />
        ))}
      </div>
    </section>
  );
};

// کامپوننت نمایش جداگانه
const SeparateSection: React.FC<{
  section: CustomSection;
  activeTabs: CustomTab[];
}> = ({ section, activeTabs }) => {
  return (
    <div className="space-y-20">
      {activeTabs.map((tab, tabIndex) => (
        <section 
          key={tab.id} 
          className={`py-20 ${
            tabIndex % 2 === 0 
              ? 'bg-gradient-to-br from-gray-50 to-purple-50' 
              : 'bg-gradient-to-br from-blue-50 to-pink-50'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-block p-3 bg-purple-100 rounded-full mb-6">
                <span className="text-3xl">⭐</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {tab.title}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {tab.subtitle}
              </p>
            </div>

            <TabContent tab={tab} isActive={true} />
          </div>
        </section>
      ))}
    </div>
  );
};

// کامپوننت محتوای تب
const TabContent: React.FC<{
  tab: CustomTab;
  isActive: boolean;
  sectionId?: string;
}> = ({ tab, isActive, sectionId }) => {
  // استفاده از React Query برای دریافت محصولات
  const { data: products = [], isLoading, error } = useProductsByType(
    tab.selectionMode,
    tab.maxProducts,
    tab.selectedProducts
  );

  if (!isActive) return null;

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-lg">در حال بارگذاری محصولات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
          <span className="text-4xl">❌</span>
        </div>
        <p className="text-red-500 text-lg">خطا در بارگذاری محصولات</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
          <span className="text-4xl">📦</span>
        </div>
        <p className="text-gray-500 text-lg">محصولی یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="transition-all duration-500">
      {tab.subtitle && (
        <p className="text-center text-gray-600 mb-8 text-lg">{tab.subtitle}</p>
      )}
      
      <div className="relative">
        <SwiperWrapper
          products={products}
          sectionId={sectionId || 'single'}
          tabId={tab.id}
        />
      </div>
    </div>
  );
};

export default CustomSections;
