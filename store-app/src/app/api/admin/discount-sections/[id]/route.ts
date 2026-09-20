import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { fallbackStorage } from '@/lib/fallback-storage';

// GET /api/admin/discount-sections/[id] - دریافت یک بخش تخفیفی
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    console.log('🚀 Starting GET request for section:', params.id);
    
    // Import mongodb instance directly
    const { mongodb } = await import('@/lib/mongodb');
    await mongodb.connect();
    console.log('✅ Database connected successfully');
    
    // استفاده از discountSections getter
    const collection = mongodb.discountSections;
    console.log('✅ Collection accessed via discountSections getter');
    
    const section = await collection.findOne({ 
      _id: new ObjectId(params.id) 
    });
    console.log('📦 Found section:', section ? 'Yes' : 'No');

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'بخش تخفیفی یافت نشد' },
        { status: 404 }
      );
    }

    const formattedSection = {
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
    };

    return NextResponse.json({
      success: true,
      data: formattedSection
    });

  } catch (error) {
    console.error('❌ Error fetching discount section:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در دریافت بخش تخفیفی',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/discount-sections/[id] - به‌روزرسانی بخش تخفیفی
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    console.log('🚀 Starting PUT request for section:', params.id);
    
    const body = await request.json();
    
    // Import mongodb instance directly
    const { mongodb } = await import('@/lib/mongodb');
    await mongodb.connect();
    console.log('✅ Database connected successfully');
    
    // استفاده از discountSections getter
    const collection = mongodb.discountSections;
    console.log('✅ Collection accessed via discountSections getter');
    
    const updateData = {
      title: body.title,
      subtitle: body.subtitle,
      active: body.active,
      maxProducts: body.maxProducts,
      showDiscountBadge: body.showDiscountBadge,
      position: body.position,
      productType: body.productType || 'newest', // اضافه کردن productType
      selectedCategories: body.selectedCategories || [], // اضافه کردن selectedCategories
      order: body.order || 0, // اضافه کردن order
      updatedAt: new Date()
    };
    console.log('📝 Update data:', updateData);

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );
    console.log('✅ Update result:', result.matchedCount, 'matched', result.modifiedCount, 'modified');

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'بخش تخفیفی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'بخش تخفیفی با موفقیت به‌روزرسانی شد'
    });

  } catch (error) {
    console.error('❌ Error updating discount section:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در به‌روزرسانی بخش تخفیفی',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/discount-sections/[id] - حذف بخش تخفیفی
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    console.log('🚀 Starting DELETE request for section:', params.id);
    
    // Import mongodb instance directly
    const { mongodb } = await import('@/lib/mongodb');
    await mongodb.connect();
    console.log('✅ Database connected successfully');
    
    // استفاده از discountSections getter
    const collection = mongodb.discountSections;
    console.log('✅ Collection accessed via discountSections getter');
    
    const result = await collection.deleteOne({ 
      _id: new ObjectId(params.id) 
    });
    console.log('✅ Delete result:', result.deletedCount, 'deleted');

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'بخش تخفیفی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'بخش تخفیفی با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('❌ Error deleting discount section:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در حذف بخش تخفیفی',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}