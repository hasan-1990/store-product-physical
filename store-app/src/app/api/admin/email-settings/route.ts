import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

// Helper function to check admin authentication (NextAuth + localStorage token)
async function checkAdminAuth(request: NextRequest): Promise<boolean> {
  console.log('🔐 Checking admin authentication...');
  
  // Method 1: Check NextAuth session
  const session = await getServerSession(authOptions);
  console.log('Session:', session ? {
    user: session.user?.email,
    role: session.user?.role
  } : 'No session');
  
  if (session?.user?.role && session.user.role.toLowerCase() === 'admin') {
    console.log('✅ Authenticated via NextAuth session');
    return true;
  }

  // Method 2: Check localStorage token from Authorization header
  const authHeader = request.headers.get('Authorization');
  console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Decode base64 token (fake JWT from localStorage)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Token payload:', payload);
        
        if (payload.role?.toLowerCase() === 'admin') {
          console.log('✅ Authenticated via Bearer token');
          return true;
        }
      }
    } catch (e) {
      console.error('❌ Token decode error:', e);
    }
  }

  console.log('❌ Authentication failed');
  return false;
}

// GET - دریافت تنظیمات ایمیل
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth(request);
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    const db = await connectDB();
    
    // خواندن تنظیمات از collection
    const emailSettings = await db.settings?.findOne({ key: 'emailSettings' });
    
    // تنظیمات پیش‌فرض
    const defaultSettings = {
      enabled: process.env.EMAIL_ENABLED === 'true',
      useResend: !!process.env.RESEND_API_KEY,
      resendApiKey: process.env.RESEND_API_KEY || '',
      smtpHost: process.env.SMTP_HOST || 'localhost',
      smtpPort: parseInt(process.env.SMTP_PORT || '25'),
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      smtpSecure: process.env.SMTP_SECURE === 'true',
      fromName: process.env.EMAIL_FROM_NAME || 'فروشگاه آنلاین',
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@store.com',
      supportEmail: process.env.EMAIL_SUPPORT_EMAIL || 'support@store.com',
      supportPhone: process.env.EMAIL_SUPPORT_PHONE || '021-12345678',
      logoUrl: process.env.EMAIL_LOGO_URL || '',
      templates: {
        order: 'modern',
        reset: 'modern',
        ticket: 'modern',
        invoice: 'modern'
      }
    } as const;

    // حذف رمزهای عبور از پاسخ برای امنیت بیشتر (فقط نمایش ستاره‌ها)
    const safeSettings = { ...(emailSettings?.value || defaultSettings) };
    if (safeSettings.smtpPass) {
      safeSettings.smtpPass = '••••••••••••';
    }
    if (safeSettings.resendApiKey) {
      safeSettings.resendApiKey = safeSettings.resendApiKey.substring(0, 8) + '••••••••••••';
    }

    return NextResponse.json({
      success: true,
      data: safeSettings
    });

  } catch (error: any) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

// PUT - بروزرسانی تنظیمات ایمیل
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth(request);
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // دریافت تنظیمات فعلی برای نگهداری رمزهای عبور
    const currentSettings = await db.settings?.findOne({ key: 'emailSettings' });
    
    // اگر رمز عبور با ستاره‌ها ارسال شده، از مقدار قبلی استفاده کن
    const finalSettings = { ...settings };
    
    if (finalSettings.smtpPass === '••••••••••••' && currentSettings?.value?.smtpPass) {
      finalSettings.smtpPass = currentSettings.value.smtpPass;
    }
    
    if (finalSettings.resendApiKey?.includes('••••') && currentSettings?.value?.resendApiKey) {
      finalSettings.resendApiKey = currentSettings.value.resendApiKey;
    }

    // ذخیره تنظیمات در دیتابیس
    await db.settings?.updateOne(
      { key: 'emailSettings' },
      {
        $set: {
          key: 'emailSettings',
          value: finalSettings,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log('✅ Email settings updated successfully:', {
      enabled: finalSettings.enabled,
      useResend: finalSettings.useResend,
      smtpHost: finalSettings.smtpHost,
      fromAddress: finalSettings.fromAddress
    });

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت بروزرسانی شد'
    });

  } catch (error: any) {
    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    );
  }
}
