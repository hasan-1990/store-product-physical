import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const db = await connectDB();
    const filter = status ? { status } : {};
    const instances = await db.siteInstances.find(filter).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, instances });
  } catch (error) {
    console.error('GET site-instances error:', error);
    return NextResponse.json({ success: false, error: 'خطا' }, { status: 500 });
  }
}
