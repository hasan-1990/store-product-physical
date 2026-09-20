import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { RecommendationScore, Product } from '@/types';

// کش ساده برای نتایج (5 دقیقه)
const recommendationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 دقیقه

// وزن‌های الگوریتم
const WEIGHTS = {
  categoryMatch: 0.2,           // دسته‌بندی مشابه
  behaviorMatch: 0.2,           // رفتار کاربر
  popularity: 0.15,             // محبوبیت محصول
  priceRange: 0.1,              // محدوده قیمتی مشابه
  recency: 0.1,                 // بازدیدهای اخیر
  complementary: 0.15,          // محصولات مکمل (با هم خریده شده)
  collaborative: 0.1            // فیلتر مشارکتی (کاربران مشابه)
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const currentProductId = searchParams.get('currentProductId');
    const limit = parseInt(searchParams.get('limit') || '5');
    const excludeIds = searchParams.get('excludeIds')?.split(',') || [];

    if (!sessionId && !userId) {
      return NextResponse.json(
        { success: false, error: 'شناسه نشست یا کاربر الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // بررسی کش ساده بدون query
    const cacheKey = `${sessionId || userId}_${currentProductId}_${limit}`;
    const cached = recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // 1. گرفتن رفتار کاربر
    const userBehavior = await db.userBehaviors.findOne({
      $or: [
        ...(userId ? [{ userId }] : []),
        { sessionId }
      ]
    });

    // 2. گرفتن محصول فعلی (اگر وجود داشته باشد)
    let currentProduct: any = null;
    if (currentProductId) {
      currentProduct = await db.products.findOne({ 
        _id: new ObjectId(currentProductId),
        active: true 
      });
    }

    // 3. گرفتن همه محصولات فعال
    const allProducts = await db.products.find({ 
      active: true,
      _id: { $nin: [...excludeIds.map(id => new ObjectId(id)), ...(currentProductId ? [new ObjectId(currentProductId)] : [])] }
    }).toArray();

    // 4. محصولات مکمل (خریداری شده با هم)
    let complementaryProducts: any[] = [];
    if (currentProductId) {
      complementaryProducts = await findComplementaryProducts(db, currentProductId);
    }

    // 5. محصولات از کاربران مشابه
    let collaborativeProducts: any[] = [];
    if (userBehavior) {
      collaborativeProducts = await findCollaborativeProducts(db, userBehavior, (userId || sessionId) as string);
    }

    // 6. محاسبه امتیاز هر محصول
    const scoredProducts = allProducts.map(product => {
      const scores = calculateProductScore(
        product,
        currentProduct,
        userBehavior,
        allProducts,
        complementaryProducts,
        collaborativeProducts
      );

      return {
        product,
        ...scores
      };
    });

    // 7. مرتب‌سازی و برگشت top N
    // اگر رفتار کاربر خالی است، کمی تصادفی‌سازی اضافه کن
    let sortedProducts = scoredProducts;
    
    if (!userBehavior || !userBehavior.events || userBehavior.events.length === 0) {
      // Add randomness for new users - shuffle top 20% products
      const topCount = Math.ceil(scoredProducts.length * 0.2);
      const topProducts = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, topCount);
      
      // Shuffle top products
      for (let i = topProducts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [topProducts[i], topProducts[j]] = [topProducts[j], topProducts[i]];
      }
      
      sortedProducts = [
        ...topProducts,
        ...scoredProducts.slice(topCount)
      ];
    } else {
      sortedProducts = scoredProducts.sort((a, b) => b.score - a.score);
    }
    
    const recommendations = sortedProducts.slice(0, limit);

    const result = {
      success: true,
      recommendations: recommendations.map(r => ({
        ...r.product,
        _id: r.product._id.toString()
      })),
      scores: recommendations.map(r => ({
        productId: r.product._id.toString(),
        score: r.score,
        reasons: r.reasons
      })),
      debug: {
        hasBehavior: !!userBehavior?.events?.length,
        totalProducts: allProducts.length,
        complementaryCount: complementaryProducts.length,
        collaborativeCount: collaborativeProducts.length
      }
    };

    // ذخیره در کش
    recommendationCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت پیشنهادات' },
      { status: 500 }
    );
  }
}

// پیدا کردن محصولات مکمل (با هم خریداری شده)
async function findComplementaryProducts(db: any, productId: string): Promise<any[]> {
  try {
    // پیدا کردن سفارشاتی که این محصول در آن‌ها بوده
    const orders = await db.orders?.find({
      'items.productId': new ObjectId(productId),
      status: { $in: ['completed', 'delivered'] }
    }).toArray() || [];

    if (orders.length === 0) return [];

    // شمارش محصولاتی که با این محصول خریده شده‌اند
    const productCounts = new Map<string, number>();
    
    orders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        const itemId = item.productId?.toString();
        if (itemId && itemId !== productId) {
          productCounts.set(itemId, (productCounts.get(itemId) || 0) + 1);
        }
      });
    });

    return Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ productId: id, count }));
  } catch (error) {
    console.error('Error finding complementary products:', error);
    return [];
  }
}

// پیدا کردن محصولات از کاربران مشابه
async function findCollaborativeProducts(db: any, userBehavior: any, currentUser: string): Promise<any[]> {
  try {
    if (!userBehavior?.events || userBehavior.events.length === 0) return [];

    // دریافت دسته‌بندی‌هایی که کاربر بیشتر دیده
    const categoryViews = new Map<string, number>();
    userBehavior.events.forEach((event: any) => {
      if (event.categoryId) {
        categoryViews.set(event.categoryId, (categoryViews.get(event.categoryId) || 0) + 1);
      }
    });

    const topCategories = Array.from(categoryViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    if (topCategories.length === 0) return [];

    // پیدا کردن کاربران دیگر با علایق مشابه
    const similarUsers = await db.userBehaviors?.find({
      $or: [
        { userId: { $ne: currentUser } },
        { sessionId: { $ne: currentUser } }
      ],
      'events.categoryId': { $in: topCategories }
    }).limit(20).toArray() || [];

    // محصولاتی که این کاربران دیده‌اند
    const productViews = new Map<string, number>();
    similarUsers.forEach((user: any) => {
      user.events?.forEach((event: any) => {
        if (event.productId && event.type === 'view') {
          productViews.set(event.productId, (productViews.get(event.productId) || 0) + 1);
        }
      });
    });

    return Array.from(productViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, views]) => ({ productId: id, views }));
  } catch (error) {
    console.error('Error finding collaborative products:', error);
    return [];
  }
}

// محاسبه امتیاز یک محصول
function calculateProductScore(
  product: any,
  currentProduct: any | null,
  userBehavior: any | null,
  allProducts: any[],
  complementaryProducts: any[] = [],
  collaborativeProducts: any[] = []
): { score: number; reasons: RecommendationScore['reasons'] } {
  
  const reasons = {
    categoryMatch: 0,
    behaviorMatch: 0,
    popularity: 0,
    priceRange: 0,
    recency: 0,
    complementary: 0,
    collaborative: 0
  };

  // 1. امتیاز دسته‌بندی مشابه
  if (currentProduct) {
    const currentCatId = currentProduct.categoryId?.toString();
    const productCatId = product.categoryId?.toString();
    
    if (currentCatId && productCatId && currentCatId === productCatId) {
      reasons.categoryMatch = 1.0;
    } else if (currentCatId && productCatId) {
      reasons.categoryMatch = 0.3; // دسته‌های متفاوت ولی شاید مرتبط
    }
  }

  // 2. امتیاز رفتار کاربر
  if (userBehavior?.events) {
    const events = userBehavior.events;
    const productIdStr = product._id.toString();
    
    // بررسی تعامل قبلی با این محصول
    const viewCount = events.filter((e: any) => e.type === 'view' && e.productId === productIdStr).length;
    const cartCount = events.filter((e: any) => e.type === 'cart' && e.productId === productIdStr).length;
    const wishlistCount = events.filter((e: any) => e.type === 'wishlist' && e.productId === productIdStr).length;
    
    // بررسی تعامل با دسته‌بندی این محصول
    const catId = product.categoryId?.toString();
    const categoryViews = catId ? events.filter((e: any) => e.categoryId === catId).length : 0;
    
    reasons.behaviorMatch = Math.min(
      (viewCount * 0.2 + cartCount * 0.4 + wishlistCount * 0.3 + categoryViews * 0.1) / 10,
      1.0
    );
  }

  // 3. امتیاز محبوبیت
  const totalViews = product.views || 0;
  const totalSales = product.salesCount || 0;
  const rating = product.rating || 0;
  
  const maxViews = Math.max(...allProducts.map(p => p.views || 0), 1);
  const maxSales = Math.max(...allProducts.map(p => p.salesCount || 0), 1);
  
  reasons.popularity = (
    (totalViews / maxViews) * 0.4 +
    (totalSales / maxSales) * 0.4 +
    (rating / 5) * 0.2
  );

  // 4. امتیاز محدوده قیمتی
  if (currentProduct) {
    const currentPrice = currentProduct.price || 0;
    const productPrice = product.price || 0;
    
    if (currentPrice > 0 && productPrice > 0) {
      const priceDiff = Math.abs(currentPrice - productPrice);
      const avgPrice = (currentPrice + productPrice) / 2;
      const priceRatio = 1 - (priceDiff / avgPrice);
      
      reasons.priceRange = Math.max(priceRatio, 0);
    }
  } else {
    reasons.priceRange = 0.5; // اگر محصول فعلی نداریم، امتیاز متوسط
  }

  // 5. امتیاز بازدیدهای اخیر
  if (userBehavior?.events) {
    const recentEvents = userBehavior.events.slice(-50); // 50 رویداد اخیر
    const productIdStr = product._id.toString();
    const catId = product.categoryId?.toString();
    
    const recentProductViews = recentEvents.filter((e: any) => 
      e.productId === productIdStr || e.categoryId === catId
    ).length;
    
    reasons.recency = Math.min(recentProductViews / 10, 1.0);
  }

  // 6. امتیاز محصولات مکمل (با هم خریده شده)
  const productIdStr = product._id.toString();
  const complementaryItem = complementaryProducts.find(cp => cp.productId === productIdStr);
  if (complementaryItem) {
    // هر چه بیشتر با هم خریده شده باشند، امتیاز بالاتر
    const maxComplementary = Math.max(...complementaryProducts.map(cp => cp.count), 1);
    reasons.complementary = complementaryItem.count / maxComplementary;
  }

  // 7. امتیاز فیلتر مشارکتی (کاربران مشابه)
  const collaborativeItem = collaborativeProducts.find(cp => cp.productId === productIdStr);
  if (collaborativeItem) {
    const maxCollaborative = Math.max(...collaborativeProducts.map(cp => cp.views), 1);
    reasons.collaborative = collaborativeItem.views / maxCollaborative;
  }

  // محاسبه امتیاز نهایی
  const finalScore = 
    reasons.categoryMatch * WEIGHTS.categoryMatch +
    reasons.behaviorMatch * WEIGHTS.behaviorMatch +
    reasons.popularity * WEIGHTS.popularity +
    reasons.priceRange * WEIGHTS.priceRange +
    reasons.recency * WEIGHTS.recency +
    reasons.complementary * WEIGHTS.complementary +
    reasons.collaborative * WEIGHTS.collaborative;

  return {
    score: finalScore,
    reasons
  };
}
