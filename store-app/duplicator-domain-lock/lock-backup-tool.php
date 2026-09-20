<?php
/**
 * ابزار قفل‌گذاری روی فایل‌های بکاپ Duplicator
 * Domain Lock Tool for Duplicator Backups
 */

// تنظیمات
ini_set('max_execution_time', 0);
ini_set('memory_limit', '512M');

class DuplicatorBackupLocker {
    private $zipPath;
    private $domain;
    private $tempDir;
    private $expiresAt;
    
    public function __construct($zipPath, $domain, $expiresAt = null) {
        $this->zipPath = $zipPath;
        $this->domain = $domain;
        $this->expiresAt = $expiresAt;
        $this->tempDir = sys_get_temp_dir() . '/duplicator-lock-' . uniqid();
    }
    
    /**
     * قفل‌گذاری فایل بکاپ
     */
    public function lockBackup() {
        echo "🔧 شروع فرآیند قفل‌گذاری...\n\n";
        
        // 1. بررسی فایل ZIP
        if (!file_exists($this->zipPath)) {
            throw new Exception("فایل ZIP یافت نشد: " . $this->zipPath);
        }
        
        echo "✅ فایل بکاپ یافت شد: " . basename($this->zipPath) . "\n";
        echo "📦 حجم: " . $this->formatBytes(filesize($this->zipPath)) . "\n\n";
        
        // 2. استخراج فایل installer.php
        echo "📂 در حال استخراج installer.php...\n";
        $installerContent = $this->extractInstallerFromZip();
        
        if (!$installerContent) {
            throw new Exception("فایل installer.php در آرشیو یافت نشد!");
        }
        
        echo "✅ installer.php استخراج شد\n\n";
        
        // 3. ایجاد پوشه موقت
        if (!mkdir($this->tempDir, 0777, true)) {
            throw new Exception("خطا در ایجاد پوشه موقت");
        }
        
        echo "📁 پوشه موقت ایجاد شد: {$this->tempDir}\n\n";
        
        // 4. ایجاد فایل‌های قفل
        echo "🔐 در حال ایجاد سیستم قفل دامنه...\n";
        $this->createLockFiles();
        
        // 5. تغییر installer.php
        echo "✏️  در حال اضافه کردن کد قفل به installer.php...\n";
        $modifiedInstaller = $this->modifyInstaller($installerContent);
        file_put_contents($this->tempDir . '/installer.php', $modifiedInstaller);
        
        // 6. کپی فایل ZIP اصلی
        echo "📋 در حال کپی فایل بکاپ...\n";
        $newZipPath = $this->getLockedBackupPath();
        copy($this->zipPath, $newZipPath);
        
        // 7. اضافه کردن فایل‌های قفل به ZIP
        echo "➕ در حال اضافه کردن فایل‌های قفل به آرشیو...\n";
        $this->addFilesToZip($newZipPath);
        
        // 8. پاکسازی
        $this->cleanup();
        
        echo "\n✅ ✅ ✅ عملیات با موفقیت انجام شد! ✅ ✅ ✅\n\n";
        echo "📦 فایل قفل‌شده: " . basename($newZipPath) . "\n";
        echo "🔒 دامنه مجاز: {$this->domain}\n";
        echo "📊 حجم: " . $this->formatBytes(filesize($newZipPath)) . "\n";
        
        if ($this->expiresAt) {
            echo "⏰ تاریخ انقضا: {$this->expiresAt}\n";
        }
        
        echo "\n🎉 حالا می‌توانید فایل را توزیع کنید!\n";
        
        return $newZipPath;
    }
    
    /**
     * استخراج installer.php از ZIP
     */
    private function extractInstallerFromZip() {
        $zip = new ZipArchive();
        
        if ($zip->open($this->zipPath) !== true) {
            throw new Exception("خطا در باز کردن فایل ZIP");
        }
        
        $content = $zip->getFromName('installer.php');
        $zip->close();
        
        return $content;
    }
    
    /**
     * ایجاد فایل‌های قفل
     */
    private function createLockFiles() {
        // کپی کلاس validator
        $validatorSource = __DIR__ . '/DomainLockValidator.php';
        if (file_exists($validatorSource)) {
            copy($validatorSource, $this->tempDir . '/DomainLockValidator.php');
            echo "  ✓ DomainLockValidator.php ایجاد شد\n";
        }
        
        // ایجاد فایل قفل JSON
        $packageHash = $this->extractPackageHash();
        $domainHash = $this->hashDomain($this->domain);
        
        $lockData = [
            'domain_hash' => $domainHash,
            'created_at' => date('Y-m-d H:i:s'),
            'package_hash' => $packageHash,
            'version' => '1.0',
            'locked_by' => 'Duplicator Domain Lock System'
        ];
        
        if ($this->expiresAt) {
            $lockData['expires_at'] = $this->expiresAt;
        }
        
        file_put_contents(
            $this->tempDir . '/domain-lock.json',
            json_encode($lockData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
        
        echo "  ✓ domain-lock.json ایجاد شد\n";
        echo "  ✓ دامنه هش شد: " . substr($domainHash, 0, 16) . "...\n";
    }
    
    /**
     * استخراج Package Hash از نام فایل
     */
    private function extractPackageHash() {
        $filename = basename($this->zipPath);
        if (preg_match('/_([a-z0-9]{7})[a-z0-9]+_[0-9]{6}([0-9]{8})_archive\.zip$/', $filename, $matches)) {
            return $matches[1] . '-' . $matches[2];
        }
        return 'unknown';
    }
    
    /**
     * هش کردن دامنه
     */
    private function hashDomain($domain) {
        $domain = strtolower(str_replace('www.', '', $domain));
        $salt = 'YOUR_RANDOM_SALT_HERE_CHANGE_THIS'; // باید با کلاس validator یکسان باشد
        return hash('sha256', $domain . $salt);
    }
    
    /**
     * تغییر installer.php
     */
    private function modifyInstaller($content) {
        // پیدا کردن محل مناسب برای inject کردن کد
        $searchPattern = '/date_default_timezone_set\(\'UTC\'\);.*?\/\/ Some machines/s';
        
        $injectionCode = <<<'PHP'
date_default_timezone_set('UTC'); // Some machines don't have this set so just do it here.

    // ===============================================
    // DOMAIN LOCK SYSTEM - DO NOT REMOVE
    // ===============================================
    if (file_exists(__DIR__ . '/DomainLockValidator.php')) {
        require_once __DIR__ . '/DomainLockValidator.php';
        if (class_exists('DomainLockValidator')) {
            DomainLockValidator::validate();
        }
    }
    // ===============================================
PHP;
        
        $modified = preg_replace($searchPattern, $injectionCode, $content, 1);
        
        if ($modified === $content) {
            // اگر پترن پیدا نشد، از روش جایگزین استفاده کن
            $modified = str_replace(
                "date_default_timezone_set('UTC');",
                $injectionCode,
                $content
            );
        }
        
        return $modified;
    }
    
    /**
     * اضافه کردن فایل‌ها به ZIP
     */
    private function addFilesToZip($zipPath) {
        $zip = new ZipArchive();
        
        if ($zip->open($zipPath) !== true) {
            throw new Exception("خطا در باز کردن ZIP برای ویرایش");
        }
        
        // حذف installer.php قدیمی و اضافه کردن جدید
        $zip->deleteName('installer.php');
        $zip->addFile($this->tempDir . '/installer.php', 'installer.php');
        echo "  ✓ installer.php جدید جایگزین شد\n";
        
        // اضافه کردن فایل‌های قفل
        $zip->addFile($this->tempDir . '/DomainLockValidator.php', 'DomainLockValidator.php');
        echo "  ✓ DomainLockValidator.php اضافه شد\n";
        
        $zip->addFile($this->tempDir . '/domain-lock.json', 'domain-lock.json');
        echo "  ✓ domain-lock.json اضافه شد\n";
        
        $zip->close();
    }
    
    /**
     * مسیر فایل قفل‌شده جدید
     */
    private function getLockedBackupPath() {
        $dir = dirname($this->zipPath);
        $filename = basename($this->zipPath, '.zip');
        return $dir . '/' . $filename . '-LOCKED.zip';
    }
    
    /**
     * پاکسازی فایل‌های موقت
     */
    private function cleanup() {
        $files = glob($this->tempDir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        rmdir($this->tempDir);
    }
    
    /**
     * فرمت حجم فایل
     */
    private function formatBytes($bytes, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

// ========================================
// استفاده از ابزار
// ========================================

if (php_sapi_name() !== 'cli') {
    die("این اسکریپت فقط از طریق CLI قابل اجرا است.\n");
}

// دریافت آرگومان‌ها
$options = getopt('f:d:e::', ['file:', 'domain:', 'expires::']);

$zipFile = $options['f'] ?? $options['file'] ?? null;
$domain = $options['d'] ?? $options['domain'] ?? null;
$expires = $options['e'] ?? $options['expires'] ?? null;

if (!$zipFile || !$domain) {
    echo "❌ خطا: پارامترهای لازم وارد نشده است.\n\n";
    echo "استفاده:\n";
    echo "  php lock-backup-tool.php -f <file.zip> -d <domain.com> [-e <YYYY-MM-DD>]\n\n";
    echo "مثال:\n";
    echo "  php lock-backup-tool.php -f backup.zip -d example.com\n";
    echo "  php lock-backup-tool.php -f backup.zip -d example.com -e 2026-12-31\n\n";
    exit(1);
}

if (!file_exists($zipFile)) {
    echo "❌ خطا: فایل یافت نشد: $zipFile\n";
    exit(1);
}

try {
    $locker = new DuplicatorBackupLocker($zipFile, $domain, $expires);
    $lockedFile = $locker->lockBackup();
    
    echo "\n" . str_repeat("=", 50) . "\n";
    echo "✅ فایل قفل‌شده آماده است: $lockedFile\n";
    echo str_repeat("=", 50) . "\n";
    
} catch (Exception $e) {
    echo "\n❌ خطا: " . $e->getMessage() . "\n";
    exit(1);
}
