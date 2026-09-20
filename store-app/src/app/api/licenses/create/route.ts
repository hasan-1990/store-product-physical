import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { 
  generateLicenseKey, 
  normalizeDomain, 
  validateDomainFormat 
} from '@/utils/license';
import type { License, LicenseCreateRequest } from '@/types';

/**
 * API برای ایجاد لایسنس جدید
 * POST /api/licenses/create
 */
export async function POST(request: NextRequest) {
  try {
    const body: LicenseCreateRequest = await request.json();
    
    // اعتبارسنجی ورودی‌ها
    const { userId, userEmail, productId, orderId, domain, maxActivations = 1, expiresAt } = body;
    
    if (!userId || !userEmail || !productId || !orderId || !domain) {
      return NextResponse.json(
        { error: 'اطلاعات ناقص است' },
        { status: 400 }
      );
    }
    
    // اعتبارسنجی دامنه
    if (!validateDomainFormat(domain)) {
      return NextResponse.json(
        { error: 'فرمت دامنه نامعتبر است' },
        { status: 400 }
      );
    }
    
    const normalizedDomain = normalizeDomain(domain);
    
    // اتصال به دیتابیس
    const db = await connectDB();
    
    // چک کردن محصول
    const product = await db.products.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return NextResponse.json(
        { error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }
    
    // چک کردن سفارش
    const order = await db.orders.findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      return NextResponse.json(
        { error: 'سفارش یافت نشد' },
        { status: 404 }
      );
    }
    
    // چک کردن لایسنس موجود برای این سفارش و محصول
    const existingLicense = await db.licenses.findOne({
      orderId,
      productId,
    });
    
    if (existingLicense) {
      return NextResponse.json(
        { 
          error: 'لایسنس برای این سفارش قبلاً ایجاد شده است',
          license: existingLicense 
        },
        { status: 409 }
      );
    }
    
    // تولید License Key منحصر به فرد
    let licenseKey = generateLicenseKey();
    
    // اطمینان از یکتا بودن
    while (await db.licenses.findOne({ licenseKey })) {
      licenseKey = generateLicenseKey();
    }
    
    // ایجاد لایسنس جدید
    const newLicense = {
      licenseKey,
      userId,
      userEmail,
      productId,
      productName: product.name,
      productSlug: product.slug,
      orderId,
      domain: normalizedDomain,
      isActivated: false,
      status: 'inactive' as const,
      maxActivations,
      activationCount: 0,
      expiresAt: expiresAt || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activationHistory: [],
    };
    
    const result = await db.licenses.insertOne(newLicense as any);
    
    if (!result.insertedId) {
      return NextResponse.json(
        { error: 'خطا در ایجاد لایسنس' },
        { status: 500 }
      );
    }
    
    // دریافت لایسنس ایجاد شده
    const createdLicense = await db.licenses.findOne({ _id: result.insertedId });
    
    return NextResponse.json({
      success: true,
      message: 'لایسنس با موفقیت ایجاد شد',
      license: createdLicense,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating license:', error);
    return NextResponse.json(
      { error: 'خطای سرور در ایجاد لایسنس' },
      { status: 500 }
    );
  }
}
