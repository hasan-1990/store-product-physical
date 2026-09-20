/**
 * Diagnose admin login issues (no secrets printed)
 * Usage: node scripts/diagnose-admin-login.js [password-to-test]
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'hasanmansouri1990@gmail.com';
const TEST_PASSWORD = process.argv[2] || 'Admin@123';
const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

function buildShardUris(baseUri) {
  const match = baseUri.match(
    /^mongodb:\/\/([^@]+)@([a-z0-9-]+-shard-00-)\d{2}\.([^/]+)\/([^?]+)(\?.*)?$/i
  );

  if (!match) return [{ uri: baseUri, label: 'default' }];

  const [, credentials, shardPrefix, hostSuffix, database, query = ''] = match;
  const params = query || '?ssl=true&authSource=admin&directConnection=true&retryWrites=true&w=majority';

  return ['00', '01', '02'].map((shard) => ({
    label: `shard-00-${shard}`,
    uri: `mongodb://${credentials}@${shardPrefix}${shard}.${hostSuffix}/${database}${params}`,
  }));
}

async function inspectShard(candidate) {
  const client = new MongoClient(candidate.uri, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const hello = await client.db('admin').command({ hello: 1 });
    const db = client.db('store-app');
    const user = await db.collection('users').findOne({
      email: { $regex: /^hasanmansouri1990@gmail\.com$/i },
    });

    let passwordOk = false;
    if (user?.password) {
      passwordOk = await bcrypt.compare(TEST_PASSWORD, user.password);
    }

    return {
      shard: candidate.label,
      isPrimary: !!(hello.isWritablePrimary || hello.ismaster),
      userFound: !!user,
      email: user?.email || null,
      role: user?.role || null,
      isActive: user?.isActive,
      isVerified: user?.isVerified,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length || 0,
      passwordOk,
    };
  } finally {
    await client.close().catch(() => {});
  }
}

async function main() {
  if (!uri) {
    console.error('❌ MONGODB_URI تنظیم نشده');
    process.exit(1);
  }

  console.log('🔍 بررسی لاگین ادمین...\n');
  console.log('URI host:', uri.replace(/mongodb:\/\/([^@]+)@/, 'mongodb://****@').split('/')[2]?.split('?')[0] || 'unknown');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '(not set)');
  console.log('NEXTAUTH_SECRET set:', !!process.env.NEXTAUTH_SECRET);
  console.log('SKIP_DB_CONNECTION:', process.env.SKIP_DB_CONNECTION || 'false');
  console.log('');

  const shards = buildShardUris(uri);
  const results = [];

  for (const candidate of shards) {
    try {
      results.push(await inspectShard(candidate));
    } catch (error) {
      results.push({ shard: candidate.label, error: error.message });
    }
  }

  console.table(results);

  const admins = [];
  const primary = results.find((r) => r.isPrimary && r.userFound);
  const anyFound = results.find((r) => r.userFound);

  if (primary?.passwordOk) {
    console.log('\n✅ روی primary رمز درست است');
  } else if (anyFound?.passwordOk) {
    console.log('\n⚠️ رمز روی secondary درست است ولی primary را چک کنید');
  } else if (anyFound) {
    console.log('\n❌ کاربر پیدا شد ولی رمز تست با دیتابیس مطابقت ندارد');
  } else {
    console.log('\n❌ کاربر ادمین در هیچ shard پیدا نشد');
  }

  const readClient = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await readClient.connect();
  const allAdmins = await readClient
    .db('store-app')
    .collection('users')
    .find({ role: { $in: ['admin', 'ADMIN'] } })
    .project({ email: 1, role: 1, isActive: 1, isVerified: 1 })
    .toArray();
  await readClient.close();

  console.log('\n👤 همه ادمین‌ها:');
  for (const admin of allAdmins) {
    console.log(` - ${admin.email} | role=${admin.role} | active=${admin.isActive} | verified=${admin.isVerified}`);
  }
}

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
