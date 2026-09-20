import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * PATCH - تغییر وضعیت فعال/غیرفعال درگاه
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { active } = await request.json();

    const db = await connectDB();
    const result = await db.paymentGateways.updateOne(
      { _id: new ObjectId(id) },
      { $set: { active, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'درگاه پرداخت یافت نشد'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `درگاه ${active ? 'فعال' : 'غیرفعال'} شد`
    });
  } catch (error) {
    console.error('❌ Error toggling payment gateway:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در تغییر وضعیت درگاه'
    }, { status: 500 });
  }
}
