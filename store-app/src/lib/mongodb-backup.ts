/**
 * MongoDB JSON backup — cross-platform (بدون نیاز به mongodump)
 */
import fs from 'fs/promises';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

export type BackupResult = {
  success: boolean;
  backupPath: string;
  collections: number;
  totalDocuments: number;
  totalSizeBytes: number;
  message: string;
};

export type BackupOptions = {
  mongoUri?: string;
  dbName?: string;
  backupDir?: string;
  retentionDays?: number;
};

function replacer(_key: string, value: unknown) {
  if (value instanceof ObjectId) {
    return { $oid: value.toString() };
  }
  if (value instanceof Date) {
    return { $date: value.toISOString() };
  }
  return value;
}

export function resolveBackupDir(customDir?: string): string {
  return customDir || path.join(process.cwd(), 'database-backup');
}

export async function createMongoJsonBackup(options: BackupOptions = {}): Promise<BackupResult> {
  const mongoUri = options.mongoUri || process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!mongoUri) {
    throw new Error('MONGODB_URI یا DATABASE_URL تنظیم نشده است');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupRoot = resolveBackupDir(options.backupDir);
  const backupPath = path.join(backupRoot, `backup-${timestamp}`);

  await fs.mkdir(backupPath, { recursive: true });

  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 30000 });

  try {
    await client.connect();
    const db = client.db(options.dbName);
    const collectionInfos = await db.listCollections().toArray();

    let totalDocuments = 0;
    let totalSizeBytes = 0;

    for (const info of collectionInfos) {
      const name = info.name;
      const documents = await db.collection(name).find({}).toArray();
      const json = JSON.stringify(documents, replacer, 2);
      await fs.writeFile(path.join(backupPath, `${name}.json`), json, 'utf8');
      totalDocuments += documents.length;
      totalSizeBytes += Buffer.byteLength(json, 'utf8');
    }

    const metadata = {
      database: db.databaseName,
      timestamp: new Date().toISOString(),
      collections: collectionInfos.length,
      totalDocuments,
      totalSizeBytes,
      format: 'json-per-collection',
      backupPath,
    };

    await fs.writeFile(
      path.join(backupPath, 'backup-metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );

    const deleted = await pruneOldBackups(backupRoot, options.retentionDays ?? 30);

    return {
      success: true,
      backupPath,
      collections: collectionInfos.length,
      totalDocuments,
      totalSizeBytes,
      message: `بک‌آپ OK — ${collectionInfos.length} collection، ${deleted} بک‌آپ قدیمی حذف شد`,
    };
  } finally {
    await client.close();
  }
}

export async function pruneOldBackups(backupDir: string, retentionDays: number): Promise<number> {
  const entries = await fs.readdir(backupDir, { withFileTypes: true });
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let deleted = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('backup-')) continue;
    const dirPath = path.join(backupDir, entry.name);
    const stat = await fs.stat(dirPath);
    if (stat.mtimeMs < cutoff) {
      await fs.rm(dirPath, { recursive: true, force: true });
      deleted++;
    }
  }

  return deleted;
}

export async function getLatestBackupInfo(backupDir?: string): Promise<{
  found: boolean;
  path?: string;
  ageHours?: number;
  collections?: number;
}> {
  const root = resolveBackupDir(backupDir);
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('backup-'))
      .map((e) => path.join(root, e.name));

    if (dirs.length === 0) return { found: false };

    let latest = dirs[0];
    let latestMtime = 0;
    for (const dir of dirs) {
      const stat = await fs.stat(dir);
      if (stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latest = dir;
      }
    }

    let collections: number | undefined;
    try {
      const metaRaw = await fs.readFile(path.join(latest, 'backup-metadata.json'), 'utf8');
      collections = JSON.parse(metaRaw).collections;
    } catch {
      const files = await fs.readdir(latest);
      collections = files.filter((f) => f.endsWith('.json') && f !== 'backup-metadata.json').length;
    }

    const ageHours = Math.round((Date.now() - latestMtime) / (1000 * 60 * 60) * 10) / 10;
    return { found: true, path: latest, ageHours, collections };
  } catch {
    return { found: false };
  }
}
