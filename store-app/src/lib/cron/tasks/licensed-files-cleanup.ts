import type { TaskResult } from './types';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Handle licensed files and temporary downloads cleanup
 * Deletes files older than 5 minutes to prevent disk bloat
 */
export async function handleLicensedFilesCleanup(config: {
  maxAgeMinutes?: number; // Default: 5 minutes
  directories?: string[]; // Additional directories to clean
}): Promise<TaskResult> {
  try {
    const maxAgeMinutes = config.maxAgeMinutes || 5;
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    const cutoffTime = Date.now() - maxAgeMs;

    let totalDeleted = 0;
    let totalFreedSpace = 0;
    const deletionDetails: Record<string, number> = {};

    // Directories to clean
    const directories = [
      path.join(process.cwd(), 'licensed-files'),
      path.join(process.cwd(), 'licensed-files', 'duplicator-locked'),
      ...(config.directories || [])
    ];

    for (const dirPath of directories) {
      if (!existsSync(dirPath)) {
        console.log(`⏭️  Directory not found, skipping: ${dirPath}`);
        continue;
      }

      try {
        const files = await fs.readdir(dirPath);
        let deletedInDir = 0;
        let freedInDir = 0;

        for (const file of files) {
          // Skip .htaccess and index.php protection files
          if (file === '.htaccess' || file === 'index.php' || file === '.gitkeep') {
            continue;
          }

          const filePath = path.join(dirPath, file);
          
          try {
            const stats = await fs.stat(filePath);
            
            // Skip directories
            if (stats.isDirectory()) {
              continue;
            }

            // Check file age
            if (stats.mtimeMs < cutoffTime) {
              const fileSize = stats.size;
              
              // Delete the file
              await fs.unlink(filePath);
              
              deletedInDir++;
              totalDeleted++;
              freedInDir += fileSize;
              totalFreedSpace += fileSize;
              
              console.log(`🗑️  Deleted old file: ${file} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
            }
          } catch (fileError: any) {
            console.error(`❌ Error processing file ${file}:`, fileError.message);
            // Continue with next file
          }
        }

        if (deletedInDir > 0) {
          const dirName = path.basename(dirPath);
          deletionDetails[dirName] = deletedInDir;
          console.log(`✅ Cleaned ${deletedInDir} files from ${dirName} (${(freedInDir / 1024 / 1024).toFixed(2)} MB)`);
        }
      } catch (dirError: any) {
        console.error(`❌ Error reading directory ${dirPath}:`, dirError.message);
        // Continue with next directory
      }
    }

    const freedSpaceMB = (totalFreedSpace / (1024 * 1024)).toFixed(2);

    if (totalDeleted === 0) {
      return {
        success: true,
        message: `هیچ فایل قدیمی‌تر از ${maxAgeMinutes} دقیقه یافت نشد`,
        details: {
          deletedFiles: 0,
          freedSpace: '0 MB',
          maxAgeMinutes,
          directories: directories.map(d => path.basename(d))
        }
      };
    }

    return {
      success: true,
      message: `${totalDeleted} فایل موقت حذف شد، ${freedSpaceMB} مگابایت فضا آزاد شد`,
      details: {
        deletedFiles: totalDeleted,
        freedSpace: `${freedSpaceMB} MB`,
        maxAgeMinutes,
        perDirectory: deletionDetails,
        directories: directories.map(d => path.basename(d))
      }
    };
  } catch (error: any) {
    console.error('Licensed files cleanup task error:', error);
    return {
      success: false,
      message: `خطا در پاکسازی فایل‌های موقت: ${error.message}`,
      details: { 
        error: error.message,
        stack: error.stack
      }
    };
  }
}
