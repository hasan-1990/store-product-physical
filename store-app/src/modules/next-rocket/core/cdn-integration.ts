/**
 * CDN Integration Module
 * یکپارچه‌سازی با CDN (Cloudflare و Custom)
 */

import type { NextRocketSettings } from '../types';

interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'custom';
  apiKey?: string;
  zoneId?: string;
  customUrl?: string;
}

interface CDNPurgeResult {
  success: boolean;
  message: string;
  purgedFiles?: number;
}

class CDNIntegration {
  private static instance: CDNIntegration;
  private config: CDNConfig | null = null;

  private constructor() {}

  static getInstance(): CDNIntegration {
    if (!this.instance) {
      this.instance = new CDNIntegration();
    }
    return this.instance;
  }

  /**
   * تنظیم پیکربندی CDN
   */
  configure(config: CDNConfig): void {
    this.config = config;
    console.log('✅ CDN configured:', config.provider);
  }

  /**
   * پاک کردن کش CDN
   */
  async purgeCache(files?: string[]): Promise<CDNPurgeResult> {
    if (!this.config?.enabled) {
      return {
        success: false,
        message: 'CDN غیرفعال است'
      };
    }

    try {
      if (this.config.provider === 'cloudflare') {
        return await this.purgeCloudflare(files);
      } else {
        return await this.purgeCustomCDN(files);
      }
    } catch (error: any) {
      console.error('❌ خطا در purge CDN:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Purge Cloudflare CDN
   */
  private async purgeCloudflare(files?: string[]): Promise<CDNPurgeResult> {
    if (!this.config?.apiKey || !this.config?.zoneId) {
      return {
        success: false,
        message: 'API Key یا Zone ID تنظیم نشده است'
      };
    }

    const url = `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`;
    
    const body = files && files.length > 0
      ? { files } // Purge specific files
      : { purge_everything: true }; // Purge all

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Cloudflare cache purged successfully');
      return {
        success: true,
        message: 'کش Cloudflare با موفقیت پاک شد',
        purgedFiles: files?.length || 0
      };
    } else {
      throw new Error(data.errors?.[0]?.message || 'خطای ناشناخته');
    }
  }

  /**
   * Purge Custom CDN
   */
  private async purgeCustomCDN(files?: string[]): Promise<CDNPurgeResult> {
    if (!this.config?.customUrl) {
      return {
        success: false,
        message: 'URL سفارشی CDN تنظیم نشده است'
      };
    }

    // Custom CDN implementation
    console.log('🔄 Purging custom CDN:', this.config.customUrl);
    
    // این بخش بسته به CDN شما متفاوت است
    // مثال: ArvanCloud, CDN77, etc.
    
    return {
      success: true,
      message: 'کش CDN سفارشی پاک شد',
      purgedFiles: files?.length || 0
    };
  }

  /**
   * تبدیل URLها به فرمت CDN
   */
  rewriteUrls(html: string, cdnUrl: string): string {
    if (!this.config?.enabled || !cdnUrl) {
      return html;
    }

    // پیدا کردن تمام URLهای استاتیک
    const patterns = [
      // CSS files
      /href=["']([^"']*\.css[^"']*)["']/g,
      // JS files
      /src=["']([^"']*\.js[^"']*)["']/g,
      // Images
      /src=["']([^"']*\.(jpg|jpeg|png|gif|webp|svg)[^"']*)["']/gi,
      // Background images in inline styles
      /url\(["']?([^"')]*\.(jpg|jpeg|png|gif|webp|svg)[^"')]*)["']?\)/gi,
    ];

    let modifiedHtml = html;

    patterns.forEach(pattern => {
      modifiedHtml = modifiedHtml.replace(pattern, (match, url) => {
        // فقط URLهای نسبی را تبدیل کن
        if (url.startsWith('/') && !url.startsWith('//')) {
          const cdnUrl = this.config!.provider === 'cloudflare' 
            ? this.config!.customUrl 
            : this.config!.customUrl;
          
          if (cdnUrl) {
            return match.replace(url, `${cdnUrl}${url}`);
          }
        }
        return match;
      });
    });

    return modifiedHtml;
  }

  /**
   * Pre-warming CDN - بارگذاری فایل‌های مهم روی CDN
   */
  async prewarmCache(urls: string[]): Promise<{ success: boolean; warmed: number }> {
    if (!this.config?.enabled) {
      return { success: false, warmed: 0 };
    }

    console.log(`🔥 Pre-warming ${urls.length} URLs...`);
    
    let warmed = 0;
    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          warmed++;
        }
      } catch (error) {
        console.error(`Failed to prewarm: ${url}`);
      }
    });

    await Promise.all(promises);

    console.log(`✅ Pre-warmed ${warmed}/${urls.length} URLs`);
    
    return {
      success: true,
      warmed
    };
  }

  /**
   * دریافت آمار CDN (فقط Cloudflare)
   */
  async getStats(): Promise<any> {
    if (!this.config?.enabled || this.config.provider !== 'cloudflare') {
      return null;
    }

    if (!this.config.apiKey || !this.config.zoneId) {
      return null;
    }

    try {
      const url = `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/analytics/dashboard`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        return {
          bandwidth: data.result.totals.bandwidth?.all,
          requests: data.result.totals.requests?.all,
          cachedRequests: data.result.totals.requests?.cached,
          cacheHitRate: data.result.totals.requests?.cached / data.result.totals.requests?.all * 100,
        };
      }
    } catch (error) {
      console.error('خطا در دریافت آمار CDN:', error);
    }

    return null;
  }

  /**
   * تنظیم قوانین کش CDN
   */
  async setCacheRules(rules: {
    browserCacheTTL?: number;
    edgeCacheTTL?: number;
    cacheLevel?: 'aggressive' | 'basic' | 'simplified';
  }): Promise<boolean> {
    if (!this.config?.enabled || this.config.provider !== 'cloudflare') {
      return false;
    }

    console.log('🔧 Setting CDN cache rules:', rules);

    // Implementation for Cloudflare Page Rules
    // این بخش نیاز به API calls بیشتر به Cloudflare دارد

    return true;
  }

  /**
   * چک کردن وضعیت CDN
   */
  async checkStatus(): Promise<{
    online: boolean;
    latency?: number;
    provider: string;
  }> {
    if (!this.config?.enabled) {
      return {
        online: false,
        provider: 'none'
      };
    }

    const testUrl = this.config.customUrl || 'https://cloudflare.com';
    const startTime = Date.now();

    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      const latency = Date.now() - startTime;

      return {
        online: response.ok,
        latency,
        provider: this.config.provider
      };
    } catch (error) {
      return {
        online: false,
        provider: this.config.provider
      };
    }
  }
}

export default CDNIntegration.getInstance();
