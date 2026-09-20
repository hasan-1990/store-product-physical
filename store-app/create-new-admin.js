// ساخت کاربر Admin جدید
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🔌 اتصال به MongoDB...');
    const client = await MongoClient.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app');
    const db = client.db();
    
    // اطلاعات admin جدید (قابل شخصی‌سازی از طریق متغیرهای محیطی)
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const phone = process.env.ADMIN_PHONE || '09120000000';
    const rawPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const adminData = {
      email,
      phone,
      role: 'admin',
      password: await bcrypt.hash(rawPassword, 10),
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // حذف admin قبلی با همین شماره یا ایمیل
    await db.collection('users').deleteMany({ $or: [{ phone }, { email }] });
    console.log('🗑️  Admin‌های قبلی با این مشخصات پاک شدند');
    
    // ساخت admin جدید
    const result = await db.collection('users').insertOne(adminData);
    
    console.log('\n✅ کاربر Admin با موفقیت ساخته شد:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminData.email);
    console.log('📱 Phone:', adminData.phone);
    console.log('🔑 Password:', rawPassword);
    console.log('👤 Role:', adminData.role);
    console.log('🆔 ID:', result.insertedId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 حالا می‌توانید با این اطلاعات وارد شوید:');
    console.log(`   URL: ${appUrl}/admin/login`);
    console.log(`   Email / Phone: ${email} / ${phone}`);
    console.log(`   Password: ${rawPassword}`);
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  }
}

createAdmin();
