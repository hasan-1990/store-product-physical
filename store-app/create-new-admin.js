// ساخت کاربر Admin جدید
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🔌 اتصال به MongoDB...');
    const client = await MongoClient.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app');
    const db = client.db();
    
    // اطلاعات admin جدید
    const adminData = {
      email: 'admin@fathemes.com',
      phone: '09151675512',
      role: 'admin',
      password: await bcrypt.hash('Admin@123456', 10),
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // حذف admin قبلی با همین شماره (اگه وجود داره)
    await db.collection('users').deleteMany({ phone: '09151675512' });
    console.log('🗑️  Admin‌های قبلی پاک شدند');
    
    // ساخت admin جدید
    const result = await db.collection('users').insertOne(adminData);
    
    console.log('\n✅ کاربر Admin با موفقیت ساخته شد:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminData.email);
    console.log('📱 Phone:', adminData.phone);
    console.log('🔑 Password:', 'Admin@123456');
    console.log('👤 Role:', adminData.role);
    console.log('🆔 ID:', result.insertedId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 حالا میتونید با این اطلاعات وارد شوید:');
    console.log('   URL: https://fathemes.com/admin/login');
    console.log('   Phone: 09151675512');
    console.log('   Password: Admin@123456');
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  }
}

createAdmin();
