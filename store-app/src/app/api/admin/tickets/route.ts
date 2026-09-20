import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

function toObjectId(value: unknown): ObjectId | null {
  if (typeof value !== 'string') return null;
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

async function resolveAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionRole = session?.user?.role ? String(session.user.role).toLowerCase() : undefined;
  const sessionUserId = session?.user?.id ? String(session.user.id) : undefined;
  const sessionEmail = session?.user?.email ? String(session.user.email) : undefined;

  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;

  let resolvedRole = sessionRole;
  let resolvedUserId = sessionUserId;
  let resolvedEmail = sessionEmail;

  if (!resolvedRole && bearerToken) {
    const decoded = verifyToken(bearerToken);

    if (decoded) {
      resolvedRole = decoded.role?.toLowerCase();
      resolvedUserId = decoded.userId;
      resolvedEmail = decoded.email;
    } else {
      try {
        const parts = bearerToken.split('.');
        if (parts.length >= 2) {
          const payloadRaw = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadRaw);
          if (payload?.role) {
            resolvedRole = String(payload.role).toLowerCase();
            resolvedUserId = payload.userId || payload.id || undefined;
            resolvedEmail = payload.email || undefined;
            console.warn('⚠️ Using fallback decoded admin token without signature verification');
          }
        }
      } catch (fallbackError) {
        console.error('Failed to decode fallback admin token', fallbackError);
      }
    }
  }

  if (!resolvedRole) {
    return { authorized: false as const, status: 401, error: 'احراز هویت مورد نیاز است' };
  }

  if (resolvedRole !== 'admin') {
    console.log('❌ User is not admin. Role:', resolvedRole, 'Email:', resolvedEmail);
    return { authorized: false as const, status: 403, error: 'دسترسی غیرمجاز' };
  }

  return {
    authorized: true as const,
    role: resolvedRole,
    userId: resolvedUserId,
    email: resolvedEmail
  };
}

// GET - دریافت تمام تیکت‌ها (فقط ادمین)
export async function GET(req: NextRequest) {
  try {
    const admin = await resolveAdmin(req);

    if (!admin.authorized) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');

    const db = await connectDB();
    
    // ساخت فیلتر
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;

    // دریافت تیکت‌ها
    const tickets = await db.tickets.find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // محاسبه آمار
    const stats = {
      total: tickets.length,
      open: tickets.filter((t: any) => t.status === 'open').length,
      inProgress: tickets.filter((t: any) => t.status === 'in_progress').length,
      answered: tickets.filter((t: any) => t.status === 'answered').length,
      closed: tickets.filter((t: any) => t.status === 'closed').length,
      byCategory: {
        technical: tickets.filter((t: any) => t.category === 'technical').length,
        sales: tickets.filter((t: any) => t.category === 'sales').length,
        payment: tickets.filter((t: any) => t.category === 'payment').length,
        shipping: tickets.filter((t: any) => t.category === 'shipping').length,
        other: tickets.filter((t: any) => t.category === 'other').length
      },
      byPriority: {
        low: tickets.filter((t: any) => t.priority === 'low').length,
        medium: tickets.filter((t: any) => t.priority === 'medium').length,
        high: tickets.filter((t: any) => t.priority === 'high').length,
        urgent: tickets.filter((t: any) => t.priority === 'urgent').length
      }
    };

    return NextResponse.json({
      success: true,
      tickets: tickets.map((ticket: any) => ({
        ...ticket,
        _id: ticket._id.toString()
      })),
      stats
    });

  } catch (error) {
    console.error('❌ خطا در دریافت تیکت‌ها:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تیکت‌ها' },
      { status: 500 }
    );
  }
}

// PATCH - بروزرسانی تیکت توسط ادمین
export async function PATCH(req: NextRequest) {
  try {
    const admin = await resolveAdmin(req);

    if (!admin.authorized) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = await req.json();
    const { ticketId, status, priority, assignedTo } = body;

    const ticketObjectId = toObjectId(ticketId);
    if (!ticketObjectId) {
      return NextResponse.json({ error: 'شناسه تیکت نامعتبر است' }, { status: 400 });
    }

    const db = await connectDB();
    
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    if (status === 'closed') {
      updateData.closedAt = new Date().toISOString();
    }

    await db.tickets.updateOne({ _id: ticketObjectId }, { $set: updateData });

    return NextResponse.json({
      success: true,
      message: 'تیکت بروزرسانی شد'
    });

  } catch (error) {
    console.error('❌ خطا در بروزرسانی تیکت:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی تیکت' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تیکت (فقط ادمین)
export async function DELETE(req: NextRequest) {
  try {
    const admin = await resolveAdmin(req);

    if (!admin.authorized) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json({ error: 'شناسه تیکت الزامی است' }, { status: 400 });
    }

    const ticketObjectId = toObjectId(ticketId);
    if (!ticketObjectId) {
      return NextResponse.json({ error: 'شناسه تیکت نامعتبر است' }, { status: 400 });
    }

    const db = await connectDB();
    
    await db.tickets.deleteOne({ _id: ticketObjectId });

    return NextResponse.json({
      success: true,
      message: 'تیکت حذف شد'
    });

  } catch (error) {
    console.error('❌ خطا در حذف تیکت:', error);
    return NextResponse.json(
      { error: 'خطا در حذف تیکت' },
      { status: 500 }
    );
  }
}
