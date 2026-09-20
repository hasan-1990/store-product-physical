/**
 * اسکریپت انتقال و همگام‌سازی محتوای SEO به Dynamic Content
 * 
 * این اسکریپت:
 * 1. محتواهای SEO از پنل ادمین را میخواند
 * 2. آنها را به dynamicContent collection منتقل میکند
 * 3. مطمئن میشود که تمام فیلدهای SEO در dynamicContent موجود باشند
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ خطا: متغیر DATABASE_URL یا MONGODB_URI تنظیم نشده است');
  process.exit(1);
}

// فیلدهای SEO که باید بررسی شوند
const SEO_FIELDS = [
  'seo_site_name',
  'seo_site_description',
  'seo_keywords',
  'site_title',
  'site_subtitle',
  'hero_title',
  'logo_text',
  'site_name',
  'site_description',
  'seo_title',
  'seo_description',
  'og_title',
  'og_description',
  'footer_about',
  'footer_copyright',
  'contact_email',
  'contact_phone',
  'contact_address'
];

async function syncSEOToDynamicContent() {
  let client;
  
  try {
    console.log('🔄 در حال اتصال به MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    console.log('✅ اتصال برقرار شد');
    
    // دریافت تنظیمات سایت از settings collection
    console.log('\n📊 دریافت تنظیمات سایت از settings...');
    const settings = await db.collection('settings').findOne({ key: 'general' });
    const settingsData = settings?.data || {};
    console.log('تعداد فیلدهای موجود در settings:', Object.keys(settingsData).length);
    
    // دریافت محتوای فعلی dynamicContent
    console.log('\n📊 دریافت محتوای فعلی dynamicContent...');
    const existingContent = await db.collection('dynamicContent').find({}).toArray();
    const existingKeys = new Set(existingContent.map(item => item.key));
    console.log('تعداد آیتم‌های موجود در dynamicContent:', existingContent.length);
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    console.log('\n🔄 شروع همگام‌سازی...\n');
    
    for (const field of SEO_FIELDS) {
      const value = settingsData[field];
      
      if (!value || value === '') {
        console.log(`⏭️  رد شد: ${field} (مقدار خالی)`);
        skippedCount++;
        continue;
      }
      
      if (existingKeys.has(field)) {
        // بروزرسانی اگر مقدار متفاوت است
        const existing = existingContent.find(item => item.key === field);
        if (existing.value !== value) {
          await db.collection('dynamicContent').updateOne(
            { key: field },
            { 
              $set: { 
                value, 
                updatedAt: new Date().toISOString() 
              } 
            }
          );
          console.log(`🔄 بروزرسانی شد: ${field}`);
          console.log(`   قدیمی: "${existing.value.substring(0, 50)}${existing.value.length > 50 ? '...' : ''}"`);
          console.log(`   جدید: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
          updatedCount++;
        } else {
          console.log(`✓  بدون تغییر: ${field}`);
          skippedCount++;
        }
      } else {
        // اضافه کردن آیتم جدید
        await db.collection('dynamicContent').insertOne({
          key: field,
          value,
          category: field.startsWith('seo_') ? 'seo' : 
                    field.startsWith('footer_') ? 'footer' :
                    field.startsWith('contact_') ? 'contact' :
                    field.includes('title') || field.includes('name') ? 'header' : 'general',
          description: `فیلد ${field} از تنظیمات سایت`,
          type: 'text',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`➕ اضافه شد: ${field} = "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
        addedCount++;
      }
    }
    
    // بررسی تمام محتواهای dynamicContent
    console.log('\n📋 لیست کامل محتواهای dynamicContent:');
    console.log('─'.repeat(80));
    const allContent = await db.collection('dynamicContent').find({ isActive: true }).toArray();
    allContent.forEach(item => {
      const valuePreview = typeof item.value === 'string' 
        ? item.value.substring(0, 60) + (item.value.length > 60 ? '...' : '')
        : JSON.stringify(item.value).substring(0, 60);
      console.log(`  ${item.key.padEnd(25)} | ${item.category.padEnd(10)} | ${valuePreview}`);
    });
    
    // خلاصه نتایج
    console.log('\n' + '='.repeat(80));
    console.log('📊 خلاصه نتایج:');
    console.log('─'.repeat(80));
    console.log(`  ✅ اضافه شده:     ${addedCount}`);
    console.log(`  🔄 بروزرسانی شده: ${updatedCount}`);
    console.log(`  ⏭️  رد شده:        ${skippedCount}`);
    console.log(`  📦 مجموع فعلی:     ${allContent.length}`);
    console.log('='.repeat(80));
    
    if (addedCount > 0 || updatedCount > 0) {
      console.log('\n✅ همگام‌سازی با موفقیت انجام شد!');
      console.log('💡 نکته: برای اعمال تغییرات در سایت، Next.js را restart کنید');
    } else {
      console.log('\n✅ همه چیز بروز است، نیازی به تغییر نیست');
    }
    
  } catch (error) {
    console.error('\n❌ خطا در همگام‌سازی:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 اتصال به دیتابیس بسته شد');
    }
  }
}

// اجرای اسکریپت
console.log('🚀 اسکریپت همگام‌سازی SEO به Dynamic Content');
console.log('='.repeat(80));
syncSEOToDynamicContent();
