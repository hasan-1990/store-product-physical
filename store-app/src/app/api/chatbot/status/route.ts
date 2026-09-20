import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function parseEnabled(value: unknown): boolean {
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  return true;
}

export async function GET() {
  try {
    const db = await connectDB();
    const setting = await db.chatbotSettings.findOne({ key: 'enabled' });

    return NextResponse.json({
      success: true,
      enabled: parseEnabled(setting?.value),
    });
  } catch (error) {
    console.error('Error fetching chatbot status:', error);
    return NextResponse.json({
      success: true,
      enabled: true,
    });
  }
}
