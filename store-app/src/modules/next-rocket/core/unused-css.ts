/**
 * Unused CSS Remover
 * حذف CSS استفاده نشده با PurgeCSS
 */

// import { PurgeCSS } from 'purgecss'; // Temporarily disabled - dependency removed
import fs from 'fs/promises';
import path from 'path';
import { UnusedCssResult } from '../types';

export class UnusedCSSRemover {
  private static instance: UnusedCSSRemover;

  private constructor() {}

  static getInstance(): UnusedCSSRemover {
    if (!this.instance) {
      this.instance = new UnusedCSSRemover();
    }
    return this.instance;
  }

  /**
   * تحلیل و حذف CSS استفاده نشده
   * DISABLED: موقتاً غیرفعال است (Next.js 15 compatibility)
   */
  async analyze(cssFiles: string[], contentFiles: string[]): Promise<UnusedCssResult[]> {
    console.log('⚠️ Unused CSS Analysis موقتاً غیرفعال است (Next.js 15 compatibility)');
    return [];
  }

  /**
   * حذف unused CSS و ذخیره فایل‌های جدید
   * DISABLED: موقتاً غیرفعال است (Next.js 15 compatibility)
   */
  async removeAndSave(
    cssFiles: string[],
    contentFiles: string[],
    outputDir: string
  ): Promise<UnusedCssResult[]> {
    console.log('⚠️ Unused CSS Remove موقتاً غیرفعال است (Next.js 15 compatibility)');
    return [];
  }



  /**
   * لیست کلاس‌ها و selectorهایی که نباید حذف بشن
   */
  private getSafelist(): (string | RegExp)[] {
    return [
      // Tailwind
      /^(hover|focus|active|group-hover|sm|md|lg|xl|2xl):/,
      
      // React/Next.js
      'hydrated',
      'server-rendered',
      '__next',
      
      // Animation classes
      /^animate-/,
      /^transition-/,
      
      // Dynamic classes
      /^data-/,
      /^aria-/,
      
      // توابع CSS
      /^:not/,
      /^:where/,
      /^:is/,
      
      // کلاس‌های داینامیک احتمالی
      'active',
      'open',
      'closed',
      'visible',
      'hidden',
      'show',
      'hide',
      'error',
      'success',
      'warning',
      'loading',
      
      // Swiper/Sliders
      /^swiper-/,
      /^slick-/,
      
      // Icons
      /^icon-/,
      /^fa-/,
    ];
  }

  /**
   * لیست selectorهایی که حتماً باید حذف بشن
   */
  private getBlocklist(): string[] {
    return [
      // Debug classes
      '.debug',
      '.test',
      '.temp',
      
      // Old browser support
      '.ie',
      '.ie11',
      '.edge',
    ];
  }

  /**
   * تحلیل یک فایل CSS خاص
   */
  async analyzeFile(
    cssFile: string,
    contentFiles: string[]
  ): Promise<UnusedCssResult> {
    const results = await this.analyze([cssFile], contentFiles);
    return results[0];
  }

  /**
   * دریافت آمار کلی
   */
  async getStats(results: UnusedCssResult[]) {
    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalUsed = results.reduce((sum, r) => sum + r.usedSize, 0);
    const totalUnused = results.reduce((sum, r) => sum + r.unusedSize, 0);
    const totalSelectors = results.reduce((sum, r) => sum + r.unusedSelectors.length, 0);

    return {
      filesAnalyzed: results.length,
      totalOriginalSize: totalOriginal,
      totalUsedSize: totalUsed,
      totalUnusedSize: totalUnused,
      totalSavings: totalUnused,
      savingsPercentage: (totalUnused / totalOriginal) * 100,
      unusedSelectorsCount: totalSelectors,
      averageSavings: totalUnused / results.length,
    };
  }

  /**
   * پیدا کردن تمام فایل‌های CSS در پروژه
   */
  async findCssFiles(directory: string): Promise<string[]> {
    const files: string[] = [];

    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and .next
          if (!['node_modules', '.next', '.git'].includes(entry.name)) {
            await scan(fullPath);
          }
        } else if (entry.name.endsWith('.css')) {
          files.push(fullPath);
        }
      }
    }

    await scan(directory);
    return files;
  }

  /**
   * پیدا کردن تمام فایل‌های محتوا (HTML, JSX, TSX)
   */
  async findContentFiles(directory: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.html', '.jsx', '.tsx', '.js', '.ts'];

    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
            await scan(fullPath);
          }
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }

    await scan(directory);
    return files;
  }
}

export default UnusedCSSRemover.getInstance();
