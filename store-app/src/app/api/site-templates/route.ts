import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    const templates = await db.siteTemplates
      .find({ active: true })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطا' }, { status: 500 });
  }
}
