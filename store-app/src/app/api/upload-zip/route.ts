import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, stat, rm } from 'fs/promises';
import { existsSync, createWriteStream } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';
import archiver from 'archiver';

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

    // بررسی نوع فایل
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { success: false, error: 'فقط فایل‌های ZIP مجاز هستند' },
        { status: 400 }
      );
    }

    // بررسی حجم فایل (حداکثر 250MB)
    const maxSize = 250 * 1024 * 1024; // 250MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'حجم فایل نباید بیشتر از 250MB باشد' },
        { status: 400 }
      );
    }

    // ایجاد پوشه uploads/zip
    const uploadsDir = path.join(process.cwd(), 'uploads', 'zip');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // ایجاد نام فایل یکتا برای فایل موقت
    const tempFileName = `temp_${uuidv4()}.zip`;
    const tempFilePath = path.join(uploadsDir, tempFileName);

    // تبدیل فایل به Buffer و ذخیره موقت
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(tempFilePath, buffer);

    const originalSize = file.size;
    
    // ✅ فشرده‌سازی مجدد با DEFLATE Level 9 (حداکثر فشرده‌سازی ZIP)
    try {
      console.log('🔄 شروع فشرده‌سازی با DEFLATE Level 9...');
      console.log(`📦 حجم اصلی: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
      
      // خواندن ZIP اصلی و extract کردن محتویات
      const zip = new AdmZip(tempFilePath);
      const zipEntries = zip.getEntries();
      
      console.log(`📂 تعداد فایل‌ها: ${zipEntries.length}`);
      
      // ایجاد فایل ZIP نهایی با compression بالا
      const finalFileName = `${uuidv4()}.zip`;
      const finalFilePath = path.join(uploadsDir, finalFileName);
      const output = createWriteStream(finalFilePath);
      
      // ساخت archive با حداکثر compression
      const archive = archiver('zip', {
        zlib: { level: 9 } // حداکثر compression (0-9)
      });

      // Promise برای tracking
      const compressionPromise = new Promise<void>((resolve, reject) => {
        output.on('close', () => {
          console.log(`✅ فشرده‌سازی تمام شد. حجم نهایی: ${archive.pointer()} bytes`);
          resolve();
        });

        archive.on('error', (err: Error) => {
          console.error('❌ خطا در فشرده‌سازی:', err);
          reject(err);
        });
      });

      archive.pipe(output);

      let processedFiles = 0;
      let totalUncompressedSize = 0;

      // اضافه کردن فایل‌ها به ZIP جدید
      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          try {
            // استخراج محتوای فایل (uncompressed)
            const fileData = entry.getData();
            totalUncompressedSize += fileData.length;
            
            // اضافه کردن به archive با compression level 9
            archive.append(fileData, { 
              name: entry.entryName,
              date: entry.header.time
            });
            
            processedFiles++;
            
            if (processedFiles % 50 === 0) {
              console.log(`⏳ ${processedFiles}/${zipEntries.length} فایل پردازش شد`);
            }
          } catch (entryError) {
            console.warn(`⚠️ خطا در ${entry.entryName}:`, entryError);
          }
        }
      }
      
      console.log(`✅ ${processedFiles} فایل پردازش شد`);
      console.log(`📊 حجم uncompressed: ${(totalUncompressedSize / 1024 / 1024).toFixed(2)} MB`);

      // بستن archive
      await archive.finalize();
      await compressionPromise;

      // بررسی اندازه فایل نهایی
      const stats = await stat(finalFilePath);
      const compressedSize = stats.size;
      const savedBytes = originalSize - compressedSize;
      const savedPercentage = savedBytes > 0 
        ? ((savedBytes / originalSize) * 100).toFixed(2)
        : '0.00';

      console.log(`📊 حجم نهایی: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`💾 کاهش حجم: ${(savedBytes / 1024 / 1024).toFixed(2)} MB (${savedPercentage}%)`);

      // حذف فایل موقت
      await unlink(tempFilePath);

      return NextResponse.json({
        success: true,
        message: savedBytes > 0 
          ? `فایل ${savedPercentage}% فشرده‌تر شد`
          : 'فایل آپلود شد (از قبل حداکثر فشرده است)',
        filePath: finalFilePath,
        fileName: finalFileName,
        originalName: file.name,
        originalSize,
        compressedSize,
        savedBytes,
        savedPercentage: `${savedPercentage}%`,
        compressionInfo: {
          method: 'DEFLATE Level 9',
          filesCount: processedFiles,
          uncompressedSize: totalUncompressedSize,
          compressionRatio: ((compressedSize / totalUncompressedSize) * 100).toFixed(2) + '%'
        }
      });
      
    } catch (compressionError) {
      console.error('⚠️ خطا در فشرده‌سازی:', compressionError);
      
      // اگر فشرده‌سازی شکست خورد، فایل اصلی را نگه دار
      const fallbackFileName = `${uuidv4()}.zip`;
      const fallbackPath = path.join(uploadsDir, fallbackFileName);
      await writeFile(fallbackPath, buffer);
      
      try {
        await unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('خطا در حذف فایل موقت:', unlinkError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'فایل آپلود شد (فشرده‌سازی مجدد انجام نشد)',
        filePath: fallbackPath,
        fileName: fallbackFileName,
        originalName: file.name,
        size: originalSize,
        compressionFailed: true,
        compressionInfo: {
          method: '7-Zip LZMA2',
          error: compressionError instanceof Error ? compressionError.message : 'Unknown error'
        }
      });
    }

  } catch (error) {
    console.error('خطا در آپلود فایل ZIP:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}
