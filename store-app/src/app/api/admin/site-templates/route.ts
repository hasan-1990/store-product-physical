import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/auth-helper';
import type { SiteTemplate } from '@/types/site-provisioning';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const db = await connectDB();
    const filter = activeOnly ? { active: true } : {};
    const templates = await db.siteTemplates.find(filter).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error('GET site-templates error:', error);
    return NextResponse.json({ success: false, error: 'خطا در دریافت قالب‌ها' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const now = new Date().toISOString();

    if (!body.slug || !body.name || !body.folderPath) {
      return NextResponse.json(
        { success: false, error: 'slug، name و folderPath الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const existing = await db.siteTemplates.findOne({ slug: body.slug });
    if (existing) {
      return NextResponse.json({ success: false, error: 'این slug قبلاً ثبت شده' }, { status: 409 });
    }

    const template: SiteTemplate = {
      slug: body.slug,
      name: body.name,
      folderPath: body.folderPath,
      shortDescription: body.shortDescription || '',
      description: body.description || '',
      thumbnail: body.thumbnail || '',
      gallery: body.gallery || [],
      features: body.features || [],
      version: body.version || '1.0.0',
      demoUrl: body.demoUrl || '',
      active: body.active !== false,
      seo: {
        title: body.seo?.title || body.name,
        description: body.seo?.description || body.shortDescription || '',
        keywords: body.seo?.keywords || '',
        ogImage: body.seo?.ogImage || body.thumbnail || '',
        canonicalUrl: body.seo?.canonicalUrl || `/templates/${body.slug}`,
      },
      basePrice: body.basePrice,
      linkedProductId: body.linkedProductId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.siteTemplates.insertOne(template as any);

    return NextResponse.json({
      success: true,
      template: { ...template, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error('POST site-templates error:', error);
    return NextResponse.json({ success: false, error: 'خطا در ایجاد قالب' }, { status: 500 });
  }
}
