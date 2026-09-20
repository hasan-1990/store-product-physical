import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/db/products';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ success: false, error: 'محصول یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در دریافت محصول' },
      { status: 500 },
    );
  }
}
