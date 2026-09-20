import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyToken } from '@/lib/jwt';

/**
 * POST /api/admin/orders/create
 * ایجاد سفارش رایگان دستی توسط ادمین
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📦 [ADMIN] Creating manual order...');
    
    // بررسی احراز هویت ادمین
    // Accept either a NextAuth admin session (cookie) OR a verified Bearer JWT with admin role.
    const session = await getServerSession(authOptions);
    let adminName = session?.user?.name || session?.user?.email;
    let createdByAdminId: any = session?.user?.id;

    if (!session || session.user?.role?.toLowerCase() !== 'admin') {
      // Try Bearer token fallback
      const authHeader = req.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;
      if (!bearerToken) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز - فقط ادمین' },
          { status: 403 }
        );
      }

      const decoded = verifyToken(bearerToken);
      if (!decoded || !decoded.role || decoded.role.toUpperCase() !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز - فقط ادمین' },
          { status: 403 }
        );
      }

      // Use decoded token info for admin metadata
      adminName = decoded.email || adminName;
      createdByAdminId = decoded.userId;
    }

    const body = await req.json();
    const { userId, items, note } = body;

    console.log('📦 [ADMIN] Request body:', { userId, items, note });

    // Basic validation
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'اطلاعات ناقص است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Validate userId -> ObjectId
    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (err) {
      console.error('❌ [ADMIN] Invalid userId provided:', userId, err);
      return NextResponse.json({ success: false, error: 'شناسه کاربر نامعتبر است' }, { status: 400 });
    }

    // بررسی وجود کاربر
    const user = await db.users.findOne({ _id: userObjectId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // دریافت اطلاعات محصولات - validate product ids
    let productIds: ObjectId[] = [];
    try {
      productIds = items.map((item: any) => {
        if (!item.productId) throw new Error('missing productId');
        return new ObjectId(item.productId);
      });
    } catch (err) {
      console.error('❌ [ADMIN] Invalid productId in items:', items, err);
      return NextResponse.json({ success: false, error: 'شناسه محصول نامعتبر است' }, { status: 400 });
    }

    const products = await db.products.find({ _id: { $in: productIds } }).toArray();

    if (products.length !== items.length) {
      console.warn('⚠️ [ADMIN] Product count mismatch, requested:', items.length, 'found:', products.length);
      return NextResponse.json(
        { success: false, error: 'برخی محصولات یافت نشد' },
        { status: 404 }
      );
    }

    // ایجاد شماره سفارش منحصر به فرد
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // آماده‌سازی آیتم‌های سفارش
    const orderItems = items.map((item: any) => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        productId: new ObjectId(item.productId),
        name: product?.name || 'نامشخص',
        price: 0, // رایگان
        quantity: item.quantity || 1,
        productType: product?.productType || 'PHYSICAL',
        isDigital: product?.isDigital || false,
        downloadUrl: product?.downloadUrl || null,
        fileSize: product?.fileSize || null,
        fileFormat: product?.fileFormat || null,
        image: product?.images?.[0] || null,
      };
    });

    // ایجاد سفارش
    const order = {
      orderNumber,
      userId: new ObjectId(userId),
      userEmail: user.email,
      userName: user.name || user.email,
      userPhone: user.phone || '',
      items: orderItems,
      totalAmount: 0, // رایگان
      discountAmount: 0,
      taxAmount: 0,
      shippingCost: 0,
      finalAmount: 0, // رایگان
      paymentMethod: 'free', // سفارش رایگان
      paymentStatus: 'paid',
      status: 'completed', // مستقیماً تکمیل شده
      isPaid: true,
      paidAt: new Date(),
      shippingAddress: null,
      billingAddress: null,
      notes: note || 'سفارش رایگان توسط ادمین',
  adminNote: `ایجاد شده توسط ${adminName} در ${new Date().toLocaleString('fa-IR')}`,
  createdBy: 'admin',
  createdByAdmin: createdByAdminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.orders.insertOne(order);
    console.log('✅ [ADMIN] Order created:', result.insertedId);

    // ایجاد فاکتور
    const invoice = {
      orderId: result.insertedId,
      orderNumber,
      userId: new ObjectId(userId),
      invoiceNumber: `INV-${Date.now()}`,
      items: orderItems,
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      status: 'paid',
      paymentMethod: 'free',
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.invoices.insertOne(invoice);
    console.log('✅ [ADMIN] Invoice created');

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت ایجاد شد',
      data: {
        orderId: result.insertedId,
        orderNumber,
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error creating manual order:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد سفارش' },
      { status: 500 }
    );
  }
}
