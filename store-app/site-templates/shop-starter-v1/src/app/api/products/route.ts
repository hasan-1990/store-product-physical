import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminFromRequest } from '@/lib/auth';
import { listProducts, createProduct } from '@/lib/db/products';
import type { CatalogCategory, SkinType } from '@/lib/catalog';

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0).default(0),
  category: z.string(),
  brand: z.string(),
  image: z.string().optional(),
  active: z.boolean().default(true),
  skinTypes: z.array(z.string()).optional(),
});

const categoryLabels: Record<string, string> = {
  skincare: 'مراقبت پوست',
  'face-makeup': 'آرایش صورت',
  'eye-makeup': 'آرایش چشم',
  'lip-makeup': 'آرایش لب',
  fragrance: 'عطر و ادکلن',
  hair: 'مراقبت از مو',
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const activeOnly = searchParams.get('all') !== 'true';

    const products = await listProducts({ category, activeOnly });
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در دریافت محصولات' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const body = await request.json();
    const data = createSchema.parse(body);
    const category = data.category as CatalogCategory;
    const slug = data.slug || slugify(data.name);
    const categoryLabel = categoryLabels[category] || data.category;

    const id = await createProduct({
      slug,
      name: data.name,
      category,
      categoryLabel,
      categorySlug: category,
      price: data.price,
      image: data.image || '/images/products/serum-main.jpg',
      badge: 'جدید',
      skinTypes: (data.skinTypes as SkinType[]) || ['combination'],
      brand: data.brand,
      stock: data.stock,
      active: data.active,
      featured: false,
      gallery: [data.image || '/images/products/serum-main.jpg'],
      rating: 4.5,
      reviewCount: 0,
      shortDescription: data.description || data.name,
      description: {
        title: data.name,
        body: data.description || '',
        benefits: [],
      },
      ingredients: [],
      howToUse: [],
      highlights: [],
      reviews: [],
      related: [],
    });

    return NextResponse.json({ success: true, id, slug });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'داده‌های ورودی نامعتبر', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در ایجاد محصول' },
      { status: 500 },
    );
  }
}
