import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { ObjectId } from 'mongodb';

// GET - دریافت لیست علاقه‌مندی‌های کاربر
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await connectDB();
    
    // Get wishlist items with product details and category
    const wishlist = await db.wishlist.aggregate([
      {
        $match: { userId: decoded.userId }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: { $toObjectId: '$product.categoryId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$categoryId'] } } }
          ],
          as: 'category'
        }
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          'product.category': '$category'
        }
      },
      {
        $project: {
          category: 0
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    return NextResponse.json({
      success: true,
      data: wishlist,
      wishlist // برای سازگاری با صفحه wishlist
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - افزودن محصول به لیست علاقه‌مندی‌ها
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;
    
    console.log('📝 POST /api/user/wishlist - Received productId:', productId, 'Type:', typeof productId);

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(productId)) {
      console.error('Invalid productId format:', productId);
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }

    const db = await connectDB();

    // Check if product exists
    const product = await db.products.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      console.error('Product not found:', productId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if already in wishlist
    const existing = await db.wishlist.findOne({
      userId: decoded.userId,
      productId: new ObjectId(productId)
    });

    if (existing) {
      return NextResponse.json({ error: 'Product already in wishlist' }, { status: 400 });
    }

    // Add to wishlist
    const result = await db.wishlist.insertOne({
      userId: decoded.userId,
      productId: new ObjectId(productId),
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'محصول به لیست علاقه‌مندی‌ها اضافه شد',
      wishlistId: result.insertedId
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
