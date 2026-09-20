import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';

async function saveAsWebP(file: File, uploadDir: string) {
  const originalExtension = file.name.split('.').pop()?.toLowerCase() || 'png';
  const baseFileName = uuid();
  const targetFileName = `${baseFileName}.webp`;
  const targetPath = join(uploadDir, targetFileName);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const webpBuffer = await sharp(buffer)
      .rotate()
      .webp({ 
        quality: 98, // کیفیت خیلی بالا برای حفظ کیفیت اصلی
        lossless: false,
        effort: 6, // بالاترین کیفیت (0-6)
        smartSubsample: true, // حفظ کیفیت رنگ
        nearLossless: true // تقریباً بدون افت کیفیت
      })
      .toBuffer();

    await writeFile(targetPath, webpBuffer);
    return targetFileName;
  } catch (conversionError) {
    console.error('Image conversion to WebP failed, falling back to original format:', conversionError);
    // اگر تبدیل به WebP شکست خورد، فایل اصلی را ذخیره کن
    const fallbackName = `${baseFileName}.${originalExtension}`;
    const fallbackPath = join(uploadDir, fallbackName);
    await writeFile(fallbackPath, buffer);
    return fallbackName;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    
    if (type === 'gallery') {
      // Handle multiple files
      const files = formData.getAll('files') as File[];
      const urls: string[] = [];
      
      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      for (const file of files) {
        if (!file.size) continue;

        const savedFileName = await saveAsWebP(file, uploadDir);
        urls.push(`/uploads/products/${savedFileName}`);
      }
      
      return NextResponse.json({
        success: true,
        urls,
        message: 'فایل‌ها با موفقیت آپلود شدند',
      });
    } else {
      // Handle single file
      const file = formData.get('file') as File;
      
      if (!file || !file.size) {
        return NextResponse.json(
          { success: false, error: 'فایل انتخاب نشده است' },
          { status: 400 }
        );
      }
      
      // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'فرمت فایل پشتیبانی نمی‌شود' },
          { status: 400 }
        );
      }
      
      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, error: 'سایز فایل بیش از حد مجاز است' },
          { status: 400 }
        );
      }
      
      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      const savedFileName = await saveAsWebP(file, uploadDir);
      
      return NextResponse.json({
        success: true,
        url: `/uploads/products/${savedFileName}`,
        message: 'فایل با موفقیت آپلود شد',
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}
