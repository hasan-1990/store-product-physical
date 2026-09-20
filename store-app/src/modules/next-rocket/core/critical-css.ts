/**
 * Critical CSS Generator
 * استخراج و تولید Critical CSS برای above-the-fold content
 * 
 * ⚠️ DISABLED: Incompatible with Next.js 15
 * Dependencies (penthouse, clean-css) cause webpack polyfill conflicts
 */

// DISABLED: Commented out to prevent build errors
// import Penthouse from 'penthouse';
// import CleanCSS from 'clean-css';
import fs from 'fs/promises';
import path from 'path';
import { CriticalCssResult } from '../types';

export class CriticalCSSGenerator {
  private static instance: CriticalCSSGenerator;
  private cache: Map<string, CriticalCssResult> = new Map();

  private constructor() {}

  static getInstance(): CriticalCSSGenerator {
    if (!this.instance) {
      this.instance = new CriticalCSSGenerator();
    }
    return this.instance;
  }

  /**
   * تولید Critical CSS برای یک URL
   * DISABLED: موقتاً غیرفعال است (Next.js 15 compatibility)
   */
  async generate(url: string, cssFiles: string[]): Promise<CriticalCssResult> {
    console.log('⚠️ Critical CSS موقتاً غیرفعال است (Next.js 15 compatibility)');
    
    return {
      url,
      css: '',
      size: 0,
      originalSize: 0,
      savings: 0,
      generatedAt: new Date(),
    };
  }

  /**
   * تولید Critical CSS برای چندین صفحه
   * DISABLED: موقتاً غیرفعال است (Next.js 15 compatibility)
   */
  async generateBatch(urls: string[], cssFiles: string[]): Promise<Map<string, CriticalCssResult>> {
    console.log('⚠️ Critical CSS Batch موقتاً غیرفعال است (Next.js 15 compatibility)');
    return new Map<string, CriticalCssResult>();
  }

  /**
   * ذخیره Critical CSS در فایل
   * DISABLED: موقتاً غیرفعال است (Next.js 15 compatibility)
   */
  async save(url: string, outputPath: string): Promise<void> {
    console.log('⚠️ Critical CSS Save موقتاً غیرفعال است (Next.js 15 compatibility)');
    return;
  }

  /**
   * inline کردن Critical CSS در HTML
   */
  inlineIntoHtml(html: string, criticalCss: string): string {
    const styleTag = `<style id="critical-css">${criticalCss}</style>`;
    
    // اضافه کردن بعد از تگ <head>
    return html.replace('</head>', `${styleTag}</head>`);
  }

  /**
   * async کردن فایل‌های CSS غیر‌critical
   */
  makeNonCriticalAsync(html: string, excludeFiles: string[] = []): string {
    let modifiedHtml = html;

    // پیدا کردن تمام link tag های CSS
    const linkRegex = /<link([^>]*rel=["']stylesheet["'][^>]*)>/gi;
    
    modifiedHtml = modifiedHtml.replace(linkRegex, (match, attrs) => {
      // چک کردن که آیا این فایل در لیست exclude هست
      const shouldExclude = excludeFiles.some(file => match.includes(file));
      if (shouldExclude || match.includes('critical')) {
        return match;
      }

      // اضافه کردن media="print" و onload برای async loading
      if (!attrs.includes('media=')) {
        return match.replace(
          '<link',
          '<link media="print" onload="this.media=\'all\'; this.onload=null;"'
        );
      }

      return match;
    });

    // اضافه کردن noscript fallback
    modifiedHtml = modifiedHtml.replace(linkRegex, (match) => {
      if (match.includes('media="print"')) {
        return `${match}\n<noscript>${match.replace('media="print" onload="this.media=\'all\'; this.onload=null;"', '')}</noscript>`;
      }
      return match;
    });

    return modifiedHtml;
  }

  /**
   * چک کردن اعتبار کش
   */
  private isValid(result: CriticalCssResult): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 ساعت
    const age = Date.now() - result.generatedAt.getTime();
    return age < maxAge;
  }

  /**
   * پاک کردن کش
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  /**
   * دریافت آمار
   */
  getStats() {
    let totalSavings = 0;
    let totalOriginal = 0;

    this.cache.forEach((result) => {
      totalSavings += result.savings;
      totalOriginal += result.originalSize;
    });

    return {
      cachedUrls: this.cache.size,
      totalSavings,
      totalOriginal,
      savingsPercentage: totalOriginal > 0 
        ? (totalSavings / totalOriginal) * 100 
        : 0,
    };
  }
}

export default CriticalCSSGenerator.getInstance();
