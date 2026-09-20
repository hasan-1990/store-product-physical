import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

// بهینه‌سازی تصاویر و تبدیل به فرمت‌های مدرن
export async function POST() {
  try {
    const result = await optimizeAllImages();
    
    return NextResponse.json({
      success: true,
      optimizedCount: result.optimizedCount,
      savedSize: result.savedSize,
      formats: result.formats,
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

async function optimizeAllImages() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    
    // پیدا کردن تمام تصاویر JPEG و PNG
    const jpegPattern = path.join(publicDir, '**/*.{jpg,jpeg}');
    const pngPattern = path.join(publicDir, '**/*.png');
    
    const jpegFiles = await glob(jpegPattern.replace(/\\/g, '/'));
    const pngFiles = await glob(pngPattern.replace(/\\/g, '/'));
    
    let optimizedCount = 0;
    let savedSize = 0;
    let webpConverted = 0;
    let avifConverted = 0;
    let compressed = 0;
    
    // پردازش فایل‌های JPEG
    for (const imagePath of jpegFiles) {
      try {
        const originalStat = await fs.stat(imagePath);
        const originalSize = originalStat.size;
        
        const dir = path.dirname(imagePath);
        const name = path.basename(imagePath, path.extname(imagePath));
        
        // تبدیل به WebP
        const webpPath = path.join(dir, `${name}.webp`);
        await sharp(imagePath)
          .webp({ quality: 80, effort: 6 })
          .toFile(webpPath);
        
        webpConverted++;
        
        // تبدیل به AVIF (اگر Sharp پشتیبانی کند)
        try {
          const avifPath = path.join(dir, `${name}.avif`);
          await sharp(imagePath)
            .avif({ quality: 70, effort: 6 })
            .toFile(avifPath);
          
          avifConverted++;
        } catch (avifError) {
          console.warn('AVIF پشتیبانی نمی‌شود یا خطا:', avifError);
        }
        
        // فشرده‌سازی فایل اصلی
        const tempPath = imagePath + '.tmp';
        await sharp(imagePath)
          .jpeg({ quality: 85, progressive: true, mozjpeg: true })
          .toFile(tempPath);
        
        const compressedStat = await fs.stat(tempPath);
        if (compressedStat.size < originalSize) {
          await fs.rename(tempPath, imagePath);
          savedSize += originalSize - compressedStat.size;
          compressed++;
        } else {
          await fs.unlink(tempPath);
        }
        
        optimizedCount++;
        
      } catch (error) {
        console.warn(`خطا در بهینه‌سازی ${imagePath}:`, error);
      }
    }
    
    // پردازش فایل‌های PNG
    for (const imagePath of pngFiles) {
      try {
        const originalStat = await fs.stat(imagePath);
        const originalSize = originalStat.size;
        
        const dir = path.dirname(imagePath);
        const name = path.basename(imagePath, '.png');
        
        // تبدیل به WebP
        const webpPath = path.join(dir, `${name}.webp`);
        await sharp(imagePath)
          .webp({ quality: 90, effort: 6, lossless: false })
          .toFile(webpPath);
        
        webpConverted++;
        
        // فشرده‌سازی PNG
        const tempPath = imagePath + '.tmp';
        await sharp(imagePath)
          .png({ compressionLevel: 9, palette: true })
          .toFile(tempPath);
        
        const compressedStat = await fs.stat(tempPath);
        if (compressedStat.size < originalSize) {
          await fs.rename(tempPath, imagePath);
          savedSize += originalSize - compressedStat.size;
          compressed++;
        } else {
          await fs.unlink(tempPath);
        }
        
        optimizedCount++;
        
      } catch (error) {
        console.warn(`خطا در بهینه‌سازی ${imagePath}:`, error);
      }
    }
    
    return {
      optimizedCount,
      savedSize: Math.round(savedSize / 1024), // KB
      formats: {
        webpConverted,
        avifConverted,
        compressed
      }
    };
  } catch (error) {
    console.error('خطا در بهینه‌سازی دسته‌ای:', error);
    throw new Error('خطا در بهینه‌سازی تصاویر');
  }
}

// مثال کد واقعی بهینه‌سازی (برای آینده):
/*
async function optimizeImageWithSharp(inputPath: string, outputDir: string) {
  const sharp = require('sharp');
  const path = require('path');
  const fs = require('fs').promises;
  
  const filename = path.basename(inputPath, path.extname(inputPath));
  const webpPath = path.join(outputDir, `${filename}.webp`);
  const avifPath = path.join(outputDir, `${filename}.avif`);
  
  // تبدیل به WebP
  await sharp(inputPath)
    .webp({ quality: 80 })
    .toFile(webpPath);
  
  // تبدیل به AVIF
  await sharp(inputPath)
    .avif({ quality: 70 })
    .toFile(avifPath);
  
  // فشرده‌سازی فایل اصلی
  if (path.extname(inputPath).toLowerCase() === '.jpg' || path.extname(inputPath).toLowerCase() === '.jpeg') {
    await sharp(inputPath)
      .jpeg({ quality: 85, progressive: true })
      .toFile(inputPath);
  } else if (path.extname(inputPath).toLowerCase() === '.png') {
    await sharp(inputPath)
      .png({ compressionLevel: 9 })
      .toFile(inputPath);
  }
  
  return {
    original: inputPath,
    webp: webpPath,
    avif: avifPath
  };
}
*/