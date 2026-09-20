import { MongoClient } from 'mongodb';
import { provisioningConfig } from './config';
import { slugToDatabaseName } from './domain-utils';
import { seedTenantDatabase } from './seed-tenant';

async function ensureTenantIndexes(db: ReturnType<MongoClient['db']>): Promise<void> {
  await db.collection('products').createIndex({ slug: 1 }, { unique: true });
  await db.collection('products').createIndex({ categorySlug: 1, active: 1 });
  await db.collection('orders').createIndex({ createdAt: -1 });
  await db.collection('orders').createIndex({ status: 1 });
  await db.collection('promo_codes').createIndex({ code: 1 }, { unique: true });
  await db.collection('admin_users').createIndex({ email: 1 }, { unique: true });
}

export async function createInstanceDatabase(
  slug: string,
  templateFolder: string,
): Promise<string> {
  const dbName = slugToDatabaseName(slug);
  const uri = provisioningConfig.mongoUri;

  if (!uri) {
    throw new Error('MONGODB_URI تنظیم نشده است');
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    await ensureTenantIndexes(db);
    await seedTenantDatabase(slug, templateFolder);

    return dbName;
  } finally {
    await client.close();
  }
}
