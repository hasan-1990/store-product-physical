'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface URLSettings {
  urlStructure: 'id-only' | 'product-only' | 'category-product';
  categoryPrefix: string;
  productPrefix: string;
  removeStopWords: boolean;
  slugLanguage: 'persian' | 'english';
  maxSlugLength: number;
  separatorType: '-' | '_' | '.';
  includeId: boolean;
  removeNumbers: boolean;
}

interface URLSettingsContextType {
  settings: URLSettings;
  updateSettings: (newSettings: URLSettings) => void;
  generateProductUrl: (product: any, category?: any) => string;
  isLoading: boolean;
}

const defaultSettings: URLSettings = {
  urlStructure: 'category-product',
  categoryPrefix: '',
  productPrefix: '',
  removeStopWords: false,
  slugLanguage: 'english',
  maxSlugLength: 50,
  separatorType: '-',
  // تغییر به true برای تولید فرمت "دسته/slug-عدد"
  includeId: true,
  removeNumbers: false
};

const URLSettingsContext = createContext<URLSettingsContextType | undefined>(undefined);

export const URLSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<URLSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // بارگذاری تنظیمات از API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/seo/url-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSettings(data.data);
            // همچنین در localStorage ذخیره کن برای استفاده offline
            localStorage.setItem('urlSettings', JSON.stringify(data.data));
          }
        }
      } catch (error) {
        console.warn('خطا در دریافت تنظیمات URL:', error);
        // تلاش برای خواندن از localStorage
        try {
          const stored = localStorage.getItem('urlSettings');
          if (stored) {
            setSettings(JSON.parse(stored));
          }
        } catch (e) {
          console.warn('خطا در خواندن تنظیمات از localStorage:', e);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // بروزرسانی تنظیمات
  const updateSettings = async (newSettings: URLSettings) => {
    try {
      const response = await fetch('/api/admin/seo/url-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(newSettings);
        localStorage.setItem('urlSettings', JSON.stringify(newSettings));
        
        // اختیاری: اطلاع‌رسانی به سایر components
        window.dispatchEvent(new CustomEvent('urlSettingsChanged', { 
          detail: newSettings 
        }));
      }
    } catch (error) {
      console.error('خطا در بروزرسانی تنظیمات URL:', error);
    }
  };

  // تولید URL محصول بر اساس تنظیمات فعلی
  const generateProductUrl = (product: any, category?: any): string => {
    const cat = category || product.category;

    // استفاده از sequential ID با پیشوند tst- یا fallback به _id
    const productId = product.sequentialId
      ? `tst-${product.sequentialId}`
      : product.id || product._id;

    // Debug
    console.log('🔗 generateProductUrl called:', {
      productName: product.name,
      productSlug: product.slug,
      sequentialId: product.sequentialId,
      productId,
      hasCategoryPath: !!(product.categoryPath && Array.isArray(product.categoryPath)),
      categoryPathLength: product.categoryPath?.length || 0,
      categoryPath: product.categoryPath,
      hasCategory: !!cat,
      categorySlug: cat?.slug
    });

    switch (settings.urlStructure) {
      case 'category-product':
        // استفاده از categoryPath برای پشتیبانی از دسته‌بندی‌های تودرتو
        if (product.categoryPath && Array.isArray(product.categoryPath) && product.categoryPath.length > 0) {
          const categorySlugPath = product.categoryPath.map((c: any) => c.slug).join('/');
          // ترکیب slug محصول با sequential ID
          const fullProductSlug = settings.includeId && product.slug && product.sequentialId
            ? `${product.slug}-${product.sequentialId}`
            : (product.slug || productId);
          return `/products/${categorySlugPath}/${fullProductSlug}`;
        } else if (cat && cat.slug) {
          // ترکیب slug محصول با sequential ID
          const fullProductSlug = settings.includeId && product.slug && product.sequentialId
            ? `${product.slug}-${product.sequentialId}`
            : (product.slug || productId);
          return `/products/${cat.slug}/${fullProductSlug}`;
        } else if (product.slug) {
          return settings.includeId
            ? `/products/${product.slug}-${product.sequentialId || productId}`
            : `/products/${product.slug}`;
        }
        break;

      case 'product-only':
        if (product.slug) {
          return settings.includeId
            ? `/products/${product.slug}/${productId}`
            : `/products/${product.slug}`;
        }
        break;

      case 'id-only':
      default:
        return `/products/${productId}`;
    }

    // fallback به ID اگر slug موجود نباشد
    return `/products/${productId}`;
  };

  return (
    <URLSettingsContext.Provider value={{
      settings,
      updateSettings,
      generateProductUrl,
      isLoading
    }}>
      {children}
    </URLSettingsContext.Provider>
  );
};

// Hook برای استفاده از Context
export const useURLSettings = () => {
  const context = useContext(URLSettingsContext);
  if (context === undefined) {
    throw new Error('useURLSettings must be used within a URLSettingsProvider');
  }
  return context;
};

export default URLSettingsProvider;