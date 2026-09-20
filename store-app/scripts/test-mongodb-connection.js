/**
 * Test MongoDB Atlas connection using .env.local
 * Usage: node scripts/test-mongodb-connection.js
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL

if (!uri) {
  console.error('❌ MONGODB_URI یا DATABASE_URL در .env.local تنظیم نشده')
  process.exit(1)
}

if (uri.includes('<db_password>')) {
  console.error('❌ هنوز <db_password> را با رمز واقعی Atlas عوض نکرده‌اید!')
  console.error('   فایل: .env.local')
  console.error('   Atlas → Database Access → رمز کاربر دیتابیس')
  process.exit(1)
}

const masked = uri.replace(/:([^@/]+)@/, ':****@')
console.log('🔌 در حال اتصال به:', masked)

async function test() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 })
  try {
    await client.connect()
    const db = client.db('store-app')
    const collections = await db.listCollections().toArray()
    console.log('✅ اتصال موفق!')
    console.log(`📦 دیتابیس store-app — ${collections.length} collection`)
    process.exit(0)
  } catch (error) {
    console.error('❌ اتصال ناموفق:', error.message)
    if (error.message.includes('authentication')) {
      console.error('   → رمز یا نام کاربر اشتباه است')
    }
    if (error.message.includes('timed out') || error.message.includes('ENOTFOUND')) {
      console.error('   → IP شما در Atlas → Network Access اضافه نشده')
    }
    process.exit(1)
  } finally {
    await client.close().catch(() => {})
  }
}

test()
