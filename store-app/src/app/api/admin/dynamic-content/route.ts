import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions, requireAdmin } from '@/lib/auth';
import { revalidateTag, revalidatePath } from 'next/cache';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { getJwtSecret } from '@/lib/secrets';

// Helper function to verify JWT token from Authorization header
async function verifyJWTToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as Record<string, unknown>;
    
    // Check if user is admin (case insensitive)
    const userRole = String(decoded.role ?? decoded.Role ?? '');
    if (userRole.toLowerCase() !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Helper to check authentication - supports both NextAuth and JWT
async function checkAuth(request: NextRequest) {
  // Try NextAuth first
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.log('NextAuth session check failed:', error);
  }
  
  console.log('🔐 Dynamic Content Auth Check:', { 
    hasSession: !!session, 
    userRole: (session?.user as any)?.role,
    userEmail: (session?.user as any)?.email,
    hasAuthHeader: !!request.headers.get('authorization')
  });
  
  // Check NextAuth session - اولویت با NextAuth
  if (session?.user) {
    const userRole = ((session.user as any).role || '').toLowerCase();
    if (userRole === 'admin') {
      console.log('✅ Authentication successful via NextAuth');
      return { authenticated: true, method: 'nextauth' };
    } else {
      console.log('⚠️ User not admin. Role:', (session.user as any).role);
    }
  }

  // Try JWT token - اگر NextAuth نبود
  const jwtUser = await verifyJWTToken(request);
  if (jwtUser) {
    console.log('✅ Authentication successful via JWT');
    return { authenticated: true, method: 'jwt' };
  }

  console.log('❌ Authentication failed - no valid session or token');
  return { authenticated: false };
}

// 🔥 تابع همگام‌سازی با فایل JSON
async function syncToJSON(db: any) {
  try {
    const contents = await db.dynamicContent.find({ isActive: true }).toArray();
    
    // تبدیل به فرمت key-value برای فایل JSON
    const jsonData: Record<string, string> = {};
    contents.forEach((item: any) => {
      jsonData[item.key] = item.value;
    });
    
    // مسیر فایل JSON
    const jsonPath = path.join(process.cwd(), 'data', 'site-settings.json');
    
    // نوشتن در فایل JSON
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    
    console.log('✅ داده‌ها با موفقیت در فایل JSON ذخیره شدند');
    return true;
  } catch (error) {
    console.error('❌ خطا در ذخیره فایل JSON:', error);
    return false;
  }
}

// GET - دریافت تمام محتواهای داینامیک یا فیلتر شده بر اساس category
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // برای خواندن، نیازی به احراز هویت نیست
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');
    
    const db = await connectDB();
    
    let query: any = { isActive: true };
    if (category) query.category = category;
    if (key) query.key = key;
    
    const contents = await db.dynamicContent.find(query).toArray();
    
    // پاک کردن کاراکترهای کنترلی از داده‌ها
    const cleanedContents = contents.map((item: any) => ({
      ...item,
      value: typeof item.value === 'string' 
        ? item.value.replace(/[\x00-\x1F\x7F]/g, '') 
        : item.value
    }));
    
    // تبدیل به فرمت key-value برای استفاده آسان
    const contentMap: Record<string, any> = {};
    cleanedContents.forEach((item: any) => {
      contentMap[item.key] = item.value;
    });
    
    return NextResponse.json({ 
      success: true,
      data: cleanedContents,
      map: contentMap 
    });
    
  } catch (error) {
    console.error('خطا در دریافت محتوای داینامیک:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت محتوا' },
      { status: 500 }
    );
  }
}

// POST - ایجاد محتوای جدید (فقط ادمین)
export async function POST(request: NextRequest) {
  try {
    // بررسی احراز هویت (NextAuth یا JWT)
    const auth = await checkAuth(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز - لطفاً وارد شوید' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { key, value, category, description, type = 'text' } = body;
    
    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: 'کلید و مقدار الزامی است' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    // بررسی وجود کلید تکراری
    const existing = await db.dynamicContent.findOne({ key });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'این کلید قبلاً ثبت شده است' },
        { status: 400 }
      );
    }
    
    const newContent = {
      key,
      value,
      category: category || 'general',
      description: description || '',
      type: type || 'text',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.dynamicContent.insertOne(newContent);
    
    // 🔥 همگام‌سازی با فایل JSON
    await syncToJSON(db);
    
    // 🔥 پاک کردن cache برای محتوای جدید
    try {
      revalidateTag('site-settings');
      revalidateTag('dynamic-content');
      revalidatePath('/', 'layout');
      console.log('✅ Cache invalidated for new content:', key);
    } catch (revalidateError) {
      console.error('⚠️ Cache revalidation error:', revalidateError);
    }
    
    return NextResponse.json({
      success: true,
      data: { ...newContent, _id: result.insertedId }
    });
    
  } catch (error) {
    console.error('خطا در ایجاد محتوای داینامیک:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد محتوا' },
      { status: 500 }
    );
  }
}

// PUT - به‌روزرسانی محتوا (فقط ادمین)
export async function PUT(request: NextRequest) {
  try {
    // بررسی احراز هویت (NextAuth یا JWT)
    const auth = await checkAuth(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز - لطفاً وارد شوید' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { key, value, category, description, type, isActive } = body;
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'کلید الزامی است' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (value !== undefined) updateData.value = value;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const result = await db.dynamicContent.updateOne(
      { key },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'محتوا یافت نشد' },
        { status: 404 }
      );
    }
    
    // 🔥 همگام‌سازی با فایل JSON
    await syncToJSON(db);
    
    // 🔥 پاک کردن cache برای اینکه تغییرات نمایش داده شود
    try {
      revalidateTag('site-settings');
      revalidateTag('homepage-seo-data');
      revalidateTag('seo-data');
      revalidateTag('dynamic-content');
      revalidatePath('/', 'layout');
      revalidatePath('/', 'page');
      console.log('✅ Cache invalidated successfully for key:', key);
    } catch (revalidateError) {
      console.error('⚠️ Cache revalidation error:', revalidateError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'محتوا با موفقیت به‌روزرسانی شد'
    });
    
  } catch (error) {
    console.error('خطا در به‌روزرسانی محتوای داینامیک:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی محتوا' },
      { status: 500 }
    );
  }
}

// DELETE - حذف محتوا (فقط ادمین)
export async function DELETE(request: NextRequest) {
  try {
    // بررسی احراز هویت (NextAuth یا JWT)
    const auth = await checkAuth(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز - لطفاً وارد شوید' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'کلید الزامی است' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    const result = await db.dynamicContent.deleteOne({ key });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'محتوا یافت نشد' },
        { status: 404 }
      );
    }
    
    // 🔥 همگام‌سازی با فایل JSON
    await syncToJSON(db);
    
    return NextResponse.json({
      success: true,
      message: 'محتوا با موفقیت حذف شد'
    });
    
  } catch (error) {
    console.error('خطا در حذف محتوای داینامیک:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف محتوا' },
      { status: 500 }
    );
  }
}
