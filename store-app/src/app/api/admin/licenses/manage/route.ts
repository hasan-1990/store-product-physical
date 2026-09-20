import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import type { License } from '@/types';
import { verifyToken } from '@/lib/jwt';

/**
 * API برای مدیریت لایسنس‌ها توسط ادمین
 * GET /api/admin/licenses/manage - دریافت لیست
 * PUT /api/admin/licenses/manage - به‌روزرسانی لایسنس
 * DELETE /api/admin/licenses/manage - حذف لایسنس
 */

export async function GET(request: NextRequest) {
  try {
    // چک دسترسی ادمین
    let isAdminRequest = false;
    const session = await getServerSession();
    if (session?.user && isAdmin(session.user)) {
      isAdminRequest = true;
    } else {
      // try Bearer token (for admin clients that use JWT)
      const authHeader = request.headers.get('authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        if (decoded && decoded.role === 'admin') {
          isAdminRequest = true;
        }
      }
    }

    if (!isAdminRequest) {
      return NextResponse.json(
        { error: 'دسترسی مجاز نیست' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const productId = searchParams.get('productId');

    const db = await connectDB();

    // ساخت فیلتر
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (productId) {
      filter.productId = productId;
    }
    
    if (search) {
      filter.$or = [
        { licenseKey: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
      ];
    }

    // محاسبه offset
    const skip = (page - 1) * limit;

    // دریافت لایسنس‌ها
    const licenses = await db.licenses
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray() as any as License[];

    // تعداد کل
    const total = await db.licenses.countDocuments(filter);

    // دریافت اطلاعات کاربران
    const userIds = [...new Set(licenses.map(l => l.userId))];
    const users = await db.users
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .toArray();

    // ترکیب اطلاعات
    const licensesWithUsers = licenses.map(license => {
      const user = users.find(u => u._id?.toString() === license.userId);
      return {
        ...license,
        user: user ? {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      licenses: licensesWithUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error getting licenses:', error);
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // چک دسترسی ادمین
    let isAdminRequest = false;
    const session = await getServerSession();
    if (session?.user && isAdmin(session.user)) {
      isAdminRequest = true;
    } else {
      const authHeader = request.headers.get('authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        if (decoded && decoded.role === 'admin') {
          isAdminRequest = true;
        }
      }
    }

    if (!isAdminRequest) {
      return NextResponse.json(
        { error: 'دسترسی مجاز نیست' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { licenseId, updates, action } = body;

    if (!licenseId) {
      return NextResponse.json(
        { error: 'شناسه لایسنس الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    let updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // اعمال action های مختلف
    switch (action) {
      case 'suspend':
        updateData.status = 'suspended';
        updateData.notes = 'تعلیق شده توسط ادمین';
        break;

      case 'activate':
        updateData.status = 'active';
        updateData.isActivated = true;
        break;

      case 'deactivate':
        updateData.status = 'inactive';
        updateData.isActivated = false;
        break;

      case 'revoke':
        updateData.status = 'revoked';
        updateData.notes = 'لغو شده توسط ادمین';
        break;

      case 'extend':
        if (updates.expiresAt) {
          updateData.expiresAt = updates.expiresAt;
        }
        break;

      case 'update':
        if (updates) {
          Object.assign(updateData, updates);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'عملیات نامعتبر' },
          { status: 400 }
        );
    }

    // اعمال به‌روزرسانی
    const result = await db.licenses.updateOne(
      { _id: new ObjectId(licenseId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'لایسنس یافت نشد یا تغییری اعمال نشد' },
        { status: 404 }
      );
    }

    // دریافت لایسنس به‌روز شده
    const updatedLicense = await db.licenses.findOne({
      _id: new ObjectId(licenseId)
    });

    return NextResponse.json({
      success: true,
      message: 'لایسنس با موفقیت به‌روزرسانی شد',
      license: updatedLicense,
    });

  } catch (error) {
    console.error('Error updating license:', error);
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE License API called');
    
    const searchParams = request.nextUrl.searchParams;
    const licenseId = searchParams.get('id');
    
    console.log('🔍 License ID:', licenseId);

    if (!licenseId) {
      console.log('❌ Missing license ID');
      return NextResponse.json(
        { error: 'شناسه لایسنس الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    console.log('✅ Database connected');

    const result = await db.licenses.deleteOne({
      _id: new ObjectId(licenseId)
    });
    
    console.log('🔍 Delete result:', result);

    if (result.deletedCount === 0) {
      console.log('❌ License not found');
      return NextResponse.json(
        { error: 'لایسنس یافت نشد' },
        { status: 404 }
      );
    }

    console.log('✅ License deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'لایسنس با موفقیت حذف شد',
    });

  } catch (error) {
    console.error('❌ Error deleting license:', error);
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

/**
 * چک کردن دسترسی ادمین
 */
function isAdmin(user: any): boolean {
  return user?.role === 'admin' || user?.email === 'admin@yoursite.com';
}