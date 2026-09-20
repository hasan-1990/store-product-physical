// src/app/api/admin/security/blocked-ips/route.ts
/**
 * Blocked IPs Management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/auth-helper';
import { logSystemChange } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// دریافت لیست IP های بلاک شده
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) return auth.response as NextResponse;

    const db = await connectDB();

    const blockedIPs = await db.blockedIPs
      .find({})
      .sort({ blockedAt: -1 })
      .toArray();

    // آمار
    const stats = {
      total: blockedIPs.length,
      active: blockedIPs.filter((ip: any) => !ip.expiresAt || ip.expiresAt > new Date()).length,
      expired: blockedIPs.filter((ip: any) => ip.expiresAt && ip.expiresAt <= new Date()).length,
      permanent: blockedIPs.filter((ip: any) => !ip.expiresAt).length
    };

    return NextResponse.json({ success: true, data: { blockedIPs, stats } }, { status: 200 });
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت IP های بلاک شده' }, { status: 500 });
  }
}

// بلاک کردن IP
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) return auth.response as NextResponse;

    const body = await request.json();
    const { ip, reason, durationHours } = body;

    if (!ip) {
      return NextResponse.json({ success: false, message: 'IP الزامی است' }, { status: 400 });
    }

    const db = await connectDB();

    // بررسی IP از قبل بلاک نشده باشد
    const existing = await db.blockedIPs.findOne({ ip });
    if (existing) {
      return NextResponse.json({ success: false, message: 'این IP از قبل بلاک شده است' }, { status: 400 });
    }

    const blockedIP = {
      ip,
      reason: reason || 'Blocked by admin',
      blockedAt: new Date(),
      blockedBy: auth.user?.id || 'unknown',
      expiresAt: durationHours ? new Date(Date.now() + durationHours * 3600000) : null,
      isPermanent: !durationHours
    };

    await db.blockedIPs.insertOne(blockedIP);

    logSystemChange(
      'BLOCK_IP',
      auth.user?.id || 'unknown'?.toString() || 'unknown',
      { ip, reason, durationHours }
    );

    return NextResponse.json({ success: true, data: blockedIP, message: 'IP بلاک شد' }, { status: 201 });
  } catch (error) {
    console.error('Error blocking IP:', error);
    return NextResponse.json({ success: false, message: 'خطا در بلاک کردن IP' }, { status: 500 });
  }
}

// حذف IP از لیست بلاک
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) return auth.response as NextResponse;

    const { searchParams } = request.nextUrl;
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json({ success: false, message: 'IP الزامی است' }, { status: 400 });
    }

    const db = await connectDB();

    const result = await db.blockedIPs.deleteOne({ ip });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'IP یافت نشد' }, { status: 404 });
    }

    logSystemChange(
      'UNBLOCK_IP',
      auth.user?.id || 'unknown'?.toString() || 'unknown',
      { ip }
    );

    return NextResponse.json({ success: true, data: { success: true }, message: 'IP از لیست بلاک حذف شد' }, { status: 200 });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    return NextResponse.json({ success: false, message: 'خطا در حذف IP از لیست بلاک' }, { status: 500 });
  }
}
