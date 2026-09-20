'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  h1Title?: string;
  h2Title?: string;
  content?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsContent?: string;
  structuredData?: any;
}

interface SEOManagerProps {
  url: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  children?: React.ReactNode;
}

const SEOManager: React.FC<SEOManagerProps> = ({ 
  url, 
  fallbackTitle = '', 
  fallbackDescription = '',
  children 
}) => {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        const response = await fetch(`/api/seo?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSeoData(data.data);
          }
        }
      } catch (error) {
        console.error('خطا در دریافت اطلاعات SEO:', error);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchSEOData();
    } else {
      setLoading(false);
    }
  }, [url]);

  if (loading) {
    return children || null;
  }

  const title = seoData?.title || fallbackTitle;
  const description = seoData?.description || fallbackDescription;
  const h1Title = seoData?.h1Title || title;
  const h2Title = seoData?.h2Title;

  return (
    <>
      {/* Meta Tags */}
      <Head>
        {title && <title>{title}</title>}
        {description && <meta name="description" content={description} />}
        {seoData?.keywords && <meta name="keywords" content={seoData.keywords} />}
        
        {/* Open Graph */}
        {(seoData?.ogTitle || title) && <meta property="og:title" content={seoData?.ogTitle || title} />}
        {(seoData?.ogDescription || description) && <meta property="og:description" content={seoData?.ogDescription || description} />}
        {seoData?.ogImage && <meta property="og:image" content={seoData.ogImage} />}
        
        {/* Twitter */}
        {(seoData?.twitterTitle || title) && <meta name="twitter:title" content={seoData?.twitterTitle || title} />}
        {(seoData?.twitterDescription || description) && <meta name="twitter:description" content={seoData?.twitterDescription || description} />}
        {seoData?.twitterImage && <meta name="twitter:image" content={seoData.twitterImage} />}
        
        {/* Other */}
        {seoData?.canonicalUrl && <link rel="canonical" href={seoData.canonicalUrl} />}
        {seoData?.robotsContent && <meta name="robots" content={seoData.robotsContent} />}
        
        {/* Structured Data */}
        {seoData?.structuredData && (
          <script 
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(seoData.structuredData)
            }}
          />
        )}
      </Head>

      {/* H1 و H2 و محتوای SEO پنهان */}
      <div className="hidden">
        {h1Title && (
          <h1 aria-label="عنوان اصلی صفحه">
            {h1Title}
          </h1>
        )}
        
        {h2Title && (
          <h2 aria-label="عنوان فرعی صفحه">
            {h2Title}
          </h2>
        )}
        
        {/* محتوای SEO پنهان - فقط برای گوگل */}
        {seoData?.content && (
          <div dangerouslySetInnerHTML={{ __html: seoData.content }} />
        )}
      </div>
      
      {children}
    </>
  );
};

export default SEOManager;