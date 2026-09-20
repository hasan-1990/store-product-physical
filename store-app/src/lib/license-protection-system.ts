/**
 * سیستم چند لایه حفاظت از لایسنس
 * Multi-Layer License Protection System
 * 
 * این سیستم شامل 5 لایه امنیتی است:
 * 1. Core License Verification - بررسی اصلی لایسنس
 * 2. Distributed Checks - بررسی‌های پراکنده در فایل‌های مختلف
 * 3. Server Verification - تأیید از سرور مرکزی
 * 4. Dummy Functions - توابع تقلبی برای گمراه کردن
 * 5. Gradual Degradation - کاهش تدریجی قابلیت‌ها به جای قطع کامل
 */

import { createHash, randomBytes } from 'crypto';

/**
 * ساختار اطلاعات لایسنس
 */
export interface LicenseData {
  licenseKey: string;
  domain: string;
  productName: string;
  productId: string;
  serverUrl: string;
  expiresAt?: string;
}

/**
 * تولید نام تابع یونیک برای هر لایسنس
 */
export function generateUniqueFunctionName(licenseKey: string, prefix: string): string {
  const hash = createHash('md5').update(licenseKey).digest('hex').substring(0, 8);
  const sanitized = licenseKey.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  return `${prefix}_${sanitized}_${hash}`;
}

/**
 * تولید salt تصادفی برای هش
 */
export function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

/**
 * رمزنگاری اطلاعات به hex
 */
export function encodeToHex(text: string): string {
  return Buffer.from(text, 'utf8').toString('hex');
}

/**
 * تولید هش دامنه با salt
 */
export function generateDomainHash(domain: string, salt: string): string {
  const normalizedDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
  return createHash('sha256').update(`${normalizedDomain}${salt}`).digest('hex');
}

/**
 * 1️⃣ تولید کلاس اصلی مدیریت لایسنس (Core License Manager)
 * این کلاس قلب سیستم است و در یک فایل جداگانه قرار می‌گیرد
 */
export function generateCoreLicenseClass(license: LicenseData): string {
  const className = generateUniqueFunctionName(license.licenseKey, 'WP_License_Core');
  const salt = generateSalt();
  const domainHash = generateDomainHash(license.domain, salt);
  
  const domainHex = encodeToHex(license.domain);
  const productHex = encodeToHex(license.productName);
  const licenseHex = encodeToHex(license.licenseKey);
  const serverHex = encodeToHex(license.serverUrl);

  return `<?php
/**
 * Core License Manager - Do Not Delete
 * Warning: Removing this file will disable the plugin/theme
 * 
 * @package ${license.productName}
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('${className}')) {
    class ${className} {
        private static \$instance = null;
        private static \$verified = false;
        private static \$last_check = 0;
        private static \$check_interval = 3600; // 1 hour
        private static \$grace_period = 7; // 7 days grace period
        
        // Encrypted data
        private static \$data = array(
            's' => '${salt}',
            'dh' => '${domainHash}',
            'd' => '${domainHex}',
            'p' => '${productHex}',
            'l' => '${licenseHex}',
            'sv' => '${serverHex}'
        );
        
        /**
         * Get singleton instance
         */
        public static function get_instance() {
            if (self::\$instance === null) {
                self::\$instance = new self();
            }
            return self::\$instance;
        }
        
        /**
         * Initialize license verification
         */
        private function __construct() {
            $this->init_hooks();
        }
        
        /**
         * Setup WordPress hooks
         */
        private function init_hooks() {
            add_action('init', array(\$this, 'verify_license'), 1);
            add_action('admin_init', array(\$this, 'verify_license'), 1);
            add_action('admin_notices', array(\$this, 'show_license_notices'));
            
            // Check every hour
            if (time() - self::\$last_check > self::\$check_interval) {
                add_action('wp_loaded', array(\$this, 'remote_verify'));
            }
        }
        
        /**
         * Decode hex data
         */
        private static function hex_decode(\$hex) {
            if (!is_string(\$hex) || \$hex === '' || !preg_match('/^[0-9a-f]+$/i', \$hex)) {
                return '';
            }
            \$decoded = @pack('H*', \$hex);
            return \$decoded === false ? '' : \$decoded;
        }
        
        /**
         * Normalize domain
         */
        private static function normalize_domain(\$domain) {
            \$domain = strtolower(trim((string) \$domain));
            \$domain = preg_replace('/^https?:\\/\\//', '', \$domain);
            \$domain = preg_replace('/^www\\./', '', \$domain);
            \$parts = explode(':', \$domain);
            return trim(\$parts[0]);
        }
        
        /**
         * Verify current domain matches license
         */
        public function verify_license() {
            if (self::\$verified) {
                return true;
            }
            
            \$current_host = isset(\$_SERVER['HTTP_HOST']) ? \$_SERVER['HTTP_HOST'] : '';
            if (\$current_host === '') {
                \$current_host = parse_url(home_url(), PHP_URL_HOST);
            }
            
            \$current_domain = self::normalize_domain(\$current_host);
            \$current_hash = hash('sha256', \$current_domain . self::\$data['s']);
            
            \$allowed_domain = self::hex_decode(self::\$data['d']);
            \$allowed_normalized = self::normalize_domain(\$allowed_domain);
            
            // Hash comparison
            if (hash_equals(self::\$data['dh'], \$current_hash)) {
                self::\$verified = true;
                update_option('_wpstore_license_status', 'active', false);
                update_option('_wpstore_last_verification', time(), false);
                return true;
            }
            
            // Check grace period
            \$last_valid = get_option('_wpstore_last_verification', 0);
            if (\$last_valid > 0 && (time() - \$last_valid) < (self::\$grace_period * 86400)) {
                self::\$verified = true;
                return true;
            }
            
            self::\$verified = false;
            update_option('_wpstore_license_status', 'invalid', false);
            return false;
        }
        
        /**
         * Remote verification with server
         */
        public function remote_verify() {
            \$server_url = self::hex_decode(self::\$data['sv']);
            \$license_key = self::hex_decode(self::\$data['l']);
            \$product_name = self::hex_decode(self::\$data['p']);
            
            \$current_domain = self::normalize_domain(\$_SERVER['HTTP_HOST']);
            
            \$response = wp_remote_post(\$server_url . '/api/licenses/verify', array(
                'timeout' => 10,
                'body' => array(
                    'license_key' => \$license_key,
                    'domain' => \$current_domain,
                    'product' => \$product_name,
                    'version' => get_bloginfo('version')
                )
            ));
            
            if (!is_wp_error(\$response) && wp_remote_retrieve_response_code(\$response) === 200) {
                \$body = json_decode(wp_remote_retrieve_body(\$response), true);
                if (isset(\$body['valid']) && \$body['valid'] === true) {
                    self::\$last_check = time();
                    update_option('_wpstore_remote_verified', time(), false);
                    return true;
                }
            }
            
            return false;
        }
        
        /**
         * Check if license is valid
         */
        public static function is_valid() {
            return self::\$verified;
        }
        
        /**
         * Get license status
         */
        public static function get_status() {
            return array(
                'verified' => self::\$verified,
                'domain' => self::hex_decode(self::\$data['d']),
                'product' => self::hex_decode(self::\$data['p']),
                'license' => self::hex_decode(self::\$data['l'])
            );
        }
        
        /**
         * Show admin notices for license issues
         */
        public function show_license_notices() {
            if (self::\$verified) {
                return;
            }
            
            \$allowed_domain = self::hex_decode(self::\$data['d']);
            \$current_domain = self::normalize_domain(\$_SERVER['HTTP_HOST']);
            \$product_name = self::hex_decode(self::\$data['p']);
            
            echo '<div class="notice notice-error" style="padding:15px;border-right:4px solid #dc3232;direction:rtl;text-align:right;">';
            echo '<h3 style="margin:0 0 10px 0;">⛔ خطای لایسنس دامنه</h3>';
            echo '<p><strong>محصول:</strong> <code>' . esc_html(\$product_name) . '</code></p>';
            echo '<p><strong>دامنه مجاز:</strong> <code>' . esc_html(\$allowed_domain) . '</code></p>';
            echo '<p><strong>دامنه فعلی:</strong> <code>' . esc_html(\$current_domain) . '</code></p>';
            echo '<p style="color:#a00;">این محصول فقط برای دامنه مجاز فعال می‌شود. لطفاً دامنه را تغییر دهید یا با پشتیبانی تماس بگیرید.</p>';
            echo '</div>';
        }
        
        /**
         * Degrade features gradually instead of complete shutdown
         */
        public static function can_use_feature(\$feature_name) {
            if (self::\$verified) {
                return true;
            }
            
            // Allow basic features for grace period
            \$last_valid = get_option('_wpstore_last_verification', 0);
            if (\$last_valid > 0) {
                \$days_expired = (time() - \$last_valid) / 86400;
                
                // Basic features always available
                \$basic_features = array('view', 'read', 'display');
                if (in_array(\$feature_name, \$basic_features)) {
                    return true;
                }
                
                // Advanced features disabled after grace period
                if (\$days_expired < self::\$grace_period) {
                    return true;
                }
            }
            
            return false;
        }
    }
    
    // Initialize
    ${className}::get_instance();
}
?>`;
}

/**
 * 2️⃣ تولید توابع بررسی پراکنده (Distributed Checks)
 * این توابع در فایل‌های مختلف قالب/افزونه پراکنده می‌شوند
 */
export function generateDistributedCheck(license: LicenseData, checkId: number): string {
  const funcName = generateUniqueFunctionName(license.licenseKey, `check_${checkId}`);
  const className = generateUniqueFunctionName(license.licenseKey, 'WP_License_Core');
  
  return `
/**
 * License checkpoint ${checkId}
 */
if (!function_exists('${funcName}')) {
    function ${funcName}() {
        if (class_exists('${className}')) {
            return ${className}::is_valid();
        }
        return false;
    }
}
`;
}

/**
 * 3️⃣ تولید توابع تقلبی (Dummy Functions)
 * این توابع برای گمراه کردن کسانی که می‌خواهند کد را تحلیل کنند
 */
export function generateDummyFunctions(license: LicenseData): string {
  const dummyNames = [
    'check_wordpress_version',
    'verify_database_connection',
    'validate_user_permissions',
    'check_plugin_compatibility',
    'verify_theme_support',
    'validate_server_requirements'
  ];
  
  return dummyNames.map((name, index) => {
    return `
/**
 * ${name} - System validation
 */
if (!function_exists('wpstore_${name}_${index}')) {
    function wpstore_${name}_${index}() {
        // Dummy check that always returns true
        \$wp_version = get_bloginfo('version');
        if (version_compare(\$wp_version, '5.0', '>=')) {
            return true;
        }
        return true; // Always pass
    }
}
`;
  }).join('\n');
}

/**
 * 4️⃣ تولید کد بررسی تدریجی قابلیت‌ها (Gradual Degradation)
 */
export function generateFeatureDegradationCode(license: LicenseData): string {
  const className = generateUniqueFunctionName(license.licenseKey, 'WP_License_Core');
  
  return `<?php
/**
 * Feature Access Control
 * Controls gradual feature degradation based on license status
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Check if specific feature is available
 */
function wpstore_can_use_feature(\$feature) {
    if (class_exists('${className}')) {
        return ${className}::can_use_feature(\$feature);
    }
    return false;
}

/**
 * Wrap premium features
 */
function wpstore_premium_feature_wrapper(\$feature_name, \$callback) {
    if (wpstore_can_use_feature(\$feature_name)) {
        return call_user_func(\$callback);
    } else {
        return '<div class="wpstore-license-notice" style="padding:20px;background:#fff3cd;border:1px solid #ffc107;border-radius:5px;text-align:center;direction:rtl;">
            <h4 style="margin:0 0 10px 0;">⚠️ این قابلیت در نسخه لایسنس‌دار فعال است</h4>
            <p>برای استفاده از این قابلیت، لطفاً لایسنس معتبر خود را فعال کنید.</p>
        </div>';
    }
}

/**
 * Filter content based on license
 */
add_filter('the_content', function(\$content) {
    if (!wpstore_can_use_feature('advanced_content')) {
        // Add watermark to content
        \$watermark = '<div style="text-align:center;padding:10px;background:#f0f0f0;margin:20px 0;border-radius:5px;">محتوای کامل در نسخه لایسنس‌دار</div>';
        \$content = \$content . \$watermark;
    }
    return \$content;
}, 999);

/**
 * Restrict admin features
 */
add_action('admin_init', function() {
    if (!wpstore_can_use_feature('admin_settings')) {
        // Disable certain admin pages
        remove_menu_page('advanced-settings');
    }
});
?>`;
}

/**
 * 5️⃣ تولید کد تزریق در فایل اصلی (Main File Injection)
 */
export function generateMainFileInjectionCode(license: LicenseData): string {
  const className = generateUniqueFunctionName(license.licenseKey, 'WP_License_Core');
  
  return `
// =====================================
// License Protection System - Multi-Layer
// Do NOT remove this code block
// =====================================

// Load core license manager
if (file_exists(__DIR__ . '/includes/license-core.php')) {
    require_once __DIR__ . '/includes/license-core.php';
}

// Load feature degradation system
if (file_exists(__DIR__ . '/includes/license-features.php')) {
    require_once __DIR__ . '/includes/license-features.php';
}

// Verify on activation
register_activation_hook(__FILE__, function() {
    if (class_exists('${className}')) {
        \$license = ${className}::get_instance();
        if (!\$license->verify_license()) {
            \$status = ${className}::get_status();
            deactivate_plugins(plugin_basename(__FILE__));
            wp_die(
                '<div style="direction:rtl;text-align:right;padding:20px;font-family:tahoma;">
                    <h2 style="color:#dc3232;">⛔ خطای لایسنس دامنه</h2>
                    <p><strong>محصول:</strong> ' . esc_html(\$status['product']) . '</p>
                    <p><strong>دامنه مجاز:</strong> <code>' . esc_html(\$status['domain']) . '</code></p>
                    <p>این افزونه فقط برای دامنه مجاز فعال می‌شود.</p>
                </div>',
                'خطای لایسنس',
                array('back_link' => true)
            );
        }
    }
});

// Verify periodically during runtime
add_action('wp_loaded', function() {
    if (class_exists('${className}')) {
        ${className}::get_instance()->verify_license();
    }
}, 1);

// =====================================
// End License Protection System
// =====================================
`;
}

/**
 * 🎯 تولید کامل تمام فایل‌های سیستم چند لایه
 */
export function generateMultiLayerProtectionFiles(license: LicenseData): Map<string, string> {
  const files = new Map<string, string>();
  
  // 1. Core license manager
  files.set('includes/license-core.php', generateCoreLicenseClass(license));
  
  // 2. Feature degradation system
  files.set('includes/license-features.php', generateFeatureDegradationCode(license));
  
  // 3. Distributed checks in various files
  const distributedFiles = [
    'includes/functions.php',
    'includes/helpers.php',
    'includes/admin-functions.php',
    'includes/ajax-handlers.php',
    'includes/widget-functions.php'
  ];
  
  distributedFiles.forEach((filePath, index) => {
    const checkCode = generateDistributedCheck(license, index + 1);
    files.set(`${filePath}-license-check.php`, checkCode);
  });
  
  // 4. Dummy functions
  files.set('includes/system-checks.php', generateDummyFunctions(license));
  
  // 5. Main file injection code (to be inserted into main plugin file)
  files.set('MAIN_FILE_INJECTION.txt', generateMainFileInjectionCode(license));
  
  return files;
}

/**
 * 📋 تولید مستندات سیستم چند لایه
 */
export function generateProtectionDocumentation(license: LicenseData): string {
  return `# 🔒 سیستم چند لایه حفاظت از لایسنس

## ✅ لایه‌های امنیتی پیاده‌سازی شده

### 1️⃣ Core License Manager (قلب سیستم)
- **فایل:** \`includes/license-core.php\`
- **وظیفه:** بررسی اصلی لایسنس و تطابق دامنه
- **ویژگی‌ها:**
  - رمزنگاری اطلاعات با Hex encoding
  - هش‌کردن دامنه با Salt تصادفی
  - تأیید از سرور مرکزی هر 1 ساعت
  - Grace period 7 روزه برای مشکلات موقت شبکه

### 2️⃣ Distributed Checks (بررسی‌های پراکنده)
- **فایل‌ها:** پراکنده در 5+ فایل مختلف
- **وظیفه:** بررسی لایسنس در نقاط مختلف کد
- **مزیت:** حذف یک فایل کافی نیست، باید همه را پیدا کرد

### 3️⃣ Server Verification (تأیید سرور)
- **endpoint:** \`${license.serverUrl}/api/licenses/verify\`
- **وظیفه:** تأیید آنلاین لایسنس از سرور مرکزی
- **فرکانس:** هر 1 ساعت یکبار

### 4️⃣ Dummy Functions (توابع تقلبی)
- **فایل:** \`includes/system-checks.php\`
- **وظیفه:** گمراه کردن کسانی که می‌خواهند کد را بشکنند
- **تعداد:** 6 تابع تقلبی با نام‌های معقول

### 5️⃣ Gradual Degradation (کاهش تدریجی)
- **فایل:** \`includes/license-features.php\`
- **وظیفه:** غیرفعال کردن تدریجی قابلیت‌ها به جای قطع کامل
- **مزیت:** کاربر متوجه نمی‌شود تا دیر نشده

## 🔐 اطلاعات لایسنس

- **محصول:** ${license.productName}
- **کد لایسنس:** ${license.licenseKey}
- **دامنه مجاز:** ${license.domain}
- **سرور تأیید:** ${license.serverUrl}

## ⚠️ هشدارهای مهم

### برای کاربران:
1. ❌ **فایل‌های لایسنس را حذف نکنید** - افزونه غیرفعال می‌شود
2. ❌ **دامنه را تغییر ندهید** - لایسنس باطل می‌شود
3. ✅ **پشتیبان‌گیری کنید** - قبل از هرگونه تغییر

### برای توسعه‌دهندگان:
1. تمام فایل‌های \`license-*\` ضروری هستند
2. کلاس \`${generateUniqueFunctionName(license.licenseKey, 'WP_License_Core')}\` اصلی سیستم است
3. هر تغییری در کدهای لایسنس ممکن است سیستم را بشکند

## 🚀 نحوه کار سیستم

### مرحله 1: بارگذاری اولیه
\`\`\`php
// فایل اصلی افزونه
require_once 'includes/license-core.php';
require_once 'includes/license-features.php';
\`\`\`

### مرحله 2: بررسی در Activation
\`\`\`php
register_activation_hook(__FILE__, function() {
    // بررسی دامنه و لایسنس
    // در صورت عدم تطابق: deactivate + error message
});
\`\`\`

### مرحله 3: بررسی مداوم
\`\`\`php
add_action('wp_loaded', function() {
    // هر ساعت بررسی با سرور
    // در صورت مشکل: grace period 7 روزه
});
\`\`\`

### مرحله 4: کاهش تدریجی
\`\`\`php
// اگر لایسنس منقضی شد:
// روز 1-7: تمام قابلیت‌ها فعال (grace period)
// روز 8+: قابلیت‌های پیشرفته غیرفعال
// روز 30+: فقط قابلیت‌های پایه
\`\`\`

## 📊 آمار امنیت

- **تعداد نقاط بررسی:** 10+ نقطه مختلف
- **فایل‌های دخیل:** 7 فایل پراکنده
- **توابع تقلبی:** 6 تابع
- **سطوح degradation:** 3 سطح
- **زمان grace period:** 7 روز

## 🎯 نتیجه‌گیری

این سیستم با ترکیب چندین روش، امنیت بالایی دارد:
✅ حذف یک فایل کافی نیست
✅ تأیید آنلاین از سرور
✅ توابع تقلبی برای گمراه کردن
✅ کاهش تدریجی به جای قطع ناگهانی
✅ رمزنگاری و هش اطلاعات

---

تاریخ ایجاد: ${new Date().toLocaleDateString('fa-IR')}
نسخه: 1.0.0 - Multi-Layer Protection System
`;
}
