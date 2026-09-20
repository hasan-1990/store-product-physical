import crypto from 'crypto';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

/**
 * کلاس قفل‌گذاری بکاپ Duplicator
 * این کلاس به صورت کامل با TypeScript نوشته شده و نیازی به PHP ندارد
 */

interface LockResult {
  success: boolean;
  message: string;
  lockedFile?: string;
  lockedFilename?: string;
  domainHash?: string;
  filesize?: number;
  cached?: boolean;
  errorCode?: string;
}

export class DuplicatorBackupLocker {
  private static DOMAIN_SALT = process.env.DOMAIN_LOCK_SALT || 'YOUR_SECRET_SALT_12345';
  private static CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 روز

  /**
   * هش کردن دامنه با SHA-256
   */
  private static hashDomain(domain: string): string {
    // نرمال‌سازی دامنه
    let normalizedDomain = domain.toLowerCase().trim();
    normalizedDomain = normalizedDomain.replace(/^www\./, '');
    normalizedDomain = normalizedDomain.replace(/:\d+$/, '');
    normalizedDomain = normalizedDomain.replace(/^https?:\/\//, '');
    normalizedDomain = normalizedDomain.replace(/\/+$/, '');

    // هش SHA-256 بدون SALT (باید با PHP یکسان باشد)
    return crypto
      .createHash('sha256')
      .update(normalizedDomain)
      .digest('hex');
  }

  /**
   * کد تزریقی به installer.php - چک‌های پراکنده برای امنیت بالاتر
   */
  private static getLockInjectionCode(domainHash: string): string {
    const base64Hash = Buffer.from(domainHash).toString('base64');
    const hashParts = domainHash.match(/.{4}/g)?.join(' ') || domainHash;
    const first4 = domainHash.substring(0, 4);
    
    const errorPage = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Access Denied</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center}.container{background:#fff;border-radius:20px;padding:60px 40px;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;max-width:500px;animation:slideIn 0.5s ease}.icon{font-size:80px;margin-bottom:20px;animation:pulse 2s infinite}h1{color:#333;font-size:32px;margin-bottom:20px;font-weight:700}.domain{background:#f5f5f5;padding:15px 20px;border-radius:10px;margin:20px 0;color:#666;font-family:monospace;word-break:break-all}.message{color:#888;font-size:16px;line-height:1.6}@keyframes slideIn{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style></head><body><div class="container"><div class="icon">🔒</div><h1>Domain Lock</h1><div class="domain">'.htmlspecialchars($_SERVER['HTTP_HOST']??'').'</div><p class="message">Access denied for this domain.<br>This installer is locked to a specific domain.</p></div></body></html>`;
    
    return `
// ===== DISTRIBUTED DOMAIN LOCK - SECURITY ENHANCED =====
// Multiple validation points spread across the code for higher security
`;
  }

  /**
   * تزریق کد قفل به installer.php - چک‌های پراکنده
   */
  private static injectLockCode(installerContent: string, domainHash: string): string {
    const base64Hash = Buffer.from(domainHash).toString('base64');
    const hashParts = domainHash.match(/.{4}/g)?.join(' ') || domainHash;
    const first4 = domainHash.substring(0, 4);
    const hashWithoutSpaces = domainHash.replace(/\s/g, '');
    
    const errorPage = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Access Denied</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center}.container{background:#fff;border-radius:20px;padding:60px 40px;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;max-width:500px;animation:slideIn 0.5s ease}.icon{font-size:80px;margin-bottom:20px;animation:pulse 2s infinite}h1{color:#333;font-size:32px;margin-bottom:20px;font-weight:700}.domain{background:#f5f5f5;padding:15px 20px;border-radius:10px;margin:20px 0;color:#666;font-family:monospace;word-break:break-all}.message{color:#888;font-size:16px;line-height:1.6}@keyframes slideIn{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style></head><body><div class="container"><div class="icon">🔒</div><h1>Domain Lock</h1><div class="domain">'.htmlspecialchars($_SERVER['HTTP_HOST']??'').'</div><p class="message">Access denied for this domain.<br>This installer is locked to a specific domain.</p></div></body></html>`;

    // 1. تزریق در __construct
    installerContent = installerContent.replace(
      /(private\s+function\s+__construct\s*\(\s*\)\s*\{)/,
      `$1\n            if(hash('sha256',$_SERVER['HTTP_HOST']??'')!==base64_decode('${base64Hash}'))die('${errorPage}');`
    );

    // 2. تزریق در getInstance
    installerContent = installerContent.replace(
      /(public\s+static\s+function\s+getInstance\s*\(\s*\)\s*\{)/,
      `$1\n            $d=base64_decode('${base64Hash}');if(hash('sha256',$_SERVER['HTTP_HOST']??'')!==$d)die();`
    );

    // 3. تزریق در phpVersionCheck
    installerContent = installerContent.replace(
      /(public\s+static\s+function\s+phpVersionCheck\s*\(\s*\)\s*\{)/,
      `$1\n            $v=base64_decode('${base64Hash}');if(hash('sha256',$_SERVER['HTTP_HOST']??'X')!==$v){http_response_code(403);die('${errorPage}');}`
    );

    // 4. تزریق در chmod
    installerContent = installerContent.replace(
      /(public\s+static\s+function\s+chmod\s*\([^)]+\)\s*\{)/,
      `$1\n            if(substr(hash('sha256',$_SERVER['HTTP_HOST']??''),0,4)!=='${first4}')return false;`
    );

    // 5. تزریق در setHTTPHeaders
    installerContent = installerContent.replace(
      /(private\s+function\s+setHTTPHeaders\s*\(\s*\)\s*\{)/,
      `$1\n            $h=$_SERVER['HTTP_HOST']??'';if(!$h||hash('sha256',$h)!=='${first4}'.'${hashWithoutSpaces.substring(4)}')exit();`
    );

    // 6. تزریق قبل از run() اگر وجود دارد
    installerContent = installerContent.replace(
      /(DUPX_Bootstrap::phpVersionCheck\(\);)/,
      `$1\n    if(hash('sha256',$_SERVER['HTTP_HOST']??'X')!==str_replace([' ','-'],'','${hashParts}'))exit();`
    );

    return installerContent;
  }

  /**
   * قفل کردن فایل بکاپ
   */
  static async lockBackup(
    sourceFile: string,
    domain: string,
    outputDir: string
  ): Promise<LockResult> {
    try {
      // بررسی وجود فایل
      if (!fs.existsSync(sourceFile)) {
        return {
          success: false,
          message: 'فایل بکاپ پیدا نشد',
          errorCode: 'FILE_NOT_FOUND',
        };
      }

      // بررسی دامنه
      if (!domain || domain.trim().length === 0) {
        return {
          success: false,
          message: 'دامنه مشخص نشده است',
          errorCode: 'DOMAIN_REQUIRED',
        };
      }

      // هش کردن دامنه
      const domainHash = this.hashDomain(domain);

      // ایجاد نام فایل قفل‌شده
      const sourceFilename = path.basename(sourceFile);
      const lockedFilename = sourceFilename.replace(
        '.zip',
        `-LOCKED-${domainHash.substring(0, 8)}.zip`
      );
      const lockedFile = path.join(outputDir, lockedFilename);

      // ایجاد پوشه خروجی
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // چک کردن کش (7 روز)
      if (fs.existsSync(lockedFile)) {
        const stats = fs.statSync(lockedFile);
        const fileAge = Date.now() - stats.mtimeMs;
        
        if (fileAge < this.CACHE_DURATION) {
          return {
            success: true,
            message: 'فایل قفل‌شده از کش بازیابی شد',
            lockedFile,
            lockedFilename,
            domainHash,
            filesize: stats.size,
            cached: true,
          };
        }
      }

      // باز کردن ZIP اصلی
      const zip = new AdmZip(sourceFile);
      const zipEntries = zip.getEntries();

      // پیدا کردن installer.php
      const installerEntry = zipEntries.find(
        (entry) => entry.entryName === 'installer.php'
      );

      if (!installerEntry) {
        return {
          success: false,
          message: 'فایل installer.php پیدا نشد',
          errorCode: 'INSTALLER_NOT_FOUND',
        };
      }

      // استخراج محتوای installer.php
      const installerContent = installerEntry.getData().toString('utf8');

      // تزریق کد قفل به installer
      const modifiedInstaller = this.injectLockCode(installerContent, domainHash);

      // کپی فایل ZIP
      fs.copyFileSync(sourceFile, lockedFile);

      // باز کردن فایل کپی‌شده و اضافه کردن installer قفل شده
      const lockedZip = new AdmZip(lockedFile);
      
      // حذف installer قدیمی و اضافه کردن نسخه قفل شده
      lockedZip.deleteFile('installer.php');
      lockedZip.addFile('installer.php', Buffer.from(modifiedInstaller, 'utf8'));

      // ذخیره فایل
      lockedZip.writeZip(lockedFile);

      const fileStats = fs.statSync(lockedFile);

      return {
        success: true,
        message: 'فایل با موفقیت قفل شد',
        lockedFile,
        lockedFilename,
        domainHash,
        filesize: fileStats.size,
        cached: false,
      };

    } catch (error: any) {
      console.error('Lock Backup Error:', error);
      return {
        success: false,
        message: `خطای سیستمی: ${error.message}`,
        errorCode: 'SYSTEM_ERROR',
      };
    }
  }

  /**
   * بررسی اینکه آیا فایل یک بکاپ Duplicator است
   */
  static isDuplicatorBackup(filepath: string): boolean {
    try {
      // چک پسوند
      if (path.extname(filepath).toLowerCase() !== '.zip') {
        return false;
      }

      const filename = path.basename(filepath);

      // الگوی نام فایل Duplicator: YYYYMMDD_name_hash_timestamp_archive.zip
      if (/^\d{8}_.*_[a-f0-9]+_\d{14}_archive\.zip$/i.test(filename)) {
        return true;
      }

      // چک محتوای ZIP
      if (fs.existsSync(filepath)) {
        const zip = new AdmZip(filepath);
        const entries = zip.getEntries();
        return entries.some((entry) => entry.entryName === 'installer.php');
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * پاکسازی فایل‌های قدیمی
   */
  static cleanupOldFiles(lockedDir: string): number {
    try {
      if (!fs.existsSync(lockedDir)) {
        return 0;
      }

      const files = fs.readdirSync(lockedDir);
      let deleted = 0;

      files.forEach((file) => {
        if (file.includes('-LOCKED-') && file.endsWith('.zip')) {
          const filePath = path.join(lockedDir, file);
          const stats = fs.statSync(filePath);
          const fileAge = Date.now() - stats.mtimeMs;

          if (fileAge > this.CACHE_DURATION) {
            fs.unlinkSync(filePath);
            deleted++;
          }
        }
      });

      return deleted;
    } catch (error) {
      console.error('Cleanup Error:', error);
      return 0;
    }
  }
}
