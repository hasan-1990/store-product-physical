// اسکریپت برای بررسی محصولات تخفیفی موجود
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkDiscountProducts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('store');
    const collection = db.collection('products');
    
    // تعداد کل محصولات
    const totalProducts = await collection.countDocuments({ active: true });
    console.log(`📊 Total active products: ${totalProducts}`);
    
    // محصولاتی که originalPrice دارند
    const productsWithOriginalPrice = await collection.countDocuments({
      active: true,
      originalPrice: { $exists: true, $ne: null }
    });
    console.log(`📊 Products with originalPrice: ${productsWithOriginalPrice}`);
    
    // محصولاتی که واقعاً تخفیف دارند (originalPrice > price)
    const discountProducts = await collection.countDocuments({
      active: true,
      originalPrice: { $exists: true, $ne: null },
      $expr: { $gt: ['$originalPrice', '$price'] }
    });
    console.log(`📊 Products with discount: ${discountProducts}`);
    
    // نمایش چند محصول نمونه
    if (discountProducts > 0) {
      console.log('\n🎯 Sample discount products:');
      const samples = await collection.find({
        active: true,
        originalPrice: { $exists: true, $ne: null },
        $expr: { $gt: ['$originalPrice', '$price'] }
      }).limit(5).toArray();
      
      samples.forEach(product => {
        console.log(`  - ${product.name}: ${product.price} تومان (قبلاً ${product.originalPrice} تومان)`);
      });
    } else {
      console.log('\n⚠️ No discount products found!');
      
      // نمایش چند محصول عادی برای اضافه کردن تخفیف
      console.log('\n📋 Adding discount to some products...');
      const products = await collection.find({ active: true }).limit(6).toArray();
      
      for (const product of products) {
        const originalPrice = Math.round(product.price * 1.2); // 20% تخفیف
        await collection.updateOne(
          { _id: product._id },
          { $set: { originalPrice: originalPrice } }
        );
        console.log(`  ✅ Updated ${product.name}: ${product.price} تومان (قبلاً ${originalPrice} تومان)`);
      }
      
      console.log('\n🎉 Added discount to products!');
    }
    
  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    await client.close();
    console.log('🔐 MongoDB connection closed');
  }
}

// اجرای اسکریپت
checkDiscountProducts().catch(console.error);