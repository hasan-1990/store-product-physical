// scripts/delete-all-reviews.js
// Utility to remove every review document and reset related product stats

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/store';

function buildProductFilters(rawId) {
  const filters = [];

  if (rawId == null) {
    return filters;
  }

  if (rawId instanceof ObjectId) {
    filters.push({ _id: rawId });
    const asString = rawId.toString();
    const numeric = Number(asString);
    if (!Number.isNaN(numeric)) {
      filters.push({ sequentialId: numeric });
    }
    return filters;
  }

  if (typeof rawId === 'string') {
    if (ObjectId.isValid(rawId)) {
      filters.push({ _id: new ObjectId(rawId) });
    }
    const numeric = Number(rawId);
    if (!Number.isNaN(numeric)) {
      filters.push({ sequentialId: numeric });
    }
    return filters;
  }

  if (typeof rawId === 'number') {
    filters.push({ sequentialId: rawId });
    return filters;
  }

  return filters;
}

async function resetProductStats(db, rawId) {
  const productCollection = db.collection('products');
  const filters = buildProductFilters(rawId);

  if (filters.length === 0) {
    console.warn('⚠️  Skipping product rating reset; unrecognised productId:', rawId);
    return false;
  }

  for (const filter of filters) {
    const updateResult = await productCollection.updateOne(filter, {
      $set: {
        rating: 0,
        reviewsCount: 0,
        updatedAt: new Date()
      }
    });

    if (updateResult.matchedCount > 0) {
      return true;
    }
  }

  console.warn('⚠️  Unable to match product for rating reset. productId:', rawId);
  return false;
}

async function deleteAllReviews() {
  console.log('🧹 Starting full review purge...');
  console.log('🔌 Connecting to MongoDB using URI:', DATABASE_URI.replace(/:[^:@]*@/g, ':***@'));

  const client = new MongoClient(DATABASE_URI);
  await client.connect();
  const db = client.db();

  try {
    const reviewsCollection = db.collection('reviews');
    const totalBefore = await reviewsCollection.countDocuments();
    console.log(`📊 Reviews before deletion: ${totalBefore}`);
    const productIds = await reviewsCollection.distinct('productId');
    console.log(`📦 Found ${productIds.length} unique product references in reviews`);

  const deleteResult = await reviewsCollection.deleteMany({});
  console.log(`🗑️  Deleted ${deleteResult.deletedCount ?? 0} review documents`);

    let resetCount = 0;
    for (const productId of productIds) {
      const updated = await resetProductStats(db, productId);
      if (updated) {
        resetCount += 1;
      }
    }

    console.log(`🔄 Reset rating stats for ${resetCount} products`);
    console.log('✅ Review purge completed successfully');
  } catch (error) {
    console.error('❌ Error deleting reviews:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  deleteAllReviews().catch((error) => {
    console.error('❌ Unexpected failure:', error);
    process.exit(1);
  });
}
