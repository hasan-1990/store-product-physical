/**
 * اسکریپت Seed برای ایجاد محتوای داینامیک اولیه
 * این اسکریپت محتواهای اولیه سایت را در دیتابیس ایجاد می‌کند
 */

const { MongoClient } = require('mongodb');

const defaultContents = [
  // SEO Content
  {
    key: 'site_name',
    value: 'فروشگاه آنلاین فاتم',
    category: 'seo',
    description: 'نام سایت برای SEO و متاتگ‌ها',
    type: 'text',
    isActive: true
  },
  {
    key: 'site_title',
    value: 'فروشگاه آنلاین فاتم - خرید محصولات با کیفیت',
    category: 'seo',
    description: 'عنوان اصلی سایت',
    type: 'text',
    isActive: true
  },
  {
    key: 'site_description',
    value: 'خرید آنلاین محصولات با بهترین کیفیت و قیمت مناسب',
    category: 'seo',
    description: 'توضیحات سایت',
    type: 'textarea',
    isActive: true
  },
  {
    key: 'seo_description',
    value: 'فروشگاه آنلاین فاتم - خرید محصولات اصل و با کیفیت با بهترین قیمت. ارسال سریع به سراسر کشور.',
    category: 'seo',
    description: 'توضیحات SEO برای موتورهای جستجو',
    type: 'textarea',
    isActive: true
  },
  {
    key: 'seo_keywords',
    value: 'فروشگاه آنلاین, خرید اینترنتی, محصولات با کیفیت, ارسال سریع',
    category: 'seo',
    description: 'کلمات کلیدی SEO',
    type: 'text',
    isActive: true
  },
  {
    key: 'og_title',
    value: 'فروشگاه آنلاین فاتم',
    category: 'seo',
    description: 'عنوان Open Graph برای شبکه‌های اجتماعی',
    type: 'text',
    isActive: true
  },
  {
    key: 'og_description',
    value: 'بهترین فروشگاه آنلاین برای خرید محصولات با کیفیت',
    category: 'seo',
    description: 'توضیحات Open Graph',
    type: 'textarea',
    isActive: true
  },

  // Header Content
  {
    key: 'header_logo_text',
    value: 'فاتم',
    category: 'header',
    description: 'متن لوگو در هدر',
    type: 'text',
    isActive: true
  },
  {
    key: 'header_slogan',
    value: 'خرید آسان، کیفیت عالی',
    category: 'header',
    description: 'شعار سایت در هدر',
    type: 'text',
    isActive: true
  },

  // Footer Content
  {
    key: 'footer_about',
    value: 'فروشگاه آنلاین فاتم با بیش از 10 سال تجربه، ارائه‌دهنده بهترین محصولات با کیفیت و قیمت مناسب است. ما متعهد به رضایت مشتریان خود هستیم.',
    category: 'footer',
    description: 'متن درباره ما در فوتر',
    type: 'textarea',
    isActive: true
  },
  {
    key: 'footer_copyright',
    value: '© 2024 فروشگاه آنلاین. تمامی حقوق محفوظ است.',
    category: 'footer',
    description: 'متن کپی‌رایت',
    type: 'text',
    isActive: true
  },
  {
    key: 'contact_email',
    value: 'info@example.com',
    category: 'footer',
    description: 'ایمیل تماس',
    type: 'text',
    isActive: true
  },
  {
    key: 'contact_phone',
    value: '021-12345678',
    category: 'footer',
    description: 'شماره تماس',
    type: 'text',
    isActive: true
  },
  {
    key: 'contact_address',
    value: 'تهران، میدان ونک، خیابان ملاصدرا',
    category: 'footer',
    description: 'آدرس',
    type: 'text',
    isActive: true
  },

  // Homepage Content
  {
    key: 'hero_title',
    value: 'خوش آمدید به فروشگاه آنلاین',
    category: 'homepage',
    description: 'عنوان اصلی صفحه اول',
    type: 'text',
    isActive: true
  },
  {
    key: 'hero_subtitle',
    value: 'بهترین محصولات با بهترین قیمت',
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
  },

  // Product Page Content
  {
    key: 'product_add_to_cart',
    value: 'افزودن به سبد خرید',
    category: 'product',
    description: 'متن دکمه افزودن به سبد',
    type: 'text',
    isActive: true
  },
  {
    key: 'product_buy_now',
    value: 'خرید فوری',
    category: 'product',
    description: 'متن دکمه خرید فوری',
    type: 'text',
    isActive: true
  },
  {
    key: 'product_out_of_stock',
    value: 'ناموجود',
    category: 'product',
    description: 'متن ناموجود بودن',
    type: 'text',
    isActive: true
  }
];

async function seed() {
  let client;
  
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app';
    
    console.log('🔌 اتصال به MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('store-app');
    const collection = db.collection('dynamic_content');
    
    console.log('🗑️  پاک کردن محتوای قبلی...');
    await collection.deleteMany({});
    
    console.log('📝 ایجاد محتوای اولیه...');
    const contents = defaultContents.map(item => ({
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    const result = await collection.insertMany(contents);
    
    console.log(`✅ ${result.insertedCount} محتوا با موفقیت ایجاد شد!`);
    
    // نمایش آمار
    const stats = await collection.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    console.log('\n📊 آمار محتواها:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} عدد`);
    });
    
    console.log('\n🎉 Seed کامل شد!');
    
  } catch (error) {
    console.error('❌ خطا در seed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 اتصال به دیتابیس بسته شد');
    }
  }
}

// اجرای اسکریپت
if (require.main === module) {
  seed();
}

module.exports = { seed, defaultContents };
