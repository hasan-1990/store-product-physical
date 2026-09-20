import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

interface Product {
  _id: any;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  discountPercentage?: number;
  imageUrl: string;
  description?: string;
  category?: string;
  active: boolean;
  featured?: boolean;
  createdAt?: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const db = await connectDB();
    
    // فیلتر محصولات با تخفیف (که قیمت اصلی بیشتر از قیمت فعلی باشد)
    const discountFilter = {
      active: true,
      $expr: {
        $and: [
          { $gt: ['$originalPrice', 0] },
          { $lt: ['$price', '$originalPrice'] }
        ]
      }
    };

    // دریافت محصولات تخفیفی
    const products = await db.products
      .aggregate([
        { $match: discountFilter },
        {
          $addFields: {
            discountPercentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: [{ $subtract: ['$originalPrice', '$price'] }, '$originalPrice'] },
                    100
                  ]
                },
                0
              ]
            }
          }
        },
        { $sort: { discountPercentage: -1 } }, // مرتب‌سازی بر اساس درصد تخفیف (بیشترین تخفیف اول)
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryData'
          }
        },
        {
          $addFields: {
            categoryInfo: { $arrayElemAt: ['$categoryData', 0] }
          }
        },
        {
          $project: {
            _id: 1,
            sequentialId: 1,
            name: 1,
            slug: 1,
            price: 1,
            originalPrice: 1,
            discountPercentage: 1,
            imageUrl: 1,
            description: 1,
            categoryPath: 1,
            active: 1,
            featured: 1,
            createdAt: 1,
            'categoryInfo._id': 1,
            'categoryInfo.name': 1,
            'categoryInfo.slug': 1
          }
        }
      ])
      .toArray();

    // تعداد کل محصولات تخفیفی
    const totalCount = await db.products.countDocuments(discountFilter);

    // تبدیل _id به id
    const formattedProducts = products.map((product: any) => ({
      id: product.sequentialId || product._id.toString(),
      sequentialId: product.sequentialId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercentage: product.discountPercentage,
      imageUrl: product.imageUrl,
      description: product.description,
      categoryPath: product.categoryPath,
      category: product.categoryInfo ? {
        id: product.categoryInfo._id?.toString(),
        _id: product.categoryInfo._id?.toString(),
        name: product.categoryInfo.name,
        slug: product.categoryInfo.slug
      } : { name: 'بدون دسته', slug: '' },
      active: product.active,
      featured: product.featured,
      createdAt: product.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching discount products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در دریافت محصولات تخفیفی' 
      },
      { status: 500 }
    );
  }
}