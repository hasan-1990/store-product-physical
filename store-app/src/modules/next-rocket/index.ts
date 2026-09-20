/**
 * Next Rocket Main Integration
 * لایه اصلی یکپارچه‌سازی تمام قابلیت‌ها
 */

import CriticalCSSGenerator from './core/critical-css';
import UnusedCSSRemover from './core/unused-css';
import CacheManager from './core/cache-manager';
import JavaScriptOptimizer from './core/javascript-optimizer';
import DatabaseOptimizer from './core/database-optimizer';
import CDNIntegration from './core/cdn-integration';
import PreloadSystem from './core/preload-system';
import MediaOptimizer from './core/media-optimizer';
import { NextRocketSettings } from './types';
import { DEFAULT_SETTINGS } from './config';

class NextRocket {
  private static instance: NextRocket;
  private settings: NextRocketSettings = DEFAULT_SETTINGS;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): NextRocket {
    if (!this.instance) {
      this.instance = new NextRocket();
    }
    return this.instance;
  }

  /**
   * مقداردهی اولیه با تنظیمات
   */
  async initialize(settings?: Partial<NextRocketSettings>): Promise<void> {
    if (this.initialized) {
      console.log('⚠️  Next Rocket already initialized');
      return;
    }

    // ترکیب تنظیمات
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...settings
    };

    console.log('🚀 Initializing Next Rocket...');

    // تنظیم CDN
    if (this.settings.cdn?.enabled) {
      CDNIntegration.configure({
        enabled: this.settings.cdn.enabled,
        provider: this.settings.cdn.provider as any,
        apiKey: this.settings.cdn.cloudflareSettings?.apiKey,
        zoneId: this.settings.cdn.cloudflareSettings?.zoneId,
        customUrl: this.settings.cdn.customCdnUrl
      });
      console.log('✅ CDN configured');
    }

    // تنظیم Preload
    if (this.settings.preload?.enabled) {
      PreloadSystem.configure({
        enabled: this.settings.preload.enabled,
        preloadFonts: true,
        preloadCriticalCSS: this.settings.preload.preloadLinks,
        preloadCriticalJS: this.settings.preload.preloadLinks,
        prefetchLinks: this.settings.preload.prefetchLinks,
        preconnectDomains: this.settings.preload.preconnect
      });
      console.log('✅ Preload System configured');
    }

    this.initialized = true;
    console.log('✅ Next Rocket initialized successfully');
  }

  /**
   * بهینه‌سازی یک صفحه HTML
   */
  async optimizePage(html: string, url: string): Promise<string> {
    if (!this.settings.enabled) {
      return html;
    }

    let optimizedHtml = html;

    try {
      // 1. Critical CSS
      if (this.settings.fileOptimization?.criticalCss) {
        const criticalCss = await CriticalCSSGenerator.generate(
          url,
          ['/styles/globals.css'] // این باید از تنظیمات بیاد
        );
        
        if (criticalCss.css) {
          optimizedHtml = this.injectCriticalCSS(optimizedHtml, criticalCss.css);
        }
      }

      // 2. Preload Tags
      if (this.settings.preload?.enabled) {
        optimizedHtml = PreloadSystem.injectPreloadTags(optimizedHtml);
      }

      // 3. Lazy Load Images
      if (this.settings.mediaOptimization?.lazyLoadImages) {
        optimizedHtml = MediaOptimizer.convertImagesToLazy(optimizedHtml, 2);
        optimizedHtml = MediaOptimizer.injectLazyLoadScript(optimizedHtml, {
          enabled: true,
          threshold: 0.1,
          rootMargin: '50px',
          loadingAttribute: true
        });
      }

      // 4. YouTube Previews
      if (this.settings.mediaOptimization?.youtubePreview) {
        optimizedHtml = MediaOptimizer.convertYouTubeToPreview(optimizedHtml);
      }

      // 5. CDN URL Rewriting
      if (this.settings.cdn?.enabled && this.settings.cdn.customCdnUrl) {
        optimizedHtml = CDNIntegration.rewriteUrls(optimizedHtml, this.settings.cdn.customCdnUrl);
      }

      // 6. JavaScript Optimization
      if (this.settings.javascript?.delayExecution) {
        optimizedHtml = JavaScriptOptimizer.injectDelayScript(
          optimizedHtml,
          this.settings.javascript.delayTimeout * 1000
        );
      }

      // 7. Prefetch Links
      if (this.settings.preload?.prefetchLinks) {
        const prefetchScript = PreloadSystem.generatePrefetchScript();
        optimizedHtml = this.injectBeforeBodyEnd(optimizedHtml, prefetchScript);
      }

      return optimizedHtml;
    } catch (error) {
      console.error('❌ خطا در بهینه‌سازی صفحه:', error);
      return html; // برگشت HTML اصلی در صورت خطا
    }
  }

  /**
   * بهینه‌سازی فایل CSS
   */
  async optimizeCSS(cssPath: string): Promise<void> {
    if (!this.settings.fileOptimization?.enabled) {
      return;
    }

    // حذف CSS استفاده نشده
    if (this.settings.fileOptimization.removeUnusedCss) {
      await UnusedCSSRemover.analyze([cssPath], []);
    }
  }

  /**
   * بهینه‌سازی فایل JavaScript
   */
  async optimizeJS(jsPath: string): Promise<void> {
    if (!this.settings.fileOptimization?.minifyJs) {
      return;
    }

    await JavaScriptOptimizer.minifyFile(jsPath);
  }

  /**
   * پاکسازی خودکار دیتابیس
   */
  async runDatabaseCleanup(): Promise<void> {
    if (!this.settings.database?.autoCleanup) {
      return;
    }

    console.log('🗑️  شروع پاکسازی دیتابیس...');
    
    const result = await DatabaseOptimizer.cleanup(90); // 90 روز پیش‌فرض
    
    console.log('✅ پاکسازی دیتابیس کامل شد:', result);
  }

  /**
   * بهینه‌سازی Indexهای دیتابیس
   */
  async optimizeDatabaseIndexes(): Promise<void> {
    console.log('🔧 بهینه‌سازی Indexها...');
    
    const result = await DatabaseOptimizer.optimizeIndexes();
    
    console.log('✅ بهینه‌سازی Indexها:', result.message);
  }

  /**
   * Pre-warming کش از Sitemap
   */
  async prewarmCacheFromSitemap(sitemapPath: string): Promise<void> {
    if (!this.settings.preload?.enabled) {
      return;
    }

    console.log('🔥 Pre-warming cache از sitemap...');
    
    const result = await PreloadSystem.prewarmFromSitemap(sitemapPath);
    
    console.log(`✅ Pre-warmed ${result.warmed}/${result.total} URLs`);
  }

  /**
   * Purge CDN Cache
   */
  async purgeCDN(files?: string[]): Promise<void> {
    if (!this.settings.cdn?.enabled) {
      console.log('⚠️  CDN غیرفعال است');
      return;
    }

    console.log('🗑️  Purging CDN cache...');
    
    const result = await CDNIntegration.purgeCache(files);
    
    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.error('❌', result.message);
    }
  }

  /**
   * دریافت آمار کلی
   */
  async getStats() {
    const [cacheStats, dbStats, cdnStatus] = await Promise.allSettled([
      CacheManager.getStats(),
      DatabaseOptimizer.analyzeCollections(),
      this.settings.cdn?.enabled ? CDNIntegration.checkStatus() : null
    ]);

    return {
      cache: cacheStats.status === 'fulfilled' ? cacheStats.value : null,
      database: dbStats.status === 'fulfilled' ? dbStats.value : null,
      cdn: cdnStatus.status === 'fulfilled' ? cdnStatus.value : null,
      settings: this.settings
    };
  }

  /**
   * آپدیت تنظیمات
   */
  updateSettings(newSettings: Partial<NextRocketSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings
    };

    // اعمال تنظیمات جدید
    if (newSettings.cdn) {
      CDNIntegration.configure({
        enabled: this.settings.cdn!.enabled,
        provider: this.settings.cdn!.provider as any,
        apiKey: this.settings.cdn!.cloudflareSettings?.apiKey,
        zoneId: this.settings.cdn!.cloudflareSettings?.zoneId,
        customUrl: this.settings.cdn!.customCdnUrl
      });
    }

    console.log('✅ تنظیمات آپدیت شد');
  }

  /**
   * Helper: درج Critical CSS
   */
  private injectCriticalCSS(html: string, css: string): string {
    const styleTag = `<style id="critical-css">${css}</style>`;
    const headEndIndex = html.indexOf('</head>');
    
    if (headEndIndex !== -1) {
      return html.slice(0, headEndIndex) + styleTag + html.slice(headEndIndex);
    }
    
    return html;
  }

  /**
   * Helper: درج قبل از </body>
   */
  private injectBeforeBodyEnd(html: string, content: string): string {
    const bodyEndIndex = html.indexOf('</body>');
    
    if (bodyEndIndex !== -1) {
      return html.slice(0, bodyEndIndex) + content + html.slice(bodyEndIndex);
    }
    
    return html;
  }

  /**
   * گرفتن تنظیمات فعلی
   */
  getSettings(): NextRocketSettings {
    return { ...this.settings };
  }

  /**
   * چک کردن وضعیت initialization
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export default NextRocket.getInstance();

// Export class for testing
export { NextRocket };
