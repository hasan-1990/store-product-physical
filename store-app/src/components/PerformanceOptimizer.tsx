'use client';
import { useEffect, useState } from 'react';
import OptimizedImage from './OptimizedImage';

interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

interface PerformanceOptimizerProps {
  enableLazyLoading?: boolean;
  enablePrefetch?: boolean;
  enablePreload?: string[];
  enableImageOptimization?: boolean;
  enableCoreWebVitalsTracking?: boolean;
}

export default function PerformanceOptimizer({
  enableLazyLoading = true,
  enablePrefetch = true,
  enablePreload = [],
  enableImageOptimization = true,
  enableCoreWebVitalsTracking = true
}: PerformanceOptimizerProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Lazy Loading for images
    if (enableLazyLoading && 'IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[data-lazy]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute('data-lazy');
            if (src) {
              img.src = src;
              img.removeAttribute('data-lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));

      return () => imageObserver.disconnect();
    }
  }, [enableLazyLoading]);

  useEffect(() => {
    // Prefetch critical resources
    if (enablePrefetch) {
      const criticalResources = [
        '/api/products',
        '/api/categories',
        ...enablePreload
      ];

      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource;
        document.head.appendChild(link);
      });
    }
  }, [enablePrefetch, enablePreload]);

  useEffect(() => {
    // Core Web Vitals tracking
    if (enableCoreWebVitalsTracking && typeof window !== 'undefined') {
      let lcp = 0;
      let fid = 0;
      let cls = 0;
      let fcp = 0;
      let ttfb = 0;

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fidEntry = entry as any;
          fid = fidEntry.processingStart - fidEntry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const clsEntry = entry as any;
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
          }
        });
        cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            fcp = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Time to First Byte (TTFB)
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
      }

      // Update metrics after 3 seconds
      setTimeout(() => {
        setMetrics({ lcp, fid, cls, fcp, ttfb });
        
        // Send to analytics if available
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'web_vitals', {
            lcp: Math.round(lcp),
            fid: Math.round(fid),
            cls: Math.round(cls * 1000) / 1000,
            fcp: Math.round(fcp),
            ttfb: Math.round(ttfb)
          });
        }
      }, 3000);

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        fcpObserver.disconnect();
      };
    }
  }, [enableCoreWebVitalsTracking]);

  useEffect(() => {
    // Critical CSS inlining
    const criticalCSS = `
      /* Critical CSS */
      body { font-family: system-ui, -apple-system, sans-serif; }
      .hero { min-height: 50vh; }
      .loading { display: flex; align-items: center; justify-content: center; }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);

    // Resource hints
    const resourceHints: Array<{ rel: string; href: string; crossOrigin?: string }> = [
      { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
      { rel: 'dns-prefetch', href: '//www.googletagmanager.com' }
    ];

    resourceHints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossOrigin) {
        link.crossOrigin = hint.crossOrigin;
      }
      document.head.appendChild(link);
    });

  }, []);

  // Service Worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return null; // This component doesn't render anything
}

// Enhanced Image component with performance optimizations
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  className?: string;
  lazy?: boolean;
}

// NOTE: Legacy local OptimizedImage removed in favor of shared component.

// Critical CSS loader
export function CriticalCSS() {
  useEffect(() => {
    // Load non-critical CSS asynchronously
    const loadCSS = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
      document.head.appendChild(link);
    };

    // Load non-critical stylesheets
    const nonCriticalCSS = [
      '/css/components.css',
      '/css/pages.css'
    ];

    nonCriticalCSS.forEach(css => {
      setTimeout(() => loadCSS(css), 100);
    });
  }, []);

  return null;
}