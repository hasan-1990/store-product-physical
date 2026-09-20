import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

// ✅ افزایش محدودیت حجم آپلود به 250MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '250mb',
    },
  },
};

// GET /api/admin/upload - Get all uploaded images
export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    
    if (!existsSync(uploadsDir)) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const files = readdirSync(uploadsDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    const images = imageFiles.map(file => {
      const filePath = path.join(uploadsDir, file);
      let size = 'Unknown';
      let createdAt = new Date();
      try {
        const stats = statSync(filePath);
        size = `${Math.round(stats.size / 1024)} KB`;
        createdAt = stats.birthtime || stats.mtime; // زمان ساخت یا آخرین تغییر
      } catch (error) {
        // Handle error silently
      }
      
      return {
        id: file,
        name: file,
        url: `/uploads/products/${file}`,
        size,
        type: path.extname(file).substring(1).toUpperCase(),
        createdAt: createdAt.getTime()
      };
    });

    // ✅ مرتب‌سازی بر اساس تاریخ - جدیدترین ها اول
    images.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تصاویر' },
      { status: 500 }
    );
  }
}

// POST /api/admin/upload - Upload new image(s) with WebP optimization
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const file = formData.get('file') as File | null;
    const uploadType = formData.get('type') as string || 'products'; // 'products' or 'gallery'

    // Handle both single and multiple file uploads
    const filesToProcess = files.length > 0 ? files : (file ? [file] : []);

    if (filesToProcess.length === 0) {
      return NextResponse.json(
        { success: false, error: 'فایل انتخاب نشده است' },
        { status: 400 }
      );
    }

    // Create uploads directory based on type
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', uploadType);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (const file of filesToProcess) {
      try {
        // ✅ همه فرمت‌های تصویری مجاز است و به webp تبدیل می‌شود
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          errors.push(`${file.name}: نوع فایل مجاز نیست`);
          continue;
        }

        // Validate file size (max 10MB before optimization)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          errors.push(`${file.name}: حجم فایل نباید بیشتر از 10 مگابایت باشد`);
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // ✅ بهینه‌سازی WebP با کیفیت 75%
        const originalName = path.parse(file.name).name;
        let fileName;
        let outputPath;
        let imageBuffer = buffer;
        
        try {
          // ابتدا اطلاعات تصویر را بررسی می‌کنیم
          const metadata = await sharp(buffer).metadata();
          console.log(`اطلاعات تصویر: ${file.name}`, metadata);
          
          // تصویر را با کتابخانه Sharp پردازش می‌کنیم
          let imageProcessor = sharp(buffer);
          
          // بررسی می‌کنیم آیا تصویر بسیار بزرگ است
          const maxDimension = 16000; // محدودیت ابعاد برای WebP
          const needsResize = (metadata.width || 0) > maxDimension || (metadata.height || 0) > maxDimension;
          
          if (needsResize) {
            console.log(`تصویر بسیار بزرگ است: ${metadata.width}x${metadata.height}, تغییر اندازه جزئی برای امکان تبدیل به WebP`);
            
            // کوچک‌سازی جزئی برای تصاویر بسیار بزرگ - فقط به اندازه‌ای که WebP پشتیبانی کند
            const scaleFactor = Math.min(
              maxDimension / (metadata.width || 1),
              maxDimension / (metadata.height || 1)
            ) * 0.99; // 1% کوچکتر از حداکثر مجاز
            
            const newWidth = Math.floor((metadata.width || 1) * scaleFactor);
            const newHeight = Math.floor((metadata.height || 1) * scaleFactor);
            
            console.log(`تغییر اندازه مختصر به: ${newWidth}x${newHeight} فقط برای پشتیبانی از WebP`);
            
            imageProcessor = imageProcessor.resize({
              width: newWidth,
              height: newHeight,
              fit: 'inside',
              withoutEnlargement: true
            });
          }
          
          // اول تلاش می‌کنیم تصویر را با WebP ذخیره کنیم
          try {
            console.log(`تلاش برای تبدیل به WebP با کیفیت 75: ${file.name}`);
            
            // نام فایل را با پسوند WebP تنظیم می‌کنیم
            fileName = `${originalName}-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
            outputPath = path.join(uploadsDir, fileName);
            
            await imageProcessor
              .webp({ 
                quality: 75,      // کیفیت مناسب برای کاهش حجم
                effort: 6,        // میزان تلاش برای فشرده‌سازی (6 از 6)
                lossless: false,  // فشرده‌سازی با اتلاف
                nearLossless: false // بدون حالت نزدیک به lossless
              })
              .toFile(outputPath);
            
            const stats = statSync(outputPath);
            const finalSize = Math.round(stats.size / 1024);
            
            console.log(`✅ تصویر با موفقیت به WebP تبدیل شد: ${fileName} (${Math.round(file.size / 1024)}KB → ${finalSize}KB)`);
            
            // اگر حجم فایل همچنان بزرگ است، دوباره فشرده‌سازی می‌کنیم
            if (finalSize > 2048) { // اگر بزرگتر از 2 مگابایت است
              console.log(`حجم فایل WebP همچنان بزرگ است (${finalSize}KB)، دوباره فشرده‌سازی می‌کنیم`);
              
              const tempPath = outputPath;
              // نام فایل را به‌روز می‌کنیم اما همچنان WebP می‌ماند
              fileName = `${originalName}-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
              outputPath = path.join(uploadsDir, fileName);
              
              // دوباره با کیفیت کمتر فشرده‌سازی می‌کنیم
              await sharp(tempPath)
                .webp({ 
                  quality: 50,     // کیفیت کمتر برای فشرده‌سازی بیشتر
                  effort: 6,
                  alphaQuality: 50 // کیفیت کانال آلفا هم کاهش یابد
                })
                .toFile(outputPath);
              
              // فایل موقت را حذف می‌کنیم
              try {
                await unlink(tempPath);
              } catch (unlinkError) {
                console.error('خطا در حذف فایل موقت:', unlinkError);
              }
              
              const newStats = statSync(outputPath);
              const newFinalSize = Math.round(newStats.size / 1024);
              console.log(`✅ تصویر WebP مجدداً فشرده شد: ${fileName} (${finalSize}KB → ${newFinalSize}KB)`);
            }
            
            // URL تصویر را اضافه می‌کنیم
            const imageUrl = `/uploads/${uploadType}/${fileName}`;
            uploadedUrls.push(imageUrl);
            
            // به مرحله بعدی می‌رویم
            continue;
          } catch (webpError) {
            // در صورت خطا در تبدیل به WebP، خطا را لاگ می‌کنیم
            console.error('خطا در تبدیل به WebP:', webpError);
            
            // تلاش می‌کنیم به JPEG تبدیل کنیم
            try {
              console.log(`تلاش برای تبدیل به JPEG با کیفیت 70: ${file.name}`);
              
              fileName = `${originalName}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
              outputPath = path.join(uploadsDir, fileName);
              
              await imageProcessor
                .jpeg({ 
                  quality: 70,      // کیفیت مناسب
                  progressive: true,
                  mozjpeg: true     // استفاده از موتور mozjpeg برای فشرده‌سازی بهتر
                })
                .toFile(outputPath);
              
              const stats = statSync(outputPath);
              const finalSize = Math.round(stats.size / 1024);
              
              console.log(`✅ تصویر به JPEG تبدیل شد: ${fileName} (${Math.round(file.size / 1024)}KB → ${finalSize}KB)`);
              
              const imageUrl = `/uploads/${uploadType}/${fileName}`;
              uploadedUrls.push(imageUrl);
              continue;
            } catch (jpegError) {
              console.error('خطا در تبدیل به JPEG:', jpegError);
              
              // نهایتاً تلاش می‌کنیم به PNG تبدیل کنیم
              try {
                console.log(`تلاش برای تبدیل به PNG: ${file.name}`);
                
                fileName = `${originalName}-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
                outputPath = path.join(uploadsDir, fileName);
                
                await imageProcessor
                  .png({ 
                    compressionLevel: 9,
                    progressive: true,
                    quality: 70
                  })
                  .toFile(outputPath);
                
                const stats = statSync(outputPath);
                const finalSize = Math.round(stats.size / 1024);
                
                console.log(`✅ تصویر به PNG تبدیل شد: ${fileName} (${Math.round(file.size / 1024)}KB → ${finalSize}KB)`);
                
                const imageUrl = `/uploads/${uploadType}/${fileName}`;
                uploadedUrls.push(imageUrl);
                continue;
              } catch (pngError) {
                console.error('خطا در تبدیل به PNG:', pngError);
                throw new Error(`خطا در تبدیل تصویر به هر فرمتی: ${pngError instanceof Error ? pngError.message : 'خطای نامشخص'}`);
              }
            }
          }
          
          // این بخش با منطق جدید در بالا جایگزین شده است
        } catch (error) {
          console.error('خطا در بهینه‌سازی تصویر:', error);
          // در صورت خطا، فرمت اصلی را حفظ می‌کنیم
          const originalExt = path.extname(file.name) || '.png';
          fileName = `${originalName}-${Date.now()}-${Math.random().toString(36).substring(7)}${originalExt}`;
          outputPath = path.join(uploadsDir, fileName);
          
          console.log(`⚠️ ذخیره فایل با فرمت اصلی بدون پردازش: ${fileName}`);
          // ذخیره بدون پردازش
          await writeFile(outputPath, buffer);
        }

        // Get file size
        const stats = statSync(outputPath);
        const finalSize = Math.round(stats.size / 1024);

        const imageUrl = `/uploads/${uploadType}/${fileName}`;
        uploadedUrls.push(imageUrl);

        const fileExt = path.extname(fileName).substring(1).toUpperCase();
        console.log(`✅ تصویر پردازش شد: ${file.name} (${Math.round(file.size / 1024)}KB → ${finalSize}KB) - فرمت: ${fileExt}`);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errors.push(`${file.name}: خطا در پردازش تصویر`);
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', ') || 'خطا در آپلود تصاویر' },
        { status: 400 }
      );
    }

    // Return single URL for single file, array for multiple
    if (filesToProcess.length === 1) {
      const fileName = path.basename(uploadedUrls[0]);
      const ext = path.extname(fileName).substring(1).toUpperCase();
      
      return NextResponse.json({
        success: true,
        data: {
          id: fileName,
          name: fileName,
          url: uploadedUrls[0],
          type: ext
        },
        message: path.extname(fileName).toLowerCase() === '.webp' ? 
          'تصویر با فرمت WebP بهینه‌سازی شد' : 
          `تصویر با فرمت ${ext} بهینه‌سازی شد`
      });
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedUrls.length} تصویر آپلود و پردازش شد`
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/upload - Delete image
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'نام فایل مشخص نشده است' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'products', fileName);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'فایل یافت نشد' },
        { status: 404 }
      );
    }

    await unlink(filePath);

    return NextResponse.json({
      success: true,
      message: 'فایل با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف فایل' },
      { status: 500 }
    );
  }
}
