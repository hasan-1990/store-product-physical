import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getJwtSecret } from '@/lib/secrets';

// PUT - تنظیم آدرس پیش‌فرض
export async function PUT(req: NextRequest) {
  try {
    const db = await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'ماژول احراز هویت یافت نشد' }, { status: 401 });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه آدرس الزامی است' }, { status: 400 });
    }

    // Check if address exists and belongs to user
    const address = await db.addresses.findOne({
      _id: new ObjectId(id),
      userId: decoded.userId
    });

    if (!address) {
      return NextResponse.json({ error: 'آدرس یافت نشد' }, { status: 404 });
    }

    // Unset all other defaults for this user
    await db.addresses.updateMany(
      { userId: decoded.userId },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    await db.addresses.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isDefault: true, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'آدرس پیش‌فرض با موفقیت تنظیم شد'
    });
  } catch (error) {
    console.error('Set default address error:', error);
    return NextResponse.json({ error: 'خطا در تنظیم آدرس پیش‌فرض' }, { status: 500 });
  }
}
