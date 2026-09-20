/**
 * Seed cron job پیش‌فرض بک‌آپ روزانه + تنظیمات scale
 */
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!uri) {
  console.error('❌ MONGODB_URI تنظیم نشده');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const existing = await db.collection('cronJobs').findOne({
    taskType: 'database_backup',
    enabled: true,
  });

  if (!existing) {
    const now = new Date().toISOString();
    await db.collection('cronJobs').insertOne({
      name: 'بک‌آپ روزانه MongoDB',
      description: 'بک‌آپ JSON خودکار — Q4 Scale',
      taskType: 'database_backup',
      schedule: '0 2 * * *',
      enabled: true,
      status: 'active',
      priority: 'high',
      config: { retentionDays: 30 },
      runCount: 0,
      successCount: 0,
      failCount: 0,
      logs: [],
      maxLogs: 100,
      createdBy: 'scale-seed',
      createdAt: now,
      updatedAt: now,
    });
    console.log('✅ cron job database_backup ایجاد شد (02:00 روزانه)');
  } else {
    console.log('ℹ️ cron job database_backup از قبل وجود دارد');
  }

  await client.close();
  console.log('✅ scale defaults seed کامل شد');
}

main().catch((error) => {
  console.error('❌', error);
  process.exit(1);
});
