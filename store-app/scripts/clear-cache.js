// اسکریپت برای clear کردن cache
const redis = require('redis');
require('dotenv').config({ path: '.env.local' });

async function clearCache() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  try {
    console.log('🔗 Connecting to Redis...');
    await client.connect();
    console.log('✅ Connected to Redis');
    
    // Clear all keys that start with 'products'
    const keys = await client.keys('products*');
    console.log(`📊 Found ${keys.length} cache keys to clear`);
    
    if (keys.length > 0) {
      await client.del(keys);
      console.log('🗑️ Cleared all product cache keys');
    }
    
    // Clear all keys that start with 'discount-sections'
    const sectionKeys = await client.keys('discount-sections*');
    console.log(`📊 Found ${sectionKeys.length} section cache keys to clear`);
    
    if (sectionKeys.length > 0) {
      await client.del(sectionKeys);
      console.log('🗑️ Cleared all section cache keys');
    }
    
    console.log('🎉 Cache cleared successfully!');
    
  } catch (error) {
    console.log('⚠️ Redis not available, skipping cache clear:', error.message);
  } finally {
    try {
      await client.quit();
      console.log('🔐 Redis connection closed');
    } catch (error) {
      // Redis might not be connected
    }
  }
}

// اجرای اسکریپت
clearCache().catch(console.error);