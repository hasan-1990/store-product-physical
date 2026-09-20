import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

/**
 * API مرکزی برای حذف تمام انواع عکس‌ها
 * - حذف فایل فیزیکی از سرور
 * - حذف آدرس از دیتابیس (محصولات، بنرها، بلاگ‌ها، اسلایدرها)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, type, documentId } = body;

    console.log('🗑️ درخواست حذف عکس:', { imageUrl, type, documentId });

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'آدرس عکس الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const results = {
      fileDeleted: false,
      databaseUpdated: false,
      relatedFilesDeleted: 0,
      message: ''
    };

    // 1️⃣ حذف فایل فیزیکی از سرور
    const fileName = imageUrl.split('/').pop();
    if (fileName) {
      // تشخیص نوع پوشه از URL
      let uploadDir = '';
      if (imageUrl.includes('/uploads/products/')) {
        uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      } else if (imageUrl.includes('/uploads/blog/')) {
        uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
      } else if (imageUrl.includes('/uploads/banners/')) {
        uploadDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
      } else if (imageUrl.includes('/uploads/sliders/')) {
        uploadDir = path.join(process.cwd(), 'public', 'uploads', 'sliders');
      } else if (imageUrl.includes('/images/blog/')) {
        uploadDir = path.join(process.cwd(), 'public', 'images', 'blog');
      } else if (imageUrl.includes('/images/banners/')) {
        uploadDir = path.join(process.cwd(), 'public', 'images', 'banners');
      } else {
        uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      }

      const filePath = path.join(uploadDir, fileName);

      // حذف فایل اصلی
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        results.fileDeleted = true;
        console.log('✅ فایل اصلی حذف شد:', fileName);
      } else {
        console.log('⚠️ فایل اصلی یافت نشد:', filePath);
      }

      // حذف نسخه‌های مختلف فایل (thumbnails, optimized, etc.)
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      
      const patterns = [
        `${nameWithoutExt}_thumb${ext}`,
        `${nameWithoutExt}_small${ext}`,
        `${nameWithoutExt}_medium${ext}`,
        `${nameWithoutExt}_large${ext}`,
        `${nameWithoutExt}_optimized${ext}`,
        `thumb_${fileName}`,
        `optimized_${fileName}`,
        `${nameWithoutExt}.webp`,
        `${nameWithoutExt}.avif`
      ];

      patterns.forEach(pattern => {
        const relatedPath = path.join(uploadDir, pattern);
        if (fs.existsSync(relatedPath)) {
          fs.unlinkSync(relatedPath);
          results.relatedFilesDeleted++;
          console.log('✅ فایل مرتبط حذف شد:', pattern);
        }
      });
    }

    // 2️⃣ حذف از دیتابیس بر اساس نوع
    if (type && documentId) {
      let updateResult;
      
      switch (type) {
        case 'product':
          // حذف از محصولات (imageUrl یا gallery)
          updateResult = await db.products.updateOne(
            { _id: documentId },
            {
              $set: {
                imageUrl: '',
                updatedAt: new Date()
              },
              $pull: { gallery: imageUrl }
            }
          );
          break;

        case 'blog':
          // حذف از بلاگ (featuredImage یا content)
          updateResult = await db.blogPosts.updateOne(
            { _id: documentId },
            {
              $set: {
                featuredImage: '',
                updatedAt: new Date()
              }
            }
          );
          break;

        case 'banner':
          // حذف بنر - بررسی collection‌های مختلف
          // اگر بنر در heroSliders است
          updateResult = await db.heroSliders.updateOne(
            { _id: documentId },
            {
              $set: {
                imageUrl: '',
                updatedAt: new Date()
              }
            }
          );
          break;

        case 'slider':
          // حذف اسلایدر
          updateResult = await db.heroSliders.updateOne(
            { _id: documentId },
            {
              $set: {
                imageUrl: '',
                updatedAt: new Date()
              }
            }
          );
          break;

        case 'category':
          // حذف عکس دسته‌بندی
          updateResult = await db.categories.updateOne(
            { _id: documentId },
            {
              $set: {
                imageUrl: '',
                updatedAt: new Date()
              }
            }
          );
          break;

        case 'brand':
          // حذف لوگوی برند
          updateResult = await db.brands.updateOne(
            { _id: documentId },
            {
              $set: {
                logo: '',
                updatedAt: new Date()
              }
            }
          );
          break;

        default:
          console.log('⚠️ نوع مشخص نشده یا پشتیبانی نمی‌شود:', type);
      }

      if (updateResult && updateResult.modifiedCount > 0) {
        results.databaseUpdated = true;
        console.log('✅ دیتابیس بروزرسانی شد:', type, documentId);
      }
    } else {
      // اگر نوع مشخص نشده، سعی کن از همه جا حذف کن
      console.log('⚠️ نوع مشخص نشده - جستجو در تمام collections...');
      
      // جستجو و حذف از محصولات
      const productUpdate = await db.products.updateMany(
        { 
          $or: [
            { imageUrl: imageUrl },
            { gallery: imageUrl }
          ]
        },
        {
          $set: { imageUrl: '' },
          $pull: { gallery: imageUrl }
        }
      );

      // جستجو و حذف از بلاگ
      const blogUpdate = await db.blogPosts.updateMany(
        { featuredImage: imageUrl },
        { $set: { featuredImage: '' } }
      );

      // جستجو و حذف از اسلایدرها
      const sliderUpdate = await db.heroSliders.updateMany(
        { imageUrl: imageUrl },
        { $set: { imageUrl: '' } }
      );

      const totalUpdated = 
        (productUpdate.modifiedCount || 0) +
        (blogUpdate.modifiedCount || 0) +
        (sliderUpdate.modifiedCount || 0);

      if (totalUpdated > 0) {
        results.databaseUpdated = true;
        console.log(`✅ ${totalUpdated} سند در دیتابیس بروزرسانی شد`);
      }
    }

    // نتیجه نهایی - موفق است حتی اگر فقط از دیتابیس حذف شود
    if (results.fileDeleted || results.databaseUpdated) {
      results.message = 'عکس با موفقیت حذف شد';
      console.log('✅ عملیات حذف موفق:', results);
      return NextResponse.json({
        success: true,
        ...results
      });
    } else {
      // حتی اگر هیچ تغییری نداد، 200 برگردان (فایل از قبل حذف شده)
      results.message = 'عکس از قبل حذف شده یا وجود ندارد';
      console.log('⚠️ عکس پیدا نشد ولی خطا نمی‌دهیم:', imageUrl);
      return NextResponse.json({
        success: true,
        ...results,
        warning: 'فایل یافت نشد ولی از دیتابیس پاک شد'
      });
    }

  } catch (error) {
    console.error('❌ خطا در حذف عکس:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در حذف عکس',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
