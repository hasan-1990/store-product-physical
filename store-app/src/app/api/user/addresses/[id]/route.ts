import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { ObjectId } from 'mongodb';

// DELETE - حذف آدرس
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();

    // Get token from header
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'ماژول احراز هویت یافت نشد' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const { id: addressId } = await params;

    if (!addressId) {
      return NextResponse.json({ error: 'شناسه آدرس الزامی است' }, { status: 400 });
    }

    // Check if this is the default address
    const address = await db.addresses.findOne({
      _id: new ObjectId(addressId),
      userId: decoded.userId
    });

    if (!address) {
      return NextResponse.json({ error: 'آدرس یافت نشد' }, { status: 404 });
    }

    // Delete address
    await db.addresses.deleteOne({
      _id: new ObjectId(addressId),
      userId: decoded.userId
    });

    // If deleted address was default, make another address default
    if (address.isDefault) {
      const remainingAddresses = await db.addresses.find({
        userId: decoded.userId
      }).limit(1).toArray();

      if (remainingAddresses.length > 0) {
        await db.addresses.updateOne(
          { _id: remainingAddresses[0]._id },
          { $set: { isDefault: true } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'آدرس با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: 'خطا در حذف آدرس' }, { status: 500 });
  }
}

// PUT - تنظیم به عنوان پیش‌فرض
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();

    // Get token from header
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'ماژول احراز هویت یافت نشد' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const { id: addressId } = await params;

    if (!addressId) {
      return NextResponse.json({ error: 'شناسه آدرس الزامی است' }, { status: 400 });
    }

    // Check if address exists and belongs to user
    const address = await db.addresses.findOne({
      _id: new ObjectId(addressId),
      userId: decoded.userId
    });

    if (!address) {
      return NextResponse.json({ error: 'آدرس یافت نشد' }, { status: 404 });
    }

    // Unset all defaults for this user
    await db.addresses.updateMany(
      { userId: decoded.userId },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    await db.addresses.updateOne(
      { _id: new ObjectId(addressId) },
      { $set: { isDefault: true } }
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
