import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { 
  generateLicenseKey, 
  normalizeDomain, 
  validateDomainFormat 
} from '@/utils/license';

// Force Node.js runtime (برای استفاده از crypto module)
export const runtime = 'nodejs';

/**
 * API برای ایجاد لایسنس جدید توسط ادمین (بدون نیاز به سفارش)
 * POST /api/admin/licenses/create
 */
export async function POST(request: NextRequest) {
  console.log('🔵 ========== Admin License Create API Called ==========');
  
  try {
    console.log('🔵 Step 1: Parsing request body...');
    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    // اعتبارسنجی ورودی‌ها
    const { userId, productId, domain, licenseType = 'single', expirationDays } = body;
    console.log('📝 Extracted fields:', { userId, productId, domain, licenseType, expirationDays });
    
    if (!userId || !productId || !domain) {
      console.log('❌ Missing required fields:', { userId: !!userId, productId: !!productId, domain: !!domain });
      return NextResponse.json(
        { error: 'اطلاعات ناقص است. لطفاً کاربر، محصول و دامنه را وارد کنید' },
        { status: 400 }
      );
    }
    
    // اعتبارسنجی دامنه
    console.log('🔍 Step 2: Validating domain format...');
    console.log('Domain before validation:', domain);
    
    let isValid = false;
    let normalizedDomain = '';
    
    try {
      isValid = validateDomainFormat(domain);
      console.log('Validation result:', isValid);
    } catch (error) {
      console.error('❌ Error in validateDomainFormat:', error);
      return NextResponse.json(
        { error: 'خطا در اعتبارسنجی دامنه', details: error instanceof Error ? error.message : 'نامشخص' },
        { status: 500 }
      );
    }
    
    if (!isValid) {
      console.log('❌ Invalid domain format');
      return NextResponse.json(
        { error: 'فرمت دامنه نامعتبر است' },
        { status: 400 }
      );
    }
    
    try {
      normalizedDomain = normalizeDomain(domain);
      console.log('✅ Normalized domain:', normalizedDomain);
    } catch (error) {
      console.error('❌ Error in normalizeDomain:', error);
      return NextResponse.json(
        { error: 'خطا در نرمال‌سازی دامنه', details: error instanceof Error ? error.message : 'نامشخص' },
        { status: 500 }
      );
    }
    
    // اتصال به دیتابیس
    console.log('🔌 Connecting to database...');
    const db = await connectDB();
    console.log('✅ Database connected');
    
    // تبدیل userId و productId به string (اگر object هستند)
    console.log('🔍 Raw userId type:', typeof userId, 'value:', userId);
    console.log('🔍 Raw productId type:', typeof productId, 'value:', productId);
    
    let userIdStr: string;
    let productIdStr: string;
    
    // Extract string ID from userId
    if (typeof userId === 'string') {
      userIdStr = userId;
    } else if (userId && typeof userId === 'object' && '_id' in userId) {
      userIdStr = String(userId._id);
    } else if (userId && typeof userId === 'object' && 'toString' in userId) {
      userIdStr = userId.toString();
    } else {
      userIdStr = String(userId);
    }
    
    // Extract string ID from productId
    if (typeof productId === 'string') {
      productIdStr = productId;
    } else if (productId && typeof productId === 'object' && '_id' in productId) {
      productIdStr = String(productId._id);
    } else if (productId && typeof productId === 'object' && 'toString' in productId) {
      productIdStr = productId.toString();
    } else {
      productIdStr = String(productId);
    }
    
    console.log('✅ Converted userIdStr:', userIdStr, 'length:', userIdStr.length);
    console.log('✅ Converted productIdStr:', productIdStr, 'length:', productIdStr.length);
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(userIdStr)) {
      console.log('❌ Invalid userIdStr format:', userIdStr);
      return NextResponse.json(
        { error: 'فرمت شناسه کاربر نامعتبر است' },
        { status: 400 }
      );
    }
    
    if (!/^[0-9a-fA-F]{24}$/.test(productIdStr)) {
      console.log('❌ Invalid productIdStr format:', productIdStr);
      return NextResponse.json(
        { error: 'فرمت شناسه محصول نامعتبر است' },
        { status: 400 }
      );
    }
    
    // دریافت اطلاعات کاربر
    console.log('👤 Fetching user:', userIdStr);
    const user = await db.users.findOne({ _id: new ObjectId(userIdStr) });
    if (!user) {
      console.log('❌ User not found:', userIdStr);
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }
    console.log('✅ User found:', user.email);
    
    // دریافت اطلاعات محصول
    console.log('📦 Fetching product:', productIdStr);
    const product = await db.products.findOne({ _id: new ObjectId(productIdStr) });
    if (!product) {
      console.log('❌ Product not found:', productIdStr);
      return NextResponse.json(
        { error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }
    console.log('✅ Product found:', product.name);
    
    // چک کردن لایسنس تکراری برای این کاربر و محصول و دامنه
    console.log('🔍 Checking for existing license...');
    const existingLicense = await db.licenses.findOne({
      userId: userIdStr,
      productId: productIdStr,
      domain: normalizedDomain,
    });
    
    if (existingLicense) {
      console.log('⚠️ License already exists');
      return NextResponse.json(
        { 
          error: 'لایسنس برای این کاربر، محصول و دامنه قبلاً ایجاد شده است',
          license: existingLicense 
        },
        { status: 409 }
      );
    }
    console.log('✅ No existing license found');
    
    // تولید License Key منحصر به فرد
    console.log('🔑 Generating license key...');
    let licenseKey = generateLicenseKey();
    
    // اطمینان از یکتا بودن
    while (await db.licenses.findOne({ licenseKey })) {
      licenseKey = generateLicenseKey();
    }
    console.log('✅ License key generated:', licenseKey.substring(0, 20) + '...');
    
    // محاسبه تاریخ انقضا
    let expiresAt: string | undefined;
    if (expirationDays && parseInt(expirationDays) > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));
      expiresAt = expirationDate.toISOString();
      console.log('📅 Expiration date set:', expiresAt);
    }
    
    // تعیین maxActivations بر اساس نوع لایسنس
    const maxActivations = licenseType === 'unlimited' ? -1 : 1;
    console.log('🔢 Max activations:', maxActivations);
    
    // ایجاد لایسنس جدید
    console.log('💾 Creating license...');
    const newLicense = {
      licenseKey,
      userId: userIdStr,
      userEmail: user.email,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      productId: productIdStr,
      productName: product.name,
      productSlug: product.slug,
      orderId: null, // لایسنس دستی - بدون سفارش
      domain: normalizedDomain,
      licenseType,
      isActivated: false,
      status: 'active', // لایسنس دستی بلافاصله فعال است
      maxActivations,
      activationCount: 0,
      expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activationHistory: [],
      notes: 'ایجاد شده توسط ادمین',
    };
    
    console.log('📝 License object:', newLicense);
    const result = await db.licenses.insertOne(newLicense as any);
    
    if (!result.insertedId) {
      console.log('❌ Failed to insert license');
      return NextResponse.json(
        { error: 'خطا در ایجاد لایسنس' },
        { status: 500 }
      );
    }
    
    console.log('✅ License inserted with ID:', result.insertedId);
    
    // دریافت لایسنس ایجاد شده
    const createdLicense = await db.licenses.findOne({ _id: result.insertedId });
    
    console.log('🎉 License created successfully!');
    return NextResponse.json({
      success: true,
      message: 'لایسنس با موفقیت ایجاد شد',
      license: {
        ...createdLicense,
        _id: createdLicense?._id?.toString(),
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ ========== FATAL ERROR in Admin License Create ==========');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    return NextResponse.json(
      { 
        error: 'خطای سرور در ایجاد لایسنس', 
        details: error instanceof Error ? error.message : 'نامشخص',
        type: error?.constructor?.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}
