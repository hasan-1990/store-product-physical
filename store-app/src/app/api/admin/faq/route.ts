import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET - دریافت همه سوالات متداول
export async function GET() {
  try {
    const mongodb = await connectDB();
    const faqs = await mongodb.faqs.find({}).sort({ order: 1, createdAt: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      faqs: faqs
    });
  } catch (error) {
    console.error('خطا در دریافت FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}

// POST - اضافه کردن سوال جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, category, order } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: 'سوال و جواب الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();
    
    const newFAQ = {
      question,
      answer,
      category: category || '',
      order: order || 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongodb.faqs.insertOne(newFAQ);

    return NextResponse.json({
      success: true,
      faq: { ...newFAQ, _id: result.insertedId }
    });
  } catch (error) {
    console.error('خطا در ایجاد FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره اطلاعات' },
      { status: 500 }
    );
  }
}

// PUT - ویرایش سوال
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, question, answer, category, order, isActive } = body;

    if (!id || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'شناسه، سوال و جواب الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();
    const { ObjectId } = await import('mongodb');
    
    const updateData = {
      question,
      answer,
      category: category || '',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date()
    };

    const result = await mongodb.faqs.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'سوال یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'سوال با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('خطا در ویرایش FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی اطلاعات' },
      { status: 500 }
    );
  }
}

// DELETE - حذف سوال
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه سوال الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();
    const { ObjectId } = await import('mongodb');
    
    const result = await mongodb.faqs.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'سوال یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'سوال با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('خطا در حذف FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف اطلاعات' },
      { status: 500 }
    );
  }
}