// Seed script for dynamic content
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app';

const initialContent = [
  // Header Content
  {
    key: 'site_title',
    value: 'فروشگاه آنلاین',
    category: 'header',
    description: 'عنوان اصلی سایت',
    type: 'text',
    isActive: true
  },
  {
    key: 'site_subtitle',
    value: 'بهترین محصولات با بهترین قیمت',
    category: 'header',
    description: 'زیرعنوان سایت',
    type: 'text',
    isActive: true
  },
  {
    key: 'logo_text',
    value: 'فروشگاه',
    category: 'header',
    description: 'متن لوگو',
    type: 'text',
    isActive: true
  },
  
  // Footer Content
  {
    key: 'footer_about_text',
    value: 'ما بهترین محصولات را با بهترین قیمت و کیفیت برای شما فراهم می‌کنیم.',
    category: 'footer',
    description: 'متن درباره ما در فوتر',
    type: 'textarea',
    isActive: true
  },
  {
    key: 'footer_copyright',
    value: '© 2025 تمامی حقوق محفوظ است',
    category: 'footer',
    description: 'متن کپی رایت',
    type: 'text',
    isActive: true
  },
  {
    key: 'footer_contact_email',
    value: 'info@example.com',
    category: 'footer',
    description: 'ایمیل تماس',
    type: 'text',
    isActive: true
  },
  {
    key: 'footer_contact_phone',
    value: '021-12345678',
    category: 'footer',
    description: 'شماره تماس',
    type: 'text',
    isActive: true
  },
  
  // SEO Content
  {
    key: 'seo_site_name',
    value: 'فروشگاه آنلاین',
    category: 'seo',
    description: 'نام سایت برای SEO',
    type: 'text',
    isActive: true
  },
  {
    key: 'seo_site_description',
    value: 'خرید آنلاین محصولات با بهترین قیمت و کیفیت',
    category: 'seo',
    description: 'توضیحات سایت برای SEO',
    type: 'textarea',
    isActive: true
  },
  {
    key: 'seo_keywords',
    value: 'فروشگاه آنلاین, خرید اینترنتی, محصولات',
    category: 'seo',
    description: 'کلمات کلیدی',
    type: 'text',
    isActive: true
  },
  
  // Homepage Content
  {
    key: 'hero_title',
    value: 'خوش آمدید به فروشگاه ما',
    category: 'homepage',
    description: 'عنوان اصلی صفحه اول',
    type: 'text',
    isActive: true
  },
  {
    key: 'hero_subtitle',
    value: 'بهترین محصولات را با ما تجربه کنید',
    category: 'homepage',
    description: 'زیرعنوان صفحه اول',
    type: 'text',
    isActive: true
  },
  {
    key: 'hero_button_text',
    value: 'مشاهده محصولات',
    category: 'homepage',
    description: 'متن دکمه اصلی',
    type: 'text',
    isActive: true
  }
];

async function seedDynamicContent() {
  console.log('🌱 Starting dynamic content seeding...');
  console.log('📡 Connecting to MongoDB:', uri);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('store-app');
    const collection = db.collection('dynamic_content');
    
    // پاک کردن داده‌های قبلی (اختیاری)
    // await collection.deleteMany({});
    // console.log('🗑️  Cleared existing content');
    
    // بررسی وجود داده
    const existingCount = await collection.countDocuments();
    console.log(`📊 Existing documents: ${existingCount}`);
    
    if (existingCount === 0) {
      // اضافه کردن timestamp
      const contentWithTimestamp = initialContent.map(item => ({
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const result = await collection.insertMany(contentWithTimestamp);
      console.log(`✅ Inserted ${result.insertedCount} documents`);
      
      // نمایش داده‌های ایجاد شده
      const allContent = await collection.find({}).toArray();
      console.log('\n📋 Created content:');
      allContent.forEach(item => {
        console.log(`   - ${item.key} (${item.category}): ${item.value.substring(0, 50)}...`);
      });
    } else {
      console.log('ℹ️  Content already exists, skipping seed');
      
      // نمایش محتوای موجود
      const allContent = await collection.find({}).toArray();
      console.log('\n📋 Existing content:');
      allContent.forEach(item => {
        console.log(`   - ${item.key} (${item.category}): ${item.value.substring(0, 50)}...`);
      });
    }
    
    console.log('\n✅ Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding dynamic content:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

seedDynamicContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
