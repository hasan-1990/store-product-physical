import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

const COLLECTION = 'siteHeaderSettings';

export async function GET() {
  try {
  const mongodb = await connectDB();
  // استفاده از getter برای collection
  const collection = mongodb.siteHeaderSettings;
  const doc = await collection.findOne({}) ?? {};
    return NextResponse.json({ success: true, data: doc || {} });
  } catch (err) {
  return NextResponse.json({ success: false, error: String(err) });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
  const mongodb = await connectDB();
  const collection = mongodb.siteHeaderSettings;
  await collection.updateOne({}, { $set: body }, { upsert: true });
    return NextResponse.json({ success: true });
  } catch (err) {
  return NextResponse.json({ success: false, error: String(err) });
  }
}
