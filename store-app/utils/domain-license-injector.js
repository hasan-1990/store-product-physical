/**
 * سیستم تزریق کد لایسنس دامنه‌ای به افزونه‌های وردپرس
 * این کد به فایل اصلی افزونه اضافه می‌شود تا فقط روی دامنه مجاز کار کند
 */

const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * ساخت نام یکتا برای توابع PHP
 */
function buildLicenseFunctionKey(licenseKey) {
  const sanitized = licenseKey.replace(/[^a-zA-Z0-9]/g, '_');
  const base = `lk_${sanitized}`.replace(/_+/g, '_');
  return /^[a-zA-Z]/.test(base) ? base : `lk_${base}`;
}

/**
 * Normalize کردن domain
 */
function normalizeDomain(domain) {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/:\d+$/, '');
}

/**
 * کد PHP که به افزونه تزریق می‌شود - نسخه هش شده و امن
 */
function generateLicenseCheckerCode(licenseKey, domain, productName) {
  const functionKey = buildLicenseFunctionKey(licenseKey);
  
  // تولید salt تصادفی برای هش
  const salt = crypto.randomBytes(16).toString('hex');
  const normalizedDomain = normalizeDomain(domain);
  const domainHash = crypto.createHash('sha256').update(`${normalizedDomain}${salt}`).digest('hex');
  
  // رمزنگاری اطلاعات به hex
  const domainHex = Buffer.from(domain, 'utf8').toString('hex');
  const productHex = Buffer.from(productName, 'utf8').toString('hex');
  const licenseHex = Buffer.from(licenseKey, 'utf8').toString('hex');
  
  return `<?php
if (!defined('ABSPATH')) {
    exit;
}

if (!function_exists('wpstore_hex_decode_${functionKey}')) {
    function wpstore_hex_decode_${functionKey}(\$hex) {
        if (!is_string(\$hex) || \$hex === '') {
            return '';
        }
        if (!preg_match('/^[0-9a-f]+$/i', \$hex)) {
            return '';
        }
        \$decoded = @pack('H*', \$hex);
        return \$decoded === false ? '' : \$decoded;
    }
}

if (!function_exists('wpstore_normalize_domain_${functionKey}')) {
    function wpstore_normalize_domain_${functionKey}(\$domain) {
        \$d = strtolower(trim(\$domain));
        \$d = preg_replace('/^https?:\\/\\//', '', \$d);
        \$d = preg_replace('/^www\\./', '', \$d);
        \$d = preg_replace('/:\\d+\$/', '', \$d);
        return \$d;
    }
}

if (!function_exists('wpstore_hash_equals_${functionKey}')) {
    function wpstore_hash_equals_${functionKey}(\$known, \$user) {
        if (!is_string(\$known) || !is_string(\$user)) {
            return false;
        }
        if (function_exists('hash_equals')) {
            return hash_equals(\$known, \$user);
        }
        if (strlen(\$known) !== strlen(\$user)) {
            return false;
        }
        \$result = 0;
        for (\$i = 0; \$i < strlen(\$known); \$i++) {
            \$result |= ord(\$known[\$i]) ^ ord(\$user[\$i]);
        }
        return \$result === 0;
    }
}

if (!function_exists('wpstore_license_guard_${functionKey}')) {
    function wpstore_license_guard_${functionKey}() {
        \$salt = '${salt}';
        \$expected_hash = '${domainHash}';
        
        \$current_domain = isset(\$_SERVER['HTTP_HOST']) ? \$_SERVER['HTTP_HOST'] : '';
        \$normalized_domain = wpstore_normalize_domain_${functionKey}(\$current_domain);
        \$current_hash = hash('sha256', \$normalized_domain . \$salt);
        
        if (!wpstore_hash_equals_${functionKey}(\$expected_hash, \$current_hash)) {
            \$allowed_domain = wpstore_hex_decode_${functionKey}('${domainHex}');
            \$product_name = wpstore_hex_decode_${functionKey}('${productHex}');
            \$license_key = wpstore_hex_decode_${functionKey}('${licenseHex}');
            
            add_action('admin_notices', function() use (\$allowed_domain, \$current_domain, \$product_name, \$license_key) {
                ?>
                <div class="notice notice-error">
                    <p><strong>❌ خطای لایسنس دامنه</strong></p>
                    <p>این افزونه فقط برای دامنه <code><?php echo esc_html(\$allowed_domain); ?></code> مجاز است.</p>
                    <p>دامنه فعلی: <code><?php echo esc_html(\$current_domain); ?></code></p>
                    <p>محصول: <?php echo esc_html(\$product_name); ?></p>
                    <p>کد لایسنس: <code><?php echo esc_html(\$license_key); ?></code></p>
                    <p>برای فعالسازی روی دامنه جدید، به‌دلیل داشتن مشکلی جدی افزونه فعال نشد.</p>
                </div>
                <?php
            });
            
            add_action('admin_init', function() {
                deactivate_plugins(plugin_basename(__FILE__));
            });
            
            return false;
        }
        
        return true;
    }
}

add_action('plugins_loaded', 'wpstore_license_guard_${functionKey}', 1);

register_activation_hook(__FILE__, function() {
    if (!wpstore_license_guard_${functionKey}()) {
        \$allowed_domain = wpstore_hex_decode_${functionKey}('${domainHex}');
        \$product_name = wpstore_hex_decode_${functionKey}('${productHex}');
        
        wp_die(
            '<h1>❌ خطای لایسنس دامنه</h1>' .
            '<p>این افزونه (<strong>' . esc_html(\$product_name) . '</strong>) فقط برای دامنه <code>' . esc_html(\$allowed_domain) . '</code> مجاز است.</p>' .
            '<p>دامنه فعلی: <code>' . esc_html(\$_SERVER['HTTP_HOST']) . '</code></p>' .
            '<p>به‌دلیل داشتن مشکلی جدی افزونه فعال نشد.</p>' .
            '<p><a href="' . admin_url('plugins.php') . '">← بازگشت به لیست افزونه‌ها</a></p>',
            'خطای لایسنس',
            array('back_link' => true)
        );
    }
});

?>
`;
}

/**
 * تزریق کد لایسنس به افزونه ZIP
 */
async function injectLicenseToPlugin(
  inputZipPath,
  outputZipPath,
  licenseKey,
  domain,
  productName
) {
  try {
    console.log('📦 شروع تزریق لایسنس به افزونه...');
    console.log('  📁 فایل ورودی:', inputZipPath);
    console.log('  🔑 کد لایسنس:', licenseKey);
    console.log('  🌐 دامنه:', domain);

    // خواندن ZIP
    const zip = new AdmZip(inputZipPath);
    const zipEntries = zip.getEntries();

    // پیدا کردن فایل اصلی افزونه (معمولاً اولین .php)
    let mainPluginFile = null;
    let pluginFolder = null;

    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.php') && !entry.entryName.includes('/')) {
        // فایل PHP در ریشه
        mainPluginFile = entry.entryName;
        break;
      } else if (entry.entryName.match(/^[^/]+\/[^/]+\.php$/)) {
        // فایل PHP در پوشه اول
        if (!mainPluginFile) {
          mainPluginFile = entry.entryName;
          pluginFolder = entry.entryName.split('/')[0];
        }
      }
    }

    if (!mainPluginFile) {
      console.error('❌ فایل اصلی افزونه پیدا نشد!');
      return false;
    }

    console.log('  ✅ فایل اصلی پیدا شد:', mainPluginFile);

    // ایجاد فایل بررسی لایسنس
    const licenseCheckerCode = generateLicenseCheckerCode(licenseKey, domain, productName);
    const licenseFileName = pluginFolder 
      ? `${pluginFolder}/wp-license-checker.php`
      : 'wp-license-checker.php';

    // اضافه کردن فایل بررسی لایسنس
    zip.addFile(licenseFileName, Buffer.from(licenseCheckerCode, 'utf-8'));
    console.log('  ✅ فایل بررسی لایسنس اضافه شد:', licenseFileName);

    // خواندن فایل اصلی افزونه
    const mainFileContent = zip.readAsText(mainPluginFile);

    // اضافه کردن require برای فایل لایسنس در ابتدای فایل اصلی
    const requireStatement = `\n// بارگذاری سیستم بررسی لایسنس دامنه\nrequire_once __DIR__ . '/wp-license-checker.php';\n`;
    
    // پیدا کردن محل مناسب برای تزریق (بعد از <?php)
    let modifiedContent;
    if (mainFileContent.includes('<?php')) {
      modifiedContent = mainFileContent.replace('<?php', '<?php' + requireStatement);
    } else {
      modifiedContent = '<?php' + requireStatement + '\n?>' + mainFileContent;
    }

    // جایگزینی فایل اصلی
    zip.updateFile(mainPluginFile, Buffer.from(modifiedContent, 'utf-8'));
    console.log('  ✅ کد require به فایل اصلی اضافه شد');

    // اضافه کردن فایل‌های اطلاعاتی
    const readmeContent = `لایسنس محصول ${productName}
=====================================

کد لایسنس: ${licenseKey}
دامنه مجاز: ${domain}

⚠️ هشدار مهم:
این افزونه فقط برای دامنه ${domain} مجاز است.
استفاده در دامنه‌های دیگر غیرقانونی بوده و افزونه کار نخواهد کرد.

چگونگی کار:
- افزونه هنگام فعالسازی، دامنه فعلی را بررسی می‌کند
- اگر دامنه با لایسنس مطابقت نداشته باشد، فعالسازی متوقف می‌شود
- در صورت تغییر دامنه، افزونه به صورت خودکار غیرفعال می‌شود

برای پشتیبانی یا دریافت لایسنس جدید با ما تماس بگیرید.
`;

    const licenseInfoFile = pluginFolder
      ? `${pluginFolder}/LICENSE-INFO.txt`
      : 'LICENSE-INFO.txt';
    
    zip.addFile(licenseInfoFile, Buffer.from(readmeContent, 'utf-8'));
    console.log('  ✅ فایل اطلاعات لایسنس اضافه شد');

    // ذخیره ZIP جدید
    zip.writeZip(outputZipPath);
    console.log('  ✅ فایل ZIP جدید ذخیره شد:', outputZipPath);

    return true;

  } catch (error) {
    console.error('❌ خطا در تزریق لایسنس:', error);
    return false;
  }
}

// تست
if (require.main === module) {
  const testInputZip = './public/uploads/digital-products/4c431e14-c080-42f4-aa79-c6a853a26c4c.zip';
  const testOutputZip = './test-licensed-plugin.zip';
  const testLicenseKey = 'TEST-ABCD-1234567890';
  const testDomain = 'example.com';
  const testProductName = 'Test Plugin Pro';

  injectLicenseToPlugin(
    testInputZip,
    testOutputZip,
    testLicenseKey,
    testDomain,
    testProductName
  ).then(success => {
    if (success) {
      console.log('\n✅ تست موفق بود! فایل را امتحان کنید.');
    } else {
      console.log('\n❌ تست ناموفق بود.');
    }
  });
}

module.exports = { injectLicenseToPlugin, generateLicenseCheckerCode };
