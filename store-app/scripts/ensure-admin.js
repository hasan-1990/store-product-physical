// بررسی و ساخت admin در صورت نیاز
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function ensureAdmin() {
  const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app';
  console.log('🔌 اتصال به MongoDB...');
  
  const client = await MongoClient.connect(dbUrl);
  const db = client.db();
  
  // چک کردن admin با شماره 09151675512
  const admin = await db.collection('users').findOne({ phone: '09151675512' });
  
  if (admin) {
    console.log('✅ کاربر admin موجود است:');
    console.log('   Email:', admin.email);
    console.log('   Phone:', admin.phone);
    console.log('   Role:', admin.role);
    
    // اگه role با حروف کوچیک نیست، آپدیت کن
    if (admin.role === 'ADMIN') {
      console.log('\n🔄 آپدیت role به حروف کوچیک...');
      await db.collection('users').updateOne(
        { _id: admin._id },
        { $set: { role: 'admin' } }
      );
      console.log('✅ Role به "admin" تغییر کرد');
    }
  } else {
    console.log('❌ کاربر admin با شماره 09151675512 وجود ندارد');
    console.log('📝 ساخت کاربر admin جدید...');
    
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    await db.collection('users').insertOne({
      email: 'hasanmansouri1990@gmail.com',
      phone: '09151675512',
      role: 'admin',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ کاربر admin ساخته شد:');
    console.log('   Email: hasanmansouri1990@gmail.com');
    console.log('   Phone: 09151675512');
    console.log('   Password: Admin@123');
    console.log('   Role: admin');
  }
  
  await client.close();
  console.log('\n✅ عملیات با موفقیت انجام شد');
}

ensureAdmin().catch(err => {
  console.error('❌ خطا:', err.message);
  process.exit(1);
});
