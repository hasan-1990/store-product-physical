import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllSEOPages, 
  getSEODataByUrl, 
  upsertSEOPage, 
  deleteSEOPage, 
  toggleSEOPage,
  searchSEOPages,
  getSEOStats
} from '@/lib/seo-helpers';

// GET - دریافت صفحات SEO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const search = searchParams.get('search');
    const stats = searchParams.get('stats');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    // اگر درخواست آمار باشد
    if (stats === 'true') {
      const seoStats = await getSEOStats();
      return NextResponse.json({ 
        success: true, 
        data: seoStats 
      });
    }
    
    // اگر URL مشخص باشد، فقط آن صفحه را برگردان
    if (url) {
      const seoData = await getSEODataByUrl(url);
      if (!seoData) {
        return NextResponse.json({ 
          success: false, 
          error: 'صفحه‌ای با این URL یافت نشد' 
        }, { status: 404 });
      }
      return NextResponse.json({ 
        success: true, 
        data: seoData 
      });
    }
    
    // اگر جستجو مشخص باشد
    if (search && search.trim()) {
      const searchResults = await searchSEOPages(search.trim());
      return NextResponse.json({ 
        success: true, 
        data: searchResults,
        count: searchResults.length
      });
    }
    
    // دریافت تمام صفحات
    const pages = await getAllSEOPages(includeInactive);
    return NextResponse.json({ 
      success: true, 
      data: pages,
      count: pages.length
    });
    
  } catch (error) {
    console.error('خطا در GET صفحات SEO:', error);
    return NextResponse.json({ 
      success: false,
      error: 'خطا در دریافت صفحات SEO',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}

// POST - ایجاد صفحه SEO جدید
export async function POST(request: NextRequest) {
  try {
    const seoData = await request.json();
    
    // اعتبارسنجی داده‌های ورودی
    if (!seoData.url || !seoData.title || !seoData.description) {
      return NextResponse.json({ 
        success: false,
        error: 'فیلدهای URL، عنوان و توضیحات الزامی هستند' 
      }, { status: 400 });
    }
    
    // بررسی منحصر بودن URL
    const existingPage = await getSEODataByUrl(seoData.url);
    if (existingPage) {
      return NextResponse.json({ 
        success: false,
        error: 'صفحه‌ای با این URL قبلاً وجود دارد' 
      }, { status: 409 });
    }
    
    const newPage = await upsertSEOPage(seoData.url, seoData);
    
    if (!newPage) {
      return NextResponse.json({ 
        success: false,
        error: 'خطا در ایجاد صفحه SEO' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'صفحه SEO با موفقیت ایجاد شد',
      data: newPage
    }, { status: 201 });
    
  } catch (error) {
    console.error('خطا در POST صفحه SEO:', error);
    return NextResponse.json({ 
      success: false,
      error: 'خطا در ایجاد صفحه SEO',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}

// PUT - بروزرسانی صفحه SEO موجود
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ 
        success: false,
        error: 'URL صفحه مورد نیاز است' 
      }, { status: 400 });
    }
    
    const updateData = await request.json();
    
    // بررسی وجود صفحه
    const existingPage = await getSEODataByUrl(url);
    if (!existingPage) {
      return NextResponse.json({ 
        success: false,
        error: 'صفحه‌ای با این URL یافت نشد' 
      }, { status: 404 });
    }
    
    const updatedPage = await upsertSEOPage(url, updateData);
    
    if (!updatedPage) {
      return NextResponse.json({ 
        success: false,
        error: 'خطا در بروزرسانی صفحه SEO' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'صفحه SEO با موفقیت بروزرسانی شد',
      data: updatedPage
    });
    
  } catch (error) {
    console.error('خطا در PUT صفحه SEO:', error);
    return NextResponse.json({ 
      success: false,
      error: 'خطا در بروزرسانی صفحه SEO',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}

// DELETE - حذف صفحه SEO
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ 
        success: false,
        error: 'URL صفحه مورد نیاز است' 
      }, { status: 400 });
    }
    
    // بررسی وجود صفحه
    const existingPage = await getSEODataByUrl(url);
    if (!existingPage) {
      return NextResponse.json({ 
        success: false,
        error: 'صفحه‌ای با این URL یافت نشد' 
      }, { status: 404 });
    }
    
    const deleted = await deleteSEOPage(url);
    
    if (!deleted) {
      return NextResponse.json({ 
        success: false,
        error: 'خطا در حذف صفحه SEO' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'صفحه SEO با موفقیت حذف شد'
    });
    
  } catch (error) {
    console.error('خطا در DELETE صفحه SEO:', error);
    return NextResponse.json({ 
      success: false,
      error: 'خطا در حذف صفحه SEO',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}

// PATCH - تغییر وضعیت صفحه SEO (فعال/غیرفعال)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ 
        success: false,
        error: 'URL صفحه مورد نیاز است' 
      }, { status: 400 });
    }
    
    const { isActive } = await request.json();
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ 
        success: false,
        error: 'وضعیت فعال/غیرفعال باید boolean باشد' 
      }, { status: 400 });
    }
    
    const updatedPage = await toggleSEOPage(url, isActive);
    
    if (!updatedPage) {
      return NextResponse.json({ 
        success: false,
        error: 'خطا در تغییر وضعیت صفحه SEO' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `صفحه SEO با موفقیت ${isActive ? 'فعال' : 'غیرفعال'} شد`,
      data: updatedPage
    });
    
  } catch (error) {
    console.error('خطا در PATCH صفحه SEO:', error);
    return NextResponse.json({ 
      success: false,
      error: 'خطا در تغییر وضعیت صفحه SEO',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}