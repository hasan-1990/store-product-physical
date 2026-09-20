import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { DuplicatorBackupLocker } from '@/lib/duplicator-locker';

/**
 * API برای دانلود فایل بکاپ با قفل دامنه
 * این API به صورت خودکار فایل را با دامنه مشتری قفل می‌کند
 */

interface DownloadRequest {
  orderId: string;
  filename: string;
  domain: string;
  licenseKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DownloadRequest = await request.json();
    const { orderId, filename, domain } = body;

    // اعتبارسنجی ورودی‌ها
    if (!orderId || !filename || !domain) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'پارامترهای الزامی وارد نشده است',
          required: ['orderId', 'filename', 'domain']
        },
        { status: 400 }
      );
    }

    // اعتبارسنجی دامنه
    const domainRegex = /^[a-z0-9\-\.]+\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'فرمت دامنه صحیح نیست',
          example: 'example.com'
        },
        { status: 400 }
      );
    }

    // TODO: بررسی سفارش در دیتابیس
    // const order = await db.orders.findOne({ orderId });
    // if (!order) {
    //   return NextResponse.json({ success: false, error: 'سفارش پیدا نشد' }, { status: 404 });
    // }

    // مسیر فایل اصلی بکاپ
    const backupsDir = path.join(process.cwd(), 'public', 'backups');
    const sourceFile = path.join(backupsDir, filename);

    // بررسی وجود فایل
    try {
      await fs.access(sourceFile);
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: 'فایل بکاپ پیدا نشد',
          filename 
        },
        { status: 404 }
      );
    }

    // مسیر فایل‌های قفل‌شده
    const lockedDir = path.join(process.cwd(), 'public', 'locked-backups');

    console.log('🔒 Locking backup file:', {
      orderId,
      filename,
      domain,
      sourceFile,
      lockedDir
    });

    // قفل کردن فایل با TypeScript (بدون PHP)
    const lockResult = await DuplicatorBackupLocker.lockBackup(
      sourceFile,
      domain,
      lockedDir
    );

    if (!lockResult.success) {
      console.error('Lock failed:', lockResult);
      return NextResponse.json(
        { 
          success: false, 
          error: lockResult.message || 'خطا در قفل کردن فایل',
          errorCode: lockResult.errorCode
        },
        { status: 500 }
      );
    }

    console.log('✅ Backup locked successfully:', {
      lockedFilename: lockResult.lockedFilename,
      domainHash: lockResult.domainHash,
      cached: lockResult.cached,
      filesize: lockResult.filesize
    });

    // TODO: ثبت دانلود در دیتابیس
    // await db.downloads.insertOne({
    //   orderId,
    //   filename: lockResult.lockedFilename,
    //   domain,
    //   domainHash: lockResult.domainHash,
    //   downloadedAt: new Date(),
    //   ipAddress: request.ip || request.headers.get('x-forwarded-for'),
    //   cached: lockResult.cached
    // });

    // خواندن فایل قفل‌شده
    const fileBuffer = await fs.readFile(lockResult.lockedFile!);

    // ارسال فایل به کاربر
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${lockResult.lockedFilename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'X-Domain-Hash': lockResult.domainHash!,
        'X-Order-Id': orderId,
        'X-Cached': lockResult.cached ? 'true' : 'false',
      },
    });

  } catch (error: any) {
    console.error('Download API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطای سرور',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET method برای دریافت لیست بکاپ‌های موجود
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId الزامی است' },
        { status: 400 }
      );
    }

    // TODO: دریافت لیست بکاپ‌های مرتبط با این سفارش از دیتابیس
    // const backups = await db.orders.findOne({ orderId }).backups;

    const backupsDir = path.join(process.cwd(), 'public', 'backups');
    const files = await fs.readdir(backupsDir);

    const backups = await Promise.all(
      files
        .filter(file => file.endsWith('.zip') && !file.includes('-LOCKED-'))
        .map(async (file) => {
          const filePath = path.join(backupsDir, file);
          const stats = await fs.stat(filePath);
          
          return {
            filename: file,
            size: stats.size,
            modified: stats.mtime,
          };
        })
    );

    return NextResponse.json({
      success: true,
      orderId,
      backups,
      total: backups.length
    });

  } catch (error: any) {
    console.error('Get Backups Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
