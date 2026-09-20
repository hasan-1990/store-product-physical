// اسکریپت ایجاد جدول licenses در MongoDB
const { MongoClient } = require('mongodb');

async function createLicensesCollection() {
  const client = new MongoClient('mongodb://localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    console.log('✅ متصل به MongoDB');

    const db = client.db('store-app');
    
    // ایجاد کالکشن licenses
    const collection = db.collection('licenses');
    
    // ایجاد ایندکس‌ها
    await collection.createIndex({ licenseKey: 1 }, { unique: true });
    await collection.createIndex({ productId: 1, domain: 1, userId: 1 });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ expiresAt: 1 });
    await collection.createIndex({ isActive: 1 });
    
    console.log('✅ کالکشن licenses و ایندکس‌ها ایجاد شد');

    // اضافه کردن نمونه داده برای تست
    const sampleLicense = {
      licenseKey: 'TEST-ABCD-1234567890123456',
      productId: '507f1f77bcf86cd799439011', // نمونه ObjectId
      domain: 'example.com',
      userId: '507f1f77bcf86cd799439012', // نمونه ObjectId
      orderId: null,
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 سال
      downloads: 0,
      lastUsed: null,
      usageCount: 0
    };

    // بررسی اینکه آیا نمونه داده قبلاً وجود دارد
    const existingSample = await collection.findOne({ licenseKey: sampleLicense.licenseKey });
    if (!existingSample) {
      await collection.insertOne(sampleLicense);
      console.log('✅ نمونه داده لایسنس اضافه شد');
    } else {
      console.log('ℹ️ نمونه داده قبلاً موجود است');
    }

    console.log('\n📋 ساختار کالکشن licenses:');
    console.log('- licenseKey: string (کلید لایسنس یکتا)');
    console.log('- productId: ObjectId (شناسه محصول)');
    console.log('- domain: string (دامنه کاربر)');
    console.log('- userId: ObjectId (شناسه کاربر)');
    console.log('- orderId: ObjectId | null (شناسه سفارش)');
    console.log('- isActive: boolean (وضعیت فعال/غیرفعال)');
    console.log('- createdAt: Date (تاریخ ایجاد)');
    console.log('- expiresAt: Date (تاریخ انقضا)');
    console.log('- downloads: number (تعداد دانلود)');
    console.log('- lastUsed: Date | null (آخرین استفاده)');
    console.log('- usageCount: number (تعداد استفاده)');

  } catch (error) {
    console.error('❌ خطا:', error);
  } finally {
    await client.close();
    console.log('🔒 اتصال به دیتابیس بسته شد');
  }
}

createLicensesCollection();

module.exports = { createLicensesCollection };