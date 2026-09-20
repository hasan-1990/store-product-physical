import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, productId } = await request.json();

    if (!fileUrl || !productId) {
      return NextResponse.json(
        { success: false, error: 'URL فایل و شناسه محصول مورد نیاز است' },
        { status: 400 }
      );
    }

    // تبدیل URL به مسیر فایل
    let filePath: string;
    
    if (fileUrl.startsWith('/uploads/')) {
      // فایل در پوشه uploads
      filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
    } else if (fileUrl.startsWith('/files/')) {
      // فایل در پوشه files
      filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
    } else {
      // سایر مسیرها
      filePath = path.join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));
    }

    // بررسی وجود فایل
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'فایل یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی نوع فایل
    if (!filePath.toLowerCase().endsWith('.zip')) {
      return NextResponse.json(
        { success: false, error: 'فقط فایل‌های ZIP قابل پردازش هستند' },
        { status: 400 }
      );
    }

    // پردازش فایل با API موجود
    const processResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/files/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filePath,
        productId: productId.trim(),
        fileType: 'theme'
      })
    });

    if (!processResponse.ok) {
      const errorData = await processResponse.json();
      throw new Error(errorData.error || 'خطا در پردازش فایل');
    }

    const processResult = await processResponse.json();
    
    if (!processResult.success) {
      throw new Error(processResult.error || 'خطا در پردازش فایل');
    }

    return NextResponse.json({
      success: true,
      message: 'فایل با موفقیت پردازش شد',
      processedFilePath: processResult.processedFilePath,
      injectedFiles: processResult.injectedFiles,
      fileName: processResult.fileName
    });

  } catch (error) {
    console.error('خطا در پردازش فایل از URL:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در پردازش فایل' },
      { status: 500 }
    );
  }
}