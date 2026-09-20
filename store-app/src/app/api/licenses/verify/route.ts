import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { 
  normalizeDomain, 
  validateLicenseKeyFormat,
  isLicenseExpired 
} from '@/utils/license';
import type { LicenseVerifyRequest, LicenseVerifyResponse, License } from '@/types';

/**
 * API برای تایید و چک کردن لایسنس
 * POST /api/licenses/verify
 * این API توسط قالب/افزونه PHP فراخوانی می‌شود
 */
export async function POST(request: NextRequest) {
  try {
    const body: LicenseVerifyRequest = await request.json();
    
    const { licenseKey, domain, productId, ipAddress, userAgent } = body;
    
    // اعتبارسنجی ورودی‌ها
    if (!licenseKey || !domain || !productId) {
      return NextResponse.json<LicenseVerifyResponse>(
        { 
          valid: false,
          message: 'اطلاعات ناقص است - لایسنس، دامنه و شناسه محصول الزامی است' 
        },
        { status: 400 }
      );
    }
    
    // اعتبارسنجی فرمت License Key
    if (!validateLicenseKeyFormat(licenseKey)) {
      return NextResponse.json<LicenseVerifyResponse>(
        { 
          valid: false,
          message: 'فرمت کلید لایسنس نامعتبر است' 
        },
        { status: 400 }
      );
    }
    
    const normalizedDomain = normalizeDomain(domain);
    
    // اتصال به دیتابیس
    const db = await connectDB();
    
    // پیدا کردن لایسنس
    const license = await db.licenses.findOne({
      licenseKey,
      productId,
    }) as License | null;
    
    if (!license) {
      return NextResponse.json<LicenseVerifyResponse>(
        { 
          valid: false,
          message: 'کلید لایسنس یافت نشد یا برای این محصول معتبر نیست' 
        },
        { status: 404 }
      );
    }
    
    // چک وضعیت لایسنس
    if (license.status === 'suspended') {
      return NextResponse.json<LicenseVerifyResponse>(
        { 
          valid: false,
          license,
          message: 'لایسنس شما تعلیق شده است. لطفاً با پشتیبانی تماس بگیرید' 
        },
        { status: 403 }
      );
    }
    
    if (license.status === 'revoked') {
      return NextResponse.json<LicenseVerifyResponse>(
        { 
          valid: false,
          license,
          message: 'لایسنس شما لغو شده است' 
        },
        { status: 403 }
      );
    }
    
    // چک انقضا
    if (isLicenseExpired(license.expiresAt)) {
      // به‌روزرسانی وضعیت به expired
      await db.licenses.updateOne(
        { _id: new ObjectId(license._id) },
        { 
          $set: { 
            status: 'expired',
            updatedAt: new Date().toISOString()
          }
        }
      );
      
      return NextResponse.json<LicenseVerifyResponse>(
        { 
          valid: false,
          license,
          message: 'لایسنس شما منقضی شده است' 
        },
        { status: 403 }
      );
    }
    
    // چک دامنه
    if (license.domain !== normalizedDomain) {
      return NextResponse.json<LicenseVerifyResponse>(
        { 
          valid: false,
          license,
          message: `لایسنس برای دامنه ${license.domain} صادر شده است، نه ${normalizedDomain}` 
        },
        { status: 403 }
      );
    }
    
    // اگر هنوز فعال نشده، فعال‌سازی اولیه
    if (!license.isActivated) {
      const activationHistory = license.activationHistory || [];
      activationHistory.push({
        domain: normalizedDomain,
        ipAddress,
        userAgent,
        activatedAt: new Date().toISOString(),
        isActive: true,
      });
      
      await db.licenses.updateOne(
        { _id: new ObjectId(license._id) },
        {
          $set: {
            isActivated: true,
            activatedAt: new Date().toISOString(),
            status: 'active',
            activationCount: 1,
            activationHistory,
            updatedAt: new Date().toISOString(),
          }
        }
      );
      
      // دریافت لایسنس به‌روز شده
      const updatedLicense = await db.licenses.findOne({ 
        _id: new ObjectId(license._id) 
      }) as any as License;
      
      return NextResponse.json<LicenseVerifyResponse>({
        valid: true,
        license: updatedLicense,
        message: 'لایسنس با موفقیت فعال شد',
        product: {
          id: license.productId,
          name: license.productName,
        }
      });
    }
    
    // لایسنس معتبر و فعال
    return NextResponse.json<LicenseVerifyResponse>({
      valid: true,
      license,
      message: 'لایسنس معتبر است',
      product: {
        id: license.productId,
        name: license.productName,
      }
    });
    
  } catch (error) {
    console.error('Error verifying license:', error);
    return NextResponse.json<LicenseVerifyResponse>(
      { 
        valid: false,
        message: 'خطای سرور در بررسی لایسنس' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/licenses/verify?key=XXXX-XXXX-XXXX-XXXX
 * برای چک سریع وضعیت لایسنس
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const licenseKey = searchParams.get('key');
    
    if (!licenseKey) {
      return NextResponse.json(
        { error: 'کلید لایسنس الزامی است' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    const license = await db.licenses.findOne({ licenseKey }) as License | null;
    
    if (!license) {
      return NextResponse.json(
        { error: 'لایسنس یافت نشد' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      license,
      expired: isLicenseExpired(license.expiresAt),
    });
    
  } catch (error) {
    console.error('Error getting license:', error);
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
