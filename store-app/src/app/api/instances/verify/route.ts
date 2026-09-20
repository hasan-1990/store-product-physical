import { NextRequest, NextResponse } from 'next/server';
import { verifyInstanceLicense } from '@/lib/provisioning/run-provision';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, domain, licenseKey } = body;

    if (!slug || !domain || !licenseKey) {
      return NextResponse.json(
        { success: false, valid: false, error: 'slug, domain, licenseKey الزامی است' },
        { status: 400 }
      );
    }

    const result = await verifyInstanceLicense(slug, domain, licenseKey);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('instance verify error:', error);
    return NextResponse.json({ success: false, valid: false, error: 'خطای سرور' }, { status: 500 });
  }
}
