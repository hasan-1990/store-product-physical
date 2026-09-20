/**
 * Reset admin password in MongoDB
 * Usage: node scripts/reset-admin-password.js [newPassword]
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const ADMIN_EMAIL = 'hasanmansouri1990@gmail.com'
const NEW_PASSWORD = process.argv[2] || 'Admin@123'
const uri = process.env.MONGODB_URI || process.env.DATABASE_URL

function buildShardUris(baseUri) {
  const match = baseUri.match(
    /^mongodb:\/\/([^@]+)@([a-z0-9-]+-shard-00-)\d{2}\.([^/]+)\/([^?]+)(\?.*)?$/i
  )

  if (!match) return [baseUri]

  const [, credentials, shardPrefix, hostSuffix, database, query = ''] = match
  const params = query || '?ssl=true&authSource=admin&directConnection=true&retryWrites=true&w=majority'

  return ['00', '01', '02'].map(
    (shard) =>
      `mongodb://${credentials}@${shardPrefix}${shard}.${hostSuffix}/${database}${params}`
  )
}

async function connectWritableClient(baseUri) {
  const candidates = buildShardUris(baseUri)
  let lastError = null

  for (const candidate of candidates) {
    const client = new MongoClient(candidate, { serverSelectionTimeoutMS: 15000 })
    try {
      await client.connect()
      const hello = await client.db('admin').command({ hello: 1 })
      if (hello.isWritablePrimary || hello.ismaster) {
        return client
      }
      await client.close()
    } catch (error) {
      lastError = error
      await client.close().catch(() => {})
    }
  }

  throw lastError || new Error('هیچ primary برای MongoDB پیدا نشد')
}

async function main() {
  if (!uri) {
    console.error('❌ MONGODB_URI در .env.local تنظیم نشده')
    process.exit(1)
  }

  const client = await connectWritableClient(uri)

  const db = client.db('store-app')
  const hashed = await bcrypt.hash(NEW_PASSWORD, 10)

  const result = await db.collection('users').updateOne(
    { email: { $regex: /^hasanmansouri1990@gmail\.com$/i } },
    {
      $set: {
        email: ADMIN_EMAIL,
        password: hashed,
        role: 'admin',
        isActive: true,
        isVerified: true,
        updatedAt: new Date(),
      },
    }
  )

  if (result.matchedCount === 0) {
    console.error(`❌ کاربر ادمین با ایمیل ${ADMIN_EMAIL} پیدا نشد`)
    process.exit(1)
  }

  console.log('✅ رمز ادمین با موفقیت تغییر کرد')
  console.log('📧 ایمیل:', ADMIN_EMAIL)
  console.log('🔑 رمز جدید:', NEW_PASSWORD)
  console.log('🌐 ورود:', 'http://localhost:3000/admin/login')

  await client.close()
}

main().catch((error) => {
  console.error('❌ خطا:', error.message)
  process.exit(1)
})
