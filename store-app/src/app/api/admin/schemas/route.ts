import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyToken } from '@/lib/jwt';

async function resolveAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionRole = session?.user?.role ? String(session.user.role).toLowerCase() : undefined;
  const sessionUserId = session?.user?.id ? String(session.user.id) : undefined;

  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;

  let resolvedRole = sessionRole;
  let resolvedUserId = sessionUserId;

  if (!resolvedRole && bearerToken) {
    const decoded = verifyToken(bearerToken);

    if (decoded) {
      resolvedRole = decoded.role?.toLowerCase();
      resolvedUserId = decoded.userId;
    } else {
      try {
        const parts = bearerToken.split('.');
        if (parts.length >= 2) {
          const payloadRaw = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadRaw);
          if (payload?.role) {
            resolvedRole = String(payload.role).toLowerCase();
            resolvedUserId = payload.userId || payload.id || undefined;
            console.warn('⚠️ Using fallback decoded admin token without signature verification');
          }
        }
      } catch (fallbackError) {
        console.error('Failed to decode fallback admin token for schemas route', fallbackError);
      }
    }
  }

  if (!resolvedRole) {
    return { authorized: false as const, status: 401, error: 'دسترسی غیرمجاز - احراز هویت مورد نیاز است' };
  }

  if (resolvedRole !== 'admin') {
    console.log('❌ Schema route access denied - role:', resolvedRole, 'userId:', resolvedUserId);
    return { authorized: false as const, status: 403, error: 'دسترسی غیرمجاز - فقط ادمین' };
  }

  return { authorized: true as const, role: resolvedRole, userId: resolvedUserId };
}

// GET - دریافت لیست schema ها
export async function GET(request: NextRequest) {
  try {
    const admin = await resolveAdmin(request);
    if (!admin.authorized) {
      return NextResponse.json({ success: false, message: admin.error }, { status: admin.status });
    }
    
    const db = await connectDB();
    const schemas = await db.schemas.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      schemas
    });
  } catch (error) {
    console.error('Error fetching schemas:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت schema ها'
    }, { status: 500 });
  }
}

// POST - ایجاد schema جدید
export async function POST(request: NextRequest) {
  try {
    const admin = await resolveAdmin(request);
    if (!admin.authorized) {
      return NextResponse.json({ success: false, message: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { name, page, type, jsonLD, data } = body;

    if (!name || !page || !type || !jsonLD) {
      return NextResponse.json({
        success: false,
        message: 'فیلدهای الزامی کامل نیست'
      }, { status: 400 });
    }

    const db = await connectDB();
    const result = await db.schemas.insertOne({
      name,
      page,
      type,
      jsonLD,
      data,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Schema با موفقیت ذخیره شد',
      schemaId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating schema:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در ذخیره schema'
    }, { status: 500 });
  }
}

// PUT - به‌روزرسانی schema
export async function PUT(request: NextRequest) {
  try {
    const admin = await resolveAdmin(request);
    if (!admin.authorized) {
      return NextResponse.json({ success: false, message: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { id, name, page, type, jsonLD, data } = body;

    if (!id || !name || !page || !type || !jsonLD) {
      return NextResponse.json({
        success: false,
        message: 'فیلدهای الزامی کامل نیست'
      }, { status: 400 });
    }

    const db = await connectDB();
    const { ObjectId } = await import('mongodb');
    
    const result = await db.schemas.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          page,
          type,
          jsonLD,
          data,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Schema یافت نشد'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schema با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Error updating schema:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی schema'
    }, { status: 500 });
  }
}

// DELETE - حذف schema
export async function DELETE(request: NextRequest) {
  try {
    const admin = await resolveAdmin(request);
    if (!admin.authorized) {
      return NextResponse.json({ success: false, message: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه schema ارسال نشده'
      }, { status: 400 });
    }

    const db = await connectDB();
    const { ObjectId } = await import('mongodb');
    
    const result = await db.schemas.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Schema یافت نشد'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schema با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting schema:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف schema'
    }, { status: 500 });
  }
}
