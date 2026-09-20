import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET /api/discount-sections - دریافت بخش‌های تخفیفی فعال برای نمایش در سایت
export async function GET() {
  try {
    const db = await connectDB();
    
    const sections = await db.discountSections
      .find({ active: true })
      .sort({ order: 1 })
      .toArray();
    
    const formattedSections = sections.map(section => ({
      id: section._id.toString(),
      title: section.title,
      subtitle: section.subtitle,
      maxProducts: section.maxProducts,
      showDiscountBadge: section.showDiscountBadge,
      order: section.order
    }));

    return NextResponse.json({
      success: true,
      data: formattedSections
    });

  } catch (error) {
    console.error('Error fetching active discount sections:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت بخش‌های تخفیفی' },
      { status: 500 }
    );
  }
}