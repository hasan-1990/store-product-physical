// SMTP Server ساده برای تست محلی (مثل cPanel)
// اجرا: node local-smtp-server.js

const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');

console.log('🚀 راه‌اندازی SMTP Server محلی...\n');

const server = new SMTPServer({
  // اجازه اتصال بدون authentication
  authOptional: true,
  
  // پردازش ایمیل‌های دریافتی
  onData(stream, session, callback) {
    let emailData = '';
    
    stream.on('data', (chunk) => {
      emailData += chunk;
    });
    
    stream.on('end', () => {
      // Parse کردن ایمیل
      simpleParser(emailData).then(parsed => {
        console.log('\n📧 ایمیل جدید دریافت شد:');
        console.log('═══════════════════════════════════════');
        console.log('از:', parsed.from?.text);
        console.log('به:', parsed.to?.text);
        console.log('موضوع:', parsed.subject);
        console.log('───────────────────────────────────────');
        console.log('محتوا:');
        console.log(parsed.text || parsed.html);
        console.log('═══════════════════════════════════════\n');
        
        callback();
      }).catch(err => {
        console.error('❌ خطا در parse ایمیل:', err);
        callback(err);
      });
    });
  },
  
  // لاگ اتصالات
  onConnect(session, callback) {
    console.log('🔌 اتصال جدید از:', session.remoteAddress);
    callback();
  },
  
  onMailFrom(address, session, callback) {
    console.log('📤 فرستنده:', address.address);
    callback();
  },
  
  onRcptTo(address, session, callback) {
    console.log('📥 گیرنده:', address.address);
    callback();
  },
  
  // خطاها
  onError(err) {
    console.error('❌ خطای SMTP Server:', err.message);
  }
});

// راه‌اندازی سرور روی پورت 2525 (برای تست محلی)
const PORT = process.env.SMTP_PORT || 2525;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('✅ SMTP Server در حال اجرا است:');
  console.log(`   Host: ${HOST}`);
  console.log(`   Port: ${PORT}`);
  console.log('\n💡 برای تست، در .env.local تنظیم کنید:');
  console.log('   EMAIL_USE_DIRECT=true');
  console.log('   EMAIL_HOST=localhost');
  console.log('   EMAIL_PORT=25');
  console.log('\n⚠️  برای متوقف کردن سرور: Ctrl+C\n');
});

// مدیریت خطای پورت در استفاده
server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error('\n❌ خطا: نیاز به دسترسی Administrator برای استفاده از پورت 25');
    console.error('💡 راه حل: PowerShell را با دسترسی Administrator اجرا کنید\n');
    console.error('یا پورت دیگری انتخاب کنید (مثلاً 2525):');
    console.error('   در .env.local: EMAIL_PORT=2525');
    console.error('   و این فایل را با PORT=2525 اجرا کنید\n');
  } else if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ خطا: پورت ${PORT} در حال استفاده است`);
    console.error('💡 یک پورت دیگر انتخاب کنید یا سرویس دیگر را متوقف کنید\n');
  } else {
    console.error('\n❌ خطا:', err.message);
  }
  process.exit(1);
});

// مدیریت Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⏹️  متوقف کردن SMTP Server...');
  server.close(() => {
    console.log('✅ سرور با موفقیت متوقف شد\n');
    process.exit(0);
  });
});
