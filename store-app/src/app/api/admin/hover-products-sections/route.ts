import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - دریافت تمام بخش‌های محصولات ویژه
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');

    let query: any = {};
    if (position) {
      query.position = position;
    }

    const sections = await db.hoverProductsSections
      .find(query)
      .sort({ order: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: sections
    });
  } catch (error) {
    console.error('Error fetching hover products sections:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت بخش‌های محصولات ویژه' },
      { status: 500 }
    );
  }
}

// POST - ایجاد بخش جدید
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();

    // اعتبارسنجی داده‌های ورودی
    if (!body.title || !body.position) {
      return NextResponse.json(
        { success: false, error: 'عنوان و موقعیت الزامی است' },
        { status: 400 }
      );
    }

    // محاسبه order بعدی
    const lastSection = await db.hoverProductsSections
      .find({ position: body.position })
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const nextOrder = lastSection.length > 0 ? (lastSection[0].order || 0) + 1 : 1;

    const newSection = {
      title: body.title || 'جدیدترین محصولات',
      subtitle: body.subtitle || 'کشف کنید، انتخاب کنید و لذت ببرید',
      backgroundColor: body.backgroundColor || 'bg-white',
      maxProducts: body.maxProducts || 8,
      active: body.active !== undefined ? body.active : true,
      position: body.position,
      order: nextOrder,
      productType: body.productType || 'latest', // latest, random, manual, category
      selectedCategories: body.selectedCategories || [],
      selectedProducts: body.selectedProducts || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.hoverProductsSections.insertOne(newSection);

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...newSection
      },
      message: 'بخش با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Error creating hover products section:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد بخش محصولات ویژه' },
      { status: 500 }
    );
  }
}

// PUT - بروزرسانی بخش
export async function PUT(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    const { id, _id, ...updateData } = body;

    const sectionId = id || _id;

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'شناسه بخش الزامی است' },
        { status: 400 }
      );
    }

    const result = await db.hoverProductsSections.updateOne(
      { _id: new ObjectId(sectionId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'بخش یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'بخش با موفقیت بروزرسانی شد'
    });
  } catch (error) {
    console.error('Error updating hover products section:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی بخش محصولات ویژه' },
      { status: 500 }
    );
  }
}

// DELETE - حذف بخش
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه بخش الزامی است' },
        { status: 400 }
      );
    }

    const result = await db.hoverProductsSections.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'بخش یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'بخش با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting hover products section:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف بخش محصولات ویژه' },
      { status: 500 }
    );
  }
}
