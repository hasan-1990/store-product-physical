import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { triggerProvisioningForOrder } from '@/lib/provisioning/run-provision';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه سفارش نامعتبر است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    const order = await mongodb.orders.findOne({
      _id: new ObjectId(orderId)
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      );
    }

    await mongodb.orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentStatus: 'completed',
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (order.userId) {
      await mongodb.cartItems.deleteMany({
        userId: new ObjectId(order.userId)
      });
    }

    let provisionedInstances: unknown[] = [];
    try {
      provisionedInstances = await triggerProvisioningForOrder(orderId);
    } catch (provisionError) {
      console.error('Provisioning error after order complete:', provisionError);
    }

    const updatedOrder = await mongodb.orders.findOne({
      _id: new ObjectId(orderId)
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      provisionedInstances,
      message: 'سفارش با موفقیت تکمیل شد'
    });

  } catch (error) {
    console.error('Complete order error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تکمیل سفارش' },
      { status: 500 }
    );
  }
}
