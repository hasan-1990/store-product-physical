import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'images', 'blog');
const UPLOAD_DIR_OLD = join(process.cwd(), 'public', 'uploads', 'blog');

// Ensure upload directories exist
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!existsSync(UPLOAD_DIR_OLD)) {
  mkdirSync(UPLOAD_DIR_OLD, { recursive: true });
}

export async function GET() {
  try {
    const images: any[] = [];
    
    // خواندن فایل‌ها از پوشه جدید (images/blog)
    if (existsSync(UPLOAD_DIR)) {
      const files = await readdir(UPLOAD_DIR);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
      );
      
      imageFiles.forEach(file => {
        images.push({
          name: file,
          url: `/images/blog/${file}`,
          path: join(UPLOAD_DIR, file),
          location: 'new'
        });
      });
    }
    
    // خواندن فایل‌ها از پوشه قدیمی (uploads/blog)
    if (existsSync(UPLOAD_DIR_OLD)) {
      const files = await readdir(UPLOAD_DIR_OLD);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
      );
      
      imageFiles.forEach(file => {
        images.push({
          name: file,
          url: `/uploads/blog/${file}`,
          path: join(UPLOAD_DIR_OLD, file),
          location: 'old'
        });
      });
    }

    console.log(`📂 تعداد تصاویر بلاگ: ${images.length} (جدید + قدیمی)`);
    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error('Error reading images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read images' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'فایل ارسال نشده است' }, 
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'فرمت فایل معتبر نیست' }, 
        { status: 400 }
      );
    }

    // Generate unique filename - حفظ فرمت اصلی
    const timestamp = Date.now();
    const extension = file.name.split('.').pop()?.toLowerCase();
    const sanitizedName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${sanitizedName}_${timestamp}.${extension}`;
    
    // دریافت فایل به صورت کامل بدون تغییر
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filePath = join(UPLOAD_DIR, filename);
    
    // ذخیره فایل اصلی بدون هیچ پردازشی
    await writeFile(filePath, buffer);
    
    const imageUrl = `/images/blog/${filename}`;
    
    console.log(`✅ تصویر با کیفیت اصلی ذخیره شد: ${filename}`);
    console.log(`📊 اندازه فایل: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`📐 فرمت: ${file.type}`);
    
    return NextResponse.json({
      success: true,
      url: imageUrl, // برای سازگاری با RichTextEditor
      image: {
        name: filename,
        url: imageUrl,
        path: filePath,
        size: buffer.length,
        type: file.type,
        originalName: file.name
      },
      message: 'تصویر با کیفیت اصلی (بدون فشرده‌سازی) ذخیره شد'
    });
  } catch (error) {
    console.error('❌ خطا در آپلود تصویر:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در آپلود تصویر' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'No filename provided' }, 
        { status: 400 }
      );
    }

    let fileDeleted = false;
    let deletedFrom = '';

    // تلاش برای حذف از پوشه جدید
    const filePath = join(UPLOAD_DIR, filename);
    if (existsSync(filePath)) {
      await unlink(filePath);
      fileDeleted = true;
      deletedFrom = 'images/blog';
      console.log(`✅ فایل از ${deletedFrom} حذف شد: ${filename}`);
    }

    // تلاش برای حذف از پوشه قدیمی
    const filePathOld = join(UPLOAD_DIR_OLD, filename);
    if (existsSync(filePathOld)) {
      await unlink(filePathOld);
      fileDeleted = true;
      deletedFrom = deletedFrom ? deletedFrom + ' و uploads/blog' : 'uploads/blog';
      console.log(`✅ فایل از uploads/blog حذف شد: ${filename}`);
    }
    
    if (!fileDeleted) {
      return NextResponse.json(
        { success: false, error: 'File not found in any directory' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Image deleted successfully from ${deletedFrom}`,
      deletedFrom
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' }, 
      { status: 500 }
    );
  }
}