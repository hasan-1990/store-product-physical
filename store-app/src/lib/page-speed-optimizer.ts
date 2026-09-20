/**
 * کتابخانه بهینه‌سازی تصاویر و Lazy Loading
 * Image Optimization and Lazy Loading Library
 */

export interface ImageOptimizationOptions {
  quality?: number;
  progressive?: boolean;
  formats?: ('webp' | 'avif' | 'jpeg' | 'png')[];
  sizes?: number[];
  lazy?: boolean;
  placeholder?: boolean;
}

export interface ImageAnalysisResult {
  path: string;
  originalSize: number;
  optimizedSize: number;
  format: string;
  dimensions: { width: number; height: number };
  hasAltText?: boolean;
  hasLazyLoading?: boolean;
  compressionRatio: number;
}

export interface PageSpeedMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay  
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  score: number;
  suggestions: string[];
}

/**
 * تحلیل تصاویر موجود در سایت
 */
export class ImageAnalyzer {
  
  /**
   * اسکن تمام تصاویر در مسیر مشخص شده
   */
  static async scanImages(directory: string): Promise<ImageAnalysisResult[]> {
    // در حالت واقعی اینجا از fs و path استفاده می‌شود
    const mockResults: ImageAnalysisResult[] = [
      {
        path: '/images/hero-banner.jpg',
        originalSize: 850000, // 850KB
        optimizedSize: 320000, // 320KB
        format: 'jpeg',
        dimensions: { width: 1920, height: 1080 },
        hasAltText: true,
        hasLazyLoading: false,
        compressionRatio: 0.62
      },
      {
        path: '/images/product-1.png',
        originalSize: 450000, // 450KB
        optimizedSize: 180000, // 180KB
        format: 'png',
        dimensions: { width: 800, height: 600 },
        hasAltText: false,
        hasLazyLoading: true,
        compressionRatio: 0.40
      }
    ];
    
    return mockResults;
  }

  /**
   * تحلیل تصاویر بدون Alt Text
   */
  static async findImagesWithoutAlt(htmlContent?: string): Promise<string[]> {
    if (!htmlContent) return [];
    
    const imgRegex = /<img[^>]*>/g;
    const images = htmlContent.match(imgRegex) || [];
    
    return images.filter(img => !img.includes('alt='));
  }

  /**
   * تحلیل تصاویر بدون Lazy Loading
   */
  static async findImagesWithoutLazy(htmlContent?: string): Promise<string[]> {
    if (!htmlContent) return [];
    
    const imgRegex = /<img[^>]*>/g;
    const images = htmlContent.match(imgRegex) || [];
    
    return images.filter(img => !img.includes('loading="lazy"'));
  }
}

/**
 * بهینه‌ساز تصاویر
 */
export class ImageOptimizer {
  
  /**
   * بهینه‌سازی تصویر واحد
   */
  static async optimizeImage(
    inputPath: string, 
    outputPath: string, 
    options: ImageOptimizationOptions = {}
  ): Promise<ImageAnalysisResult> {
    const {
      quality = 75, // کیفیت بالا برای تصاویر بهتر
      progressive = true,
      formats = ['webp', 'avif'], // AVIF برای کیفیت عالی + WebP برای سازگاری
      lazy = true
    } = options;

    // شبیه‌سازی بهینه‌سازی
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      path: outputPath,
      originalSize: 500000,
      optimizedSize: 200000,
      format: formats[0],
      dimensions: { width: 800, height: 600 },
      hasLazyLoading: lazy,
      compressionRatio: 0.6
    };
  }

  /**
   * تبدیل دسته‌ای تصاویر به فرمت‌های مدرن
   */
  static async batchOptimize(
    inputDir: string,
    outputDir: string,
    options: ImageOptimizationOptions = {}
  ): Promise<ImageAnalysisResult[]> {
    // شبیه‌سازی پردازش دسته‌ای
    const results: ImageAnalysisResult[] = [];
    
    // فرض کنیم 10 تصویر داریم
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      results.push({
        path: `${outputDir}/image-${i}.webp`,
        originalSize: 400000 + (i * 50000),
        optimizedSize: 150000 + (i * 20000),
        format: 'webp',
        dimensions: { width: 800, height: 600 },
        hasLazyLoading: true,
        compressionRatio: 0.65
      });
    }
    
    return results;
  }

  /**
   * تولید پیش‌نمایش (placeholder) برای تصاویر
   */
  static async generatePlaceholder(imagePath: string): Promise<string> {
    // تولید placeholder blur base64
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyEH1fLjMbyLyJ1LxkS0qxgqW';
  }
}

/**
 * مدیر Lazy Loading
 */
export class LazyLoadingManager {
  
  /**
   * فعال‌سازی Lazy Loading برای عنصر
   */
  static enableLazyLoading(element: HTMLImageElement): void {
    if (!element.hasAttribute('loading')) {
      element.setAttribute('loading', 'lazy');
    }
  }

  /**
   * فعال‌سازی Lazy Loading برای تمام تصاویر صفحه
   */
  static enableLazyLoadingForPage(): void {
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => this.enableLazyLoading(img as HTMLImageElement));
  }

  /**
   * بررسی پشتیبانی مرورگر از Lazy Loading
   */
  static isLazyLoadingSupported(): boolean {
    return 'loading' in HTMLImageElement.prototype;
  }

  /**
   * Intersection Observer برای Lazy Loading سفارشی
   */
  static createIntersectionObserver(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    return new IntersectionObserver(callback, options);
  }
}

/**
 * تحلیلگر سرعت صفحه
 */
export class PageSpeedAnalyzer {
  
  /**
   * اندازه‌گیری Core Web Vitals
   */
  static async measureCoreWebVitals(): Promise<PageSpeedMetrics> {
    return new Promise((resolve) => {
      // شبیه‌سازی اندازه‌گیری
      setTimeout(() => {
        resolve({
          lcp: 2.1,
          fid: 85,
          cls: 0.12,
          fcp: 1.8,
          ttfb: 0.6,
          score: 78,
          suggestions: [
            'بهینه‌سازی تصاویر',
            'فعال‌سازی فشرده‌سازی',
            'کاهش JavaScript'
          ]
        });
      }, 1000);
    });
  }

  /**
   * تحلیل عملکرد تصاویر
   */
  static analyzeImagePerformance(): {
    totalImages: number;
    unoptimizedImages: number;
    missingLazyLoad: number;
    potentialSavings: number;
  } {
    const images = document.querySelectorAll('img');
    const unoptimizedImages = Array.from(images).filter(img => {
      const src = img.src;
      return !src.includes('.webp') && !src.includes('.avif');
    });

    const missingLazyLoad = Array.from(images).filter(img => {
      return !img.hasAttribute('loading');
    });

    return {
      totalImages: images.length,
      unoptimizedImages: unoptimizedImages.length,
      missingLazyLoad: missingLazyLoad.length,
      potentialSavings: Math.round((unoptimizedImages.length / images.length) * 100)
    };
  }

  /**
   * پیشنهادات بهینه‌سازی
   */
  static generateOptimizationSuggestions(metrics: PageSpeedMetrics): string[] {
    const suggestions: string[] = [];

    if (metrics.lcp > 2.5) {
      suggestions.push('بهینه‌سازی Largest Contentful Paint با فشرده‌سازی تصاویر');
    }

    if (metrics.fid > 100) {
      suggestions.push('کاهش First Input Delay با بهینه‌سازی JavaScript');
    }

    if (metrics.cls > 0.1) {
      suggestions.push('کاهش Cumulative Layout Shift با تعیین ابعاد تصاویر');
    }

    if (metrics.fcp > 1.8) {
      suggestions.push('بهبود First Contentful Paint با بهینه‌سازی CSS');
    }

    if (metrics.ttfb > 0.8) {
      suggestions.push('بهبود Time to First Byte با بهینه‌سازی سرور');
    }

    return suggestions;
  }
}

/**
 * ابزارهای کمکی
 */
export class ImageUtils {
  
  /**
   * تشخیص فرمت تصویر از URL
   */
  static getImageFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  /**
   * محاسبه نسبت فشرده‌سازی
   */
  static calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  }

  /**
   * تبدیل بایت به فرمت قابل خواندن
   */
  static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * بررسی پشتیبانی فرمت تصویر در مرورگر
   */
  static async supportsImageFormat(format: 'webp' | 'avif'): Promise<boolean> {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob !== null);
      }, `image/${format}`);
    });
  }
}

/**
 * کنترلر اصلی بهینه‌سازی صفحه
 */
export class PageOptimizationController {
  
  /**
   * اجرای کامل بهینه‌سازی صفحه
   */
  static async optimizePage(): Promise<{
    imagesOptimized: number;
    lazyLoadingEnabled: boolean;
    performanceScore: number;
    suggestions: string[];
  }> {
    // فعال‌سازی Lazy Loading
    LazyLoadingManager.enableLazyLoadingForPage();
    
    // تحلیل عملکرد
    const metrics = await PageSpeedAnalyzer.measureCoreWebVitals();
    const imagePerf = PageSpeedAnalyzer.analyzeImagePerformance();
    const suggestions = PageSpeedAnalyzer.generateOptimizationSuggestions(metrics);

    return {
      imagesOptimized: imagePerf.unoptimizedImages,
      lazyLoadingEnabled: imagePerf.missingLazyLoad === 0,
      performanceScore: metrics.score,
      suggestions
    };
  }

  /**
   * گزارش کامل وضعیت بهینه‌سازی
   */
  static async generateOptimizationReport(): Promise<{
    images: any;
    performance: PageSpeedMetrics;
    recommendations: string[];
  }> {
    const imageAnalysis = PageSpeedAnalyzer.analyzeImagePerformance();
    const performance = await PageSpeedAnalyzer.measureCoreWebVitals();
    const recommendations = PageSpeedAnalyzer.generateOptimizationSuggestions(performance);

    return {
      images: imageAnalysis,
      performance,
      recommendations
    };
  }
}