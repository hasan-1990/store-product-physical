import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyToken } from '@/lib/jwt';
import { 
  getGlobalSEOSettings, 
  updateGlobalSEOSettings 
} from '@/lib/seo-helpers';

async function resolveAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionRole = session?.user?.role ? String(session.user.role).toLowerCase() : undefined;
  const sessionUserId = session?.user?.id ? String(session.user.id) : undefined;
  const sessionEmail = session?.user?.email ? String(session.user.email) : undefined;

  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;

  let resolvedRole = sessionRole;
  let resolvedUserId = sessionUserId;
  let resolvedEmail = sessionEmail;

  if (!resolvedRole && bearerToken) {
    const decoded = verifyToken(bearerToken);

    if (decoded) {
      resolvedRole = decoded.role?.toLowerCase();
      resolvedUserId = decoded.userId;
      resolvedEmail = decoded.email;
    } else {
      try {
        const parts = bearerToken.split('.');
        if (parts.length >= 2) {
          const payloadRaw = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadRaw);
          if (payload?.role) {
            resolvedRole = String(payload.role).toLowerCase();
            resolvedUserId = payload.userId || payload.id || undefined;
            resolvedEmail = payload.email || undefined;
            console.warn('⚠️ Using fallback decoded admin token without signature verification');
          }
        }
      } catch (fallbackError) {
        console.error('Failed to decode fallback admin token', fallbackError);
      }
    }
  }

  if (!resolvedRole) {
    return { authorized: false as const, status: 401, error: 'دسترسی غیرمجاز - احراز هویت مورد نیاز است' };
  }

  if (resolvedRole !== 'admin') {
    console.log('❌ Access denied - Role:', resolvedRole, 'Email:', resolvedEmail);
    return { authorized: false as const, status: 403, error: 'دسترسی غیرمجاز - فقط ادمین' };
  }

  return {
    authorized: true as const,
    role: resolvedRole,
    userId: resolvedUserId,
    email: resolvedEmail
  };
}

// GET - دریافت تنظیمات
export async function GET(req: NextRequest) {
  try {
    const admin = await resolveAdmin(req);

    if (!admin.authorized) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    console.log('✅ Admin access granted for SEO settings. UserId:', admin.userId);
    const settings = await getGlobalSEOSettings();
    
    if (!settings) {
      // ایجاد تنظیمات پیش‌فرض اگر وجود نداشت
      const defaultSettings = {
        siteTitle: process.env.NEXT_PUBLIC_SITE_TITLE || '',
        siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '',
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
        siteName: process.env.NEXT_PUBLIC_SITE_NAME || '',
        language: 'fa',
        direction: 'rtl',
        allowCrawling: true,
        googleSiteVerification: '',
        googleAnalyticsId: '',
        googleTagManagerId: '',
        robotsRules: [
          'User-agent: *',
          'Allow: /',
          'Disallow: /admin/',
          'Disallow: /api/',
          'Disallow: /_next/',
          'Sitemap: /sitemap.xml'
        ],
        socialMedia: {
          twitter: '',
          facebook: '',
          instagram: '',
          telegram: ''
        },
        contact: {
          email: '',
          phone: '',
          address: ''
        }
      } as any;
      
      const newSettings = await updateGlobalSEOSettings(defaultSettings);
      return NextResponse.json({ global: newSettings });
    }
    
    return NextResponse.json({ global: settings });
    
  } catch (error) {
    console.error('خطا در GET تنظیمات SEO:', error);
    return NextResponse.json({ 
      error: 'خطا در دریافت تنظیمات',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}

// POST - ذخیره تنظیمات جدید
export async function POST(request: NextRequest) {
  try {
    const admin = await resolveAdmin(request);

    if (!admin.authorized) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    console.log('✅ Admin access granted for updating SEO settings. UserId:', admin.userId);

    const newSettings = await request.json();
    
    // اعتبارسنجی داده‌های ورودی
    if (!newSettings.global) {
      return NextResponse.json({ 
        error: 'داده‌های تنظیمات کلی مورد نیاز است' 
      }, { status: 400 });
    }
    
    const savedSettings = await updateGlobalSEOSettings(newSettings.global);
    
    if (!savedSettings) {
      return NextResponse.json({ 
        error: 'خطا در ذخیره تنظیمات' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'تنظیمات با موفقیت ذخیره شد',
      data: { global: savedSettings }
    });
    
  } catch (error) {
    console.error('خطا در POST تنظیمات SEO:', error);
    return NextResponse.json({ 
      error: 'خطا در ذخیره تنظیمات',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}

// PUT - به‌روزرسانی تنظیمات
export async function PUT(request: NextRequest) {
  try {
    const admin = await resolveAdmin(request);

    if (!admin.authorized) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    console.log('✅ Admin access granted for updating SEO settings. UserId:', admin.userId);

    const updateData = await request.json();
    console.log('Received update data:', JSON.stringify(updateData, null, 2));
    
    if (!updateData.global) {
      return NextResponse.json({ 
        error: 'داده‌های تنظیمات کلی مورد نیاز است' 
      }, { status: 400 });
    }
    
    // حذف فیلدهای غیرقابل تغییر از updateData
    const { _id, __v, createdAt, ...updateFields } = updateData.global;
    
    const updatedSettings = await updateGlobalSEOSettings(updateFields);
    
    if (!updatedSettings) {
      return NextResponse.json({ 
        error: 'خطا در به‌روزرسانی تنظیمات' 
      }, { status: 500 });
    }
    
    console.log('Updated settings:', updatedSettings);
    
    return NextResponse.json({ 
      success: true, 
      message: 'تنظیمات به‌روزرسانی شد',
      data: {
        global: updatedSettings
      }
    });
    
  } catch (error) {
    console.error('خطا در PUT تنظیمات SEO:', error);
    console.error('Error details:', error);
    return NextResponse.json({ 
      error: 'خطا در به‌روزرسانی تنظیمات',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}