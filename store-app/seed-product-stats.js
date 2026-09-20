/**
 * اسکریپت موقت برای افزودن آمار تصادفی به محصولات
 * فقط یک بار اجرا کنید
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.MONGODB_URI;

async function seedProductStats() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL یافت نشد!');
    process.exit(1);
  }

  const client = new MongoClient(DATABASE_URL);

  try {
    await client.connect();
    console.log('✅ اتصال به MongoDB برقرار شد');

    const db = client.db();
    const products = await db.collection('products').find({}).toArray();

    console.log(`📦 تعداد محصولات: ${products.length}\n`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // مقادیر متفاوت برای هر محصول
      const stats = {
        views: Math.floor(Math.random() * 500) + (i * 10),
        soldCount: Math.floor(Math.random() * 100) + (i * 5),
        salesCount: Math.floor(Math.random() * 100) + (i * 5),
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0-5.0
        ratingCount: Math.floor(Math.random() * 50) + (i * 2)
      };

      await db.collection('products').updateOne(
        { _id: product._id },
        { $set: stats }
      );

      console.log(`✅ ${i + 1}/${products.length} - ${product.name}`);
      console.log(`   views: ${stats.views}, soldCount: ${stats.soldCount}, rating: ${stats.rating}`);
    }

    console.log(`\n🎉 تمام محصولات آپدیت شدند!`);
    console.log('\n💡 حالا تب‌ها باید محصولات متفاوتی نشان دهند:');
    console.log('   - جدیدترین: بر اساس تاریخ');
    console.log('   - پرفروش‌ترین: بر اساس soldCount');
    console.log('   - بالاترین امتیاز: بر اساس rating');
    console.log('   - پربازدیدترین: بر اساس views');

  } catch (error) {
    console.error('❌ خطا:', error);
  } finally {
    await client.close();
  }
}

seedProductStats();
