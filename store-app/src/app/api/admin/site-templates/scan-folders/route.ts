import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/auth-helper';
import { listTemplateFolders } from '@/lib/provisioning/clone-template';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromRequest(request);
    if (!auth.authorized) {
      return auth.response!;
    }

    const folders = await listTemplateFolders();
    return NextResponse.json({ success: true, folders });
  } catch (error) {
    console.error('scan-folders error:', error);
    return NextResponse.json({ success: false, error: 'خطا در اسکن پوشه‌ها' }, { status: 500 });
  }
}
