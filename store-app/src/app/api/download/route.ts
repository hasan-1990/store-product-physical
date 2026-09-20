import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('file');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'مسیر فایل مشخص نشده است' },
        { status: 400 }
      );
    }

    // بررسی امنیت مسیر فایل
    if (filePath.includes('..') || !filePath.startsWith(process.cwd())) {
      return NextResponse.json(
        { success: false, error: 'مسیر فایل نامعتبر است' },
        { status: 403 }
      );
    }

    // بررسی وجود فایل
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'فایل یافت نشد' },
        { status: 404 }
      );
    }

    // خواندن فایل
    const fileBuffer = await readFile(filePath);
    const fileStat = await stat(filePath);
    const fileName = path.basename(filePath);

    // تشخیص نوع فایل
    const mimeType = fileName.endsWith('.zip') ? 'application/zip' : 'application/octet-stream';

    // ایجاد response برای دانلود
    const response = new NextResponse(fileBuffer as any);
    
    response.headers.set('Content-Type', mimeType);
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    response.headers.set('Content-Length', fileStat.size.toString());
    response.headers.set('Cache-Control', 'no-cache');

    return response;

  } catch (error) {
    console.error('خطا در دانلود فایل:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دانلود فایل' },
      { status: 500 }
    );
  }
}