const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app';

async function createAdminUser() {
  let client;
  
  try {
    console.log('🔌 در حال اتصال به MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    console.log('✅ اتصال موفقیت‌آمیز بود\n');

    // اطلاعات ادمین
    const adminData = {
      name: 'Admin',
      email: 'admin@store.com',
      password: 'admin123',
      phone: '09123456789',
      role: 'ADMIN',
      active: true,
      isActive: true,
      verified: true,
      avatar: null,
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };

    // بررسی اگر ادمین از قبل وجود دارد
    const existingAdmin = await db.collection('users').findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  این ایمیل قبلاً ثبت شده است!');
      console.log('📧 ایمیل:', adminData.email);
      
      // اگر می‌خواهید رمز عبور را به‌روزرسانی کنید:
      const answer = await new Promise((resolve) => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question('\n❓ آیا می‌خواهید رمز عبور را به‌روزرسانی کنید؟ (y/n): ', (ans) => {
          readline.close();
          resolve(ans.toLowerCase());
        });
      });

      if (answer === 'y' || answer === 'yes') {
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        await db.collection('users').updateOne(
          { email: adminData.email },
          { 
            $set: { 
              password: hashedPassword,
              role: 'ADMIN',
              active: true,
              isActive: true,
              updatedAt: new Date()
            } 
          }
        );
        console.log('✅ رمز عبور به‌روزرسانی شد!');
      } else {
        console.log('❌ عملیات لغو شد');
      }
    } else {
      // Hash password
      console.log('🔐 در حال رمزنگاری رمز عبور...');
      adminData.password = await bcrypt.hash(adminData.password, 10);
      
      // Insert admin user
      console.log('💾 در حال ایجاد کاربر ادمین...');
      const result = await db.collection('users').insertOne(adminData);
      
      console.log('✅ کاربر ادمین با موفقیت ایجاد شد!\n');
      console.log('📋 اطلاعات ورود:');
      console.log('═══════════════════════════════════════');
      console.log('📧 ایمیل:', adminData.email);
      console.log('🔑 رمز عبور:', 'admin123');
      console.log('👤 نقش:', adminData.role);
      console.log('🆔 ID:', result.insertedId.toString());
      console.log('═══════════════════════════════════════');
    }

    console.log('\n🌐 لینک پنل ادمین: http://localhost:3001/admin/login');
    
  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 اتصال به دیتابیس بسته شد');
    }
  }
}

// اجرا
console.log('╔═══════════════════════════════════════╗');
console.log('║     🛠️  ساخت کاربر ادمین           ║');
console.log('╚═══════════════════════════════════════╝\n');

createAdminUser();
