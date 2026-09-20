import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'تعداد باید حداقل 1 باشد'),
});

// PUT /api/cart/[id] - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateCartItemSchema.parse(body);

    const mongodb = await connectDB();

    // Check if cart item exists
    const existingCartItem = await mongodb.cartItems.findOne({
      _id: new ObjectId(resolvedParams.id)
    });

    if (!existingCartItem) {
      return NextResponse.json(
        { success: false, error: 'آیتم در سبد خرید یافت نشد' },
        { status: 404 }
      );
    }

    // Check product stock
    const product = await mongodb.products.findOne({
      _id: new ObjectId(existingCartItem.productId)
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }

    if (product.stock < validatedData.quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'موجودی کافی نیست',
          availableStock: product.stock,
        },
        { status: 400 }
      );
    }

    // Update cart item
    await mongodb.cartItems.updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      {
        $set: {
          quantity: validatedData.quantity,
          updatedAt: new Date()
        }
      }
    );

    // Get updated cart item with product details
    const cartItem = await mongodb.cartItems.aggregate([
      { $match: { _id: new ObjectId(resolvedParams.id) } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]).toArray();

    return NextResponse.json({
      success: true,
      data: cartItem[0],
      message: 'تعداد محصول بروزرسانی شد',
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

    console.error('Cart item PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی سبد خرید' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[id] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const mongodb = await connectDB();

    // Check if cart item exists
    const existingCartItem = await mongodb.cartItems.findOne({
      _id: new ObjectId(resolvedParams.id)
    });

    if (!existingCartItem) {
      return NextResponse.json(
        { success: false, error: 'آیتم در سبد خرید یافت نشد' },
        { status: 404 }
      );
    }

    // Delete cart item
    await mongodb.cartItems.deleteOne({
      _id: new ObjectId(resolvedParams.id)
    });

    return NextResponse.json({
      success: true,
      message: 'محصول از سبد خرید حذف شد',
    });
  } catch (error) {
    console.error('Cart item DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف از سبد خرید' },
      { status: 500 }
    );
  }
}
