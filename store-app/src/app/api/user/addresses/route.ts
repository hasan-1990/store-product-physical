import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { ObjectId } from 'mongodb';
import { 
  validateFirstName, 
  validateMobileWithMessage, 
  validateAddress, 
  validateIranianPostalCode 
} from '@/utils';

// GET - دریافت لیست آدرس‌های کاربر
export async function GET(req: NextRequest) {
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

    // Get user addresses
    const addresses = await db.addresses.find({
      userId: decoded.userId
    }).sort({ isDefault: -1, createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json({ error: 'خطا در دریافت آدرس‌ها' }, { status: 500 });
  }
}

// POST - افزودن آدرس جدید
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { fullName, phone, province, city, address, postalCode, isDefault } = body;

    // Validation
    if (!fullName || !phone || !province || !city || !address || !postalCode) {
      return NextResponse.json({ error: 'لطفا تمام فیلدها را پر کنید' }, { status: 400 });
    }

    // ✅ Name Validation
    const nameResult = validateFirstName(fullName);
    if (!nameResult.isValid) {
      return NextResponse.json(
        { error: `نام: ${nameResult.error}` },
        { status: 400 }
      );
    }

    // ✅ Phone Validation
    const phoneResult = validateMobileWithMessage(phone);
    if (!phoneResult.isValid) {
      return NextResponse.json(
        { error: `موبایل: ${phoneResult.message}` },
        { status: 400 }
      );
    }

    // ✅ Address Validation
    const addrResult = validateAddress(address);
    if (!addrResult.isValid) {
      return NextResponse.json(
        { error: `آدرس: ${addrResult.error}` },
        { status: 400 }
      );
    }

    // ✅ Postal Code Validation
    const zipResult = validateIranianPostalCode(postalCode);
    if (!zipResult.isValid) {
      return NextResponse.json(
        { error: `کد پستی: ${zipResult.error}` },
        { status: 400 }
      );
    }

    // If this is the default address, unset other defaults
    if (isDefault) {
      await db.addresses.updateMany(
        { userId: decoded.userId },
        { $set: { isDefault: false } }
      );
    }

    // Check if this is the first address (make it default automatically)
    const existingAddressCount = await db.addresses.countDocuments({
      userId: decoded.userId
    });

    const newAddress = {
      userId: decoded.userId,
      fullName,
      phone,
      province,
      city,
      address,
      postalCode,
      isDefault: isDefault || existingAddressCount === 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.addresses.insertOne(newAddress);

    return NextResponse.json({
      success: true,
      message: 'آدرس با موفقیت ذخیره شد',
      address: {
        id: result.insertedId.toString(),
        ...newAddress
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    return NextResponse.json({ error: 'خطا در ذخیره آدرس' }, { status: 500 });
  }
}

// PUT - بروزرسانی آدرس
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { id, fullName, phone, province, city, address, postalCode, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه آدرس الزامی است' }, { status: 400 });
    }

    // Validation
    if (!fullName || !phone || !province || !city || !address || !postalCode) {
      return NextResponse.json({ error: 'لطفا تمام فیلدها را پر کنید' }, { status: 400 });
    }

    // ✅ Name Validation
    const nameResultPut = validateFirstName(fullName);
    if (!nameResultPut.isValid) {
      return NextResponse.json(
        { error: `نام: ${nameResultPut.error}` },
        { status: 400 }
      );
    }

    // ✅ Phone Validation
    const phoneResultPut = validateMobileWithMessage(phone);
    if (!phoneResultPut.isValid) {
      return NextResponse.json(
        { error: `موبایل: ${phoneResultPut.message}` },
        { status: 400 }
      );
    }

    // ✅ Address Validation
    const addrResultPut = validateAddress(address);
    if (!addrResultPut.isValid) {
      return NextResponse.json(
        { error: `آدرس: ${addrResultPut.error}` },
        { status: 400 }
      );
    }

    // ✅ Postal Code Validation
    const zipResultPut = validateIranianPostalCode(postalCode);
    if (!zipResultPut.isValid) {
      return NextResponse.json(
        { error: `کد پستی: ${zipResultPut.error}` },
        { status: 400 }
      );
    }

    // If this is the default address, unset other defaults
    if (isDefault) {
      await db.addresses.updateMany(
        {
          userId: decoded.userId,
          _id: { $ne: new ObjectId(id) }
        },
        { $set: { isDefault: false } }
      );
    }

    // Update address
    const result = await db.addresses.updateOne(
      {
        _id: new ObjectId(id),
        userId: decoded.userId // Security: ensure user owns this address
      },
      {
        $set: {
          fullName,
          phone,
          province,
          city,
          address,
          postalCode,
          isDefault,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'آدرس یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'آدرس با موفقیت بروزرسانی شد'
    });
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی آدرس' }, { status: 500 });
  }
}

// DELETE - حذف آدرس
export async function DELETE(req: NextRequest) {
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

    // Get address ID from query params
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه آدرس الزامی است' }, { status: 400 });
    }

    // Check if this is the default address
    const address = await db.addresses.findOne({
      _id: new ObjectId(id),
      userId: decoded.userId
    });

    if (!address) {
      return NextResponse.json({ error: 'آدرس یافت نشد' }, { status: 404 });
    }

    // Delete address
    await db.addresses.deleteOne({
      _id: new ObjectId(id),
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
