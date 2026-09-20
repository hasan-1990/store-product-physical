'use client';

import React, { useState, useEffect } from 'react';
import type { FeaturesSettings } from '@/types';

const FeaturesSection: React.FC = () => {
  const [settings, setSettings] = useState<FeaturesSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/features-settings');
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching features settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!settings || !settings.showSection) {
    return null;
  }

  const activeFeatures = settings.features
    .filter(f => f.active)
    .sort((a, b) => a.order - b.order);

  if (activeFeatures.length === 0) {
    return null;
  }

  const getGridCols = () => {
    switch (settings.columns) {
      case 2: return 'lg:grid-cols-2';
      case 3: return 'lg:grid-cols-3';
      case 4: return 'lg:grid-cols-4';
      default: return 'lg:grid-cols-4';
    }
  };

  return (
    <section 
      className="py-16"
      style={{ backgroundColor: settings.backgroundColor || '#f8f9fa' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* عنوان بخش */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {settings.sectionTitle}
          </h2>
          {settings.sectionSubtitle && (
            <p className="text-gray-600 text-lg">
              {settings.sectionSubtitle}
            </p>
          )}
        </div>

        {/* گرید ویژگی‌ها */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${getGridCols()} gap-6`}>
          {activeFeatures.map((feature) => {
            // رندر بر اساس layout
            if (settings.layout === 'cards') {
              return (
                <div
                  key={feature.id}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* آیکون */}
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-2xl"
                    style={{ 
                      backgroundColor: feature.iconColor ? `${feature.iconColor}20` : '#3b82f620',
                      color: feature.iconColor || '#3b82f6'
                    }}
                  >
                    {feature.iconType === 'emoji' ? (
                      <span>{feature.icon}</span>
                    ) : (
                      <i className={feature.icon}></i>
                    )}
                  </div>

                  {/* عنوان */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>

                  {/* توضیحات */}
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            } else if (settings.layout === 'list') {
              return (
                <div
                  key={feature.id}
                  className="flex items-start gap-4 bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                >
                  {/* آیکون */}
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                    style={{ 
                      backgroundColor: feature.iconColor ? `${feature.iconColor}20` : '#3b82f620',
                      color: feature.iconColor || '#3b82f6'
                    }}
                  >
                    {feature.iconType === 'emoji' ? (
                      <span>{feature.icon}</span>
                    ) : (
                      <i className={feature.icon}></i>
                    )}
                  </div>

                  <div className="flex-1">
                    {/* عنوان */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>

                    {/* توضیحات */}
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            } else {
              // layout === 'grid' (پیش‌فرض)
              return (
                <div
                  key={feature.id}
                  className="text-center bg-white rounded-lg p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  {/* آیکون */}
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
                    style={{ 
                      backgroundColor: feature.iconColor ? `${feature.iconColor}20` : '#3b82f620',
                      color: feature.iconColor || '#3b82f6'
                    }}
                  >
                    {feature.iconType === 'emoji' ? (
                      <span>{feature.icon}</span>
                    ) : (
                      <i className={feature.icon}></i>
                    )}
                  </div>

                  {/* عنوان */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>

                  {/* توضیحات */}
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            }
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
