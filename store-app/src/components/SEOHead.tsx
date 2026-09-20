'use client';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { usePathname } from 'next/navigation';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  structuredData?: any;
  pageType?: 'home' | 'product' | 'blog' | 'category' | 'custom';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
}

interface SEOPageData {
  id: string;
  url: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsContent?: string;
  structuredData?: any;
  customMeta?: Record<string, string>;
  isActive: boolean;
}

interface GlobalSEOSettings {
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  siteName: string;
  language: string;
  direction: string;
  googleSiteVerification: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  socialMedia: {
    twitter: string;
    facebook: string;
    instagram: string;
    telegram: string;
  };
}

export default function SEOHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
  pageType,
  publishedTime,
  modifiedTime,
  author,
  noIndex = false
}: SEOHeadProps) {
  const [globalSettings, setGlobalSettings] = useState<GlobalSEOSettings | null>(null);
  const [pageSettings, setPageSettings] = useState<SEOPageData | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // بارگیری تنظیمات کلی SEO
    const loadGlobalSettings = async () => {
      try {
        const response = await fetch('/api/admin/seo');
        const data = await response.json();
        if (data.global) {
          setGlobalSettings(data.global);
        }
      } catch (error) {
        console.error('خطا در بارگیری تنظیمات کلی SEO:', error);
      }
    };

    // بارگیری تنظیمات صفحه خاص (فقط برای صفحات عمومی)
    const loadPageSettings = async () => {
      // صفحات ادمین و API را نادیده بگیر
      if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
        return;
      }
      
      // فقط برای صفحات اصلی SEO settings چک کن (صفحه اصلی، about، contact، etc)
      // صفحات محصول و blog معمولاً dynamic SEO دارند
      const shouldCheckSEO = pathname === '/' || 
                            pathname.startsWith('/about') || 
                            pathname.startsWith('/contact') || 
                            pathname.startsWith('/categories');
      
      if (!shouldCheckSEO) {
        return;
      }
      
      try {
        const response = await fetch(`/api/admin/seo/pages/manage?url=${pathname}`);
        
        // اگر response موفق نبود، خطای 404 یا سایر خطاها طبیعی هست
        if (!response.ok) {
          return;
        }
        
        const data = await response.json();
        if (data.success && data.page && data.page.isActive) {
          setPageSettings(data.page);
        }
      } catch (error) {
        // خطاهای شبکه یا parsing را نادیده بگیر
      }
    };

    loadGlobalSettings();
    loadPageSettings();
  }, [pathname]);

  useEffect(() => {
    if (!globalSettings) return;

    // اولویت با تنظیمات صفحه خاص، سپس props، سپس تنظیمات کلی
    const finalTitle = pageSettings?.title || title || globalSettings.siteTitle;
    const finalDescription = pageSettings?.description || description || globalSettings.siteDescription;
    const finalKeywords = pageSettings?.keywords || keywords || '';
    const finalOgImage = pageSettings?.ogImage || ogImage || `${globalSettings.siteUrl}/images/og-default.jpg`;
    const finalCanonicalUrl = pageSettings?.canonicalUrl || canonicalUrl || `${globalSettings.siteUrl}${pathname}`;
    const finalRobotsContent = pageSettings?.robotsContent || (noIndex ? 'noindex,nofollow' : 'index,follow');

    // تنظیم عنوان صفحه
    const pageTitle = finalTitle.includes('|') ? finalTitle : `${finalTitle} | ${globalSettings.siteName}`;
    document.title = pageTitle;

    // حذف متاتگ‌های قبلی
    const existingMetas = document.querySelectorAll('meta[data-seo]');
    existingMetas.forEach(meta => meta.remove());

    // اضافه کردن متاتگ‌های جدید
    const metaTags = [
      { name: 'description', content: finalDescription },
      { name: 'keywords', content: finalKeywords },
      { name: 'robots', content: finalRobotsContent },
      { name: 'language', content: globalSettings.language },
      { name: 'author', content: author || globalSettings.siteName },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      
      // Open Graph
      { property: 'og:type', content: ogType },
      { property: 'og:title', content: finalTitle },
      { property: 'og:description', content: finalDescription },
      { property: 'og:url', content: finalCanonicalUrl },
      { property: 'og:site_name', content: globalSettings.siteName },
      { property: 'og:image', content: finalOgImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:locale', content: globalSettings.language === 'fa' ? 'fa_IR' : 'en_US' },
      
      // Twitter Cards
      { name: 'twitter:card', content: twitterCard },
      { name: 'twitter:title', content: finalTitle },
      { name: 'twitter:description', content: finalDescription },
      { name: 'twitter:image', content: finalOgImage },
      { name: 'twitter:site', content: globalSettings.socialMedia?.twitter || '' },
      
      // Article specific
      ...(pageType === 'blog' && publishedTime ? [
        { property: 'article:published_time', content: publishedTime },
        { property: 'article:modified_time', content: modifiedTime || publishedTime },
        { property: 'article:author', content: author || globalSettings.siteName }
      ] : []),
      
      // Product specific
      ...(pageType === 'product' ? [
        { property: 'product:brand', content: globalSettings.siteName },
        { property: 'product:availability', content: 'in stock' }
      ] : [])
    ];

    // اضافه کردن متاتگ‌ها به head
    metaTags.forEach(meta => {
      if (meta.content) {
        const metaElement = document.createElement('meta');
        metaElement.setAttribute('data-seo', 'true');
        
        if ('name' in meta && meta.name) {
          metaElement.setAttribute('name', meta.name);
        } else if ('property' in meta && meta.property) {
          metaElement.setAttribute('property', meta.property);
        }
        
        metaElement.setAttribute('content', meta.content);
        document.head.appendChild(metaElement);
      }
    });

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalCanonicalUrl);

    // Google Site Verification
    if (globalSettings.googleSiteVerification && !document.querySelector('meta[name="google-site-verification"]')) {
      const verificationMeta = document.createElement('meta');
      verificationMeta.setAttribute('name', 'google-site-verification');
      verificationMeta.setAttribute('content', globalSettings.googleSiteVerification);
      verificationMeta.setAttribute('data-seo', 'true');
      document.head.appendChild(verificationMeta);
    }

    // Structured Data (JSON-LD)
    if (structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"][data-seo]');
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.setAttribute('type', 'application/ld+json');
        scriptElement.setAttribute('data-seo', 'true');
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(structuredData);
    }

  }, [
    title, description, keywords, canonicalUrl, ogImage, ogType, 
    twitterCard, structuredData, pageType, publishedTime, 
    modifiedTime, author, noIndex, globalSettings, pageSettings, pathname
  ]);

  // این کامپوننت هیچ UI رندر نمی‌کند
  return null;
}