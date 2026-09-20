// اسکریپت برای به‌روزرسانی بخش‌های تخفیفی موجود
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function updateDiscountSections() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('store');
    const collection = db.collection('discountSections');
    
    // بررسی بخش‌های موجود
    const existingSections = await collection.find({}).toArray();
    console.log(`📊 Found ${existingSections.length} existing sections`);
    
    for (const section of existingSections) {
      console.log(`\n🔍 Processing section: ${section.title}`);
      
      const updateFields = {};
      
      // اگر productType وجود ندارد، آن را اضافه کن
      if (!section.productType) {
        updateFields.productType = 'newest'; // مقدار پیش‌فرض
        console.log('  ➕ Adding productType: newest');
      }
      
      // اگر selectedCategories وجود ندارد، آن را اضافه کن
      if (!section.selectedCategories) {
        updateFields.selectedCategories = [];
        console.log('  ➕ Adding selectedCategories: []');
      }
      
      // اگر maxProducts وجود ندارد، آن را اضافه کن
      if (!section.maxProducts) {
        updateFields.maxProducts = 6;
        console.log('  ➕ Adding maxProducts: 6');
      }
      
      // اگر چیزی برای به‌روزرسانی وجود داشته باشد
      if (Object.keys(updateFields).length > 0) {
        updateFields.updatedAt = new Date();
        
        const result = await collection.updateOne(
          { _id: section._id },
          { $set: updateFields }
        );
        
        console.log(`  ✅ Updated: ${result.modifiedCount} fields modified`);
      } else {
        console.log('  ℹ️ No updates needed');
      }
    }
    
    console.log('\n🎉 All sections updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating sections:', error);
  } finally {
    await client.close();
    console.log('🔐 MongoDB connection closed');
  }
}

// اجرای اسکریپت
updateDiscountSections().catch(console.error);