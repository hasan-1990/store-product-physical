import { createMongoJsonBackup } from '../src/lib/mongodb-backup';

async function main() {
  console.log('📦 MongoDB backup (JSON)...\n');
  const result = await createMongoJsonBackup({
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  });
  console.log(`✅ ${result.message}`);
  console.log(`   Path: ${result.backupPath}`);
  console.log(`   Collections: ${result.collections}`);
  console.log(`   Documents: ${result.totalDocuments}`);
}

main().catch((error) => {
  console.error('❌ Backup failed:', error);
  process.exit(1);
});
