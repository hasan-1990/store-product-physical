import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getToken } from "next-auth/jwt";

// دریافت تنظیمات چت‌بات
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    const role = typeof token?.role === 'string' ? token.role.toLowerCase() : undefined;
    
    console.log('🔍 Chatbot Settings GET - Token:', {
      hasToken: !!token,
      email: token?.email,
      role: token?.role
    });
    
    // بررسی دسترسی ادمین
    if (!token || role !== 'admin') {
      console.log('❌ GET Access denied - Invalid token or not admin');
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    const db = await connectDB();
    const settings = await db.chatbotSettings.find({}).toArray();

    // تبدیل به object برای راحتی استفاده
    const settingsObj: any = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      settings: settingsObj
    });

  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

// ذخیره یا به‌روزرسانی تنظیمات
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    const role = typeof token?.role === 'string' ? token.role.toLowerCase() : undefined;
    
    console.log('🔍 Chatbot Settings POST - Token:', {
      hasToken: !!token,
      email: token?.email,
      role: token?.role
    });
    
    // بررسی دسترسی ادمین
    if (!token || role !== 'admin') {
      console.log('❌ POST Access denied - Invalid token or not admin');
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'کلید الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    // به‌روزرسانی یا ایجاد تنظیم
    await db.chatbotSettings.updateOne(
      { key },
      { 
        $set: { 
          key, 
          value,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد'
    });

  } catch (error) {
    console.error('Error saving chatbot settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}

// حذف تنظیم
export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    const role = typeof token?.role === 'string' ? token.role.toLowerCase() : undefined;
    
    // بررسی دسترسی ادمین
    if (!token || role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
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
    await db.chatbotSettings.deleteOne({ key });

    return NextResponse.json({
      success: true,
      message: 'تنظیم با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting chatbot setting:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف تنظیم' },
      { status: 500 }
    );
  }
}
