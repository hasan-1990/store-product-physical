'use client';

import { useEffect } from 'react';

const URLSettingsLoader = () => {
  useEffect(() => {
    // تنظیمات پیش‌فرض را در localStorage ذخیره کن
    const defaultSettings = {
      urlStructure: 'category-product',
      categoryPrefix: '',
      productPrefix: '',
      removeStopWords: false,
      slugLanguage: 'english',
      maxSlugLength: 50,
      separatorType: '-',
      includeId: false,
      removeNumbers: false
    };

    // بارگذاری تنظیمات از API
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/seo/url-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            localStorage.setItem('urlSettings', JSON.stringify(data.data));
            return;
          }
        }
      } catch (error) {
        console.warn('خطا در دریافت تنظیمات URL:', error);
      }
      
      // در صورت خطا، از تنظیمات پیش‌فرض استفاده کن
      localStorage.setItem('urlSettings', JSON.stringify(defaultSettings));
    };

    loadSettings();
  }, []);

  return null; // این component چیزی render نمی‌کند
};

export default URLSettingsLoader;