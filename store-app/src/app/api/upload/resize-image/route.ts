import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

interface ResizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'original' | 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  preserveQuality?: boolean; // حفظ کیفیت اصلی (بدون افت)
}

// تنظیمات پیش‌فرض برای انواع مختلف تصاویر
// با گزینه حفظ فرمت اصلی برای جلوگیری از افت کیفیت
const IMAGE_CONFIGS = {
  banner: {
    width: 1200,
    height: 600,
    quality: 100,
    format: 'original' as const, // حفظ فرمت اصلی
    fit: 'cover' as const,
    preserveQuality: true // بدون افت کیفیت
  },
  product: {
    width: 800,
    height: 800,
    quality: 100,
    format: 'original' as const,
    fit: 'cover' as const,
    preserveQuality: true
  },
  thumbnail: {
    width: 300,
    height: 300,
    quality: 100,
    format: 'original' as const,
    fit: 'cover' as const,
    preserveQuality: true
  },
  hero: {
    width: 1920,
    height: 1080,
    quality: 100,
    format: 'original' as const,
    fit: 'cover' as const,
    preserveQuality: true
  }
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'banner';
    const customWidth = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
    const customHeight = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;

    if (!file) {
      return NextResponse.json(
        { error: 'فایل تصویر الزامی است' },
        { status: 400 }
      );
    }

    // بررسی نوع فایل
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'فقط فایل‌های تصویری مجاز هستند' },
        { status: 400 }
      );
    }

    // انتخاب تنظیمات بر اساس نوع
    const config = IMAGE_CONFIGS[type as keyof typeof IMAGE_CONFIGS] || IMAGE_CONFIGS.banner;
    
    // اعمال تنظیمات سفارشی در صورت وجود
    const resizeOptions: ResizeOptions = {
      width: customWidth || config.width,
      height: customHeight || config.height,
      quality: config.quality,
      format: config.format,
      fit: config.fit
    };

    // تبدیل فایل به Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // بررسی اندازه اصلی تصویر
    const metadata = await sharp(buffer).metadata();
    console.log(`📸 تصویر اصلی: ${metadata.width}x${metadata.height}, فرمت: ${metadata.format}, حجم: ${(buffer.length / 1024).toFixed(2)}KB`);

    // تعیین فرمت خروجی
    const originalFormat = metadata.format || 'jpeg';
    const requestedFormat = resizeOptions.format;
    const preserveQuality = resizeOptions.preserveQuality !== false;

    console.log(`⚙️ تنظیمات: فرمت درخواستی=${requestedFormat}, حفظ کیفیت=${preserveQuality}`);

    // ⭐ اگر فرمت original باشه، اصلاً فایل رو دست نزن - فقط کپی کن
    let processedBuffer: Buffer;
    let finalFormat: string = originalFormat;
    const outputFormat = requestedFormat === 'original' ? originalFormat : requestedFormat;
    
    if (requestedFormat === 'original' || !requestedFormat) {
      // 🎯 حالت ZERO LOSS: فایل اصلی رو بدون هیچ تغییری کپی می‌کنیم
      processedBuffer = buffer;
      finalFormat = originalFormat || 'jpeg';
      console.log(`✅ حفظ کامل فایل اصلی - ZERO LOSS (${originalFormat}) - بدون هیچ پردازشی`);
      
    } else {
      // اگر باید فرمت تغییر کنه، از Sharp استفاده می‌کنیم
      let sharpInstance = sharp(buffer);
      finalFormat = outputFormat || originalFormat;

      // اگر حفظ کیفیت فعال باشه، فقط فرمت رو تغییر میدیم (بدون resize)
      if (preserveQuality) {
        // تبدیل فرمت با حداکثر کیفیت بدون resize
        if (outputFormat === 'png') {
          processedBuffer = await sharpInstance
            .png({ 
              quality: 100,
              compressionLevel: 0, // بدون فشرده‌سازی = کیفیت 100%
              effort: 1
            })
            .toBuffer();
          console.log('✅ تبدیل به PNG با کیفیت 100% (بدون فشرده‌سازی)');
          
        } else if (outputFormat === 'webp') {
          processedBuffer = await sharpInstance
            .webp({ 
              quality: 100,
              lossless: true, // بدون افت کیفیت
              effort: 6,
              smartSubsample: false
            })
            .toBuffer();
          console.log('✅ تبدیل به WebP lossless (بدون افت کیفیت)');
          
        } else if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
          processedBuffer = await sharpInstance
            .jpeg({ 
              quality: 100,
              chromaSubsampling: '4:4:4', // بدون subsampling = کیفیت بالاتر
              mozjpeg: false // استفاده از libjpeg برای کیفیت بهتر
            })
            .toBuffer();
          console.log('✅ تبدیل به JPEG با کیفیت 100% (4:4:4 chroma)');
        } else {
          processedBuffer = buffer;
          console.log('✅ حفظ فایل اصلی');
        }
      } else {
        // حالت عادی با resize و فشرده‌سازی
        if (resizeOptions.width || resizeOptions.height) {
          sharpInstance = sharpInstance.resize(
            resizeOptions.width,
            resizeOptions.height,
            { fit: resizeOptions.fit }
          );
        }

        if (outputFormat === 'png') {
          processedBuffer = await sharpInstance.png({ quality: resizeOptions.quality }).toBuffer();
        } else if (outputFormat === 'webp') {
          processedBuffer = await sharpInstance.webp({ quality: resizeOptions.quality }).toBuffer();
        } else {
          processedBuffer = await sharpInstance.jpeg({ quality: resizeOptions.quality }).toBuffer();
        }
        console.log('⚡ پردازش با resize و فشرده‌سازی');
      }
    }

    // ایجاد نام فایل منحصر به فرد
    const timestamp = Date.now();
    const originalName = file.name.replace(/\.[^/.]+$/, ''); // حذف پسوند
    const fileExtension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const filename = `${originalName}_${timestamp}_${type}.${fileExtension}`;

    // مسیر ذخیره
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
    
    // ایجاد دایرکتوری در صورت عدم وجود
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);

    // ذخیره فایل
    await writeFile(filepath, processedBuffer);

    // URL فایل برای دسترسی
    const fileUrl = `/uploads/${type}/${filename}`;

    // اطلاعات تصویر نهایی
    const finalMetadata = await sharp(processedBuffer).metadata();

    const compressionRatio = buffer.length > processedBuffer.length 
      ? Math.round((1 - processedBuffer.length / buffer.length) * 100)
      : 0;

    const savedSpace = buffer.length > processedBuffer.length
      ? ((buffer.length - processedBuffer.length) / 1024).toFixed(2)
      : '0';

    return NextResponse.json({
      success: true,
      message: preserveQuality 
        ? `✅ تصویر با کیفیت 100% ذخیره شد (بدون افت کیفیت)` 
        : `⚡ تصویر پردازش و ذخیره شد`,
      data: {
        filename,
        url: fileUrl,
        originalSize: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: `${(buffer.length / 1024).toFixed(2)}KB`
        },
        processedSize: {
          width: finalMetadata.width,
          height: finalMetadata.height,
          format: outputFormat,
          size: `${(processedBuffer.length / 1024).toFixed(2)}KB`
        },
        qualityPreserved: preserveQuality,
        resized: (metadata.width !== finalMetadata.width) || (metadata.height !== finalMetadata.height),
        compressionRatio: `${compressionRatio}%`,
        savedSpace: `${savedSpace}KB`
      }
    });

  } catch (error) {
    console.error('خطا در resize تصویر:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش تصویر' },
      { status: 500 }
    );
  }
}

// برای دریافت اطلاعات پیکربندی‌های مختلف
export async function GET() {
  return NextResponse.json({
    success: true,
    configs: IMAGE_CONFIGS,
    supportedTypes: Object.keys(IMAGE_CONFIGS),
    maxFileSize: '10MB',
    supportedFormats: ['original', 'jpeg', 'jpg', 'png', 'webp'],
    qualityOptions: {
      preserveQuality: 'حفظ کیفیت 100% (بدون افت) - پیشنهادی',
      highQuality: 'کیفیت بالا 95%',
      mediumQuality: 'کیفیت متوسط 80%',
      lowQuality: 'کیفیت پایین 60%'
    },
    recommendation: 'برای جلوگیری از افت کیفیت، از format: "original" و preserveQuality: true استفاده کنید'
  });
}