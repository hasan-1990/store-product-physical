import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    
    // دریافت تنظیمات ترند
    const trendSettings = await db.trendSettings.findOne({});
    
    if (!trendSettings || !trendSettings.active) {
      return NextResponse.json({
        success: true,
        data: [],
        settings: null
      });
    }
    
    let products: any[] = [];
    
    if (trendSettings.selectionMode === 'manual') {
      // محصولات انتخاب شده دستی
      if (trendSettings.selectedProducts && trendSettings.selectedProducts.length > 0) {
        const productIds = trendSettings.selectedProducts.map((id: string) => new ObjectId(id));
        products = await db.products.aggregate([
          { 
            $match: { 
              _id: { $in: productIds },
              active: true 
            } 
          },
          {
            $lookup: {
              from: 'categories',
              localField: 'categoryId',
              foreignField: '_id',
              as: 'category'
            }
          },
          {
            $addFields: {
              category: { $arrayElemAt: ['$category', 0] }
            }
          },
          { $limit: trendSettings.maxProducts }
        ]).toArray();
      }
    } else {
      // انتخاب خودکار بر اساس معیار
      let sortCriteria = {};
      
      switch (trendSettings.selectionMode) {
        case 'latest':
          sortCriteria = { createdAt: -1 };
          break;
        case 'random':
          // برای random از sample استفاده می‌کنیم
          products = await db.products.aggregate([
            { $match: { active: true } },
            { $sample: { size: trendSettings.maxProducts } },
            {
              $lookup: {
                from: 'categories',
                localField: 'categoryId',
                foreignField: '_id',
                as: 'category'
              }
            },
            {
              $addFields: {
                category: { $arrayElemAt: ['$category', 0] }
              }
            }
          ]).toArray();
          break;
        case 'most_viewed':
          sortCriteria = { views: -1 };
          break;
        case 'best_selling':
          sortCriteria = { soldCount: -1 };
          break;
        case 'highest_rated':
          sortCriteria = { rating: -1 };
          break;
      }
      
      // اگر random نیست، از sort استفاده کنیم
      if (trendSettings.selectionMode !== 'random') {
        products = await db.products.aggregate([
          { $match: { active: true } },
          {
            $lookup: {
              from: 'categories',
              localField: 'categoryId',
              foreignField: '_id',
              as: 'category'
            }
          },
          {
            $addFields: {
              category: { $arrayElemAt: ['$category', 0] }
            }
          },
          { $sort: sortCriteria },
          { $limit: trendSettings.maxProducts }
        ]).toArray();
      }
    }
    
    return NextResponse.json({
      success: true,
      data: products,
      settings: {
        title: trendSettings.title,
        subtitle: trendSettings.subtitle,
        maxProducts: trendSettings.maxProducts,
        selectionMode: trendSettings.selectionMode
      }
    });
  } catch (error) {
    console.error('Error fetching trend products:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت محصولات ترند' },
      { status: 500 }
    );
  }
}
