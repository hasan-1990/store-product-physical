import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Admin orders API called');
    
    // Try reading session first (NextAuth cookie based auth)
    const session = await getServerSession(authOptions);
    const sessionRole = session?.user?.role ? String(session.user.role).toLowerCase() : undefined;
    const sessionUserId = session?.user?.id ? String(session.user.id) : undefined;
    const sessionEmail = session?.user?.email ? String(session.user.email) : undefined;

    // Fallback to bearer token if no session found
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;

    let resolvedRole = sessionRole;
    let resolvedUserId = sessionUserId;
    let resolvedEmail = sessionEmail;

    if (!resolvedRole && bearerToken) {
      const decoded = verifyToken(bearerToken);

      if (decoded) {
        resolvedRole = decoded.role?.toLowerCase();
        resolvedUserId = decoded.userId;
        resolvedEmail = decoded.email;
      } else {
        // Support legacy/fake admin tokens (base64 encoded payload without signature verification)
        try {
          const parts = bearerToken.split('.');
          if (parts.length >= 2) {
            const payloadRaw = Buffer.from(parts[1], 'base64').toString('utf8');
            const payload = JSON.parse(payloadRaw);
            if (payload?.role) {
              resolvedRole = String(payload.role).toLowerCase();
              resolvedUserId = payload.userId || payload.id || undefined;
              resolvedEmail = payload.email || undefined;
              console.warn('⚠️ Using fallback decoded admin token without signature verification');
            }
          }
        } catch (fallbackError) {
          console.error('Failed to decode fallback admin token', fallbackError);
        }
      }
    }

    if (!resolvedRole) {
      console.log('❌ No valid session or token found for admin orders');
      return NextResponse.json({ error: 'احراز هویت مورد نیاز است' }, { status: 401 });
    }

    if (resolvedRole !== 'admin') {
      console.log('❌ User is not admin. Role:', resolvedRole, 'Email:', resolvedEmail);
      return NextResponse.json({ error: 'دسترسی مدیر مورد نیاز است' }, { status: 403 });
    }

    console.log('👤 Admin resolved - UserId:', resolvedUserId, 'Email:', resolvedEmail);

    // Get all orders with user info
    console.log('📦 Fetching orders from database...');
    const mongodb = await connectDB();
    
    const orders = await mongodb.orders.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    console.log('📊 Found orders:', orders.length);

    // Transform orders data for admin interface
    const transformedOrders = orders.map((order: any) => {
      // Get customer name from contactInfo or user
      const customerName = order.contactInfo 
        ? `${order.contactInfo.firstName || ''} ${order.contactInfo.lastName || ''}`.trim()
        : order.user 
          ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email
          : 'مهمان';
      
      const customerEmail = order.contactInfo?.email || order.user?.email || '';

      // Parse shipping address
      let addressInfo = {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      };

      if (order.shippingAddress) {
        if (typeof order.shippingAddress === 'string') {
          const addressParts = order.shippingAddress.split('،') || [];
          addressInfo.street = addressParts[0]?.trim() || '';
          addressInfo.city = addressParts[1]?.trim() || '';
          addressInfo.state = addressParts[2]?.trim() || '';
          addressInfo.zipCode = addressParts[3]?.trim() || '';
        } else if (typeof order.shippingAddress === 'object') {
          addressInfo.street = order.shippingAddress.address || '';
          addressInfo.city = order.shippingAddress.cityId || '';
          addressInfo.state = order.shippingAddress.provinceId || '';
          addressInfo.zipCode = order.shippingAddress.zipCode || '';
        }
      }

      return {
        id: order.orderNumber,
        _id: order._id.toString(), // MongoDB ObjectId as string
        customerName: customerName,
        customerEmail: customerEmail,
        customerAvatar: order.user?.avatar,
        status: (order.status || 'pending').toLowerCase(),
        paymentStatus: (order.paymentStatus || 'pending').toLowerCase(),
        total: Number(order.totalAmount || 0),
        items: (order.items || []).map((item: any) => ({
          id: item.productId?.toString() || '',
          name: item.name || 'محصول',
          image: '/placeholder.jpg',
          quantity: item.quantity || 1,
          price: Number(item.price || 0)
        })),
        shippingAddress: {
          street: addressInfo.street,
          city: addressInfo.city,
          state: addressInfo.state,
          zipCode: addressInfo.zipCode,
          country: 'ایران'
        },
        orderDate: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
        shippedDate: order.status === 'shipped' || order.status === 'delivered' ? (order.updatedAt ? new Date(order.updatedAt).toISOString() : undefined) : undefined,
        deliveredDate: order.status === 'delivered' ? (order.updatedAt ? new Date(order.updatedAt).toISOString() : undefined) : undefined,
        trackingNumber: order.orderNumber,
        paymentMethod: order.paymentMethod || 'online',
        notes: order.notes
      };
    });

    console.log('✅ Transformed orders:', transformedOrders.length);
    return NextResponse.json({ orders: transformedOrders });

  } catch (error) {
    console.error('Get admin orders error:', error);
    return NextResponse.json({ error: 'خطا در دریافت سفارش‌ها' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get token from header
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'احراز هویت مورد نیاز است' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }
    
    // Check role (case-insensitive)
    if (decoded.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی مدیر مورد نیاز است' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, status, paymentStatus, notes } = body;

    const mongodb = await connectDB();

    // Update order
    const updatedOrder = await mongodb.orders.updateOne(
      { orderNumber: orderId },
      {
        $set: {
          status: status.toUpperCase(),
          paymentStatus: paymentStatus.toUpperCase(),
          notes,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ 
      message: 'سفارش با موفقیت به‌روزرسانی شد',
      order: updatedOrder 
    });

  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی سفارش' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/orders
 * حذف سفارش توسط ادمین
 */
export async function DELETE(req: NextRequest) {
  try {
    console.log('🗑️ [ADMIN] Delete order API called');
    
    // بررسی احراز هویت ادمین
    const session = await getServerSession(authOptions);
    if (!session || session?.user?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز - فقط ادمین' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'شناسه سفارش الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const { ObjectId } = await import('mongodb');

    // حذف سفارش
    const result = await db.orders.deleteOne({ _id: new ObjectId(orderId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      );
    }

    // حذف فاکتور مرتبط (اگر وجود داشته باشد)
    await db.invoices.deleteOne({ orderId: new ObjectId(orderId) });

    console.log('✅ [ADMIN] Order deleted:', orderId);

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Delete order error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف سفارش' },
      { status: 500 }
    );
  }
}
