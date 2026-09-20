import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

// GET - دریافت اطلاعات فاکتور برای یک سفارش
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه سفارش نامعتبر است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // دریافت سفارش
    const order = await db.orders.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      );
    }

    // دریافت تنظیمات فاکتور
    let invoiceSettings = await db.invoiceSettings.findOne({});

    if (!invoiceSettings) {
      const defaultSettings = {
        companyName: 'فروشگاه آنلاین',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        taxId: '',
        logoUrl: '',
        showLogo: true,
        showTax: false,
        taxRate: 9,
        invoicePrefix: 'INV',
        invoiceNotes: 'از خرید شما متشکریم',
        footerText: 'این فاکتور به صورت الکترونیکی تولید شده است'
      };
      const result = await db.invoiceSettings.insertOne(defaultSettings as any);
      invoiceSettings = { ...defaultSettings, _id: result.insertedId } as any;
    }

    // دریافت اطلاعات کاربر
    const user = await db.users.findOne({ _id: new ObjectId(order.userId) });

    // ساخت شماره فاکتور
    const invoiceNumber = `${invoiceSettings?.invoicePrefix || 'INV'}-${order.orderNumber || orderId.slice(-8).toUpperCase()}`;

    // محاسبه مالیات
    const subtotal = order.totalAmount || 0;
    const taxAmount = invoiceSettings?.showTax ? (subtotal * (invoiceSettings.taxRate || 9)) / 100 : 0;
    const total = subtotal + taxAmount;

    const invoiceData = {
      invoiceNumber,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status,
      customer: {
        name: user?.name || order.shippingAddress?.fullName || 'مشتری',
        email: user?.email || '',
        phone: user?.phone || order.shippingAddress?.phone || '',
        address: order.shippingAddress ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.province}, ${order.shippingAddress.postalCode}` : ''
      },
      items: order.items || [],
      subtotal,
      taxRate: invoiceSettings?.taxRate || 9,
      taxAmount,
      shippingCost: order.shippingCost || 0,
      discount: order.discountAmount || 0,
      total,
      paymentMethod: order.paymentMethod || 'آنلاین',
      settings: invoiceSettings
    };

    return NextResponse.json({
      success: true,
      data: invoiceData
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تولید فاکتور' },
      { status: 500 }
    );
  }
}
