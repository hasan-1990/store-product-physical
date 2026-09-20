/**
 * تست سریع سیستم ایمیل
 * این اسکریپت فقط با دیتای mock کار می‌کند
 * 
 * برای تست واقعی با Gmail:
 * 1. به https://myaccount.google.com/security بروید
 * 2. "2-Step Verification" را فعال کنید
 * 3. "App passwords" را باز کنید
 * 4. یک App Password برای "Mail" بسازید
 * 5. رمز 16 رقمی را در .env.local قرار دهید
 * 
 * اجرا: npx tsx scripts/quick-email-test.ts
 */

console.log('🚀 شروع تست سیستم ایمیل...\n');

// بررسی متغیرهای محیطی
const emailConfig = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD ? '***' : 'NOT SET',
  fromName: process.env.EMAIL_FROM_NAME,
  fromAddress: process.env.EMAIL_FROM_ADDRESS
};

console.log('📋 تنظیمات فعلی:');
console.log(JSON.stringify(emailConfig, null, 2));
console.log('\n');

if (!emailConfig.enabled) {
  console.log('⚠️  سیستم ایمیل غیرفعال است!');
  console.log('💡 برای فعال‌سازی:');
  console.log('   1. در .env.local تنظیم کنید: EMAIL_ENABLED=true');
  console.log('   2. اطلاعات SMTP را کامل کنید');
  console.log('\n');
  process.exit(1);
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.log('❌ اطلاعات SMTP ناقص است!');
  console.log('💡 باید تنظیم کنید:');
  console.log('   EMAIL_USER=your-email@gmail.com');
  console.log('   EMAIL_PASSWORD=your-app-password');
  console.log('\n');
  console.log('📖 راهنمای دریافت App Password:');
  console.log('   1. https://myaccount.google.com/security');
  console.log('   2. فعال‌سازی 2-Step Verification');
  console.log('   3. App passwords → Mail → Generate');
  console.log('   4. کپی کردن رمز 16 رقمی');
  console.log('\n');
  process.exit(1);
}

console.log('✅ تنظیمات کامل است!');
console.log('\n');
console.log('📧 برای ارسال ایمیل واقعی:');
console.log('   1. مطمئن شوید App Password صحیح است');
console.log('   2. از API ایجاد سفارش استفاده کنید');
console.log('   3. لاگ‌های سرور را بررسی کنید');
console.log('\n');

console.log('🎯 مثال تست با API:');
console.log(`
fetch('http://localhost:3000/api/orders/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{
      productId: '507f1f77bcf86cd799439011',
      name: 'محصول تستی',
      price: 100000,
      quantity: 1,
      productType: 'PHYSICAL'
    }],
    contactInfo: {
      email: '${process.env.EMAIL_USER}',
      firstName: 'علی',
      lastName: 'رضایی',
      phone: '09123456789'
    },
    shippingAddress: {
      address: 'تهران، خیابان آزادی',
      city: 'تهران',
      zipCode: '1234567890'
    },
    totalAmount: 100000,
    paymentStatus: 'completed',
    paymentMethod: 'online'
  })
}).then(r => r.json()).then(console.log);
`);

console.log('\n✨ موفق باشید!');
