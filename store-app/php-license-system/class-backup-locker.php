<?php
/**
 * Duplicator Backup Domain Locker
 * سیستم قفل‌گذاری خودکار فایل بکاپ Duplicator با دامنه
 * 
 * @package License_Manager
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit; // جلوگیری از دسترسی مستقیم
}

class Backup_Locker {
    
    /**
     * مسیر ذخیره فایل‌های قفل‌شده
     */
    private $locked_files_dir;
    
    /**
     * مسیر فایل‌های اصلی بکاپ
     */
    private $source_files_dir;
    
    /**
     * SALT برای هش دامنه (باید در production تغییر کند)
     */
    private $domain_salt = 'YOUR_SECRET_SALT_12345';
    
    /**
     * مدت زمان کش فایل‌های قفل‌شده (7 روز)
     */
    private $cache_duration = 604800; // 7 * 24 * 60 * 60
    
    /**
     * سازنده کلاس
     */
    public function __construct($source_dir = null, $locked_dir = null) {
        // تنظیم مسیرهای پیش‌فرض
        $upload_dir = wp_upload_dir();
        
        $this->source_files_dir = $source_dir ? $source_dir : $upload_dir['basedir'] . '/duplicator-backups';
        $this->locked_files_dir = $locked_dir ? $locked_dir : $upload_dir['basedir'] . '/locked-backups';
        
        // ایجاد پوشه در صورت عدم وجود
        $this->ensure_directory_exists($this->locked_files_dir);
        
        // Hook برای دانلود فایل
        add_action('init', array($this, 'handle_backup_download'));
        
        // Cron job برای پاکسازی فایل‌های قدیمی
        add_action('backup_locker_cleanup', array($this, 'cleanup_old_locked_files'));
        
        if (!wp_next_scheduled('backup_locker_cleanup')) {
            wp_schedule_event(time(), 'daily', 'backup_locker_cleanup');
        }
    }
    
    /**
     * اطمینان از وجود پوشه
     */
    private function ensure_directory_exists($dir) {
        if (!file_exists($dir)) {
            wp_mkdir_p($dir);
            
            // ایجاد فایل .htaccess برای امنیت
            $htaccess = $dir . '/.htaccess';
            if (!file_exists($htaccess)) {
                file_put_contents($htaccess, "deny from all\n");
            }
            
            // ایجاد index.php خالی
            $index = $dir . '/index.php';
            if (!file_exists($index)) {
                file_put_contents($index, "<?php\n// Silence is golden.\n");
            }
        }
    }
    
    /**
     * هش کردن دامنه
     */
    private function hash_domain($domain) {
        // نرمال‌سازی دامنه
        $domain = strtolower(trim($domain));
        $domain = str_replace('www.', '', $domain);
        $domain = preg_replace('/:[0-9]+$/', '', $domain); // حذف پورت
        
        // هش SHA-256 با SALT
        return hash('sha256', $domain . $this->domain_salt);
    }
    
    /**
     * قفل کردن فایل بکاپ
     * 
     * @param string $source_file مسیر فایل ZIP اصلی
     * @param string $domain دامنه مجاز
     * @return array نتیجه عملیات
     */
    public function lock_backup($source_file, $domain) {
        try {
            // بررسی وجود فایل اصلی
            if (!file_exists($source_file)) {
                return array(
                    'success' => false,
                    'message' => 'فایل بکاپ پیدا نشد',
                    'error_code' => 'FILE_NOT_FOUND'
                );
            }
            
            // بررسی دامنه
            if (empty($domain)) {
                return array(
                    'success' => false,
                    'message' => 'دامنه مشخص نشده است',
                    'error_code' => 'DOMAIN_REQUIRED'
                );
            }
            
            // هش کردن دامنه
            $domain_hash = $this->hash_domain($domain);
            
            // ایجاد نام فایل قفل‌شده
            $source_filename = basename($source_file);
            $locked_filename = str_replace('.zip', '-LOCKED-' . substr($domain_hash, 0, 8) . '.zip', $source_filename);
            $locked_file = $this->locked_files_dir . '/' . $locked_filename;
            
            // چک کردن کش
            if (file_exists($locked_file) && (time() - filemtime($locked_file)) < $this->cache_duration) {
                return array(
                    'success' => true,
                    'message' => 'فایل قفل‌شده از کش بازیابی شد',
                    'locked_file' => $locked_file,
                    'domain_hash' => $domain_hash,
                    'cached' => true
                );
            }
            
            // باز کردن ZIP اصلی
            $zip = new ZipArchive();
            if ($zip->open($source_file) !== true) {
                return array(
                    'success' => false,
                    'message' => 'خطا در باز کردن فایل ZIP',
                    'error_code' => 'ZIP_OPEN_ERROR'
                );
            }
            
            // استخراج installer.php
            $installer_content = $zip->getFromName('installer.php');
            if ($installer_content === false) {
                $zip->close();
                return array(
                    'success' => false,
                    'message' => 'فایل installer.php پیدا نشد',
                    'error_code' => 'INSTALLER_NOT_FOUND'
                );
            }
            
            $zip->close();
            
            // ایجاد DomainLockValidator.php
            $validator_content = $this->get_domain_validator_code();
            
            // ایجاد domain-lock.json
            $lock_data = array(
                'domain_hash' => $domain_hash,
                'locked_at' => date('Y-m-d H:i:s'),
                'product' => 'Duplicator Backup',
                'version' => '1.0'
            );
            $lock_json = json_encode($lock_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            
            // تزریق کد قفل به installer.php
            $modified_installer = $this->inject_lock_code($installer_content);
            
            // کپی فایل ZIP و اضافه کردن فایل‌های قفل
            if (!copy($source_file, $locked_file)) {
                return array(
                    'success' => false,
                    'message' => 'خطا در کپی فایل',
                    'error_code' => 'COPY_ERROR'
                );
            }
            
            // باز کردن فایل قفل‌شده برای تغییر
            $zip = new ZipArchive();
            if ($zip->open($locked_file) !== true) {
                unlink($locked_file);
                return array(
                    'success' => false,
                    'message' => 'خطا در باز کردن فایل قفل‌شده',
                    'error_code' => 'LOCKED_ZIP_ERROR'
                );
            }
            
            // اضافه کردن فایل‌ها
            $zip->addFromString('DomainLockValidator.php', $validator_content);
            $zip->addFromString('domain-lock.json', $lock_json);
            $zip->addFromString('installer.php', $modified_installer);
            
            $zip->close();
            
            return array(
                'success' => true,
                'message' => 'فایل با موفقیت قفل شد',
                'locked_file' => $locked_file,
                'locked_filename' => $locked_filename,
                'domain_hash' => $domain_hash,
                'filesize' => filesize($locked_file),
                'cached' => false
            );
            
        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => 'خطای سیستمی: ' . $e->getMessage(),
                'error_code' => 'SYSTEM_ERROR'
            );
        }
    }
    
    /**
     * تزریق کد قفل به installer.php
     */
    private function inject_lock_code($installer_content) {
        // پیدا کردن <?php اولین
        $php_tag_pos = strpos($installer_content, '<?php');
        
        if ($php_tag_pos === false) {
            // اگر <?php نبود، در ابتدا اضافه می‌کنیم
            $lock_code = "<?php\n" . $this->get_lock_injection_code() . "\n?>";
            return $lock_code . $installer_content;
        }
        
        // اضافه کردن کد بعد از <?php
        $before = substr($installer_content, 0, $php_tag_pos + 5);
        $after = substr($installer_content, $php_tag_pos + 5);
        
        $lock_code = "\n" . $this->get_lock_injection_code() . "\n";
        
        return $before . $lock_code . $after;
    }
    
    /**
     * کد تزریقی به installer.php
     */
    private function get_lock_injection_code() {
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
    private function get_domain_validator_code() {
        $salt = $this->domain_salt;
        
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
     * مدیریت دانلود فایل بکاپ
     */
    public function handle_backup_download() {
        // چک کردن درخواست دانلود
        if (!isset($_GET['download_backup']) || !isset($_GET['domain'])) {
            return;
        }
        
        // بررسی امنیت
        if (!isset($_GET['nonce']) || !wp_verify_nonce($_GET['nonce'], 'download_backup')) {
            wp_die('درخواست نامعتبر است');
        }
        
        $backup_file = sanitize_text_field($_GET['download_backup']);
        $domain = sanitize_text_field($_GET['domain']);
        
        // مسیر فایل اصلی
        $source_file = $this->source_files_dir . '/' . $backup_file;
        
        // قفل کردن فایل
        $result = $this->lock_backup($source_file, $domain);
        
        if (!$result['success']) {
            wp_die('خطا در قفل کردن فایل: ' . $result['message']);
        }
        
        // دانلود فایل قفل‌شده
        $this->force_download($result['locked_file'], $result['locked_filename']);
    }
    
    /**
     * دانلود اجباری فایل
     */
    private function force_download($file, $filename) {
        if (!file_exists($file)) {
            wp_die('فایل پیدا نشد');
        }
        
        // تنظیم هدرها
        header('Content-Description: File Transfer');
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($file));
        
        // پاک کردن بافر
        ob_clean();
        flush();
        
        // خواندن و ارسال فایل
        readfile($file);
        exit;
    }
    
    /**
     * پاکسازی فایل‌های قدیمی
     */
    public function cleanup_old_locked_files() {
        $files = glob($this->locked_files_dir . '/*-LOCKED-*.zip');
        
        if (empty($files)) {
            return;
        }
        
        $deleted = 0;
        foreach ($files as $file) {
            // حذف فایل‌های بیش از 7 روز
            if (is_file($file) && (time() - filemtime($file)) > $this->cache_duration) {
                unlink($file);
                $deleted++;
            }
        }
        
        if ($deleted > 0) {
            error_log("Backup Locker: Deleted {$deleted} old locked files");
        }
    }
    
    /**
     * ایجاد لینک دانلود
     */
    public function get_download_url($backup_filename, $domain) {
        $nonce = wp_create_nonce('download_backup');
        
        return add_query_arg(array(
            'download_backup' => $backup_filename,
            'domain' => $domain,
            'nonce' => $nonce
        ), home_url());
    }
    
    /**
     * لیست فایل‌های بکاپ موجود
     */
    public function get_available_backups() {
        $backups = array();
        $files = glob($this->source_files_dir . '/*.zip');
        
        if (empty($files)) {
            return $backups;
        }
        
        foreach ($files as $file) {
            $backups[] = array(
                'filename' => basename($file),
                'filepath' => $file,
                'filesize' => filesize($file),
                'modified' => filemtime($file)
            );
        }
        
        // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
        usort($backups, function($a, $b) {
            return $b['modified'] - $a['modified'];
        });
        
        return $backups;
    }
}
