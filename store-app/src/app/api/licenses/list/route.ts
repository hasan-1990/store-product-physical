import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import type { License } from '@/types';

/**
 * API برای لیست لایسنس‌های یک کاربر
 * GET /api/licenses/list?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    // ساخت فیلتر
    const filter: any = { userId };
    if (productId) {
      filter.productId = productId;
    }
    
    // دریافت لایسنس‌ها
    const licenses = await db.licenses
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray() as any as License[];
    
    // دریافت اطلاعات محصولات
    const productIds = [...new Set(licenses.map(l => l.productId))];
    const productObjectIds = productIds.map(id => {
      try {
        return new ObjectId(id);
      } catch {
        return null;
      }
    }).filter(id => id !== null);
    
    const products = await db.products
      .find({ _id: { $in: productObjectIds } })
      .toArray();
    
    // ترکیب اطلاعات
    const licensesWithProducts = licenses.map(license => {
      const product = products.find(p => p._id?.toString() === license.productId);
      return {
        ...license,
        product: product ? {
          id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.image || product.imageUrl,
          downloadUrl: product.downloadUrl,
        } : null,
      };
    });
    
    return NextResponse.json({
      success: true,
      licenses: licensesWithProducts,
      total: licensesWithProducts.length,
    });
    
  } catch (error) {
    console.error('Error listing licenses:', error);
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
