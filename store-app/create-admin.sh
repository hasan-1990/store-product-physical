#!/bin/bash
# اسکریپت ساخت admin جدید در دیتابیس سرور

echo "🔧 ساخت کاربر Admin جدید..."
echo ""

# اجرای دستور در container
docker compose exec -T app node << 'EOF'
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const client = await MongoClient.connect(process.env.DATABASE_URL);
    const db = client.db();
    
    // حذف admin قدیمی اگه هست
    await db.collection('users').deleteMany({ 
      $or: [
        { phone: '09151675512' },
        { email: 'hasanmansouri1990@gmail.com' }
      ]
    });
    
    // ساخت password hash
    const password = await bcrypt.hash('Admin@123456', 10);
    
    // ساخت admin جدید
    const result = await db.collection('users').insertOne({
      email: 'hasanmansouri1990@gmail.com',
      phone: '09151675512',
      role: 'admin',
      password: password,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ کاربر Admin با موفقیت ساخته شد:');
    console.log('   📧 Email: hasanmansouri1990@gmail.com');
    console.log('   📱 Phone: 09151675512');
    console.log('   🔑 Password: Admin@123456');
    console.log('   👤 Role: admin');
    console.log('   🆔 ID:', result.insertedId);
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  }
}

createAdmin();
EOF

echo ""
echo "✅ اسکریپت اجرا شد"
echo ""
echo "💡 حالا میتوانید از این اطلاعات برای فراموشی رمز استفاده کنید:"
echo "   شماره موبایل: 09151675512"
echo "   یا"
echo "   ایمیل: hasanmansouri1990@gmail.com"
