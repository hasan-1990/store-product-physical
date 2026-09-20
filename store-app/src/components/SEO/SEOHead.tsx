'use client';
import React from 'react';
import Head from 'next/head';
import { SEOSettings } from '@/types/seo';

interface SEOHeadProps {
  settings: SEOSettings;
  children?: React.ReactNode;
}

export default function SEOHead({ settings, children }: SEOHeadProps) {
  const generateStructuredData = () => {
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
          "itemListElement": []
        };
        
      default:
        return baseData;
    }
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{settings.title}</title>
      <meta name="description" content={settings.description} />
      
      {settings.keywords && settings.keywords.length > 0 && (
        <meta name="keywords" content={settings.keywords.join(', ')} />
      )}
      
      {settings.author && (
        <meta name="author" content={settings.author} />
      )}
      
      {settings.canonicalUrl && (
        <link rel="canonical" href={settings.canonicalUrl} />
      )}
      
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Language & Locale */}
      <html lang={settings.locale || 'fa-IR'} dir="rtl" />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={settings.ogTitle || settings.title} />
      <meta property="og:description" content={settings.ogDescription || settings.description} />
      <meta property="og:type" content={settings.ogType || 'website'} />
      <meta property="og:url" content={settings.canonicalUrl || settings.siteUrl} />
      <meta property="og:site_name" content={settings.siteName} />
      <meta property="og:locale" content={settings.locale || 'fa_IR'} />
      
      {settings.ogImage && (
        <>
          <meta property="og:image" content={settings.ogImage} />
          <meta property="og:image:alt" content={settings.title} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={settings.twitterCard || 'summary_large_image'} />
      <meta name="twitter:title" content={settings.twitterTitle || settings.title} />
      <meta name="twitter:description" content={settings.twitterDescription || settings.description} />
      
      {(settings.twitterImage || settings.ogImage) && (
        <meta name="twitter:image" content={settings.twitterImage || settings.ogImage} />
      )}
      
      {/* Hreflang Tags */}
      {settings.hreflang && settings.hreflang.map((lang, index) => (
        <link
          key={index}
          rel="alternate"
          hrefLang={lang.lang}
          href={lang.url}
        />
      ))}
      
      {/* Google Analytics */}
      {settings.googleAnalyticsId && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.googleAnalyticsId}');
              `,
            }}
          />
        </>
      )}
      
      {/* Google Tag Manager */}
      {settings.googleTagManagerId && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${settings.googleTagManagerId}');
              `,
            }}
          />
        </>
      )}
      
      {/* Search Console Verification */}
      {settings.searchConsoleVerification && (
        <meta name="google-site-verification" content={settings.searchConsoleVerification} />
      )}
      
      {/* Preload Resources */}
      {settings.preloadResources && settings.preloadResources.map((resource, index) => (
        <link key={index} rel="preload" href={resource} />
      ))}
      
      {/* Prefetch URLs */}
      {settings.prefetchUrls && settings.prefetchUrls.map((url, index) => (
        <link key={index} rel="prefetch" href={url} />
      ))}
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData()),
        }}
      />
      
      {/* Custom Children */}
      {children}
    </Head>
  );
}