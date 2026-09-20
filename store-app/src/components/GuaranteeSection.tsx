'use client';

import React, { useState, useEffect } from 'react';
import type { GuaranteeSettings } from '@/types';

const GuaranteeSection: React.FC = () => {
  const [settings, setSettings] = useState<GuaranteeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/guarantee-settings');
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching guarantee settings:', error);
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
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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

  const activeGuarantees = settings.guarantees
    .filter(g => g.active)
    .sort((a, b) => a.order - b.order);

  if (activeGuarantees.length === 0) {
    return null;
  }

  return (
    <section 
      className="py-12"
      style={{ backgroundColor: settings.backgroundColor || '#f8f9fa' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* عنوان بخش */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {settings.sectionTitle}
          </h2>
          {settings.sectionSubtitle && (
            <p className="text-gray-600 text-lg">
              {settings.sectionSubtitle}
            </p>
          )}
        </div>

        {/* گرید گارانتی‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeGuarantees.map((guarantee) => (
            <div
              key={guarantee.id}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 text-center"
            >
              {/* آیکون */}
              <div className="text-4xl mb-4">
                {guarantee.iconType === 'emoji' ? (
                  <span>{guarantee.icon}</span>
                ) : (
                  <i className={guarantee.icon}></i>
                )}
              </div>

              {/* عنوان */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {guarantee.title}
              </h3>

              {/* توضیحات */}
              <p className="text-gray-600 text-sm">
                {guarantee.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GuaranteeSection;
