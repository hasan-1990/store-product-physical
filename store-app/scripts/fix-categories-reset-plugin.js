/**
 * 1) تبدیل _id و categoryId از string به ObjectId (بعد از JSON restore)
 * 2) حذف دسته «افزونه» (slug: plugin) و پاک کردن categoryId محصولات
 *
 * Usage: node scripts/fix-categories-reset-plugin.js
 */

require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const { MongoClient, ObjectId } = require('mongodb')

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL
const PLUGIN_SLUG = 'plugin'
const PLUGIN_NAME = 'افزونه'

async function normalizeCategoryIds(db) {
  const categories = await db.collection('categories').find({}).toArray()
  let fixed = 0

  for (const cat of categories) {
    if (typeof cat._id !== 'string' || !ObjectId.isValid(cat._id)) continue

    const oldId = cat._id
    const newId = new ObjectId(oldId)
    const parentId =
      cat.parentId && typeof cat.parentId === 'string' && ObjectId.isValid(cat.parentId)
        ? new ObjectId(cat.parentId)
        : cat.parentId ?? null

    const { _id, ...rest } = cat
    await db.collection('categories').insertOne({
      _id: newId,
      ...rest,
      parentId,
      updatedAt: new Date(),
    })
    await db.collection('categories').deleteOne({ _id: oldId })

    await db.collection('categories').updateMany(
      { parentId: oldId },
      { $set: { parentId: newId } }
    )
    await db.collection('products').updateMany(
      { categoryId: oldId },
      { $set: { categoryId: newId } }
    )
    await db.collection('products').updateMany(
      { categoryId: newId.toString() },
      { $set: { categoryId: newId } }
    )

    fixed++
    console.log(`  ✓ normalized category: ${cat.name} (${oldId})`)
  }

  return fixed
}

async function removePluginCategory(db) {
  const plugin = await db.collection('categories').findOne({
    $or: [{ slug: PLUGIN_SLUG }, { name: PLUGIN_NAME }],
  })

  if (!plugin) {
    console.log('  ℹ دسته افزونه پیدا نشد (شاید قبلاً حذف شده)')
    return
  }

  const pluginId = plugin._id
  const pluginIdStr = pluginId.toString()

  const children = await db.collection('categories').countDocuments({
    $or: [{ parentId: pluginId }, { parentId: pluginIdStr }],
  })

  if (children > 0) {
    console.log(`  ⚠ ${children} زیردسته دارد — ابتدا زیردسته‌ها حذف می‌شوند`)
    await db.collection('categories').deleteMany({
      $or: [{ parentId: pluginId }, { parentId: pluginIdStr }],
    })
  }

  const productsResult = await db.collection('products').updateMany(
    {
      $or: [{ categoryId: pluginId }, { categoryId: pluginIdStr }],
    },
    {
      $unset: { categoryId: '', categoryPath: '' },
      $set: { updatedAt: new Date() },
    }
  )

  console.log(`  ✓ ${productsResult.modifiedCount} محصول از دسته افزونه جدا شد`)

  await db.collection('categories').deleteOne({
    $or: [{ _id: pluginId }, { _id: pluginIdStr }],
  })

  console.log(`  ✓ دسته «${plugin.name}» حذف شد`)
}

async function main() {
  if (!uri) {
    console.error('❌ MONGODB_URI تنظیم نشده')
    process.exit(1)
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 })
  await client.connect()
  const db = client.db('store-app')

  console.log('🔧 مرحله ۱: اصلاح نوع ObjectId در دسته‌بندی‌ها...')
  const fixed = await normalizeCategoryIds(db)
  console.log(`   ${fixed} دسته اصلاح شد\n`)

  console.log('🗑️  مرحله ۲: حذف دسته افزونه و جدا کردن محصولات...')
  await removePluginCategory(db)

  const remaining = await db.collection('categories').find({}).toArray()
  console.log(`\n✅ تمام. دسته‌های باقی‌مانده: ${remaining.length}`)
  for (const c of remaining) {
    console.log(`   - ${c.name} (${c.slug}) level=${c.level}`)
  }

  await client.close()
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
