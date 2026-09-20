import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const testId = searchParams.get('testId');

    // در محیط توسعه، تست‌های نمونه برمی‌گردانیم
    if (process.env.NODE_ENV === 'development') {
      const sampleTests = [
        {
          id: 'button-color-test',
          name: 'تست رنگ دکمه خرید',
          description: 'آزمایش تأثیر رنگ دکمه بر نرخ تبدیل',
          status: 'running',
          variants: [
            { id: 'control', name: 'آبی (کنترل)', weight: 50 },
            { id: 'red', name: 'قرمز', weight: 25 },
            { id: 'green', name: 'سبز', weight: 25 }
          ],
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 روز پیش
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 روز آینده
          targetAudience: {
            percentage: 80,
            conditions: {
              newUsers: false,
              returningUsers: true,
              devices: ['desktop', 'mobile']
            }
          },
          goals: { 
            primary: 'add_to_cart',
            secondary: ['page_view', 'click']
          },
          results: {
            control: {
              views: 1250,
              conversions: 87,
              conversionRate: 6.96,
              revenue: 52300
            },
            red: {
              views: 1180,
              conversions: 95,
              conversionRate: 8.05,
              revenue: 57000
            },
            green: {
              views: 1220,
              conversions: 91,
              conversionRate: 7.46,
              revenue: 54600
            }
          },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: 'header-layout-test',
          name: 'تست چیدمان هدر',
          description: 'مقایسه دو نوع چیدمان مختلف برای هدر سایت',
          status: 'running',
          variants: [
            { id: 'control', name: 'چیدمان فعلی', weight: 50 },
            { id: 'compact', name: 'چیدمان فشرده', weight: 50 }
          ],
          startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          targetAudience: {
            percentage: 100,
            conditions: {
              devices: ['desktop']
            }
          },
          goals: { 
            primary: 'navigation_click',
            secondary: ['search_usage', 'menu_interaction']
          },
          results: {
            control: {
              views: 2100,
              conversions: 420,
              conversionRate: 20.0,
              revenue: 0
            },
            compact: {
              views: 2050,
              conversions: 461,
              conversionRate: 22.5,
              revenue: 0
            }
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: 'pricing-display-test',
          name: 'تست نمایش قیمت',
          description: 'آزمایش نمایش قیمت با و بدون تخفیف',
          status: 'draft',
          variants: [
            { id: 'control', name: 'قیمت ساده', weight: 50 },
            { id: 'discount', name: 'قیمت با تخفیف', weight: 50 }
          ],
          targetAudience: {
            percentage: 50,
            conditions: {
              newUsers: true
            }
          },
          goals: { 
            primary: 'purchase',
            secondary: ['add_to_cart', 'product_view']
          },
          results: {},
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: 'checkout-flow-test',
          name: 'تست فرآیند پرداخت',
          description: 'مقایسه فرآیند پرداخت یک مرحله‌ای و چند مرحله‌ای',
          status: 'completed',
          variants: [
            { id: 'control', name: 'چند مرحله‌ای', weight: 50 },
            { id: 'single', name: 'یک مرحله‌ای', weight: 50 }
          ],
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          targetAudience: {
            percentage: 100
          },
          goals: { 
            primary: 'purchase_completion',
            secondary: ['checkout_start', 'payment_method_select']
          },
          results: {
            control: {
              views: 5600,
              conversions: 896,
              conversionRate: 16.0,
              revenue: 268800
            },
            single: {
              views: 5720,
              conversions: 1087,
              conversionRate: 19.0,
              revenue: 326100
            }
          },
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ];

      let filteredTests = sampleTests;

      // فیلتر بر اساس وضعیت
      if (status) {
        filteredTests = sampleTests.filter(test => test.status === status);
      }

      // دریافت تست خاص
      if (testId) {
        const test = sampleTests.find(test => test.id === testId);
        if (!test) {
          return NextResponse.json(
            { success: false, error: 'تست یافت نشد' },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, test });
      }

      return NextResponse.json({ 
        success: true, 
        tests: filteredTests,
        total: filteredTests.length,
        note: 'داده‌های نمونه برای محیط توسعه'
      });
    }

    // کد production - اتصال به دیتابیس
    const db = await connectDB();
    
    let query: any = {};
    if (status) {
      query.status = status;
    }

    if (testId) {
      const test = await db.getCollection('ab_tests').findOne({ 
        _id: new ObjectId(testId) 
      });
      
      if (!test) {
        return NextResponse.json(
          { success: false, error: 'تست یافت نشد' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, test });
    }

    const tests = await db.getCollection('ab_tests')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ 
      success: true, 
      tests,
      total: tests.length 
    });

  } catch (error) {
    console.error('خطا در دریافت تست‌ها:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تست‌ها' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // اعتبارسنجی داده‌های ورودی
    const requiredFields = ['name', 'description', 'variants', 'goals'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { success: false, error: `فیلد ${field} الزامی است` },
          { status: 400 }
        );
      }
    }

    // بررسی variant ها
    if (!Array.isArray(data.variants) || data.variants.length < 2) {
      return NextResponse.json(
        { success: false, error: 'حداقل 2 variant مورد نیاز است' },
        { status: 400 }
      );
    }

    // بررسی مجموع weight ها
    const totalWeight = data.variants.reduce((sum: number, v: any) => sum + (v.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      return NextResponse.json(
        { success: false, error: 'مجموع weight های variant ها باید 100 باشد' },
        { status: 400 }
      );
    }

    const newTest = {
      ...data,
      id: `test_${Date.now()}`,
      status: data.status || 'draft',
      results: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // در محیط توسعه، فقط log می‌کنیم
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ تست A/B جدید ایجاد شد:', newTest);
      return NextResponse.json({ 
        success: true, 
        test: newTest,
        message: 'تست با موفقیت ایجاد شد (development mode)'
      });
    }

    // ذخیره در دیتابیس
    const db = await connectDB();
    const result = await db.getCollection('ab_tests').insertOne(newTest);

    return NextResponse.json({ 
      success: true, 
      test: { ...newTest, _id: result.insertedId },
      message: 'تست با موفقیت ایجاد شد'
    });

  } catch (error) {
    console.error('خطا در ایجاد تست:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد تست' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه تست الزامی است' },
        { status: 400 }
      );
    }

    const updatedTest = {
      ...updateData,
      updatedAt: new Date()
    };

    // در محیط توسعه، فقط log می‌کنیم
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 تست A/B به‌روزرسانی شد:', { id, ...updatedTest });
      return NextResponse.json({ 
        success: true, 
        test: { id, ...updatedTest },
        message: 'تست با موفقیت به‌روزرسانی شد (development mode)'
      });
    }

    // به‌روزرسانی در دیتابیس
    const db = await connectDB();
    const result = await db.getCollection('ab_tests').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedTest }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'تست یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تست با موفقیت به‌روزرسانی شد'
    });

  } catch (error) {
    console.error('خطا در به‌روزرسانی تست:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی تست' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه تست الزامی است' },
        { status: 400 }
      );
    }

    // در محیط توسعه، فقط log می‌کنیم
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ تست A/B حذف شد:', id);
      return NextResponse.json({ 
        success: true, 
        message: 'تست با موفقیت حذف شد (development mode)'
      });
    }

    // حذف از دیتابیس
    const db = await connectDB();
    const result = await db.getCollection('ab_tests').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'تست یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تست با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('خطا در حذف تست:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف تست' },
      { status: 500 }
    );
  }
}