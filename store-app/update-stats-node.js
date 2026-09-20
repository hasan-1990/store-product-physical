/**
 * اسکریپت Node.js برای آپدیت آمار محصولات
 */

const { MongoClient } = require('mongodb');

const DATABASE_URL = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://store-mongodb:27017/store_db';

async function updateProductStats() {
  const client = new MongoClient(DATABASE_URL);

  try {
    await client.connect();
    console.log('✅ اتصال به MongoDB برقرار شد');

    const db = client.db();
    
    // آپدیت همه محصولات با مقادیر تصادفی متفاوت
    const products = await db.collection('products').find({}).toArray();
    
    console.log(`📦 تعداد محصولات: ${products.length}`);
    
    for (const product of products) {
      const randomViews = Math.floor(Math.random() * 1000) + 50;
      const randomSoldCount = Math.floor(Math.random() * 300) + 10;
      const randomSalesCount = Math.floor(Math.random() * 200) + 5;
      const randomRating = parseFloat((Math.random() * 2 + 3).toFixed(1));
      const randomRatingCount = Math.floor(Math.random() * 100) + 5;
      
      await db.collection('products').updateOne(
        { _id: product._id },
        {
          $set: {
            views: randomViews,
            soldCount: randomSoldCount,
            salesCount: randomSalesCount,
            rating: randomRating,
            ratingCount: randomRatingCount
          }
        }
      );
      console.log(`✅ ${product.name}: views=${randomViews}, soldCount=${randomSoldCount}, rating=${randomRating}`);
    }

    console.log('\n🎉 همه محصولات با موفقیت به‌روز شدند!');

  } catch (error) {
    console.error('❌ خطا:', error);
  } finally {
    await client.close();
    console.log('🔌 اتصال به MongoDB بسته شد');
  }
}

updateProductStats();
