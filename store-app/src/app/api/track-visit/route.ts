import { NextRequest, NextResponse } from 'next/server';
import { trackPageVisit } from '@/lib/visitor-tracking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, referrer, userAgent } = body;

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Track the visit
    await trackPageVisit(page, ip, userAgent, referrer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking visit:', error);
    return NextResponse.json({ success: false, error: 'Failed to track visit' }, { status: 500 });
  }
}