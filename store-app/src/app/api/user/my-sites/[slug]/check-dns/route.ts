import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth-helper';
import { checkAndUpdateInstanceDns } from '@/lib/provisioning/run-provision';
import { connectDB } from '@/lib/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const db = await connectDB();
    const instance = await db.siteInstances.findOne({ slug, userId: user.id });

    if (!instance) {
      return NextResponse.json({ success: false, error: 'یافت نشد' }, { status: 404 });
    }

    const updated = await checkAndUpdateInstanceDns(slug);
    return NextResponse.json({ success: true, instance: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطا' }, { status: 500 });
  }
}
