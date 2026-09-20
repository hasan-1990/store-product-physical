'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SEOSettings, SEOAnalysis } from '@/types/seo';

interface SEOContextType {
  // Current page SEO settings
  currentSEO: SEOSettings | null;
  setCurrentSEO: (seo: SEOSettings) => void;
  
  // Global SEO settings
  globalSettings: SEOSettings | null;
  setGlobalSettings: (settings: SEOSettings) => void;
  
  // SEO Analysis
  analysis: SEOAnalysis | null;
  setAnalysis: (analysis: SEOAnalysis) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Actions
  saveSEOSettings: (settings: SEOSettings) => Promise<boolean>;
  loadSEOSettings: (pageUrl?: string) => Promise<void>;
  generateSEOAnalysis: (content: string, url: string) => Promise<SEOAnalysis>;
  generateMetaTags: (settings: SEOSettings) => string;
  generateStructuredData: (settings: SEOSettings) => any;
}

const SEOContext = createContext<SEOContextType | undefined>(undefined);

export function SEOProvider({ children }: { children: ReactNode }) {
  const [currentSEO, setCurrentSEO] = useState<SEOSettings | null>(null);
  const [globalSettings, setGlobalSettings] = useState<SEOSettings | null>(null);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load global settings on mount
  useEffect(() => {
    loadGlobalSettings();
  }, []);

  const loadGlobalSettings = async () => {
    try {
      const response = await fetch('/api/seo/settings/global');
      if (response.ok) {
        const data = await response.json();
        setGlobalSettings(data);
      }
    } catch (error) {
      console.error('خطا در بارگذاری تنظیمات کلی SEO:', error);
    }
  };

  const saveSEOSettings = async (settings: SEOSettings): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/seo/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const savedSettings = await response.json();
        setCurrentSEO(savedSettings);
        return true;
      }
      return false;
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات SEO:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSEOSettings = async (pageUrl?: string) => {
    try {
      setIsLoading(true);
      const url = pageUrl ? `/api/seo/settings?url=${encodeURIComponent(pageUrl)}` : '/api/seo/settings';
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSEO(data);
      }
    } catch (error) {
      console.error('خطا در بارگذاری تنظیمات SEO:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSEOAnalysis = async (content: string, url: string): Promise<SEOAnalysis> => {
    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, url }),
      });

      if (response.ok) {
        const analysisData = await response.json();
        setAnalysis(analysisData);
        return analysisData;
      }
      throw new Error('خطا در آنالیز SEO');
    } catch (error) {
      console.error('خطا در آنالیز SEO:', error);
      throw error;
    }
  };

  const generateMetaTags = (settings: SEOSettings): string => {
    const tags: string[] = [];
    
    // Basic meta tags
    if (settings.title) {
      tags.push(`<title>${settings.title}</title>`);
      tags.push(`<meta name="title" content="${settings.title}" />`);
    }
    
    if (settings.description) {
      tags.push(`<meta name="description" content="${settings.description}" />`);
    }
    
    if (settings.keywords?.length) {
      tags.push(`<meta name="keywords" content="${settings.keywords.join(', ')}" />`);
    }

    if (settings.canonicalUrl) {
      tags.push(`<link rel="canonical" href="${settings.canonicalUrl}" />`);
    }
    
    // Open Graph tags
    if (settings.ogTitle || settings.title) {
      tags.push(`<meta property="og:title" content="${settings.ogTitle || settings.title}" />`);
    }
    
    if (settings.ogDescription || settings.description) {
      tags.push(`<meta property="og:description" content="${settings.ogDescription || settings.description}" />`);
    }
    
    if (settings.ogImage) {
      tags.push(`<meta property="og:image" content="${settings.ogImage}" />`);
    }
    
    if (settings.ogType) {
      tags.push(`<meta property="og:type" content="${settings.ogType}" />`);
    }
    
    // Twitter Cards
    if (settings.twitterCard) {
      tags.push(`<meta name="twitter:card" content="${settings.twitterCard}" />`);
    }
    
    if (settings.twitterTitle || settings.title) {
      tags.push(`<meta name="twitter:title" content="${settings.twitterTitle || settings.title}" />`);
    }
    
    if (settings.twitterDescription || settings.description) {
      tags.push(`<meta name="twitter:description" content="${settings.twitterDescription || settings.description}" />`);
    }
    
    if (settings.twitterImage || settings.ogImage) {
      tags.push(`<meta name="twitter:image" content="${settings.twitterImage || settings.ogImage}" />`);
    }

    // Analytics
    if (settings.googleAnalyticsId) {
      tags.push(`<meta name="google-site-verification" content="${settings.searchConsoleVerification}" />`);
    }

    return tags.join('\n');
  };

  const generateStructuredData = (settings: SEOSettings): any => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": settings.schemaType || "WebSite",
      "url": settings.canonicalUrl || settings.siteUrl,
      "name": settings.siteName || settings.title,
      "description": settings.description,
    };

    switch (settings.schemaType) {
      case 'Article':
        return {
          ...baseData,
          "@type": "Article",
          "headline": settings.title,
          "description": settings.description,
          "author": {
            "@type": "Person",
            "name": settings.author || "نویسنده"
          },
          "datePublished": settings.publishedAt,
          "dateModified": settings.modifiedAt || settings.publishedAt,
          "image": settings.ogImage,
          "keywords": settings.keywords?.join(', '),
        };
        
      case 'Product':
        return {
          ...baseData,
          "@type": "Product",
          "name": settings.title,
          "description": settings.description,
          "image": settings.ogImage,
        };
        
      case 'BreadcrumbList':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [] // باید از صفحه پر شود
        };
        
      default:
        return baseData;
    }
  };

  const value: SEOContextType = {
    currentSEO,
    setCurrentSEO,
    globalSettings,
    setGlobalSettings,
    analysis,
    setAnalysis,
    isLoading,
    setIsLoading,
    saveSEOSettings,
    loadSEOSettings,
    generateSEOAnalysis,
    generateMetaTags,
    generateStructuredData,
  };

  return (
    <SEOContext.Provider value={value}>
      {children}
    </SEOContext.Provider>
  );
}

export function useSEO() {
  const context = useContext(SEOContext);
  if (context === undefined) {
    throw new Error('useSEO must be used within a SEOProvider');
  }
  return context;
}