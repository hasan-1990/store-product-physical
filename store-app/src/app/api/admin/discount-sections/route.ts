import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { fallbackStorage } from '@/lib/fallback-storage';

// GET /api/admin/discount-sections - دریافت همه بخش‌های تخفیفی
export async function GET() {
  try {
    console.log('🚀 Starting GET request for discount sections');
    
    // Return empty array as fallback if database connection fails
    const emptyResponse = {
      success: true,
      data: []
    };
    
    try {
      // Import mongodb instance directly
      const { mongodb } = await import('@/lib/mongodb');
      await mongodb.connect();
      console.log('✅ Database connected successfully');
      
      // استفاده از discountSections getter مستقیماً
      const collection = mongodb.discountSections;
      console.log('✅ Collection accessed via discountSections getter');
      
      const sections = await collection.find({}).sort({ order: 1 }).toArray();
      console.log('📊 Found sections:', sections.length);
      
      const formattedSections = sections.map((section: any) => ({
        id: section._id.toString(),
        title: section.title,
        subtitle: section.subtitle,
        active: section.active,
        maxProducts: section.maxProducts,
        showDiscountBadge: section.showDiscountBadge,
        position: section.position || 'home-top',
        productType: section.productType || 'newest', // اضافه کردن productType
        selectedCategories: section.selectedCategories || [], // اضافه کردن selectedCategories
        order: section.order,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt
      }));

      return NextResponse.json({
        success: true,
        data: formattedSections,
        source: 'database',
        debug: `Found ${formattedSections.length} sections in database`
      });
      
    } catch (dbError) {
      console.error('❌ Database error, using fallback storage:', dbError);
      const sections = fallbackStorage.getSections();
      console.log('📊 Fallback sections count:', sections.length);
      
      return NextResponse.json({
        success: true,
        data: sections,
        source: 'fallback',
        debug: `Found ${sections.length} sections in fallback storage`
      });
    }

  } catch (error) {
    console.error('❌ Error fetching discount sections:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: true, 
        data: [] // Return empty array instead of error
      },
      { status: 200 }
    );
  }
}

// POST /api/admin/discount-sections - ایجاد بخش تخفیفی جدید
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting POST request for discount sections');
    
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    try {
      // Import mongodb instance directly
      const { mongodb } = await import('@/lib/mongodb');
      await mongodb.connect();
      console.log('✅ Database connected successfully');
      console.log('🔍 MongoDB instance type:', typeof mongodb);
      console.log('🔍 MongoDB instance constructor:', mongodb.constructor.name);
      console.log('🔍 Has discountSections getter:', 'discountSections' in mongodb);
      
      // استفاده از discountSections getter مستقیماً
      const collection = mongodb.discountSections;
      console.log('✅ Using discountSections getter directly');
      console.log('🔍 Collection type:', typeof collection);
      
      // تست collection با یک query ساده
      const testCount = await collection.countDocuments();
      console.log('📊 Current documents count:', testCount);
      
      // دریافت بالاترین order موجود
      const lastSection = await collection.findOne({}, { sort: { order: -1 } });
      console.log('📊 Last section found:', lastSection);
      
      const nextOrder = lastSection ? lastSection.order + 1 : 1;
      console.log('🔢 Next order will be:', nextOrder);

      const newSection = {
        title: body.title,
        subtitle: body.subtitle || '',
        active: body.active !== undefined ? body.active : true,
        maxProducts: body.maxProducts || 6,
        showDiscountBadge: body.showDiscountBadge !== undefined ? body.showDiscountBadge : true,
        position: body.position || 'home-top',
        productType: body.productType || 'newest', // اضافه کردن productType
        selectedCategories: body.selectedCategories || [], // اضافه کردن selectedCategories
        order: nextOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('📦 New section to insert:', newSection);

      const result = await collection.insertOne(newSection);
      console.log('✅ Insert result:', result);

      return NextResponse.json({
        success: true,
        data: {
          id: result.insertedId.toString(),
          ...newSection
        },
        message: 'بخش تخفیفی جدید با موفقیت ایجاد شد'
      });
      
    } catch (dbError) {
      console.error('❌ Database connection error, using fallback storage:', dbError);
      
      const newSection = fallbackStorage.addSection({
        title: body.title,
        subtitle: body.subtitle || '',
        active: body.active !== undefined ? body.active : true,
        maxProducts: body.maxProducts || 6,
        showDiscountBadge: body.showDiscountBadge !== undefined ? body.showDiscountBadge : true,
        position: body.position || 'home-top',
        productType: body.productType || 'newest', // اضافه کردن productType
        selectedCategories: body.selectedCategories || [] // اضافه کردن selectedCategories
      });
      
      console.log('✅ Section created in fallback storage:', newSection);
      
      return NextResponse.json({
        success: true,
        data: newSection,
        message: 'بخش تخفیفی جدید با موفقیت ایجاد شد (حافظه موقت)',
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('❌ Error creating discount section:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('❌ Full error object:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در ایجاد بخش تخفیفی',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/discount-sections - به‌روزرسانی ترتیب بخش‌ها
export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 Starting PUT request for sections order');
    
    const { sections } = await request.json();
    
    try {
      // Import mongodb instance directly
      const { mongodb } = await import('@/lib/mongodb');
      await mongodb.connect();
      console.log('✅ Database connected successfully');
      
      // استفاده از discountSections getter
      const collection = mongodb.discountSections;
      console.log('✅ Collection accessed via discountSections getter');
      
      console.log('📝 Updating sections order:', sections?.length || 0, 'sections');
      
      // به‌روزرسانی ترتیب همه بخش‌ها
      const updatePromises = sections.map((section: any, index: number) => 
        collection.updateOne(
          { _id: new ObjectId(section.id) },
          { 
            $set: { 
              order: index + 1,
              updatedAt: new Date()
            } 
          }
        )
      );

      await Promise.all(updatePromises);
      console.log('✅ All sections order updated successfully');

      return NextResponse.json({
        success: true,
        message: 'ترتیب بخش‌ها با موفقیت به‌روزرسانی شد'
      });
      
    } catch (dbError) {
      console.error('❌ Database error, using fallback storage:', dbError);
      
      fallbackStorage.updateOrder(sections);
      console.log('✅ Sections order updated in fallback storage');

      return NextResponse.json({
        success: true,
        message: 'ترتیب بخش‌ها با موفقیت به‌روزرسانی شد (حافظه موقت)',
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('❌ Error updating sections order:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در به‌روزرسانی ترتیب بخش‌ها',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}