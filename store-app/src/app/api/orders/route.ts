import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-manager';

// Validation schemas
const createOrderSchema = z.object({
  userId: z.string().min(1, 'شناسه کاربر الزامی است'),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
      price: z.number().positive(),
    })
  ).min(1, 'حداقل یک محصول باید انتخاب شود'),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    address: z.string().min(10),
    city: z.string().min(2),
    postalCode: z.string().min(5),
  }),
  shippingAmount: z.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp}${random}`;
}

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    
    // Create cache key from query parameters
    const cacheKey = `${CACHE_KEYS.ORDERS}list:${page}:${limit}:${search}:${status}:${paymentStatus}`;
    
    // Try to get from cache first
    const cachedOrders = await CacheManager.get(cacheKey);
    if (cachedOrders) {
      return NextResponse.json(cachedOrders);
    }
    const userId = searchParams.get('userId') || '';

    const skip = (page - 1) * limit;
    const mongodb = await connectDB();

    // Build match conditions
    const matchConditions: any = {};
    
    if (status) matchConditions.status = status;
    if (paymentStatus) matchConditions.paymentStatus = paymentStatus;
    if (userId) {
      // Try both string and ObjectId formats
      console.log('🔍 Filtering orders for userId:', userId);
      try {
        // Try ObjectId format first (most database orders use ObjectId)
        matchConditions.userId = new ObjectId(userId);
      } catch {
        // Fallback to string format if ObjectId conversion fails
        matchConditions.userId = userId;
      }
    }

    // Build search conditions
    let searchConditions: any[] = [];
    if (search) {
      searchConditions = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const pipeline = [
      // Apply match conditions early for better performance
      ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          orderNumber: 1,
          userId: 1,
          items: 1, // Items are directly in the order document
          contactInfo: 1,
          shippingAddress: 1,
          shippingMethod: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          totalAmount: 1,
          discountAmount: 1,
          discountCode: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          completedAt: 1,
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            phone: '$user.phone'
          }
        }
      },
      ...(searchConditions.length > 0 ? [{ $match: { $or: searchConditions } }] : []),
      { $sort: { createdAt: -1 } }
    ];

    const [orders, totalResult] = await Promise.all([
      mongodb.orders.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit }
      ]).toArray(),
      mongodb.orders.aggregate([
        ...pipeline,
        { $count: 'total' }
      ]).toArray()
    ]);

    const total = totalResult[0]?.total || 0;

    const result = {
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
    
    // Cache the result
    await CacheManager.set(cacheKey, result, CACHE_TTL.ORDERS);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت سفارشات' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    const mongodb = await connectDB();

    // Check if user exists
    const user = await mongodb.users.findOne({
      _id: new ObjectId(validatedData.userId)
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 400 }
      );
    }

    // Verify products and calculate total
    let totalAmount = 0;
    const validatedItems: Array<{
      productId: string;
      quantity: number;
      price: number;
    }> = [];

    for (const item of validatedData.items) {
      const product = await mongodb.products.findOne({
        _id: new ObjectId(item.productId)
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: `محصول با شناسه ${item.productId} یافت نشد` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `موجودی محصول ${product.name} کافی نیست` },
          { status: 400 }
        );
      }

      totalAmount += item.price * item.quantity;
      validatedItems.push(item);
    }

    totalAmount += validatedData.shippingAmount;

    // Create order with items
    const orderData = {
      orderNumber: generateOrderNumber(),
      userId: new ObjectId(validatedData.userId),
      totalAmount,
      shippingAmount: validatedData.shippingAmount,
      shippingAddress: validatedData.shippingAddress,
      paymentMethod: validatedData.paymentMethod,
      notes: validatedData.notes,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const orderResult = await mongodb.orders.insertOne(orderData);
    const orderId = orderResult.insertedId;

    // Create order items and update stock
    for (const item of validatedItems) {
      await mongodb.orderItems.insertOne({
        orderId: orderId,
        productId: new ObjectId(item.productId),
        quantity: item.quantity,
        price: item.price,
        createdAt: new Date()
      });

      // Update product stock and sales count
      await mongodb.products.updateOne(
        { _id: new ObjectId(item.productId) },
        { 
          $inc: { 
            stock: -item.quantity,
            soldCount: item.quantity,
            salesCount: item.quantity
          } 
        }
      );
    }

    // Clear user's cart
    await mongodb.cartItems.deleteMany({
      userId: new ObjectId(validatedData.userId)
    });

    // Fetch complete order data
    const completeOrder = await mongodb.orders.aggregate([
      { $match: { _id: orderId } },
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
          shippingAmount: { $first: '$shippingAmount' },
          createdAt: { $first: '$createdAt' },
          user: { $first: '$user' },
          orderItems: { $push: '$orderItems' }
        }
      }
    ]).toArray();

    // Invalidate orders cache after creating new order
    await CacheManager.invalidateOrders();

    return NextResponse.json({
      success: true,
      data: completeOrder[0],
      message: 'سفارش با موفقیت ثبت شد',
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

    console.error('Orders POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت سفارش' },
      { status: 500 }
    );
  }
}
