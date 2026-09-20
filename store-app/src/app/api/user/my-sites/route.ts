import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth-helper';
import { checkAndUpdateInstanceDns } from '@/lib/provisioning/run-provision';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    const instances = await db.siteInstances
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, instances });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطا' }, { status: 500 });
  }
}
