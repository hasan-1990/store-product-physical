/**
 * اسکریپت مقداردهی تصادفی آمار محصولات
 */

const { MongoClient } = require('mongodb');

const DATABASE_URL = process.env.DATABASE_URL || process.env.MONGODB_URI;

async function setRandomStats() {
  const client = new MongoClient(DATABASE_URL);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const products = await db.collection('products').find({}).toArray();

    console.log(`📦 Found ${products.length} products`);

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
    }

    console.log(`✅ Updated ${products.length} products with random stats`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setRandomStats();
