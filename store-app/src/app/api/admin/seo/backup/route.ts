import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SEOBackupManager from '@/lib/seo-backup-manager';

/**
 * بررسی دسترسی ادمین
 */
async function checkAdminAccess(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toLowerCase();

  if (role !== 'admin') {
    return { authorized: false, status: 403, error: 'فقط ادمین دسترسی دارد' };
  }

  return { authorized: true };
}

/**
 * GET - دریافت لیست پشتیبان‌ها
 */
export async function GET(request: NextRequest) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list') {
      const backups = await SEOBackupManager.listBackups();
      return NextResponse.json({
        success: true,
        backups,
        count: backups.length
      });
    }

    if (action === 'latest') {
      const latest = await SEOBackupManager.getLatestBackup();
      return NextResponse.json({
        success: true,
        backup: latest
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Action نامعتبر است'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ خطا در GET backup:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در دریافت اطلاعات پشتیبان',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}

/**
 * POST - ایجاد پشتیبان جدید یا بازگردانی
 */
export async function POST(request: NextRequest) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const body = await request.json();
    const { action, fileName, file1, file2 } = body;

    // ایجاد پشتیبان جدید
    if (action === 'create') {
      const result = await SEOBackupManager.createBackup();
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'پشتیبان با موفقیت ایجاد شد',
          filePath: result.filePath
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'خطا در ایجاد پشتیبان'
        }, { status: 500 });
      }
    }

    // بازگردانی از پشتیبان
    if (action === 'restore') {
      if (!fileName) {
        return NextResponse.json({
          success: false,
          error: 'نام فایل الزامی است'
        }, { status: 400 });
      }

      const result = await SEOBackupManager.restoreBackup(fileName);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'پشتیبان با موفقیت بازگردانی شد'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'خطا در بازگردانی پشتیبان'
        }, { status: 500 });
      }
    }

    // مقایسه دو پشتیبان
    if (action === 'compare') {
      if (!file1 || !file2) {
        return NextResponse.json({
          success: false,
          error: 'دو نام فایل برای مقایسه الزامی است'
        }, { status: 400 });
      }

      const comparison = await SEOBackupManager.compareBackups(file1, file2);
      return NextResponse.json({
        success: true,
        comparison
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Action نامعتبر است'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ خطا در POST backup:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در عملیات پشتیبان',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}

/**
 * DELETE - حذف پشتیبان
 */
export async function DELETE(request: NextRequest) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json({
        success: false,
        error: 'نام فایل الزامی است'
      }, { status: 400 });
    }

    const result = await SEOBackupManager.deleteBackup(fileName);

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'پشتیبان با موفقیت حذف شد'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'خطا در حذف پشتیبان'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ خطا در DELETE backup:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در حذف پشتیبان',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}
