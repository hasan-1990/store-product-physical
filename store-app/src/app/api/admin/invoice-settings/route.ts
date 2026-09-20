import { NextRequest, NextResponse } from 'next/server';
import { connectDB, withDbRetry } from '@/lib/mongodb';
import { isAdminRole, resolveRequestAuth } from '@/lib/resolve-request-auth';
import { serializeDoc } from '@/utils/serialize';

export const dynamic = 'force-dynamic';

async function requireAdmin(req: NextRequest) {
  const auth = await resolveRequestAuth(req);

  if (!auth) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز - احراز هویت مورد نیاز است' },
        { status: 401 }
      ),
    };
  }

  if (!isAdminRole(auth.role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز - فقط ادمین' },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, auth };
}

async function getTaxRate(db: Awaited<ReturnType<typeof connectDB>>): Promise<number> {
  const taxRateSetting = await db.settings.findOne({ key: 'taxRate' });
  if (!taxRateSetting?.value) return 9;

  const raw = taxRateSetting.value;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 9;
  if (typeof raw === 'string') {
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 9;
  }

  return 9;
}

function getDefaultInvoiceSettings(taxRate: number) {
  return {
    companyName: 'فروشگاه آنلاین',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    taxId: '',
    logoUrl: '',
    showLogo: true,
    showTax: false,
    taxRate,
    invoicePrefix: 'INV',
    invoiceNotes: 'از خرید شما متشکریم',
    footerText: 'این فاکتور به صورت الکترونیکی تولید شده است',
  };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const finalSettings = await withDbRetry(async (db) => {
      const taxRate = await getTaxRate(db);
      const settings = await db.invoiceSettings.findOne({});

      return settings
        ? serializeDoc({ ...settings, taxRate })
        : getDefaultInvoiceSettings(taxRate);
    });

    return NextResponse.json({
      success: true,
      data: finalSettings,
    });
  } catch (error) {
    console.error('Error fetching invoice settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات فاکتور' },
      { status: 500 }
    );
  }
}

// PUT - به‌روزرسانی تنظیمات فاکتور
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const body = await request.json();

    const data = await withDbRetry(async (db) => {
      const updateData = {
        companyName: body.companyName || 'فروشگاه آنلاین',
        companyAddress: body.companyAddress || '',
        companyPhone: body.companyPhone || '',
        companyEmail: body.companyEmail || '',
        companyWebsite: body.companyWebsite || '',
        taxId: body.taxId || '',
        logoUrl: body.logoUrl || '',
        showLogo: body.showLogo !== undefined ? body.showLogo : true,
        showTax: body.showTax !== undefined ? body.showTax : false,
        invoicePrefix: body.invoicePrefix || 'INV',
        invoiceNotes: body.invoiceNotes || '',
        footerText: body.footerText || '',
        updatedAt: new Date(),
      };

      await db.invoiceSettings.updateOne({}, { $set: updateData }, { upsert: true });

      const taxRate = await getTaxRate(db);

      return serializeDoc({ ...updateData, taxRate });
    });

    return NextResponse.json({
      success: true,
      message: 'تنظیمات فاکتور با موفقیت به‌روزرسانی شد',
      data,
    });
  } catch (error) {
    console.error('Error updating invoice settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی تنظیمات فاکتور' },
      { status: 500 }
    );
  }
}
