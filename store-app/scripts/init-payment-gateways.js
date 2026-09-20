/**
 * Initialize Payment Gateways Collection
 * اسکریپت مقداردهی اولیه برای کالکشن درگاه‌های پرداخت
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ DATABASE_URL or MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function initializePaymentGateways() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('store-app');
    const collection = db.collection('paymentGateways');

    // بررسی اگر قبلاً داده وجود دارد
    const existingCount = await collection.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} gateway(s) already exist. Skipping initialization.`);
      console.log('\nTo reinitialize, first delete existing gateways:');
      console.log('db.paymentGateways.deleteMany({})');
      return;
    }

    // داده‌های اولیه - درگاه زرین‌پال
    const zarinpalGateway = {
      name: 'زرین‌پال',
      type: 'zarinpal',
      merchantId: process.env.ZARINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      apiKey: '',
      active: true,
      commissionRate: 1.5,
      testMode: process.env.ZARINPAL_SANDBOX === 'true',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(zarinpalGateway);
    
    console.log('\n✅ Payment Gateway initialized successfully!');
    console.log('\n📊 Inserted Gateway:');
    console.log({
      _id: result.insertedId,
      name: zarinpalGateway.name,
      type: zarinpalGateway.type,
      merchantId: zarinpalGateway.merchantId.substring(0, 8) + '...',
      active: zarinpalGateway.active,
      testMode: zarinpalGateway.testMode
    });

    console.log('\n📝 Next Steps:');
    console.log('1. به پنل ادمین بروید: /admin/payment-gateway');
    console.log('2. Merchant ID واقعی خود را از زرین‌پال دریافت کنید');
    console.log('3. از پنل ادمین، Merchant ID را ویرایش کنید');
    console.log('4. دکمه "تست اتصال" را بزنید تا اتصال تأیید شود');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

initializePaymentGateways();
