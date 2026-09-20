import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper to get user from localStorage (client-side equivalent)
async function getUserFromRequest(request: NextRequest) {
  try {
    // Try to get user info from custom header or cookie
    const userHeader = request.headers.get('x-user-id');
    if (userHeader) {
      return userHeader;
    }

    // For now, return null - user needs to be logged in
    return null;
  } catch (error) {
    return null;
  }
}

// GET - دریافت لیست علاقه‌مندی‌های کاربر
export async function GET(request: NextRequest) {
  try {
    // دریافت userId از query parameter یا header
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No user ID provided'
      });
    }

    const db = await connectDB();

    // دریافت wishlist کاربر
    const wishlistItems = await db.wishlist
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    // دریافت اطلاعات محصولات
    const productIds = wishlistItems.map(item => item.productId);
    const products = await db.products
      .find({ _id: { $in: productIds } })
      .toArray();

    // دریافت اطلاعات دسته‌بندی‌ها برای ساخت categoryPath
    const categoryIds = products
      .map(p => p.categoryId)  // تغییر از category به categoryId
      .filter(Boolean)
      .map(id => new ObjectId(id));

    console.log('📋 Category IDs from products:', categoryIds.map(id => id.toString()));

    const categories = categoryIds.length > 0
      ? await db.categories.find({ _id: { $in: categoryIds } }).toArray()
      : [];

    console.log('📁 Found categories:', categories.map(c => ({ id: c._id.toString(), name: c.name, slug: c.slug })));

    // ترکیب اطلاعات
    const wishlistWithProducts = wishlistItems.map(item => {
      const product = products.find(p => p._id.toString() === item.productId.toString());

      if (!product) {
        return {
          _id: item._id.toString(),
          productId: item.productId.toString(),
          addedAt: item.createdAt,
          product: null
        };
      }

      // استفاده از categoryPath موجود در محصول یا ساخت آن
      let categoryPath: Array<{ _id: string; name: string; slug: string }> = [];

      if (product.categoryPath && Array.isArray(product.categoryPath) && product.categoryPath.length > 0) {
        // اگر categoryPath از قبل در محصول وجود دارد، از آن استفاده کن
        categoryPath = product.categoryPath.map((cat: any) => ({
          _id: cat._id?.toString() || '',
          name: cat.name,
          slug: cat.slug
        }));
      } else if (product.categoryId) {
        // اگر نه، از categoryId برای ساخت categoryPath استفاده کن
        const category = categories.find(c => c._id.toString() === product.categoryId?.toString());

        if (category) {
          categoryPath = [{
            _id: category._id.toString(),
            name: category.name,
            slug: category.slug
          }];

          // اگر دسته والد دارد، آن را هم اضافه کن
          if (category.parent) {
            const parentCategory = categories.find(c => c._id.toString() === category.parent?.toString());
            if (parentCategory) {
              categoryPath.unshift({
                _id: parentCategory._id.toString(),
                name: parentCategory.name,
                slug: parentCategory.slug
              });
            }
          }
        }
      }

      // Debug log
      console.log('📦 Wishlist Item:', {
        productName: product.name,
        productSlug: product.slug,
        sequentialId: product.sequentialId,
        hasCategoryId: !!product.categoryId,
        categoryId: product.categoryId?.toString(),
        categoryPathLength: categoryPath.length,
        categoryPath: categoryPath
      });

      const result = {
        _id: item._id.toString(),
        productId: item.productId.toString(),
        addedAt: item.createdAt,
        product: {
          id: product._id.toString(),
          _id: product._id.toString(),
          sequentialId: product.sequentialId,
          name: product.name,
          slug: product.slug,
          price: product.price,
          originalPrice: product.originalPrice,
          imageUrl: product.imageUrl,
          stock: product.stock,
          active: product.active,
          category: categoryPath.length > 0 ? {
            _id: categoryPath[categoryPath.length - 1]._id,
            name: categoryPath[categoryPath.length - 1].name,
            slug: categoryPath[categoryPath.length - 1].slug
          } : null,
          categoryPath: categoryPath
        }
      };

      return result;
    });

    return NextResponse.json({
      success: true,
      data: wishlistWithProducts
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست علاقه‌مندی‌ها' },
      { status: 500 }
    );
  }
}

// POST - افزودن محصول به لیست علاقه‌مندی‌ها
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'لطفا ابتدا وارد شوید' },
        { status: 401 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // بررسی وجود محصول
    const product = await db.products.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی عدم وجود قبلی در wishlist
    const existingItem = await db.wishlist.findOne({
      userId: new ObjectId(userId),
      productId: new ObjectId(productId)
    });

    if (existingItem) {
      return NextResponse.json(
        { success: false, error: 'این محصول قبلاً به لیست علاقه‌مندی‌ها اضافه شده است' },
        { status: 400 }
      );
    }

    // افزودن به wishlist
    const result = await db.wishlist.insertOne({
      userId: new ObjectId(userId),
      productId: new ObjectId(productId),
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'محصول به لیست علاقه‌مندی‌ها اضافه شد',
      data: {
        _id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در افزودن به لیست علاقه‌مندی‌ها' },
      { status: 500 }
    );
  }
}

// DELETE - حذف محصول از لیست علاقه‌مندی‌ها
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'لطفا ابتدا وارد شوید' },
        { status: 401 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // حذف از wishlist
    const result = await db.wishlist.deleteOne({
      userId: new ObjectId(userId),
      productId: new ObjectId(productId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'آیتم در لیست علاقه‌مندی‌ها یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'محصول از لیست علاقه‌مندی‌ها حذف شد'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف از لیست علاقه‌مندی‌ها' },
      { status: 500 }
    );
  }
}
