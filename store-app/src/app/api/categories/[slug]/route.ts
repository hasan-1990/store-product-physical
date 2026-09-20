import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const mongodb = await connectDB();
    const categoriesCollection = mongodb.categories;

    // جستجوی دسته‌بندی با slug (فقط active categories)
    const category = await categoriesCollection.findOne({ 
      slug,
      active: true 
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.imageUrl || category.image,
        imageUrl: category.imageUrl || category.image,
        imageAlt: category.imageAlt,
        parentId: category.parentId ? category.parentId.toString() : null,
        level: category.level,
        active: category.active,
        order: category.order,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });
  } catch (error) {
    console.error('خطا در دریافت دسته‌بندی:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت دسته‌بندی' },
      { status: 500 }
    );
  }
}
