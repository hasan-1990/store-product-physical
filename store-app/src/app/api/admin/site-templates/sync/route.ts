import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/auth-helper';
import { syncTemplatesFromDisk } from '@/lib/provisioning/template-registry';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) {
      return auth.response!;
    }

    const result = await syncTemplatesFromDisk();

    return NextResponse.json({
      success: true,
      message: `${result.synced.length} قالب همگام‌سازی شد`,
      ...result,
    });
  } catch (error) {
    console.error('sync site-templates error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در همگام‌سازی قالب‌ها از دیسک' },
      { status: 500 }
    );
  }
}
