import { NextRequest, NextResponse } from 'next/server';
import { connectDB, withDbRetry } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { resolveRequestAuth } from '@/lib/resolve-request-auth';
import { ObjectId } from 'mongodb';

async function findUserById(userId: string) {
  return withDbRetry(async (db) => {
    let user = await db.users.findOne(
      { _id: userId as any },
      { projection: { password: 0 } }
    );

    if (!user && /^[0-9a-fA-F]{24}$/.test(userId)) {
      user = await db.users.findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } }
      );
    }

    return user;
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveRequestAuth(req);
    const bearerToken = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const decoded = bearerToken ? verifyToken(bearerToken) : null;
    const userId = auth?.userId || decoded?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'ماژول احراز هویت یافت نشد' }, { status: 401 });
    }

    const user = await findUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        nationalCode: user.nationalCode || '',
        role: user.role || 'USER',
        avatar: user.avatar || '',
        createdAt: user.createdAt || user.created_at || new Date().toISOString(),
        lastLogin: user.lastLogin || user.last_login || null
      }
    });
  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات کاربر' }, { status: 500 });
  }
}

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
    const { name, phone, nationalCode } = body;
    
    // Validation
    if (!name || !phone) {
      return NextResponse.json({ error: 'نام و شماره موبایل الزامی است' }, { status: 400 });
    }

    // Validate phone
    if (!/^09[0-9]{9}$/.test(phone)) {
      return NextResponse.json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
    }

    // Validate national code if provided
    if (nationalCode && !/^[0-9]{10}$/.test(nationalCode)) {
      return NextResponse.json({ error: 'کد ملی باید 10 رقم باشد' }, { status: 400 });
    }

    // Update user
    const updateData: any = {
      name,
      phone,
      updatedAt: new Date(),
    };

    if (nationalCode) {
      updateData.nationalCode = nationalCode;
    }

    // Try string ID first
    let result = await db.users.updateOne(
      { _id: decoded.userId as any },
      { $set: updateData }
    );
    
    // If not found, try ObjectId format
    if (result.matchedCount === 0 && /^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
      result = await db.users.updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: updateData }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'پروفایل با موفقیت بروزرسانی شد'
    });
  } catch (error) {
    console.error('User profile update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی پروفایل' }, { status: 500 });
  }
}
