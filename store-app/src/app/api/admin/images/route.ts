import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/admin/images
 * بارگذاری لیست تصاویر موجود در پوشه uploads/gallery
 */
export async function GET(request: NextRequest) {
  try {
    const galleryPath = path.join(process.cwd(), 'public', 'uploads', 'gallery');
    
    // بررسی وجود پوشه gallery
    try {
      await fs.access(galleryPath);
    } catch {
      // اگر پوشه وجود نداشت، آن را بسازیم
      await fs.mkdir(galleryPath, { recursive: true });
      return NextResponse.json({ 
        success: true, 
        images: [],
        message: 'پوشه گالری ایجاد شد'
      });
    }
    
    // خواندن فایل‌های موجود
    const files = await fs.readdir(galleryPath);
    
    // فیلتر کردن فقط فایل‌های تصویری
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // ساخت URL‌های کامل
    const imageUrls = imageFiles.map(file => `/uploads/gallery/${file}`);
    
    // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
    const filesWithStats = await Promise.all(
      imageFiles.map(async (file) => {
        const filePath = path.join(galleryPath, file);
        const stats = await fs.stat(filePath);
        return {
          url: `/uploads/gallery/${file}`,
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
    );
    
    // مرتب‌سازی بر اساس تاریخ ایجاد (جدیدترین اول)
    filesWithStats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const sortedImageUrls = filesWithStats.map(file => file.url);
    
    return NextResponse.json({ 
      success: true, 
      images: sortedImageUrls,
      count: sortedImageUrls.length,
      files: filesWithStats, // اطلاعات کامل برای استفاده‌های آینده
    });
    
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در بارگذاری تصاویر گالری',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/images
 * حذف یک تصویر از گالری
 */
export async function DELETE(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'URL تصویر الزامی است' },
        { status: 400 }
      );
    }
    
    // استخراج نام فایل از URL
    const fileName = imageUrl.split('/').pop();
    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'URL نامعتبر است' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'gallery', fileName);
    
    // بررسی وجود فایل
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'تصویر یافت نشد' },
        { status: 404 }
      );
    }
    
    // حذف فایل
    await fs.unlink(filePath);
    
    return NextResponse.json({ 
      success: true, 
      message: 'تصویر با موفقیت حذف شد',
      deletedFile: fileName
    });
    
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در حذف تصویر',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
