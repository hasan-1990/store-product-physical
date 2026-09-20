import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

// تولید کلید لایسنس جدید
export async function POST(request: NextRequest) {
  try {
    const { productId, userId, domain, licenseType = 'single', expirationDays = null } = await request.json();

    if (!productId || !userId || !domain) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول، کاربر و دامنه الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    // بررسی وجود محصول
    const product = await db.products.findOne({ _id: productId });
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }

    // تولید کلید لایسنس یکتا
    const licenseKey = generateLicenseKey();
    
    // محاسبه تاریخ انقضا
    const expirationDate = expirationDays ? 
      new Date(Date.now() + (expirationDays * 24 * 60 * 60 * 1000)) : 
      null;

    // ایجاد رکورد لایسنس
    const licenseData = {
      licenseKey,
      productId,
      userId,
      domain: domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, ''),
      licenseType, // 'single', 'unlimited', 'multi-domain'
      status: 'active',
      activationDate: new Date(),
      expirationDate,
      activationCount: 0,
      maxActivations: licenseType === 'single' ? 1 : licenseType === 'multi-domain' ? 5 : 999,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.licenses.insertOne(licenseData);

    return NextResponse.json({
      success: true,
      message: 'لایسنس با موفقیت ایجاد شد',
      licenseKey,
      licenseId: result.insertedId,
      expirationDate,
      domain: licenseData.domain
    });

  } catch (error) {
    console.error('خطا در تولید لایسنس:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تولید لایسنس' },
      { status: 500 }
    );
  }
}

// تولید کلید لایسنس فرمت: XXXX-XXXX-XXXX-XXXX
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

// دریافت لیست لایسنس‌ها
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const db = await connectDB();
    
    // ساخت فیلتر
    const filter: any = {};
    if (productId) filter.productId = productId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    // دریافت تعداد کل
    const total = await db.licenses.countDocuments(filter);
    
    // دریافت لایسنس‌ها
    const licenses = await db.licenses
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // اضافه کردن اطلاعات محصول و کاربر
    const enrichedLicenses = await Promise.all(
      licenses.map(async (license) => {
        let product = null;
        let user = null;
        
        try {
          // تبدیل productId به ObjectId اگر string باشد
          const productObjectId = typeof license.productId === 'string' 
            ? new ObjectId(license.productId) 
            : license.productId;
          product = await db.products.findOne({ _id: productObjectId });
        } catch (error) {
          console.error('Error fetching product:', error);
        }
        
        try {
          // تبدیل userId به ObjectId اگر string باشد
          const userObjectId = typeof license.userId === 'string' 
            ? new ObjectId(license.userId) 
            : license.userId;
          user = await db.users.findOne({ _id: userObjectId });
        } catch (error) {
          console.error('Error fetching user:', error);
        }
        
        return {
          ...license,
          _id: license._id.toString(),
          productName: product?.name || 'نامشخص',
          userName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'نامشخص'
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedLicenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('خطا در دریافت لایسنس‌ها:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لایسنس‌ها' },
      { status: 500 }
    );
  }
}