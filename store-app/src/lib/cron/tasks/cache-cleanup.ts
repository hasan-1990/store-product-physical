import type { TaskResult } from './types';
import fs from 'fs/promises';
import path from 'path';

/**
 * Handle cache and temp file cleanup
 */
export async function handleCacheCleanup(config: any): Promise<TaskResult> {
  try {
    let deletedFiles = 0;
    let freedSpace = 0;

    // Clean Next.js cache
    const cacheDir = path.join(process.cwd(), '.next', 'cache');
    try {
      const stats = await fs.stat(cacheDir);
      if (stats.isDirectory()) {
        await fs.rm(cacheDir, { recursive: true, force: true });
        console.log('🧹 Cleared Next.js cache');
        deletedFiles++;
      }
    } catch (err) {
      // Directory doesn't exist or can't be accessed
    }

    // Clean temp uploads
    const tempDir = path.join(process.cwd(), 'tmp');
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        // Delete files older than 24 hours
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (stats.mtimeMs < oneDayAgo) {
          freedSpace += stats.size;
          await fs.unlink(filePath);
          deletedFiles++;
        }
      }
      console.log(`🧹 Cleaned ${deletedFiles} temp files`);
    } catch (err) {
      // Directory doesn't exist
    }

    // Clean old logs
    const logsDir = path.join(process.cwd(), 'logs');
    try {
      const files = await fs.readdir(logsDir);
      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);
        
        // Delete logs older than 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (stats.mtimeMs < sevenDaysAgo) {
          freedSpace += stats.size;
          await fs.unlink(filePath);
          deletedFiles++;
        }
      }
    } catch (err) {
      // Directory doesn't exist
    }

    const freedSpaceMB = (freedSpace / (1024 * 1024)).toFixed(2);

    return {
      success: true,
      message: `${deletedFiles} فایل پاک شد، ${freedSpaceMB} مگابایت فضا آزاد شد`,
      details: {
        deletedFiles,
        freedSpace: `${freedSpaceMB} MB`
      }
    };
  } catch (error: any) {
    console.error('Cache cleanup task error:', error);
    return {
      success: false,
      message: `خطا در پاکسازی کش: ${error.message}`,
      details: { error: error.message }
    };
  }
}
