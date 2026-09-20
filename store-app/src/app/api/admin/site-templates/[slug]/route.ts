import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { slug } = await params;
    const db = await connectDB();
    const template = await db.siteTemplates.findOne({ slug });

    if (!template) {
      return NextResponse.json({ success: false, error: 'قالب یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('GET site-template error:', error);
    return NextResponse.json({ success: false, error: 'خطا' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { slug } = await params;
    const body = await request.json();
    const db = await connectDB();

    const update = {
      ...body,
      updatedAt: new Date().toISOString(),
    };
    delete update._id;
    delete update.slug;

    const result = await db.siteTemplates.findOneAndUpdate(
      { slug },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'قالب یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template: result });
  } catch (error) {
    console.error('PUT site-template error:', error);
    return NextResponse.json({ success: false, error: 'خطا در ویرایش' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { slug } = await params;
    const db = await connectDB();
    await db.siteTemplates.deleteOne({ slug });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE site-template error:', error);
    return NextResponse.json({ success: false, error: 'خطا در حذف' }, { status: 500 });
  }
}
