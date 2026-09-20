import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

// تحلیل تصاویر موجود در سایت
export async function GET() {
  try {
    // در اینجا می‌توانید اطلاعات واقعی تصاویر را از دیتابیس یا فایل‌سیستم بخوانید
    // برای نمایش، از داده‌های نمونه استفاده می‌کنیم
    
    const imageAnalysis = await analyzeImages();
    
    return NextResponse.json(imageAnalysis);
  } catch (error) {
    console.error('خطا در تحلیل تصاویر:', error);
    return NextResponse.json(
      { error: 'خطا در تحلیل تصاویر' },
      { status: 500 }
    );
  }
}

// بهینه‌سازی تصاویر
export async function POST() {
  try {
    // در اینجا منطق بهینه‌سازی تصاویر قرار می‌گیرد
    // می‌توانید از کتابخانه‌هایی مثل Sharp استفاده کنید
    
    const optimizationResult = await optimizeImages();
    
    return NextResponse.json({
      success: true,
      optimizedCount: optimizationResult.optimizedCount,
      savedSize: optimizationResult.savedSize,
      message: 'تصاویر با موفقیت بهینه‌سازی شدند'
    });
  } catch (error) {
    console.error('خطا در بهینه‌سازی تصاویر:', error);
    return NextResponse.json(
      { error: 'خطا در بهینه‌سازی تصاویر' },
      { status: 500 }
    );
  }
}

async function analyzeImages() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    
    // استفاده از glob برای پیدا کردن تمام فایل‌های تصویری
    const imagePattern = path.join(publicDir, '**/*.{jpg,jpeg,png,gif,webp,avif}');
    const imagePaths = await glob(imagePattern.replace(/\\/g, '/'));
    
    const imageFiles = [];
    
    for (const imagePath of imagePaths) {
      try {
        const stat = await fs.stat(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        const relativePath = path.relative(publicDir, imagePath);
        
        // بررسی ابعاد تصویر با Sharp
        let metadata = null;
        try {
          metadata = await sharp(imagePath).metadata();
        } catch (error) {
          console.warn(`خطا در خواندن متادیتا ${imagePath}:`, error);
        }
        
        imageFiles.push({
          path: '/' + relativePath.replace(/\\/g, '/'),
          name: path.basename(imagePath),
          extension: ext,
          size: stat.size,
          width: metadata?.width || 0,
          height: metadata?.height || 0,
          format: metadata?.format || ext.slice(1),
          isOptimized: ['.webp', '.avif'].includes(ext) || stat.size < 100000
        });
      } catch (error) {
        console.warn(`خطا در پردازش فایل ${imagePath}:`, error);
      }
    }
    
    const totalSize = imageFiles.reduce((sum, img) => sum + img.size, 0);
    const optimizedFiles = imageFiles.filter(img => img.isOptimized);
    const optimizedSize = optimizedFiles.reduce((sum, img) => sum + img.size, 0);
    
    const analysis = {
      totalImages: imageFiles.length,
      optimizedImages: optimizedFiles.length,
      unoptimizedImages: imageFiles.length - optimizedFiles.length,
      totalSize: totalSize / (1024 * 1024), // MB
      optimizedSize: optimizedSize / (1024 * 1024), // MB
      savingsPotential: totalSize > 0 ? Math.round(((totalSize - optimizedSize) / totalSize) * 100) : 0,
      lazyLoadEnabled: 0, // باید از HTML صفحات بررسی شود
      missingAlt: 0, // باید از HTML صفحات بررسی شود
      formats: {
        jpeg: imageFiles.filter(img => ['.jpg', '.jpeg'].includes(img.extension)).length,
        png: imageFiles.filter(img => img.extension === '.png').length,
        webp: imageFiles.filter(img => img.extension === '.webp').length,
        avif: imageFiles.filter(img => img.extension === '.avif').length
      },
      largestImages: imageFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .map(img => ({
          path: img.path,
          size: (img.size / 1024).toFixed(1) + ' KB',
          dimensions: `${img.width}×${img.height}`
        }))
    };
    
    return analysis;
  } catch (error) {
    console.error('خطا در تحلیل تصاویر:', error);
    // داده‌های پیش‌فرض در صورت خطا
    return {
      totalImages: 0,
      optimizedImages: 0,
      unoptimizedImages: 0,
      totalSize: 0,
      optimizedSize: 0,
      savingsPotential: 0,
      lazyLoadEnabled: 0,
      missingAlt: 0,
      formats: {
        jpeg: 0,
        png: 0,
        webp: 0,
        avif: 0
      },
      largestImages: []
    };
  }
}

async function scanForImages(dir: string, extensions: string[]): Promise<any[]> {
  try {
    const files = await fs.readdir(dir);
    const imageFiles = [];
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        const subImages = await scanForImages(filePath, extensions);
        imageFiles.push(...subImages);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (extensions.includes(ext)) {
          imageFiles.push({
            path: filePath,
            name: file,
            extension: ext,
            size: stat.size,
            isOptimized: ['.webp', '.avif'].includes(ext) || stat.size < 100000 // فایل‌های کمتر از 100KB یا فرمت‌های مدرن
          });
        }
      }
    }
    
    return imageFiles;
  } catch (error) {
    console.error('خطا در اسکن تصاویر:', error);
    return [];
  }
}

async function optimizeImages() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const imagePattern = path.join(publicDir, '**/*.{jpg,jpeg,png}');
    const imagePaths = await glob(imagePattern.replace(/\\/g, '/'));
    
    let optimizedCount = 0;
    let savedSize = 0;
    
    for (const imagePath of imagePaths) {
      try {
        const originalStat = await fs.stat(imagePath);
        const originalSize = originalStat.size;
        
        // تولید نام فایل‌های خروجی
        const dir = path.dirname(imagePath);
        const name = path.basename(imagePath, path.extname(imagePath));
        const webpPath = path.join(dir, `${name}.webp`);
        
        // تبدیل به WebP
        await sharp(imagePath)
          .webp({ quality: 80, effort: 6 })
          .toFile(webpPath);
        
        // بررسی اندازه فایل جدید
        const webpStat = await fs.stat(webpPath);
        const webpSize = webpStat.size;
        
        if (webpSize < originalSize) {
          savedSize += originalSize - webpSize;
          optimizedCount++;
        }
        
        // اگر فایل اصلی JPEG است، آن را نیز فشرده کنیم
        const ext = path.extname(imagePath).toLowerCase();
        if (['.jpg', '.jpeg'].includes(ext)) {
          await sharp(imagePath)
            .jpeg({ quality: 85, progressive: true, mozjpeg: true })
            .toFile(imagePath + '.tmp');
          
          await fs.rename(imagePath + '.tmp', imagePath);
        }
        
      } catch (error) {
        console.warn(`خطا در بهینه‌سازی ${imagePath}:`, error);
      }
    }
    
    return {
      optimizedCount,
      savedSize: Math.round(savedSize / 1024) // KB
    };
  } catch (error) {
    console.error('خطا در بهینه‌سازی تصاویر:', error);
    throw new Error('خطا در بهینه‌سازی تصاویر');
  }
}