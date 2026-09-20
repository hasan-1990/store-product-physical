/**
 * Media Optimization
 * بهینه‌سازی پیشرفته تصاویر و ویدیوها
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

interface LazyLoadConfig {
  enabled: boolean;
  threshold: number; // مثلا 200px
  rootMargin: string; // مثلا "50px"
  loadingAttribute: boolean; // استفاده از loading="lazy" native
}

interface ImageOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  format: string;
}

class MediaOptimizer {
  private static instance: MediaOptimizer;

  private constructor() {}

  static getInstance(): MediaOptimizer {
    if (!this.instance) {
      this.instance = new MediaOptimizer();
    }
    return this.instance;
  }

  /**
   * تزریق Lazy Loading Script
   */
  injectLazyLoadScript(html: string, config: LazyLoadConfig): string {
    if (!config.enabled) {
      return html;
    }

    const script = `
<script>
(function() {
  'use strict';
  
  // چک کردن پشتیبانی native lazy loading
  const supportsNativeLazyLoad = 'loading' in HTMLImageElement.prototype;
  
  if (${config.loadingAttribute} && supportsNativeLazyLoad) {
    // استفاده از native lazy loading
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.loading = 'lazy';
      img.src = img.dataset.src;
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
      }
    });
  } else {
    // استفاده از IntersectionObserver
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // بارگذاری تصویر
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          
          // حذف کلاس loading
          img.classList.remove('lazy-loading');
          img.classList.add('lazy-loaded');
          
          // توقف مشاهده
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '${config.rootMargin}',
      threshold: ${config.threshold}
    });
    
    // مشاهده تمام تصاویر lazy
    document.querySelectorAll('img[data-src], iframe[data-src]').forEach(element => {
      imageObserver.observe(element);
    });
  }
  
  // Background Images
  const bgObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const bgUrl = element.dataset.bg;
        
        if (bgUrl) {
          element.style.backgroundImage = \`url('\${bgUrl}')\`;
          element.classList.remove('lazy-bg');
          element.classList.add('lazy-bg-loaded');
        }
        
        observer.unobserve(element);
      }
    });
  }, {
    rootMargin: '${config.rootMargin}'
  });
  
  document.querySelectorAll('[data-bg]').forEach(element => {
    bgObserver.observe(element);
  });
})();
</script>

<style>
.lazy-loading {
  opacity: 0;
  transition: opacity 0.3s;
}

.lazy-loaded {
  opacity: 1;
}

.lazy-bg {
  background-color: #f0f0f0;
}
</style>`;

    // درج در انتهای body
    const bodyEndIndex = html.indexOf('</body>');
    if (bodyEndIndex !== -1) {
      return html.slice(0, bodyEndIndex) + script + html.slice(bodyEndIndex);
    }

    return html;
  }

  /**
   * تبدیل تگ‌های img به lazy load
   */
  convertImagesToLazy(html: string, skipFirst: number = 2): string {
    let imgCount = 0;
    
    return html.replace(/<img([^>]*)>/g, (match, attrs) => {
      imgCount++;
      
      // Skip کردن تصاویر اول (Above the fold)
      if (imgCount <= skipFirst) {
        return match;
      }
      
      // اگر از قبل data-src داره، skip کن
      if (attrs.includes('data-src')) {
        return match;
      }
      
      // استخراج src و srcset
      const srcMatch = attrs.match(/src=["']([^"']+)["']/);
      const srcsetMatch = attrs.match(/srcset=["']([^"']+)["']/);
      
      if (!srcMatch) {
        return match;
      }
      
      // جایگزینی src با data-src
      let newAttrs = attrs
        .replace(/src=["']([^"']+)["']/, 'data-src="$1" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E"');
      
      if (srcsetMatch) {
        newAttrs = newAttrs.replace(/srcset=["']([^"']+)["']/, 'data-srcset="$1"');
      }
      
      // اضافه کردن کلاس loading
      if (!newAttrs.includes('class=')) {
        newAttrs += ' class="lazy-loading"';
      } else {
        newAttrs = newAttrs.replace(/class=["']([^"']*)["']/, 'class="$1 lazy-loading"');
      }
      
      return `<img${newAttrs}>`;
    });
  }

  /**
   * تبدیل YouTube iframes به پیش‌نمایش
   */
  convertYouTubeToPreview(html: string): string {
    const youtubeRegex = /<iframe[^>]*src=["']https:\/\/www\.youtube\.com\/embed\/([^"'?]+)[^"']*["'][^>]*><\/iframe>/g;
    
    return html.replace(youtubeRegex, (match, videoId) => {
      return `
<div class="youtube-preview" data-video-id="${videoId}" style="position: relative; padding-bottom: 56.25%; cursor: pointer; background: #000;">
  <img 
    src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" 
    alt="YouTube Video Preview"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 68px; height: 48px; background: red; border-radius: 12px;">
    <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%">
      <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path>
      <path d="M 45,24 27,14 27,34" fill="#fff"></path>
    </svg>
  </div>
</div>
<script>
  document.querySelectorAll('.youtube-preview').forEach(preview => {
    preview.addEventListener('click', function() {
      const videoId = this.dataset.videoId;
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', 'https://www.youtube.com/embed/' + videoId + '?autoplay=1');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.position = 'absolute';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      this.innerHTML = '';
      this.appendChild(iframe);
    });
  });
</script>`;
    });
  }

  /**
   * تبدیل تصویر به WebP
   */
  async convertToWebP(inputPath: string, outputPath?: string, quality: number = 80): Promise<ImageOptimizationResult> {
    try {
      const input = await sharp(inputPath);
      const metadata = await input.metadata();
      const originalSize = (await fs.stat(inputPath)).size;

      const output = outputPath || inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

      await input
        .webp({ quality })
        .toFile(output);

      const optimizedSize = (await fs.stat(output)).size;
      const savings = originalSize - optimizedSize;

      console.log(`✅ تبدیل به WebP: ${path.basename(inputPath)}`);
      console.log(`   سایز اصلی: ${(originalSize / 1024).toFixed(2)} KB`);
      console.log(`   سایز WebP: ${(optimizedSize / 1024).toFixed(2)} KB`);
      console.log(`   صرفه‌جویی: ${((savings / originalSize) * 100).toFixed(1)}%`);

      return {
        originalSize,
        optimizedSize,
        savings,
        format: 'webp'
      };
    } catch (error: any) {
      console.error('❌ خطا در تبدیل WebP:', error);
      throw error;
    }
  }

  /**
   * بهینه‌سازی ابعاد تصویر
   */
  async optimizeImageDimensions(
    inputPath: string,
    outputPath: string,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<ImageOptimizationResult> {
    try {
      const input = await sharp(inputPath);
      const metadata = await input.metadata();
      const originalSize = (await fs.stat(inputPath)).size;

      // محاسبه ابعاد جدید
      let width = metadata.width!;
      let height = metadata.height!;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      await input
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(outputPath);

      const optimizedSize = (await fs.stat(outputPath)).size;
      const savings = originalSize - optimizedSize;

      return {
        originalSize,
        optimizedSize,
        savings,
        format: metadata.format || 'unknown'
      };
    } catch (error: any) {
      console.error('❌ خطا در بهینه‌سازی ابعاد:', error);
      throw error;
    }
  }

  /**
   * تولید Responsive Images (srcset)
   */
  async generateResponsiveImages(
    inputPath: string,
    outputDir: string,
    sizes: number[] = [320, 640, 960, 1280, 1920]
  ): Promise<string[]> {
    const outputPaths: string[] = [];
    const input = await sharp(inputPath);
    const metadata = await input.metadata();
    const basename = path.basename(inputPath, path.extname(inputPath));
    const ext = path.extname(inputPath);

    for (const size of sizes) {
      // Skip اگر تصویر از این سایز کوچکتر باشه
      if (metadata.width! < size) {
        continue;
      }

      const outputPath = path.join(outputDir, `${basename}-${size}w${ext}`);
      
      await input
        .clone()
        .resize(size, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(outputPath);

      outputPaths.push(outputPath);
      console.log(`✅ تولید تصویر ${size}w: ${path.basename(outputPath)}`);
    }

    return outputPaths;
  }

  /**
   * تولید تگ img با srcset
   */
  generateResponsiveImageTag(
    baseUrl: string,
    sizes: number[],
    alt: string = '',
    loading: 'lazy' | 'eager' = 'lazy'
  ): string {
    const srcset = sizes
      .map(size => `${baseUrl}-${size}w.jpg ${size}w`)
      .join(', ');

    return `<img 
      src="${baseUrl}-${sizes[Math.floor(sizes.length / 2)]}w.jpg" 
      srcset="${srcset}"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
      alt="${alt}"
      loading="${loading}"
      decoding="async"
    >`;
  }
}

export default MediaOptimizer.getInstance();
