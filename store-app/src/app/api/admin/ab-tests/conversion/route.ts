import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { testId, variantId, goal, value, timestamp } = data;

    // اعتبارسنجی داده‌های ورودی
    if (!testId || !variantId || !goal) {
      return NextResponse.json(
        { success: false, error: 'فیلدهای testId، variantId و goal الزامی هستند' },
        { status: 400 }
      );
    }

    const conversionRecord = {
      testId,
      variantId,
      goal,
      value: value || 0,
      timestamp: timestamp || Date.now(),
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      createdAt: new Date()
    };

    // در محیط توسعه، فقط log می‌کنیم
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 A/B Test Conversion:', conversionRecord);
      return NextResponse.json({ 
        success: true, 
        message: 'Conversion ثبت شد (development mode)',
        conversionId: `conv_${Date.now()}`
      });
    }

    // ذخیره در دیتابیس
    const db = await connectDB();
    const result = await db.getCollection('ab_test_conversions').insertOne(conversionRecord);

    // به‌روزرسانی آمار تست
    await updateTestResults(db, testId, variantId, goal, value || 0);

    return NextResponse.json({ 
      success: true, 
      conversionId: result.insertedId,
      message: 'Conversion با موفقیت ثبت شد'
    });

  } catch (error) {
    console.error('خطا در ثبت conversion:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت conversion' },
      { status: 500 }
    );
  }
}

// به‌روزرسانی نتایج تست
async function updateTestResults(db: any, testId: string, variantId: string, goal: string, value: number) {
  try {
    // دریافت تست فعلی
    const test = await db.getCollection('ab_tests').findOne({ 
      id: testId 
    });

    if (!test) {
      console.error('تست یافت نشد:', testId);
      return;
    }

    // محاسبه آمار جدید
    const results = test.results || {};
    const variantResults = results[variantId] || {
      views: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0
    };

    // افزایش تعداد conversions
    variantResults.conversions += 1;
    
    // افزایش درآمد اگر value داده شده باشد
    if (value > 0) {
      variantResults.revenue += value;
    }

    // محاسبه مجدد نرخ تبدیل
    if (variantResults.views > 0) {
      variantResults.conversionRate = (variantResults.conversions / variantResults.views) * 100;
    }

    // به‌روزرسانی نتایج
    results[variantId] = variantResults;

    // ذخیره در دیتابیس
    await db.getCollection('ab_tests').updateOne(
      { id: testId },
      { 
        $set: { 
          results,
          updatedAt: new Date()
        } 
      }
    );

  } catch (error) {
    console.error('خطا در به‌روزرسانی نتایج تست:', error);
  }
}

// API برای دریافت آمار تفصیلی conversion ها
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const variantId = searchParams.get('variantId');
    const goal = searchParams.get('goal');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query: any = {};
    
    if (testId) query.testId = testId;
    if (variantId) query.variantId = variantId;
    if (goal) query.goal = goal;
    
    // فیلتر زمانی
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = parseInt(from);
      if (to) query.timestamp.$lte = parseInt(to);
    }

    // در محیط توسعه، داده‌های نمونه برمی‌گردانیم
    if (process.env.NODE_ENV === 'development') {
      const sampleConversions = [
        {
          _id: 'conv_1',
          testId: 'button-color-test',
          variantId: 'red',
          goal: 'add_to_cart',
          value: 299000,
          timestamp: Date.now() - 3600000,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          _id: 'conv_2',
          testId: 'button-color-test',
          variantId: 'control',
          goal: 'add_to_cart',
          value: 150000,
          timestamp: Date.now() - 7200000,
          createdAt: new Date(Date.now() - 7200000)
        },
        {
          _id: 'conv_3',
          testId: 'header-layout-test',
          variantId: 'compact',
          goal: 'navigation_click',
          value: 0,
          timestamp: Date.now() - 1800000,
          createdAt: new Date(Date.now() - 1800000)
        }
      ];

      // فیلتر کردن بر اساس query
      let filteredConversions = sampleConversions;
      
      if (testId) {
        filteredConversions = filteredConversions.filter(c => c.testId === testId);
      }
      
      if (variantId) {
        filteredConversions = filteredConversions.filter(c => c.variantId === variantId);
      }
      
      if (goal) {
        filteredConversions = filteredConversions.filter(c => c.goal === goal);
      }

      return NextResponse.json({ 
        success: true, 
        conversions: filteredConversions,
        total: filteredConversions.length,
        note: 'داده‌های نمونه برای محیط توسعه'
      });
    }

    // دریافت از دیتابیس
    const db = await connectDB();
    const conversions = await db.getCollection('ab_test_conversions')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray();

    return NextResponse.json({ 
      success: true, 
      conversions,
      total: conversions.length 
    });

  } catch (error) {
    console.error('خطا در دریافت conversions:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت conversions' },
      { status: 500 }
    );
  }
}