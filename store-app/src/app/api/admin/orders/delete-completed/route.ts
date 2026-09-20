import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(req: NextRequest) {
  try {
    console.log('🗑️  API حذف سفارشات انجام شده فراخوانی شد');
    
    // دریافت توکن از هدر
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ توکن ارسال نشده است');
      return NextResponse.json({ error: 'احراز هویت مورد نیاز است' }, { status: 401 });
    }

    // تایید توکن
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('❌ توکن نامعتبر است');
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }
    
    console.log('👤 کاربر احراز هویت شد:', decoded.userId, 'نقش:', decoded.role);
    
    // بررسی نقش ادمین
    if (decoded.role?.toUpperCase() !== 'ADMIN') {
      console.log('❌ کاربر ادمین نیست. نقش:', decoded.role);
      return NextResponse.json({ error: 'فقط ادمین می‌تواند سفارشات را حذف کند' }, { status: 403 });
    }

    // اتصال به دیتابیس
    console.log('🔗 اتصال به MongoDB...');
    const mongodb = await connectDB();
    
    // شمارش سفارشات انجام شده قبل از حذف
    const completedCount = await mongodb.orders.countDocuments({
      status: { $in: ['COMPLETED', 'DELIVERED', 'completed', 'delivered'] }
    });

    console.log(`📊 تعداد سفارشات انجام شده: ${completedCount}`);

    if (completedCount === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'هیچ سفارش انجام شده‌ای برای حذف وجود ندارد',
        deletedCount: 0
      });
    }

    // دریافت لیست سفارشات قبل از حذف (برای لاگ)
    const ordersToDelete = await mongodb.orders
      .find({
        status: { $in: ['COMPLETED', 'DELIVERED', 'completed', 'delivered'] }
      })
      .project({ orderNumber: 1, status: 1, totalAmount: 1, _id: 1 })
      .toArray();

    console.log('📋 لیست سفارشات قبل از حذف:');
    ordersToDelete.forEach((order, index) => {
      console.log(`${index + 1}. سفارش ${order.orderNumber} - وضعیت: ${order.status} - مبلغ: ${order.totalAmount} تومان`);
    });

    // حذف سفارشات
    console.log('🗑️  در حال حذف سفارشات...');
    const result = await mongodb.orders.deleteMany({
      status: { $in: ['COMPLETED', 'DELIVERED', 'completed', 'delivered'] }
    });

    console.log(`✅ تعداد سفارشات حذف شده: ${result.deletedCount}`);

    // شمارش سفارشات باقی‌مانده
    const remainingCount = await mongodb.orders.countDocuments();
    console.log(`📊 تعداد سفارشات باقی‌مانده: ${remainingCount}`);

    return NextResponse.json({ 
      success: true,
      message: `${result.deletedCount} سفارش انجام شده با موفقیت حذف شد`,
      deletedCount: result.deletedCount,
      remainingCount: remainingCount,
      deletedOrders: ordersToDelete.map(o => ({
        orderNumber: o.orderNumber,
        status: o.status
      }))
    });

  } catch (error) {
    console.error('❌ خطا در حذف سفارشات:', error);
    return NextResponse.json({ 
      error: 'خطا در حذف سفارشات',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
