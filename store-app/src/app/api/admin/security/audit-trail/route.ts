// src/app/api/admin/security/audit-trail/route.ts
/**
 * Audit Trail API - تاریخچه تغییرات
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

// دریافت تاریخچه تغییرات
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) return auth.response as NextResponse;

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const collection = searchParams.get('collection');
    const operation = searchParams.get('operation');
    const userId = searchParams.get('userId');

    const db = await connectDB();

    // Build query
    const query: any = {};
    if (collection) query.collection = collection;
    if (operation) query.operation = operation;
    if (userId) query.userId = userId;

    // Get total count
    const total = await db.auditTrail.countDocuments(query);

    // Get paginated results
    const auditLogs = await db.auditTrail
      .find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // آمار
    const stats = {
      totalChanges: total,
      byOperation: await db.auditTrail.aggregate([
        { $match: query },
        { $group: { _id: '$operation', count: { $sum: 1 } } }
      ]).toArray(),
      byCollection: await db.auditTrail.aggregate([
        { $match: query },
        { $group: { _id: '$collection', count: { $sum: 1 } } }
      ]).toArray(),
      topUsers: await db.auditTrail.aggregate([
        { $match: query },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray()
    };

    return NextResponse.json({ 
      success: true, 
      data: {
        auditLogs,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت تاریخچه تغییرات' }, { status: 500 });
  }
}
