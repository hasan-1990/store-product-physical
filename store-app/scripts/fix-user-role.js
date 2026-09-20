/**
 * اسکریپت اصلاح نقش کاربر
 * این اسکریپت نقش کاربران را بررسی و اصلاح می‌کند
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;
const ADMIN_EMAIL = 'hasanmansouri1990@gmail.com'; // فقط این ایمیل admin است
const NON_ADMIN_EMAIL = 'hasanmansouri19901@gmail.com'; // این نباید admin باشد

async function fixUserRoles() {
  console.log('🚀 شروع اصلاح نقش کاربران...\n');

  if (!MONGODB_URI) {
    console.error('❌ متغیر محیطی DATABASE_URL یافت نشد!');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ اتصال به MongoDB برقرار شد\n');

    const db = client.db();
    const usersCollection = db.collection('users');

    // بررسی کاربر admin صحیح
    console.log(`🔍 بررسی کاربر admin: ${ADMIN_EMAIL}`);
    const adminUser = await usersCollection.findOne({ email: ADMIN_EMAIL });
    
    if (adminUser) {
      console.log(`✅ کاربر admin یافت شد:`, {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive,
        isVerified: adminUser.isVerified
      });

      if (adminUser.role?.toLowerCase() !== 'admin') {
        console.log('⚠️  نقش کاربر admin نیست، در حال اصلاح...');
        await usersCollection.updateOne(
          { email: ADMIN_EMAIL },
          { 
            $set: { 
              role: 'admin',
              isActive: true,
              isVerified: true 
            } 
          }
        );
        console.log('✅ نقش کاربر admin به درستی تنظیم شد\n');
      } else {
        console.log('✅ نقش کاربر admin صحیح است\n');
      }
    } else {
      console.log('❌ کاربر admin یافت نشد!\n');
    }

    // بررسی کاربر غیر admin
    console.log(`🔍 بررسی کاربر غیر admin: ${NON_ADMIN_EMAIL}`);
    const regularUser = await usersCollection.findOne({ email: NON_ADMIN_EMAIL });
    
    if (regularUser) {
      console.log(`✅ کاربر یافت شد:`, {
        email: regularUser.email,
        name: regularUser.name,
        role: regularUser.role,
        isActive: regularUser.isActive,
        isVerified: regularUser.isVerified
      });

      if (regularUser.role?.toLowerCase() === 'admin') {
        console.log('⚠️  این کاربر نباید admin باشد، در حال اصلاح...');
        await usersCollection.updateOne(
          { email: NON_ADMIN_EMAIL },
          { 
            $set: { 
              role: 'user' // تغییر به user
            } 
          }
        );
        console.log('✅ نقش کاربر به "user" تغییر یافت\n');
      } else {
        console.log('✅ نقش کاربر صحیح است (user)\n');
      }
    } else {
      console.log('ℹ️  کاربر با این ایمیل یافت نشد\n');
    }

    // نمایش لیست تمام adminها
    console.log('📋 لیست تمام کاربران با نقش admin:');
    const allAdmins = await usersCollection.find({ 
      role: { $regex: /^admin$/i } 
    }).toArray();
    
    if (allAdmins.length === 0) {
      console.log('⚠️  هیچ کاربر admin یافت نشد!');
    } else {
      allAdmins.forEach((admin, index) => {
        console.log(`\n${index + 1}. Admin:`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Active: ${admin.isActive}`);
        console.log(`   Verified: ${admin.isVerified}`);
      });
    }

    console.log('\n✅ عملیات با موفقیت انجام شد!');

  } catch (error) {
    console.error('❌ خطا در عملیات:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 اتصال به MongoDB بسته شد');
  }
}

// اجرای اسکریپت
fixUserRoles();
