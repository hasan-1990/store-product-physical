import { connectDB } from '@/lib/mongodb';
import SEOFallbackManager from './seo-fallback-manager';
import fs from 'fs/promises';
import path from 'path';

/**
 * سیستم پشتیبان‌گیری خودکار از تنظیمات SEO
 * استفاده از MCP Filesystem برای ذخیره و مدیریت فایل‌های پشتیبان
 */
export class SEOBackupManager {
  private static BACKUP_DIR = path.join(process.cwd(), 'data', 'backup', 'seo');
  private static MAX_BACKUPS = 30; // حداکثر ۳۰ فایل پشتیبان

  /**
   * ایجاد پشتیبان از تنظیمات SEO
   */
  static async createBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const db = await connectDB();

      // دریافت تمام داده‌های SEO
      const globalSettings = await db.seoglobalsettings.findOne({});
      const pages = await db.seopages.find({}).toArray();

      // ایجاد timestamp برای نام فایل
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `seo-backup-${timestamp}.json`;

      // ایجاد دایرکتوری پشتیبان اگر وجود نداشت
      await fs.mkdir(this.BACKUP_DIR, { recursive: true });

      const filePath = path.join(this.BACKUP_DIR, fileName);

      // ساخت داده پشتیبان
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        globalSettings,
        pages,
        metadata: {
          totalPages: pages.length,
          activePages: pages.filter(p => p.isActive).length,
          inactivePages: pages.filter(p => !p.isActive).length
        }
      };

      // نوشتن به فایل
      await fs.writeFile(
        filePath,
        JSON.stringify(backupData, null, 2),
        'utf-8'
      );

      console.log(`✅ پشتیبان SEO ایجاد شد: ${fileName}`);

      // پاکسازی پشتیبان‌های قدیمی
      await this.cleanupOldBackups();

      // همگام‌سازی با fallback
      await SEOFallbackManager.syncFromDatabase(pages as any);

      return { success: true, filePath };
    } catch (error) {
      console.error('❌ خطا در ایجاد پشتیبان SEO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطای ناشناخته'
      };
    }
  }

  /**
   * بازیابی از پشتیبان
   */
  static async restoreBackup(fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const filePath = path.join(this.BACKUP_DIR, fileName);

      // خواندن فایل پشتیبان
      const backupContent = await fs.readFile(filePath, 'utf-8');
      const backupData = JSON.parse(backupContent);

      const db = await connectDB();

      // بازگردانی تنظیمات عمومی
      if (backupData.globalSettings) {
        await db.seoglobalsettings.deleteMany({});
        await db.seoglobalsettings.insertOne(backupData.globalSettings);
      }

      // بازگردانی صفحات
      if (backupData.pages && Array.isArray(backupData.pages)) {
        await db.seopages.deleteMany({});
        if (backupData.pages.length > 0) {
          await db.seopages.insertMany(backupData.pages);
        }
      }

      console.log(`✅ پشتیبان SEO بازگردانی شد: ${fileName}`);

      return { success: true };
    } catch (error) {
      console.error('❌ خطا در بازگردانی پشتیبان SEO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطای ناشناخته'
      };
    }
  }

  /**
   * لیست تمام پشتیبان‌ها
   */
  static async listBackups(): Promise<{
    name: string;
    size: number;
    created: string;
    metadata?: any;
  }[]> {
    try {
      await fs.mkdir(this.BACKUP_DIR, { recursive: true });
      const files = await fs.readdir(this.BACKUP_DIR);

      const backups = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.BACKUP_DIR, file);
          const stats = await fs.stat(filePath);

          // خواندن metadata از فایل
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);

            backups.push({
              name: file,
              size: stats.size,
              created: stats.birthtime.toISOString(),
              metadata: data.metadata
            });
          } catch {
            backups.push({
              name: file,
              size: stats.size,
              created: stats.birthtime.toISOString()
            });
          }
        }
      }

      // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
      backups.sort((a, b) => 
        new Date(b.created).getTime() - new Date(a.created).getTime()
      );

      return backups;
    } catch (error) {
      console.error('❌ خطا در لیست کردن پشتیبان‌ها:', error);
      return [];
    }
  }

  /**
   * حذف پشتیبان‌های قدیمی
   */
  static async cleanupOldBackups(): Promise<number> {
    try {
      const backups = await this.listBackups();

      if (backups.length <= this.MAX_BACKUPS) {
        return 0;
      }

      // حذف قدیمی‌ترین فایل‌ها
      const toDelete = backups.slice(this.MAX_BACKUPS);
      let deleted = 0;

      for (const backup of toDelete) {
        const filePath = path.join(this.BACKUP_DIR, backup.name);
        await fs.unlink(filePath);
        deleted++;
      }

      console.log(`🧹 ${deleted} پشتیبان قدیمی حذف شد`);
      return deleted;
    } catch (error) {
      console.error('❌ خطا در پاکسازی پشتیبان‌ها:', error);
      return 0;
    }
  }

  /**
   * حذف یک پشتیبان خاص
   */
  static async deleteBackup(fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(this.BACKUP_DIR, fileName);
      await fs.unlink(filePath);
      console.log(`🗑️ پشتیبان حذف شد: ${fileName}`);
      return true;
    } catch (error) {
      console.error('❌ خطا در حذف پشتیبان:', error);
      return false;
    }
  }

  /**
   * پشتیبان‌گیری خودکار (برای اجرا در Cron Job)
   */
  static async autoBackup(): Promise<void> {
    console.log('🔄 شروع پشتیبان‌گیری خودکار SEO...');
    const result = await this.createBackup();

    if (result.success) {
      console.log('✅ پشتیبان‌گیری خودکار موفق:', result.filePath);
    } else {
      console.error('❌ پشتیبان‌گیری خودکار ناموفق:', result.error);
    }
  }

  /**
   * دریافت اطلاعات آخرین پشتیبان
   */
  static async getLatestBackup(): Promise<{
    name: string;
    size: number;
    created: string;
    metadata?: any;
  } | null> {
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * مقایسه دو پشتیبان
   */
  static async compareBackups(
    file1: string,
    file2: string
  ): Promise<{
    globalSettingsChanged: boolean;
    pagesAdded: number;
    pagesRemoved: number;
    pagesModified: number;
  }> {
    try {
      const path1 = path.join(this.BACKUP_DIR, file1);
      const path2 = path.join(this.BACKUP_DIR, file2);

      const data1 = JSON.parse(await fs.readFile(path1, 'utf-8'));
      const data2 = JSON.parse(await fs.readFile(path2, 'utf-8'));

      // مقایسه تنظیمات عمومی
      const globalSettingsChanged = 
        JSON.stringify(data1.globalSettings) !== JSON.stringify(data2.globalSettings);

      // مقایسه صفحات
      const urls1 = new Set(data1.pages.map((p: any) => p.url));
      const urls2 = new Set(data2.pages.map((p: any) => p.url));

      const pagesAdded = [...urls2].filter(url => !urls1.has(url)).length;
      const pagesRemoved = [...urls1].filter(url => !urls2.has(url)).length;

      // صفحات تغییر یافته
      let pagesModified = 0;
      for (const page1 of data1.pages) {
        const page2 = data2.pages.find((p: any) => p.url === page1.url);
        if (page2 && JSON.stringify(page1) !== JSON.stringify(page2)) {
          pagesModified++;
        }
      }

      return {
        globalSettingsChanged,
        pagesAdded,
        pagesRemoved,
        pagesModified
      };
    } catch (error) {
      console.error('❌ خطا در مقایسه پشتیبان‌ها:', error);
      return {
        globalSettingsChanged: false,
        pagesAdded: 0,
        pagesRemoved: 0,
        pagesModified: 0
      };
    }
  }
}

export default SEOBackupManager;
