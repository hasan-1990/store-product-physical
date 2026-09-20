<?php
/**
 * Domain Lock Validator for Duplicator Backups
 * این کلاس از نصب بکاپ روی دامنه‌های غیرمجاز جلوگیری می‌کند
 */

class DomainLockValidator {
    /**
     * فایل کانفیگ قفل دامنه
     */
    private const LOCK_FILE = 'domain-lock.json';
    
    /**
     * Salt برای هش کردن دامنه (باید رندوم باشد)
     */
    private const SALT = 'YOUR_RANDOM_SALT_HERE_CHANGE_THIS';
    
    /**
     * بررسی اینکه آیا بکاپ قفل دامنه دارد
     */
    public static function isLocked() {
        $lockFile = __DIR__ . '/' . self::LOCK_FILE;
        return file_exists($lockFile);
    }
    
    /**
     * دریافت اطلاعات قفل از فایل
     */
    private static function getLockData() {
        $lockFile = __DIR__ . '/' . self::LOCK_FILE;
        
        if (!file_exists($lockFile)) {
            return null;
        }
        
        $content = file_get_contents($lockFile);
        $data = json_decode($content, true);
        
        if (!$data || !isset($data['domain_hash'])) {
            return null;
        }
        
        return $data;
    }
    
    /**
     * هش کردن دامنه با الگوریتم SHA256
     */
    private static function hashDomain($domain) {
        // حذف www و تبدیل به lowercase
        $domain = strtolower(str_replace('www.', '', $domain));
        
        // هش با salt
        return hash('sha256', $domain . self::SALT);
    }
    
    /**
     * دریافت دامنه فعلی
     */
    private static function getCurrentDomain() {
        if (isset($_SERVER['HTTP_HOST'])) {
            $domain = $_SERVER['HTTP_HOST'];
        } elseif (isset($_SERVER['SERVER_NAME'])) {
            $domain = $_SERVER['SERVER_NAME'];
        } else {
            $domain = 'localhost';
        }
        
        // حذف پورت
        $domain = preg_replace('/:\d+$/', '', $domain);
        
        return $domain;
    }
    
    /**
     * اعتبارسنجی دامنه فعلی با قفل
     */
    public static function validate() {
        // اگر قفل ندارد، اجازه نصب
        if (!self::isLocked()) {
            return true;
        }
        
        $lockData = self::getLockData();
        
        if (!$lockData) {
            self::showError('فایل قفل معتبر نیست!', 'INVALID_LOCK_FILE');
            return false;
        }
        
        $currentDomain = self::getCurrentDomain();
        $currentHash = self::hashDomain($currentDomain);
        
        // بررسی مطابقت هش
        if ($currentHash !== $lockData['domain_hash']) {
            self::showLicenseError($currentDomain, $lockData);
            return false;
        }
        
        // بررسی انقضا (اگر وجود داشته باشد)
        if (isset($lockData['expires_at'])) {
            $expiresAt = strtotime($lockData['expires_at']);
            if (time() > $expiresAt) {
                self::showError('مجوز این بکاپ منقضی شده است!', 'LICENSE_EXPIRED');
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * نمایش خطای عدم مطابقت دامنه
     */
    private static function showLicenseError($currentDomain, $lockData) {
        $createdAt = isset($lockData['created_at']) ? $lockData['created_at'] : 'نامشخص';
        $packageHash = isset($lockData['package_hash']) ? $lockData['package_hash'] : 'N/A';
        
        ?>
        <!DOCTYPE html>
        <html lang="fa">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>خطای مجوز - License Error</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: Tahoma, Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    direction: rtl;
                    padding: 20px;
                }
                .container {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 600px;
                    width: 100%;
                    padding: 40px;
                    text-align: center;
                }
                .icon {
                    font-size: 80px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #e74c3c;
                    margin-bottom: 20px;
                    font-size: 28px;
                }
                .message {
                    color: #555;
                    line-height: 1.8;
                    margin-bottom: 30px;
                    font-size: 16px;
                }
                .info-box {
                    background: #f8f9fa;
                    border-right: 4px solid #e74c3c;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: right;
                }
                .info-box strong {
                    color: #e74c3c;
                }
                .domain {
                    background: #fff3cd;
                    padding: 10px 20px;
                    border-radius: 8px;
                    display: inline-block;
                    margin: 10px 0;
                    font-family: monospace;
                    font-size: 18px;
                    color: #856404;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #888;
                    font-size: 14px;
                }
                .code {
                    font-family: 'Courier New', monospace;
                    background: #f4f4f4;
                    padding: 3px 8px;
                    border-radius: 4px;
                    color: #d63384;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">🔒</div>
                <h1>خطای مجوز استفاده</h1>
                
                <div class="message">
                    <p>این فایل بکاپ فقط برای یک دامنه خاص مجاز شده است.</p>
                    <p>شما مجاز به نصب این بکاپ روی دامنه فعلی نیستید.</p>
                </div>
                
                <div class="info-box">
                    <p><strong>دامنه فعلی شما:</strong></p>
                    <div class="domain"><?php echo htmlspecialchars($currentDomain); ?></div>
                </div>
                
                <div class="info-box">
                    <p><strong>اطلاعات بکاپ:</strong></p>
                    <p>شناسه بسته: <span class="code"><?php echo htmlspecialchars($packageHash); ?></span></p>
                    <p>تاریخ ایجاد: <span class="code"><?php echo htmlspecialchars($createdAt); ?></span></p>
                    <?php if (isset($lockData['expires_at'])): ?>
                    <p>تاریخ انقضا: <span class="code"><?php echo htmlspecialchars($lockData['expires_at']); ?></span></p>
                    <?php endif; ?>
                </div>
                
                <div class="message" style="margin-top: 30px;">
                    <p><strong>⚠️ توجه:</strong></p>
                    <p>برای دریافت مجوز نصب این بکاپ روی دامنه جدید، لطفاً با فروشنده یا سازنده بکاپ تماس بگیرید.</p>
                </div>
                
                <div class="footer">
                    <p>Domain Lock System v1.0</p>
                    <p>Protected by SHA-256 Encryption</p>
                </div>
            </div>
        </body>
        </html>
        <?php
        die();
    }
    
    /**
     * نمایش خطای عمومی
     */
    private static function showError($message, $code = 'ERROR') {
        ?>
        <!DOCTYPE html>
        <html lang="fa">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>خطا - Error</title>
            <style>
                body {
                    font-family: Tahoma, Arial, sans-serif;
                    background: #f5f5f5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    direction: rtl;
                    padding: 20px;
                }
                .error-box {
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    padding: 40px;
                    text-align: center;
                    max-width: 500px;
                }
                h1 {
                    color: #e74c3c;
                    margin-bottom: 20px;
                }
                .code {
                    background: #f8f9fa;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-family: monospace;
                    color: #d63384;
                }
            </style>
        </head>
        <body>
            <div class="error-box">
                <h1>❌ خطا</h1>
                <p><?php echo htmlspecialchars($message); ?></p>
                <p style="margin-top: 20px;"><span class="code"><?php echo htmlspecialchars($code); ?></span></p>
            </div>
        </body>
        </html>
        <?php
        die();
    }
    
    /**
     * ایجاد فایل قفل برای یک دامنه
     */
    public static function createLock($domain, $packageHash = null, $expiresAt = null) {
        $domainHash = self::hashDomain($domain);
        
        $lockData = [
            'domain_hash' => $domainHash,
            'created_at' => date('Y-m-d H:i:s'),
            'package_hash' => $packageHash,
            'version' => '1.0'
        ];
        
        if ($expiresAt) {
            $lockData['expires_at'] = $expiresAt;
        }
        
        $lockFile = __DIR__ . '/' . self::LOCK_FILE;
        file_put_contents($lockFile, json_encode($lockData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        return $lockFile;
    }
    
    /**
     * حذف قفل (فقط برای تست)
     */
    public static function removeLock() {
        $lockFile = __DIR__ . '/' . self::LOCK_FILE;
        if (file_exists($lockFile)) {
            unlink($lockFile);
            return true;
        }
        return false;
    }
}
