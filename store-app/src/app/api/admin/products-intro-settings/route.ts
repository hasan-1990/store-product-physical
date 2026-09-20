import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

const COLLECTION = 'settings';
const SETTING_KEY = 'products-intro-section';

export async function GET() {
  try {
    console.log('🔄 ProductsIntro GET: Starting...');
    const db = await connectDB();
    console.log('✅ ProductsIntro GET: MongoDB connected');
    
    const settings = await db[COLLECTION].findOne({ key: SETTING_KEY });
    console.log('📄 ProductsIntro GET: Found settings:', settings ? 'Yes' : 'No');
    
    return NextResponse.json({
      success: true,
      data: settings?.data || {
        title: 'مجموعه محصولات ما',
        subtitle: 'بهترین و جدیدترین محصولات را کشف کنید',
        active: true
      }
    });
  } catch (error) {
    console.error('❌ ProductsIntro GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری تنظیمات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 ProductsIntro POST: Starting...');
    const body = await request.json();
    const { title, subtitle, active } = body;
    console.log('📝 ProductsIntro POST: Received data:', { title, subtitle, active });

    const db = await connectDB();
    console.log('✅ ProductsIntro POST: MongoDB connected');
    
    const result = await db[COLLECTION].updateOne(
      { key: SETTING_KEY },
      {
        $set: {
          key: SETTING_KEY,
          data: { title, subtitle, active },
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log('💾 ProductsIntro POST: Save result:', result);

    return NextResponse.json({
      success: true,
      message: 'تنظیمات بخش معرفی محصولات با موفقیت ذخیره شد'
    });
  } catch (error) {
    console.error('❌ ProductsIntro POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}
