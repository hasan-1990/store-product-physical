'use client';

import { useEffect, useState } from 'react';

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

export const useSEO = (url: string) => {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSEOData = async () => {
      if (!url) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching SEO data for URL:', url);
        const response = await fetch(`/api/seo?url=${encodeURIComponent(url)}`);
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API Response:', data);
          
          if (data.success) {
            setSeoData(data.data);
          } else {
            console.log('API returned success=false:', data.message);
            setSeoData(null);
          }
        } else {
          console.log('Response not ok:', response.status, response.statusText);
          setError(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error('خطا در دریافت اطلاعات SEO:', err);
        setError(err instanceof Error ? err.message : 'خطای ناشناخته');
      } finally {
        setLoading(false);
      }
    };

    fetchSEOData();
  }, [url]);

  return { seoData, loading, error };
};