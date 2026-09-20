import { MongoClient, type Db } from 'mongodb';
import { coreConfig } from './config';

function parseDatabaseName(uri: string, fallback = 'store-app'): string {
  const withoutQuery = uri.split('?')[0] || uri;
  const segments = withoutQuery.split('/');
  const name = segments[segments.length - 1];
  return name && !name.includes(':') ? name : fallback;
}

let hubClient: MongoClient | null = null;
let hubDb: Db | null = null;
const tenantPools = new Map<string, Db>();

export async function connectHubDb(): Promise<Db> {
  if (hubDb) return hubDb;

  hubClient = new MongoClient(coreConfig.mongoUri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
  });
  await hubClient.connect();
  hubDb = hubClient.db(parseDatabaseName(coreConfig.mongoUri));
  return hubDb;
}

export async function getTenantDb(databaseName: string): Promise<Db> {
  const cached = tenantPools.get(databaseName);
  if (cached) return cached;

  const client = hubClient ?? new MongoClient(coreConfig.mongoUri, { maxPoolSize: 10 });
  if (!hubClient) {
    await client.connect();
    hubClient = client;
  }

  const db = client.db(databaseName);
  tenantPools.set(databaseName, db);
  return db;
}

export async function pingMongo(): Promise<boolean> {
  const db = await connectHubDb();
  await db.command({ ping: 1 });
  return true;
}

export async function closeMongoConnections(): Promise<void> {
  tenantPools.clear();
  hubDb = null;
  if (hubClient) {
    await hubClient.close();
    hubClient = null;
  }
}
