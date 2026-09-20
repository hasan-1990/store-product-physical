import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { cache } from '@/lib/redis';

export async function POST() {
  try {
    const mongodb = await connectDB();

    console.log('🔥 Starting cache warming...');

    let warmedKeys = 0;
    const errors: string[] = [];

    // 1. Warm products cache
    try {
      const products = await mongodb.products
        .find({ active: true })
        .limit(50)
        .toArray();
      
      if (products.length > 0) {
        const cacheKey = 'products:list:1:50:::null:null:null:null:createdAt:desc:null';
        await cache.set(cacheKey, products, 900); // 15 min TTL
        warmedKeys++;
        console.log('✅ Products cache warmed');
      }
    } catch (error) {
      console.error('❌ Error warming products cache:', error);
      errors.push('محصولات');
    }

    // 2. Warm categories cache
    try {
      const categories = await mongodb.categories
        .find({ active: true })
        .limit(50)
        .toArray();
      
      if (categories.length > 0) {
        const cacheKey = 'categories:list:1:50::null:null';
        await cache.set(cacheKey, categories, 1800); // 30 min TTL
        warmedKeys++;
        console.log('✅ Categories cache warmed');
      }
    } catch (error) {
      console.error('❌ Error warming categories cache:', error);
      errors.push('دسته‌بندی‌ها');
    }

    // 3. Warm settings cache
    try {
      const settings = await mongodb.settings.findOne({ type: 'general' });
      if (settings) {
        await cache.set('admin:settings:all', settings, 3600); // 1 hour TTL
        warmedKeys++;
        console.log('✅ Settings cache warmed');
      }
    } catch (error) {
      console.error('❌ Error warming settings cache:', error);
      errors.push('تنظیمات');
    }

    // 4. Warm mega menu cache
    try {
      const megaMenu = await mongodb.settings.findOne({ type: 'megaMenu' });
      if (megaMenu) {
        await cache.set('settings:mega-menu', megaMenu, 3600); // 1 hour TTL
        warmedKeys++;
        console.log('✅ Mega menu cache warmed');
      }
    } catch (error) {
      console.error('❌ Error warming mega menu cache:', error);
      errors.push('منوی مگا');
    }

    // 5. Warm sliders cache
    try {
      const sliders = await mongodb.heroSliders
        .find({ active: true })
        .sort({ order: 1 })
        .toArray();
      
      if (sliders.length > 0) {
        await cache.set('sliders:all', sliders, 1800); // 30 min TTL
        warmedKeys++;
        console.log('✅ Sliders cache warmed');
      }
    } catch (error) {
      console.error('❌ Error warming sliders cache:', error);
      errors.push('اسلایدرها');
    }

    console.log(`🎉 Cache warming completed: ${warmedKeys} keys warmed`);

    return NextResponse.json({
      success: true,
      message: `${warmedKeys} کش گرم شد`,
      warmedKeys,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Cache warming error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در گرم کردن کش'
      },
      { status: 500 }
    );
  }
}
