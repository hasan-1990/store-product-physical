import type { TaskResult } from './types';
import { createMongoJsonBackup } from '@/lib/mongodb-backup';

/**
 * بک‌آپ روزانه MongoDB — JSON per collection (Docker-friendly)
 */
export async function handleDatabaseBackup(config: {
  retentionDays?: number;
  backupDir?: string;
}): Promise<TaskResult> {
  try {
    const retentionDays = config.retentionDays || 30;

    const result = await createMongoJsonBackup({
      retentionDays,
      backupDir: config.backupDir,
    });

    return {
      success: true,
      message: result.message,
      details: {
        backupPath: result.backupPath,
        collections: result.collections,
        totalDocuments: result.totalDocuments,
        totalSizeBytes: result.totalSizeBytes,
        retentionDays,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای نامشخص';
    console.error('Database backup task error:', error);
    return {
      success: false,
      message: `خطا در ایجاد بک‌آپ: ${message}`,
      details: { error: message },
    };
  }
}
