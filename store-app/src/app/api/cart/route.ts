import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID الزامی است'),
  quantity: z.number().int().min(1, 'تعداد باید حداقل ۱ باشد').or(z.string().transform(val => parseInt(val, 10))),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  userId: z.string().optional().nullable(), // For logged-in users
  sessionId: z.string().optional().nullable(), // For guest users
}).refine((data) => data.userId || data.sessionId, {
  message: "حداقل یکی از userId یا sessionId باید ارائه شود",
});

// GET /api/cart - Get cart items for user/session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { success: false, error: 'User ID یا Session ID الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    // Find cart items based on userId or sessionId
    let query;
    if (userId) {
      // Validate ObjectId format before using it
      if (!ObjectId.isValid(userId)) {
        return NextResponse.json(
          { success: false, error: 'User ID فرمت نامعتبر دارد' },
          { status: 400 }
        );
      }
      query = { userId: new ObjectId(userId) };
    } else {
      query = { sessionId: sessionId };
    }

    const cartItems = await mongodb.cartItems.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          productId: 1,
          quantity: 1,
          size: 1,
          color: 1,
          createdAt: 1,
          updatedAt: 1,
          'product.name': 1,
          'product.price': 1,
          'product.discountPrice': 1,
          'product.images': 1,
          'product.imageUrl': 1,
          'product.image': 1,
          'product.stock': 1,
          'product.category': 1,
          'product.productType': 1,
          'product.type': 1,
          'product.downloadUrl': 1,
          'product.fileSize': 1,
          'product.fileFormat': 1,
          'product.provisioningType': 1,
          'product.templateSlug': 1,
          'product.templateId': 1,
        }
      }
    ]).toArray();

    // Format cart items for frontend
    const formattedCartItems = cartItems.map(item => ({
      id: item._id.toString(),
      productId: item.productId.toString(),
      name: item.product.name,
      price: item.product.discountPrice || item.product.price,
      originalPrice: item.product.discountPrice ? item.product.price : undefined,
      quantity: item.quantity,
      image: item.product.images?.[0] || item.product.imageUrl || item.product.image || null,
      color: item.color,
      size: item.size,
      stock: item.product.stock,
      category: item.product.category?.name || '',
      productType: item.product.productType || item.product.type || 'PHYSICAL',
      type: item.product.type || item.product.productType || 'PHYSICAL',
      downloadUrl: item.product.downloadUrl,
      fileSize: item.product.fileSize,
      fileFormat: item.product.fileFormat,
      provisioningType: item.product.provisioningType || 'download',
      templateSlug: item.product.templateSlug,
      templateId: item.product.templateId?.toString?.() || item.product.templateId,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCartItems,
      message: 'سبد خرید با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت سبد خرید' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Cart POST request body:', JSON.stringify(body));
    
    const validatedData = addToCartSchema.parse(body);
    console.log('✅ Validated data:', JSON.stringify(validatedData));

    const mongodb = await connectDB();

    // Validate ObjectId formats
    if (!ObjectId.isValid(validatedData.productId)) {
      console.log('❌ Invalid productId:', validatedData.productId);
      return NextResponse.json(
        { success: false, error: 'Product ID فرمت نامعتبر دارد' },
        { status: 400 }
      );
    }

    if (validatedData.userId && !ObjectId.isValid(validatedData.userId)) {
      console.log('❌ Invalid userId:', validatedData.userId);
      return NextResponse.json(
        { success: false, error: `User ID فرمت نامعتبر دارد: ${validatedData.userId}` },
        { status: 400 }
      );
    }

    // Check if product exists and has enough stock
    console.log('🔍 Looking for product with ID:', validatedData.productId);
    const product = await mongodb.products.findOne({
      _id: new ObjectId(validatedData.productId)
    });

    console.log('🔍 Product found:', product ? `${product.name} (stock: ${product.stock})` : 'NULL');

    if (!product) {
      console.log('❌ Product not found in database:', validatedData.productId);
      // Let's check if product exists with different ID formats
      const altProduct = await mongodb.products.findOne({
        $or: [
          { sequentialId: parseInt(validatedData.productId) },
          { _id: validatedData.productId as any }
        ]
      });
      console.log('🔍 Alternative search result:', altProduct ? altProduct.name : 'NULL');
      
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

    // Check if item already exists in cart
    let query;
    if (validatedData.userId) {
      query = { 
        userId: new ObjectId(validatedData.userId),
        productId: new ObjectId(validatedData.productId),
        size: validatedData.size || null,
        color: validatedData.color || null
      };
    } else {
      query = { 
        sessionId: validatedData.sessionId,
        productId: new ObjectId(validatedData.productId),
        size: validatedData.size || null,
        color: validatedData.color || null
      };
    }

    const existingCartItem = await mongodb.cartItems.findOne(query);

    if (existingCartItem) {
      // Update quantity if item exists
      const newQuantity = existingCartItem.quantity + validatedData.quantity;
      
      if (product.stock < newQuantity) {
        return NextResponse.json(
          {
            success: false,
            error: 'موجودی کافی نیست',
            availableStock: product.stock,
          },
          { status: 400 }
        );
      }

      await mongodb.cartItems.updateOne(
        { _id: existingCartItem._id },
        {
          $set: {
            quantity: newQuantity,
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'تعداد محصول در سبد خرید بروزرسانی شد',
      });
    } else {
      // Add new item to cart
      const cartItemData = {
        productId: new ObjectId(validatedData.productId),
        quantity: validatedData.quantity,
        size: validatedData.size || null,
        color: validatedData.color || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(validatedData.userId 
          ? { userId: new ObjectId(validatedData.userId) }
          : { sessionId: validatedData.sessionId }
        )
      };

      await mongodb.cartItems.insertOne(cartItemData);

      return NextResponse.json({
        success: true,
        message: 'محصول به سبد خرید اضافه شد',
      });
    }

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

    console.error('Cart POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در افزودن به سبد خرید', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { success: false, error: 'User ID یا Session ID الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    const query = userId 
      ? { userId: new ObjectId(userId) }
      : { sessionId: sessionId };

    await mongodb.cartItems.deleteMany(query);

    return NextResponse.json({
      success: true,
      message: 'سبد خرید پاک شد',
    });

  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پاک کردن سبد خرید' },
      { status: 500 }
    );
  }
}
