import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/auth-helper';
import { checkAndUpdateInstanceDns } from '@/lib/provisioning/run-provision';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const admin = await requireAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const db = await connectDB();
    const instance = await db.siteInstances.findOne({ slug });

    if (!instance) {
      return NextResponse.json({ success: false, error: 'یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, instance });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطا' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const admin = await requireAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const db = await connectDB();

    if (body.action === 'check-dns') {
      const instance = await checkAndUpdateInstanceDns(slug);
      return NextResponse.json({ success: true, instance });
    }

    if (body.action === 'suspend') {
      await db.siteInstances.updateOne(
        { slug },
        { $set: { status: 'suspended', updatedAt: new Date().toISOString() } }
      );
    }

    if (body.action === 'activate') {
      await db.siteInstances.updateOne(
        { slug },
        { $set: { status: 'active', updatedAt: new Date().toISOString() } }
      );
    }

    const instance = await db.siteInstances.findOne({ slug });
    return NextResponse.json({ success: true, instance });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطا' }, { status: 500 });
  }
}
