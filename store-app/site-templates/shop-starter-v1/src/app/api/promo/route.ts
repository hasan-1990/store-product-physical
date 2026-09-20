import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPromoDiscount } from '@/lib/db/content';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code?.trim()) {
    return NextResponse.json({ valid: false, discount: 0 });
  }

  const discount = await getPromoDiscount(code);
  return NextResponse.json({ valid: discount > 0, discount });
}
