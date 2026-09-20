#!/usr/bin/env php
<?php
/**
 * CLI Tool for Locking Duplicator Backups
 * ابزار خط فرمان برای قفل کردن بکاپ‌های Duplicator
 * 
 * استفاده:
 * php lock-backup-cli.php <source-file> <domain> <output-dir>
 * 
 * @package Backup_Locker
 * @version 1.0.0
 */

// SALT برای هش کردن دامنه (باید با class-backup-locker.php یکسان باشد)
define('DOMAIN_SALT', 'YOUR_SECRET_SALT_12345');

/**
 * هش کردن دامنه
 */
function hash_domain($domain) {
    // نرمال‌سازی دامنه
    $domain = strtolower(trim($domain));
    $domain = str_replace('www.', '', $domain);
    $domain = preg_replace('/:[0-9]+$/', '', $domain);
    $domain = preg_replace('#^https?://#', '', $domain);
    $domain = rtrim($domain, '/');
    
    return hash('sha256', $domain . DOMAIN_SALT);
}

/**
 * تزریق کد قفل به installer.php
 */
function inject_lock_code($installer_content) {
    $php_tag_pos = strpos($installer_content, '<?php');
    
    if ($php_tag_pos === false) {
        $lock_code = "<?php\n" . get_lock_injection_code() . "\n?>";
        return $lock_code . $installer_content;
    }
    
    $before = substr($installer_content, 0, $php_tag_pos + 5);
    $after = substr($installer_content, $php_tag_pos + 5);
    
    $lock_code = "\n" . get_lock_injection_code() . "\n";
    
    return $before . $lock_code . $after;
}

/**
 * کد تزریقی
 */
function get_lock_injection_code() {
    return <<<'LOCKCODE'
// ===== DOMAIN LOCK VALIDATION =====
if (file_exists(__DIR__ . '/DomainLockValidator.php')) {
    require_once __DIR__ . '/DomainLockValidator.php';
    
    $validator = new DomainLockValidator(__DIR__);
    
    // اگر درخواست برای بررسی دامنه باشد
    if (isset($_GET['check_domain_lock'])) {
        header('Content-Type: application/json');
        echo json_encode($validator->checkDomain());
        exit;
    }
    
    // اعتبارسنجی دامنه
    if (!$validator->validate()) {
        $validator->showLicenseError();
        exit;
    }
}
// ===== END DOMAIN LOCK =====

LOCKCODE;
}

/**
 * دریافت کد DomainLockValidator
 */
function get_domain_validator_code($salt) {
    return <<<VALIDATOR
<?php
/**
 * Domain Lock Validator for Duplicator Backup
 * Generated automatically by Backup Locker System
 */

class DomainLockValidator {
    private \$lockFile;
    private \$domainHash;
    private \$salt = '{$salt}';
    
    public function __construct(\$baseDir) {
        \$this->lockFile = \$baseDir . '/domain-lock.json';
        
        if (!file_exists(\$this->lockFile)) {
            \$this->showError('فایل قفل دامنه یافت نشد', 'LOCK_FILE_MISSING');
        }
        
        \$lockData = json_decode(file_get_contents(\$this->lockFile), true);
        
        if (!isset(\$lockData['domain_hash'])) {
            \$this->showError('هش دامنه یافت نشد', 'DOMAIN_HASH_MISSING');
        }
        
        \$this->domainHash = \$lockData['domain_hash'];
    }
    
    /**
     * هش کردن دامنه
     */
    private function hashDomain(\$domain) {
        \$domain = strtolower(trim(\$domain));
        \$domain = str_replace('www.', '', \$domain);
        \$domain = preg_replace('/:[0-9]+\$/', '', \$domain);
        
        return hash('sha256', \$domain . \$this->salt);
    }
    
    /**
     * دریافت دامنه فعلی
     */
    private function getCurrentDomain() {
        \$domain = isset(\$_SERVER['HTTP_HOST']) ? \$_SERVER['HTTP_HOST'] : '';
        
        if (empty(\$domain) && isset(\$_SERVER['SERVER_NAME'])) {
            \$domain = \$_SERVER['SERVER_NAME'];
        }
        
        return \$domain;
    }
    
    /**
     * اعتبارسنجی دامنه
     */
    public function validate() {
        \$currentDomain = \$this->getCurrentDomain();
        
        if (empty(\$currentDomain)) {
            return false;
        }
        
        \$currentHash = \$this->hashDomain(\$currentDomain);
        
        return \$currentHash === \$this->domainHash;
    }
    
    /**
     * بررسی دامنه (برای AJAX)
     */
    public function checkDomain() {
        \$currentDomain = \$this->getCurrentDomain();
        \$currentHash = \$this->hashDomain(\$currentDomain);
        \$isValid = \$currentHash === \$this->domainHash;
        
        return array(
            'valid' => \$isValid,
            'current_domain' => \$currentDomain,
            'message' => \$isValid ? 'دامنه معتبر است' : 'این بکاپ فقط برای دامنه مشخص‌شده قابل استفاده است'
        );
    }
    
    /**
     * نمایش خطای نامعتبر بودن دامنه
     */
    public function showLicenseError() {
        \$currentDomain = \$this->getCurrentDomain();
        
        \$html = '<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>خطای قفل دامنه</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Tahoma, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .error-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
            text-align: center;
        }
        .error-icon {
            font-size: 80px;
            color: #e74c3c;
            margin-bottom: 20px;
        }
        h1 {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 15px;
        }
        .message {
            color: #7f8c8d;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 25px;
        }
        .domain-info {
            background: #f8f9fa;
            border-right: 4px solid #e74c3c;
            padding: 15px;
            margin: 20px 0;
            text-align: right;
        }
        .domain-info strong {
            color: #2c3e50;
            display: block;
            margin-bottom: 5px;
        }
        .domain-info code {
            background: white;
            padding: 5px 10px;
            border-radius: 5px;
            color: #e74c3c;
            font-family: monospace;
            display: inline-block;
        }
        .help-text {
            background: #fff3cd;
            border-right: 4px solid #ffc107;
            padding: 15px;
            margin-top: 20px;
            text-align: right;
            font-size: 14px;
            color: #856404;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            color: #95a5a6;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">🔒</div>
        <h1>دسترسی غیرمجاز به فایل بکاپ</h1>
        
        <p class="message">
            این فایل بکاپ با سیستم قفل دامنه محافظت شده است و فقط می‌تواند روی دامنه مشخص‌شده نصب شود.
        </p>
        
        <div class="domain-info">
            <strong>دامنه فعلی شما:</strong>
            <code>' . htmlspecialchars(\$currentDomain) . '</code>
        </div>
        
        <div class="help-text">
            <strong>💡 راهنمایی:</strong><br>
            اگر شما مالک این بکاپ هستید و می‌خواهید روی دامنه دیگری نصب کنید، 
            لطفاً با پشتیبانی تماس بگیرید تا یک بکاپ جدید برای دامنه موردنظر برای شما ایجاد شود.
        </div>
        
        <div class="footer">
            Protected by Backup Locker System v1.0
        </div>
    </div>
</body>
</html>';
        
        echo \$html;
        exit;
    }
    
    /**
     * نمایش خطای سیستم
     */
    private function showError(\$message, \$code) {
        die('<h1 style="color:red">Domain Lock Error</h1><p>' . htmlspecialchars(\$message) . ' (Code: ' . \$code . ')</p>');
    }
}
VALIDATOR;
}

/**
 * تابع اصلی قفل کردن
 */
function lock_backup($source_file, $domain, $output_dir) {
    try {
        // بررسی وجود فایل
        if (!file_exists($source_file)) {
            return [
                'success' => false,
                'message' => 'فایل بکاپ پیدا نشد',
                'error_code' => 'FILE_NOT_FOUND'
            ];
        }
        
        // بررسی دامنه
        if (empty($domain)) {
            return [
                'success' => false,
                'message' => 'دامنه مشخص نشده است',
                'error_code' => 'DOMAIN_REQUIRED'
            ];
        }
        
        // هش کردن دامنه
        $domain_hash = hash_domain($domain);
        
        // ایجاد نام فایل قفل‌شده
        $source_filename = basename($source_file);
        $locked_filename = str_replace('.zip', '-LOCKED-' . substr($domain_hash, 0, 8) . '.zip', $source_filename);
        $locked_file = rtrim($output_dir, '/\\') . DIRECTORY_SEPARATOR . $locked_filename;
        
        // چک کردن کش (7 روز)
        if (file_exists($locked_file) && (time() - filemtime($locked_file)) < 604800) {
            return [
                'success' => true,
                'message' => 'فایل قفل‌شده از کش بازیابی شد',
                'locked_file' => $locked_file,
                'locked_filename' => $locked_filename,
                'domain_hash' => $domain_hash,
                'filesize' => filesize($locked_file),
                'cached' => true
            ];
        }
        
        // باز کردن ZIP اصلی
        $zip = new ZipArchive();
        if ($zip->open($source_file) !== true) {
            return [
                'success' => false,
                'message' => 'خطا در باز کردن فایل ZIP',
                'error_code' => 'ZIP_OPEN_ERROR'
            ];
        }
        
        // استخراج installer.php
        $installer_content = $zip->getFromName('installer.php');
        if ($installer_content === false) {
            $zip->close();
            return [
                'success' => false,
                'message' => 'فایل installer.php پیدا نشد',
                'error_code' => 'INSTALLER_NOT_FOUND'
            ];
        }
        
        $zip->close();
        
        // ایجاد محتوای فایل‌های قفل
        $validator_content = get_domain_validator_code(DOMAIN_SALT);
        
        $lock_data = [
            'domain_hash' => $domain_hash,
            'locked_at' => date('Y-m-d H:i:s'),
            'product' => 'Duplicator Backup',
            'version' => '1.0'
        ];
        $lock_json = json_encode($lock_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        
        // تزریق کد قفل به installer
        $modified_installer = inject_lock_code($installer_content);
        
        // کپی فایل ZIP
        if (!copy($source_file, $locked_file)) {
            return [
                'success' => false,
                'message' => 'خطا در کپی فایل',
                'error_code' => 'COPY_ERROR'
            ];
        }
        
        // باز کردن فایل قفل‌شده
        $zip = new ZipArchive();
        if ($zip->open($locked_file) !== true) {
            @unlink($locked_file);
            return [
                'success' => false,
                'message' => 'خطا در باز کردن فایل قفل‌شده',
                'error_code' => 'LOCKED_ZIP_ERROR'
            ];
        }
        
        // اضافه کردن فایل‌های قفل
        $zip->addFromString('DomainLockValidator.php', $validator_content);
        $zip->addFromString('domain-lock.json', $lock_json);
        $zip->addFromString('installer.php', $modified_installer);
        
        $zip->close();
        
        return [
            'success' => true,
            'message' => 'فایل با موفقیت قفل شد',
            'locked_file' => $locked_file,
            'locked_filename' => $locked_filename,
            'domain_hash' => $domain_hash,
            'filesize' => filesize($locked_file),
            'cached' => false
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'خطای سیستمی: ' . $e->getMessage(),
            'error_code' => 'SYSTEM_ERROR'
        ];
    }
}

// ==================================================
// اجرای CLI
// ==================================================

// چک کردن اجرا از CLI
if (php_sapi_name() !== 'cli') {
    die('This script must be run from command line');
}

// بررسی آرگومان‌ها
if ($argc < 4) {
    echo "Usage: php lock-backup-cli.php <source-file> <domain> <output-dir>\n";
    echo "\nExample:\n";
    echo "  php lock-backup-cli.php backup.zip example.com ./locked-backups\n";
    exit(1);
}

$source_file = $argv[1];
$domain = $argv[2];
$output_dir = $argv[3];

// ایجاد پوشه خروجی
if (!is_dir($output_dir)) {
    mkdir($output_dir, 0755, true);
}

// قفل کردن فایل
$result = lock_backup($source_file, $domain, $output_dir);

// خروجی JSON
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

exit($result['success'] ? 0 : 1);
