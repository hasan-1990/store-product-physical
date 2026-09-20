import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = await connectDB();
    const template = await db.siteTemplates.findOne({ slug, active: true });

    if (!template) {
      return NextResponse.json({ success: false, error: 'قالب یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطا' }, { status: 500 });
  }
}
