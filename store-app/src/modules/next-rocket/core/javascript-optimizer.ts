/**
 * JavaScript Optimizer
 * بهینه‌سازی و تاخیر اجرای جاوااسکریپت
 */

// import { minify } from 'terser'; // Temporarily disabled - dependency removed
import fs from 'fs/promises';
import path from 'path';

export class JavaScriptOptimizer {
  private static instance: JavaScriptOptimizer;
  private delayedScripts: Set<string> = new Set();

  private constructor() {}

  static getInstance(): JavaScriptOptimizer {
    if (!this.instance) {
      this.instance = new JavaScriptOptimizer();
    }
    return this.instance;
  }

  /**
   * Minify کردن JavaScript
   * DISABLED: موقتاً غیرفعال است (Next.js 15 compatibility)
   */
  async minify(code: string, fileName?: string): Promise<{ code: string; map?: string; savings: number }> {
    console.log('⚠️ JavaScript Minify موقتاً غیرفعال است (Next.js 15 compatibility)');
    return { code, savings: 0 };
  }

  /**
   * Minify کردن فایل JavaScript
   * DISABLED: موقتاً غیرفعال است (Next.js 15 compatibility)
   */
  async minifyFile(inputPath: string, outputPath?: string): Promise<void> {
    console.log('⚠️ JavaScript Minify File موقتاً غیرفعال است (Next.js 15 compatibility)');
    return;
  }

  /**
   * تاخیر اجرای JavaScript (Delay Execution)
   */
  injectDelayScript(html: string, delayTimeout: number = 3000, excludeFiles: string[] = []): string {
    let modifiedHtml = html;

    // Script برای delay execution
    const delayScript = `
<script>
(function() {
  'use strict';
  
  var delayedScripts = [];
  var userInteracted = false;
  var delayTimeout = ${delayTimeout};
  
  // شناسایی تعامل کاربر
  var interactionEvents = ['mousedown', 'keydown', 'touchstart', 'touchmove', 'wheel'];
  
  function executeDelayedScripts() {
    if (userInteracted) return;
    userInteracted = true;
    
    delayedScripts.forEach(function(script) {
      var newScript = document.createElement('script');
      
      // کپی کردن تمام attributeها
      Array.from(script.attributes).forEach(function(attr) {
        if (attr.name !== 'data-delayed') {
          newScript.setAttribute(attr.name, attr.value);
        }
      });
      
      // کپی کردن محتوا
      if (script.textContent) {
        newScript.textContent = script.textContent;
      }
      
      script.parentNode.replaceChild(newScript, script);
    });
    
    delayedScripts = [];
  }
  
  // اجرا بعد از تعامل
  interactionEvents.forEach(function(event) {
    window.addEventListener(event, executeDelayedScripts, { once: true, passive: true });
  });
  
  // یا بعد از timeout
  setTimeout(executeDelayedScripts, delayTimeout);
  
  // یا بعد از load کامل صفحه
  if (document.readyState === 'complete') {
    setTimeout(executeDelayedScripts, 100);
  } else {
    window.addEventListener('load', function() {
      setTimeout(executeDelayedScripts, 100);
    });
  }
  
  // پیدا کردن scriptهای delayed
  document.addEventListener('DOMContentLoaded', function() {
    var scripts = document.querySelectorAll('script[data-delayed="true"]');
    delayedScripts = Array.from(scripts);
  });
})();
</script>`;

    // اضافه کردن script قبل از </body>
    modifiedHtml = modifiedHtml.replace('</body>', `${delayScript}</body>`);

    // تبدیل script های غیر‌critical به delayed
    const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    
    modifiedHtml = modifiedHtml.replace(scriptRegex, (match, attrs, content) => {
      // چک کردن exclude
      const shouldExclude = excludeFiles.some(file => match.includes(file));
      if (shouldExclude) {
        return match;
      }

      // چک کردن اگر قبلاً delayed یا async/defer باشه
      if (attrs.includes('data-delayed') || 
          attrs.includes('async') || 
          attrs.includes('defer') ||
          attrs.includes('type="module"')) {
        return match;
      }

      // چک کردن اگر critical باشه
      if (content && (
        content.includes('critical') ||
        content.length < 500 // scriptهای کوچک
      )) {
        return match;
      }

      // اضافه کردن data-delayed
      return match.replace('<script', '<script data-delayed="true"');
    });

    return modifiedHtml;
  }

  /**
   * Defer کردن JavaScript
   */
  deferScripts(html: string, excludeFiles: string[] = []): string {
    let modifiedHtml = html;

    const scriptRegex = /<script([^>]*?)src="([^"]+)"([^>]*)><\/script>/gi;

    modifiedHtml = modifiedHtml.replace(scriptRegex, (match, before, src, after) => {
      // چک کردن exclude
      const shouldExclude = excludeFiles.some(file => src.includes(file));
      if (shouldExclude) {
        return match;
      }

      // اگر قبلاً defer یا async داره
      if (match.includes('defer') || match.includes('async')) {
        return match;
      }

      // اضافه کردن defer
      return `<script${before}src="${src}"${after} defer></script>`;
    });

    return modifiedHtml;
  }

  /**
   * حذف console.log از production
   */
  removeConsoleLogs(code: string): string {
    return code.replace(/console\.(log|debug|info|warn)\([^)]*\);?/g, '');
  }

  /**
   * تبدیل jQuery به Vanilla JS (اختیاری)
   */
  removeJQueryMigrate(html: string): string {
    // حذف jQuery Migrate
    return html.replace(
      /<script[^>]*jquery-migrate[^>]*><\/script>/gi,
      ''
    );
  }

  /**
   * Preload کردن scriptهای مهم
   */
  preloadCriticalScripts(html: string, scripts: string[]): string {
    let preloadTags = '';

    for (const script of scripts) {
      preloadTags += `<link rel="preload" href="${script}" as="script">\n`;
    }

    return html.replace('</head>', `${preloadTags}</head>`);
  }

  /**
   * تحلیل سایز bundleها
   */
  async analyzeBundles(directory: string): Promise<Array<{ file: string; size: number; gzipSize: number }>> {
    const results: Array<{ file: string; size: number; gzipSize: number }> = [];

    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.name.endsWith('.js')) {
          const stats = await fs.stat(fullPath);
          
          // تخمین سایز gzip (معمولاً 30-40% سایز اصلی)
          const gzipSize = Math.floor(stats.size * 0.35);

          results.push({
            file: fullPath,
            size: stats.size,
            gzipSize,
          });
        }
      }
    }

    await scan(directory);
    return results;
  }

  /**
   * Code Splitting Suggestions
   */
  suggestCodeSplitting(bundles: Array<{ file: string; size: number }>): string[] {
    const suggestions: string[] = [];
    const largeThreshold = 250 * 1024; // 250KB

    for (const bundle of bundles) {
      if (bundle.size > largeThreshold) {
        suggestions.push(
          `⚠️  ${path.basename(bundle.file)} بزرگه (${(bundle.size / 1024).toFixed(0)} KB) - پیشنهاد: Code Splitting`
        );
      }
    }

    return suggestions;
  }

  /**
   * آمار کلی
   */
  async getStats(directory: string) {
    const bundles = await this.analyzeBundles(directory);
    
    const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
    const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
    const largestBundle = bundles.sort((a, b) => b.size - a.size)[0];

    return {
      totalBundles: bundles.length,
      totalSize,
      totalGzipSize,
      averageSize: totalSize / bundles.length,
      largestBundle: largestBundle ? {
        file: path.basename(largestBundle.file),
        size: largestBundle.size,
      } : null,
      suggestions: this.suggestCodeSplitting(bundles),
    };
  }
}

export default JavaScriptOptimizer.getInstance();
