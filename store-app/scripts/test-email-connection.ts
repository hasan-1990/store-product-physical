/**
 * تست واقعی سیستم ایمیل با اتصال به Gmail
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🚀 شروع تست سیستم ایمیل...\n');

// بررسی متغیرهای محیطی
const emailConfig = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET',
  fromName: process.env.EMAIL_FROM_NAME,
  fromAddress: process.env.EMAIL_FROM_ADDRESS
};

console.log('📋 تنظیمات فعلی:');
console.log(JSON.stringify(emailConfig, null, 2));
console.log('\n');

if (!emailConfig.enabled) {
  console.log('⚠️  سیستم ایمیل غیرفعال است!');
  console.log('💡 در .env.local تنظیم کنید: EMAIL_ENABLED=true\n');
  process.exit(1);
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.log('❌ اطلاعات SMTP ناقص است!\n');
  process.exit(1);
}

console.log('✅ تنظیمات کامل است!\n');

// تست اتصال به Gmail
async function testConnection() {
  try {
    console.log('📡 در حال اتصال به Gmail SMTP...\n');
    
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('🔍 در حال تأیید اعتبار...');
    
    await transporter.verify();
    
    console.log('\n✅✅✅ اتصال موفقیت‌آمیز بود! ✅✅✅\n');
    console.log('🎉 سیستم ایمیل کاملاً آماده است!\n');
    console.log('💡 حالا می‌توانید:');
    console.log('   1. یک محصول بخرید');
    console.log('   2. ایمیل تأیید دریافت کنید\n');
    
    return true;
  } catch (error: any) {
    console.log('\n❌❌❌ خطا در اتصال! ❌❌❌\n');
    console.log('📝 پیام خطا:', error.message);
    console.log('\n');
    
    if (error.message.includes('Invalid login')) {
      console.log('🔐 مشکل احتمالی: رمز عبور اشتباه است\n');
      console.log('⚠️  شما رمز عبور اصلی Gmail را وارد کرده‌اید!');
      console.log('🚫 Gmail به خاطر امنیت، رمز عبور اصلی را قبول نمی‌کند.\n');
      console.log('✅ راه‌حل: باید از App Password استفاده کنید\n');
      console.log('📖 مراحل دریافت App Password:\n');
      console.log('1️⃣  به این لینک بروید:');
      console.log('   👉 https://myaccount.google.com/security\n');
      console.log('2️⃣  در بخش "Signing in to Google" روی "2-Step Verification" کلیک کنید');
      console.log('   (اگر غیرفعال است، آن را فعال کنید)\n');
      console.log('3️⃣  به انتهای صفحه بروید و روی "App passwords" کلیک کنید\n');
      console.log('4️⃣  در لیست "Select app" گزینه "Mail" را انتخاب کنید\n');
      console.log('5️⃣  در لیست "Select device" گزینه "Other" را انتخاب کنید\n');
      console.log('6️⃣  نام بنویسید: "Store App" و Generate کنید\n');
      console.log('7️⃣  یک رمز 16 رقمی نمایش داده می‌شود (مثلاً: abcd efgh ijkl mnop)\n');
      console.log('8️⃣  رمز را کپی کرده و در .env.local جایگزین کنید:\n');
      console.log('   EMAIL_PASSWORD=abcdefghijklmnop  (بدون فاصله)\n');
      console.log('9️⃣  دوباره این اسکریپت را اجرا کنید: npx tsx scripts/test-email-connection.ts\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🌐 مشکل احتمالی: مشکل در اتصال به اینترنت یا فایروال\n');
      console.log('✅ راه‌حل:');
      console.log('   1. اتصال اینترنت را چک کنید');
      console.log('   2. VPN را خاموش کنید');
      console.log('   3. فایروال یا آنتی‌ویروس را موقتاً غیرفعال کنید\n');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('⏱️  مشکل احتمالی: Timeout در اتصال\n');
      console.log('✅ راه‌حل:');
      console.log('   1. اینترنت خود را چک کنید');
      console.log('   2. تنظیمات پراکسی را بررسی کنید');
      console.log('   3. پورت 587 باز باشد\n');
    }
    
    return false;
  }
}

testConnection();
