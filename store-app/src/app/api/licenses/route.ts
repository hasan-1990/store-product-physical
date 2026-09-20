import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

// تولید لایسنس جدید برای کاربر
export async function POST(request: NextRequest) {
  try {
    const { productId, domain, userId, orderId } = await request.json();

    if (!productId || !domain || !userId) {
      return NextResponse.json(
        { success: false, error: 'اطلاعات کامل ارسال نشده است' },
        { status: 400 }
      );
    }

    // تمیز کردن دامنه
    const cleanDomain = domain
      .replace(/^https?:\/\//, '') // حذف پروتکل
      .replace(/^www\./, '')       // حذف www
      .replace(/\/$/, '')          // حذف / انتهایی
      .toLowerCase();

    // اعتبارسنجی دامنه
    if (!isValidDomain(cleanDomain)) {
      return NextResponse.json(
        { success: false, error: 'دامنه وارد شده معتبر نیست' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    // تبدیل productId به ObjectId
    let productObjectId;
    try {
      productObjectId = new ObjectId(productId);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول نامعتبر است' },
        { status: 400 }
      );
    }
    
    // بررسی محصول
    const product = await db.products.findOne({ _id: productObjectId });
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی خرید کاربر
    if (orderId) {
      let orderObjectId;
      try {
        orderObjectId = new ObjectId(orderId);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'شناسه سفارش نامعتبر است' },
          { status: 400 }
        );
      }
      
      const order = await db.orders.findOne({ 
        _id: orderObjectId, 
        userId: userId,
        'items.productId': productObjectId,
        status: 'completed'
      });
      
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'سفارش معتبر یافت نشد' },
          { status: 403 }
        );
      }
    }

    // بررسی لایسنس قبلی برای همین محصول و کاربر (صرف نظر از دامنه)
    const existingUserLicense = await db.licenses.findOne({
      productId: productObjectId,
      userId
    });

    if (existingUserLicense) {
      // کاربر قبلاً برای این محصول لایسنس دارد
      if (existingUserLicense.domain !== cleanDomain) {
        return NextResponse.json({
          success: false,
          error: `شما قبلاً برای این محصول لایسنس دریافت کرده‌اید.\nدامنه ثبت شده: ${existingUserLicense.domain}\nهر محصول فقط برای یک دامنه قابل استفاده است.`
        }, { status: 400 });
      }
      
      // اگر دامنه یکسان است، لایسنس موجود را برگردان
      if (existingUserLicense.isActive) {
        return NextResponse.json({
          success: true,
          message: 'لایسنس قبلاً برای این دامنه تولید شده است',
          data: {
            licenseKey: existingUserLicense.licenseKey,
            domain: existingUserLicense.domain,
            productName: product.name,
            isActive: existingUserLicense.isActive,
            createdAt: existingUserLicense.createdAt,
            expiresAt: existingUserLicense.expiresAt
          }
        });
      } else {
        // فعال‌سازی مجدد لایسنس غیرفعال
        await db.licenses.updateOne(
          { _id: existingUserLicense._id },
          { 
            $set: { 
              isActive: true,
              reactivatedAt: new Date()
            } 
          }
        );

        return NextResponse.json({
          success: true,
          message: 'لایسنس مجدداً فعال شد',
          data: {
            licenseKey: existingUserLicense.licenseKey,
            domain: existingUserLicense.domain,
            productName: product.name,
            isActive: true,
            createdAt: existingUserLicense.createdAt,
            expiresAt: existingUserLicense.expiresAt
          }
        });
      }
    }

    // تولید کلید لایسنس جدید
    const licenseKey = generateLicenseKey(productId, cleanDomain);
    
    // محاسبه تاریخ انقضا (1 سال)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // ذخیره لایسنس جدید
    const newLicense = {
      licenseKey,
      productId: productObjectId,
      domain: cleanDomain,
      userId,
      orderId: orderId ? new ObjectId(orderId) : null,
      isActive: true,
      createdAt: new Date(),
      expiresAt,
      usageCount: 0,
      lastUsed: null
    };

    await db.licenses.insertOne(newLicense);

    return NextResponse.json({
      success: true,
      message: 'لایسنس با موفقیت تولید شد',
      data: {
        licenseKey,
        domain: cleanDomain,
        productName: product.name,
        isActive: true,
        createdAt: newLicense.createdAt,
        expiresAt: newLicense.expiresAt
      }
    });

  } catch (error) {
    console.error('خطا در تولید لایسنس:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تولید لایسنس' },
      { status: 500 }
    );
  }
}

// دریافت لایسنس‌های کاربر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر مورد نیاز است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    // userId به صورت string در دیتابیس ذخیره شده است
    // ساخت فیلتر با string
    const filter: any = { userId };
    if (productId) {
      try {
        filter.productId = new ObjectId(productId);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'شناسه محصول نامعتبر است' },
          { status: 400 }
        );
      }
    }

    // دریافت لایسنس‌ها
    const licenses = await db.licenses.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $project: {
          licenseKey: 1,
          productId: 1,
          domain: 1,
          isActive: 1,
          createdAt: 1,
          expiresAt: 1,
          downloads: 1,
          usageCount: 1,
          lastUsed: 1,
          productName: { $arrayElemAt: ['$product.name', 0] },
          productType: { $arrayElemAt: ['$product.productType', 0] }
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    return NextResponse.json({
      success: true,
      licenses
    });

  } catch (error) {
    console.error('خطا در دریافت لایسنس‌ها:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لایسنس‌ها' },
      { status: 500 }
    );
  }
}

// تولید کلید لایسنس
function generateLicenseKey(productId: string, domain: string): string {
  const prefix = productId.slice(0, 4).toUpperCase();
  const domainHash = Buffer.from(domain).toString('base64').slice(0, 4);
  const uniqueId = uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase();
  
  return `${prefix}-${domainHash}-${uniqueId}`;
}

// اعتبارسنجی دامنه (با پشتیبانی subdomain)
function isValidDomain(domain: string): boolean {
  // پشتیبانی از subdomain مثل sub.example.com
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length >= 3 && domain.length <= 253;
}