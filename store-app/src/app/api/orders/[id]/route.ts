import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const mongodb = await connectDB();
    
    const order = await mongodb.orders.aggregate([
      { $match: { _id: new ObjectId(resolvedParams.id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'order_items',
          localField: '_id',
          foreignField: 'orderId',
          as: 'orderItems'
        }
      },
      {
        $unwind: {
          path: '$orderItems',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.productId',
          foreignField: '_id',
          as: 'orderItems.product'
        }
      },
      {
        $unwind: {
          path: '$orderItems.product',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'orderItems.product.categoryId',
          foreignField: '_id',
          as: 'orderItems.product.category'
        }
      },
      {
        $unwind: {
          path: '$orderItems.product.category',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$_id',
          orderNumber: { $first: '$orderNumber' },
          status: { $first: '$status' },
          paymentStatus: { $first: '$paymentStatus' },
          totalAmount: { $first: '$totalAmount' },
          shippingAddress: { $first: '$shippingAddress' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          user: { $first: '$user' },
          orderItems: { $push: '$orderItems' }
        }
      }
    ]).toArray();

    if (!order || order.length === 0) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order[0],
    });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت سفارش' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const mongodb = await connectDB();

    // Check if order exists
    const existingOrder = await mongodb.orders.findOne({
      _id: new ObjectId(resolvedParams.id)
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      );
    }

    // If order is being cancelled, restore product stock
    if (validatedData.status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
      // Get order items
      const orderItems = await mongodb.orderItems.find({
        orderId: new ObjectId(resolvedParams.id)
      }).toArray();

      // Restore stock for each item
      for (const item of orderItems) {
        await mongodb.products.updateOne(
          { _id: new ObjectId(item.productId) },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    // Update order
    await mongodb.orders.updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      {
        $set: {
          ...validatedData,
          updatedAt: new Date()
        }
      }
    );

    // Fetch updated order
    const updatedOrder = await mongodb.orders.aggregate([
      { $match: { _id: new ObjectId(resolvedParams.id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'order_items',
          localField: '_id',
          foreignField: 'orderId',
          as: 'orderItems'
        }
      },
      {
        $unwind: {
          path: '$orderItems',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.productId',
          foreignField: '_id',
          as: 'orderItems.product'
        }
      },
      {
        $unwind: {
          path: '$orderItems.product',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$_id',
          orderNumber: { $first: '$orderNumber' },
          status: { $first: '$status' },
          paymentStatus: { $first: '$paymentStatus' },
          totalAmount: { $first: '$totalAmount' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          user: { $first: '$user' },
          orderItems: { $push: '$orderItems' }
        }
      }
    ]).toArray();

    return NextResponse.json({
      success: true,
      data: updatedOrder[0],
      message: 'سفارش با موفقیت بروزرسانی شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'داده‌های ورودی نامعتبر',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Order PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی سفارش' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Cancel order (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const mongodb = await connectDB();
    
    // Check if order exists
    const existingOrder = await mongodb.orders.findOne({
      _id: new ObjectId(resolvedParams.id)
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (['DELIVERED', 'CANCELLED'].includes(existingOrder.status)) {
      return NextResponse.json(
        { success: false, error: 'این سفارش قابل لغو نیست' },
        { status: 400 }
      );
    }

    // Cancel order and restore stock
    // Get order items
    const orderItems = await mongodb.orderItems.find({
      orderId: new ObjectId(resolvedParams.id)
    }).toArray();

    // Restore stock for each item
    for (const item of orderItems) {
      await mongodb.products.updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stock: item.quantity } }
      );
    }

    // Update order status to cancelled
    await mongodb.orders.updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      { 
        $set: { 
          status: 'CANCELLED',
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت لغو شد',
    });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در لغو سفارش' },
      { status: 500 }
    );
  }
}
