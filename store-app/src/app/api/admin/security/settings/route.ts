// src/app/api/admin/security/settings/route.ts
/**
 * Security Settings API - تنظیمات امنیتی
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/auth-helper';
import { logSystemChange } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// دریافت تنظیمات امنیتی
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 Security Settings API - Checking auth...');
    
    const authCheck = await requireAdminFromRequest(request);
    if (!authCheck.authorized) {
      return authCheck.response as NextResponse;
    }

    const db = await connectDB();
    
    let settings: any = await db.securitySettings.findOne({ type: 'global' });
    
    // اگر تنظیمات وجود نداشت، مقادیر پیش‌فرض را ایجاد کن
    if (!settings) {
      const defaultSettings = {
        type: 'global',
        
        // Rate Limiting
        rateLimit: {
          enabled: true,
          auth: {
            maxRequests: 5,
            windowMs: 900000 // 15 minutes
          },
          admin: {
            maxRequests: 50,
            windowMs: 900000
          },
          general: {
            maxRequests: 100,
            windowMs: 900000
          },
          api: {
            maxRequests: 100,
            windowMs: 60000 // 1 minute
          }
        },
        
        // Logging
        logging: {
          enabled: true,
          level: 'info', // error, warn, info, debug
          logFailedLogins: true,
          logSuccessfulLogins: true,
          logSuspiciousActivity: true,
          logAPIErrors: true,
          logDatabaseErrors: true,
          logFileUploads: true,
          retentionDays: 30,
          maxFileSize: 10485760, // 10MB
          alertOnFailedLogins: 10, // تعداد ورود ناموفق قبل از alert
          alertOnSecurityViolations: 3
        },
        
        // Authentication
        authentication: {
          sessionTimeout: 1800000, // 30 minutes
          maxConcurrentSessions: 3,
          passwordMinLength: 8,
          passwordRequireNumbers: true,
          passwordRequireSpecialChars: true,
          passwordRequireUppercase: true,
          maxLoginAttempts: 5,
          lockoutDurationMs: 900000, // 15 minutes
          jwtExpirationMs: 86400000 // 24 hours
        },
        
        // File Upload
        fileUpload: {
          enabled: true,
          maxFileSize: 5242880, // 5MB
          allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'],
          checkMagicNumber: true,
          scanForMalware: false, // نیاز به integration با antivirus
          quarantineSuspicious: true
        },
        
        // Database Security
        database: {
          enableQueryLogging: false, // برای debugging
          slowQueryThresholdMs: 1000,
          maxQueryResultSize: 1000,
          enableAuditTrail: true,
          auditRetentionDays: 90,
          backupFrequency: 'daily' // daily, weekly, monthly
        },
        
        // Security Headers
        headers: {
          enableCSP: true,
          enableHSTS: true,
          hstsMaxAge: 31536000,
          enableXFrameOptions: true,
          xFrameOptions: 'DENY',
          enableXSSProtection: true
        },
        
        // IP Blocking
        ipBlocking: {
          enabled: true,
          autoBlockOnFailedLogins: true,
          failedLoginThreshold: 10,
          blockDurationMs: 3600000, // 1 hour
          blockedIPs: []
        },
        
        // Notifications
        notifications: {
          emailAlerts: false,
          smsAlerts: false,
          adminEmails: [],
          alertOnSecurityViolation: true,
          alertOnMultipleFailedLogins: true,
          alertOnSuspiciousActivity: true
        },
        
        // Advanced
        advanced: {
          enableTwoFactor: false,
          enableCaptcha: false,
          captchaThreshold: 3, // بعد از 3 تلاش ناموفق
          enableGeoBlocking: false,
          allowedCountries: [],
          enableDeviceFingerprinting: false
        },
        
        updatedAt: new Date(),
        updatedBy: authCheck.user?.id || 'system'
      };
      
      await db.securitySettings.insertOne(defaultSettings);
      settings = defaultSettings;
    }

    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت تنظیمات امنیتی' }, { status: 500 });
  }
}

// بروزرسانی تنظیمات امنیتی
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) return auth.response as NextResponse;

    const body = await request.json();
    const db = await connectDB();

    const userId = auth.user?.id ? String(auth.user.id) : auth.user?.email || 'unknown';

    // حذف فیلدهای MongoDB که نباید بروزرسانی بشن
    const { _id, __v, createdAt, ...cleanBody } = body;

    // بروزرسانی تنظیمات
    const result = await db.securitySettings.updateOne(
      { type: 'global' },
      { 
        $set: {
          ...cleanBody,
          type: 'global', // اطمینان از ثابت بودن type
          updatedAt: new Date(),
          updatedBy: userId
        }
      },
      { upsert: true }
    );

    // لاگ تغییرات
    try {
      logSystemChange(
        'UPDATE_SECURITY_SETTINGS',
        userId,
        { changedFields: Object.keys(cleanBody) }
      );
    } catch (logError) {
      console.warn('Failed to log system change:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      modified: result.modifiedCount, 
      upserted: result.upsertedCount,
      message: 'تنظیمات امنیتی بروزرسانی شد' 
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Error updating security settings:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'خطا در بروزرسانی تنظیمات',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// ریست به تنظیمات پیش‌فرض
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) return auth.response as NextResponse;

    const db = await connectDB();
    const userId = auth.user?.id ? String(auth.user.id) : auth.user?.email || 'unknown';

    // حذف تنظیمات فعلی
    await db.securitySettings.deleteOne({ type: 'global' });

    // با GET مجدد فراخوانی شود تا تنظیمات پیش‌فرض ایجاد شود
    try {
      logSystemChange(
        'RESET_SECURITY_SETTINGS',
        userId,
        {}
      );
    } catch (logError) {
      console.warn('Failed to log system change:', logError);
    }

    return NextResponse.json({ success: true, message: 'تنظیمات به حالت پیش‌فرض بازگشت' }, { status: 200 });
  } catch (error) {
    console.error('Error resetting security settings:', error);
    return NextResponse.json({ success: false, message: 'خطا در بازگردانی تنظیمات' }, { status: 500 });
  }
}
