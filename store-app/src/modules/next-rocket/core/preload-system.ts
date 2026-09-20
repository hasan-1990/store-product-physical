/**
 * Preload System
 * سیستم Preload برای بارگذاری پیش‌فعال منابع
 */

import fs from 'fs/promises';
import path from 'path';
import CacheManager from './cache-manager';

interface PreloadConfig {
  enabled: boolean;
  preloadFonts: boolean;
  preloadCriticalCSS: boolean;
  preloadCriticalJS: boolean;
  prefetchLinks: boolean;
  preconnectDomains: string[];
}

interface PreloadResource {
  url: string;
  as: 'style' | 'script' | 'font' | 'image';
  type?: string;
  crossorigin?: boolean;
}

class PreloadSystem {
  private static instance: PreloadSystem;
  private config: PreloadConfig | null = null;
  private criticalResources: Set<string> = new Set();

  private constructor() {}

  static getInstance(): PreloadSystem {
    if (!this.instance) {
      this.instance = new PreloadSystem();
    }
    return this.instance;
  }

  /**
   * تنظیم پیکربندی
   */
  configure(config: PreloadConfig): void {
    this.config = config;
    console.log('✅ Preload System configured');
  }

  /**
   * تولید تگ‌های Preload
   */
  generatePreloadTags(resources: PreloadResource[]): string {
    if (!this.config?.enabled) {
      return '';
    }

    const tags = resources.map(resource => {
      const attrs = [
        `rel="preload"`,
        `href="${resource.url}"`,
        `as="${resource.as}"`,
      ];

      if (resource.type) {
        attrs.push(`type="${resource.type}"`);
      }

      if (resource.crossorigin) {
        attrs.push(`crossorigin`);
      }

      return `<link ${attrs.join(' ')}>`;
    });

    return tags.join('\n');
  }

  /**
   * تولید تگ‌های Preconnect
   */
  generatePreconnectTags(): string {
    if (!this.config?.enabled || !this.config.preconnectDomains.length) {
      return '';
    }

    const tags = this.config.preconnectDomains.map(domain => {
      return [
        `<link rel="preconnect" href="${domain}">`,
        `<link rel="dns-prefetch" href="${domain}">`
      ].join('\n');
    });

    return tags.join('\n');
  }

  /**
   * استخراج منابع بحرانی از HTML
   */
  extractCriticalResources(html: string): PreloadResource[] {
    const resources: PreloadResource[] = [];

    // استخراج فونت‌های بحرانی
    if (this.config?.preloadFonts) {
      const fontRegex = /@font-face\s*{[^}]*src:\s*url\(['"]?([^'"()]+)['"]?\)/g;
      let match;
      
      while ((match = fontRegex.exec(html)) !== null) {
        const fontUrl = match[1];
        if (fontUrl) {
          resources.push({
            url: fontUrl,
            as: 'font',
            type: this.getFontType(fontUrl),
            crossorigin: true
          });
        }
      }
    }

    // استخراج CSS بحرانی
    if (this.config?.preloadCriticalCSS) {
      const cssRegex = /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/g;
      let match;
      let count = 0;
      
      while ((match = cssRegex.exec(html)) !== null && count < 3) {
        resources.push({
          url: match[1],
          as: 'style'
        });
        count++;
      }
    }

    // استخراج JavaScript بحرانی
    if (this.config?.preloadCriticalJS) {
      const jsRegex = /<script[^>]+src=["']([^"']+\.js)["'][^>]*>/g;
      let match;
      let count = 0;
      
      while ((match = jsRegex.exec(html)) !== null && count < 2) {
        resources.push({
          url: match[1],
          as: 'script'
        });
        count++;
      }
    }

    return resources;
  }

  /**
   * تشخیص نوع فونت
   */
  private getFontType(url: string): string {
    if (url.endsWith('.woff2')) return 'font/woff2';
    if (url.endsWith('.woff')) return 'font/woff';
    if (url.endsWith('.ttf')) return 'font/ttf';
    if (url.endsWith('.otf')) return 'font/otf';
    return 'font/woff2';
  }

  /**
   * درج تگ‌های Preload به HTML
   */
  injectPreloadTags(html: string): string {
    if (!this.config?.enabled) {
      return html;
    }

    // استخراج منابع بحرانی
    const resources = this.extractCriticalResources(html);
    
    // تولید تگ‌های preload
    const preloadTags = this.generatePreloadTags(resources);
    
    // تولید تگ‌های preconnect
    const preconnectTags = this.generatePreconnectTags();

    // ترکیب تگ‌ها
    const allTags = [preconnectTags, preloadTags].filter(Boolean).join('\n');

    if (!allTags) {
      return html;
    }

    // درج در head
    const headEndIndex = html.indexOf('</head>');
    if (headEndIndex !== -1) {
      return html.slice(0, headEndIndex) + allTags + '\n' + html.slice(headEndIndex);
    }

    return html;
  }

  /**
   * Smart Link Prefetching
   * Prefetch لینک‌های احتمالی بعدی
   */
  generatePrefetchScript(): string {
    if (!this.config?.enabled || !this.config.prefetchLinks) {
      return '';
    }

    return `
<script>
(function() {
  'use strict';
  
  // لیست لینک‌هایی که باید prefetch بشن
  const prefetchedLinks = new Set();
  
  // Intersection Observer برای شناسایی لینک‌های قابل مشاهده
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const link = entry.target;
        const href = link.getAttribute('href');
        
        if (href && !prefetchedLinks.has(href) && shouldPrefetch(href)) {
          prefetchLink(href);
          prefetchedLinks.add(href);
        }
      }
    });
  }, {
    rootMargin: '50px'
  });
  
  // چک کردن اینکه آیا لینک باید prefetch بشه
  function shouldPrefetch(href) {
    // فقط لینک‌های داخلی
    if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
      return false;
    }
    
    // حذف هش‌ها و query stringها برای چک کردن extension
    const url = href.split('#')[0].split('?')[0];
    
    // فقط صفحات HTML (نه فایل‌های استاتیک)
    if (/\\.(jpg|jpeg|png|gif|pdf|zip)$/i.test(url)) {
      return false;
    }
    
    return true;
  }
  
  // Prefetch کردن یک لینک
  function prefetchLink(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = 'document';
    document.head.appendChild(link);
  }
  
  // شروع مشاهده لینک‌ها پس از بارگذاری صفحه
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
  
  function init() {
    // مشاهده تمام لینک‌های داخلی
    const links = document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]');
    links.forEach(link => observer.observe(link));
  }
})();
</script>`;
  }

  /**
   * Pre-warming Cache از Sitemap
   */
  async prewarmFromSitemap(sitemapPath: string): Promise<{
    success: boolean;
    warmed: number;
    total: number;
  }> {
    try {
      console.log('🔥 Starting cache pre-warming from sitemap...');
      
      // خواندن sitemap
      const sitemapContent = await fs.readFile(sitemapPath, 'utf-8');
      
      // استخراج URLها
      const urlRegex = /<loc>([^<]+)<\/loc>/g;
      const urls: string[] = [];
      let match;
      
      while ((match = urlRegex.exec(sitemapContent)) !== null) {
        urls.push(match[1]);
      }

      console.log(`📄 Found ${urls.length} URLs in sitemap`);

      // Pre-warm کردن URLها
      let warmed = 0;
      const batchSize = 5; // همزمان 5 URL
      
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        
        const promises = batch.map(async (url) => {
          try {
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Next-Rocket-Preloader/1.0'
              }
            });
            
            if (response.ok) {
              const html = await response.text();
              
              // ذخیره در کش
              await CacheManager.set(
                `page:${url}`,
                html,
                'page',
                3600 // 1 hour
              );
              
              warmed++;
              console.log(`✅ Warmed: ${url}`);
            }
          } catch (error) {
            console.error(`❌ Failed to warm: ${url}`);
          }
        });

        await Promise.all(promises);
        
        // کمی تاخیر برای جلوگیری از فشار زیاد
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Cache pre-warming completed: ${warmed}/${urls.length}`);

      return {
        success: true,
        warmed,
        total: urls.length
      };
    } catch (error: any) {
      console.error('❌ خطا در pre-warming:', error);
      return {
        success: false,
        warmed: 0,
        total: 0
      };
    }
  }

  /**
   * تولید Resource Hints
   */
  generateResourceHints(hints: {
    preconnect?: string[];
    dnsPrefetch?: string[];
    preload?: PreloadResource[];
    prefetch?: string[];
  }): string {
    const tags: string[] = [];

    // Preconnect
    hints.preconnect?.forEach(url => {
      tags.push(`<link rel="preconnect" href="${url}">`);
    });

    // DNS Prefetch
    hints.dnsPrefetch?.forEach(url => {
      tags.push(`<link rel="dns-prefetch" href="${url}">`);
    });

    // Preload
    hints.preload?.forEach(resource => {
      tags.push(this.generatePreloadTags([resource]));
    });

    // Prefetch
    hints.prefetch?.forEach(url => {
      tags.push(`<link rel="prefetch" href="${url}">`);
    });

    return tags.join('\n');
  }
}

export default PreloadSystem.getInstance();
