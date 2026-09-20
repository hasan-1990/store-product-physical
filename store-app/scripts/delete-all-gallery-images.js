/**
 * Delete all product gallery images from disk and clear DB references.
 * Usage: node scripts/delete-all-gallery-images.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
const uploadPrefix = '/uploads/products/';

function isProductUpload(value) {
  return typeof value === 'string' && value.includes(uploadPrefix);
}

async function deleteFilesFromDisk() {
  if (!fs.existsSync(uploadsDir)) {
    console.log('📁 پوشه uploads/products وجود ندارد');
    return { deleted: 0, failed: 0 };
  }

  const files = fs.readdirSync(uploadsDir).filter((file) => {
    const fullPath = path.join(uploadsDir, file);
    return fs.statSync(fullPath).isFile();
  });

  let deleted = 0;
  let failed = 0;

  for (const file of files) {
    try {
      fs.unlinkSync(path.join(uploadsDir, file));
      deleted += 1;
    } catch (error) {
      failed += 1;
      console.error(`❌ خطا در حذف ${file}:`, error.message);
    }
  }

  return { deleted, failed, total: files.length };
}

async function clearDatabaseReferences(db) {
  const now = new Date();
  const results = {};

  const products = db.collection('products');
  const productMatches = await products.countDocuments({
    $or: [
      { image: { $regex: '^/uploads/products/' } },
      { imageUrl: { $regex: '^/uploads/products/' } },
      { gallery: { $elemMatch: { $regex: '^/uploads/products/' } } },
      { images: { $elemMatch: { $regex: '^/uploads/products/' } } },
    ],
  });

  const productCursor = products.find({
    $or: [
      { image: { $regex: '^/uploads/products/' } },
      { imageUrl: { $regex: '^/uploads/products/' } },
      { gallery: { $elemMatch: { $regex: '^/uploads/products/' } } },
      { images: { $elemMatch: { $regex: '^/uploads/products/' } } },
    ],
  });

  let productsUpdated = 0;
  while (await productCursor.hasNext()) {
    const product = await productCursor.next();
    const update = {
      updatedAt: now,
    };

    if (isProductUpload(product.image)) update.image = '';
    if (isProductUpload(product.imageUrl)) update.imageUrl = '';

    const gallery = Array.isArray(product.gallery)
      ? product.gallery.filter((url) => !isProductUpload(url))
      : [];
    const images = Array.isArray(product.images)
      ? product.images.filter((url) => !isProductUpload(url))
      : [];

    await products.updateOne(
      { _id: product._id },
      {
        $set: {
          ...update,
          gallery,
          images,
        },
      }
    );
    productsUpdated += 1;
  }

  results.productsMatched = productMatches;
  results.productsUpdated = productsUpdated;

  const categories = db.collection('categories');
  const categoryResult = await categories.updateMany(
    { imageUrl: { $regex: '^/uploads/products/' } },
    { $set: { imageUrl: '', updatedAt: now } }
  );
  results.categoriesUpdated = categoryResult.modifiedCount || 0;

  const brands = db.collection('brands');
  const brandResult = await brands.updateMany(
    { logo: { $regex: '^/uploads/products/' } },
    { $set: { logo: '', updatedAt: now } }
  );
  results.brandsUpdated = brandResult.modifiedCount || 0;

  const heroSliders = db.collection('heroSliders');
  const sliderResult = await heroSliders.updateMany(
    { imageUrl: { $regex: '^/uploads/products/' } },
    { $set: { imageUrl: '', updatedAt: now } }
  );
  results.slidersUpdated = sliderResult.modifiedCount || 0;

  const blogPosts = db.collection('blogPosts');
  const blogResult = await blogPosts.updateMany(
    { featuredImage: { $regex: '^/uploads/products/' } },
    { $set: { featuredImage: '', updatedAt: now } }
  );
  results.blogPostsUpdated = blogResult.modifiedCount || 0;

  return results;
}

async function main() {
  if (!uri) {
    console.error('❌ MONGODB_URI در .env.local تنظیم نشده');
    process.exit(1);
  }

  console.log('🗑️  شروع حذف همه عکس‌های گالری محصولات...\n');

  const fileResult = await deleteFilesFromDisk();
  console.log(`📁 فایل‌ها: ${fileResult.deleted} حذف شد، ${fileResult.failed} خطا (از ${fileResult.total || 0})`);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  const db = client.db('store-app');

  try {
    const dbResult = await clearDatabaseReferences(db);
    console.log('\n🗄️  دیتابیس:');
    console.log(`   محصولات: ${dbResult.productsUpdated} بروزرسانی (${dbResult.productsMatched} مورد)`);
    console.log(`   دسته‌بندی‌ها: ${dbResult.categoriesUpdated}`);
    console.log(`   برندها: ${dbResult.brandsUpdated}`);
    console.log(`   اسلایدرها: ${dbResult.slidersUpdated}`);
    console.log(`   بلاگ: ${dbResult.blogPostsUpdated}`);
    console.log('\n✅ همه عکس‌های گالری حذف شدند');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('❌ خطا:', error);
  process.exit(1);
});
