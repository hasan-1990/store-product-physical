import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    await db.products.findOne({}, { projection: { _id: 1 } });
    return NextResponse.json({ ok: true, service: 'shop-starter-v1' });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: 'shop-starter-v1',
        error: error instanceof Error ? error.message : 'Database unavailable',
      },
      { status: 503 },
    );
  }
}
