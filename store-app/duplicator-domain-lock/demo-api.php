<?php
/**
 * دمونستریشن نحوه استفاده از API
 * Demo: How to use the Domain Lock API
 */

require_once __DIR__ . '/DomainLockValidator.php';

echo "╔══════════════════════════════════════════════════════════╗\n";
echo "║  Duplicator Domain Lock System - API Demo               ║\n";
echo "╚══════════════════════════════════════════════════════════╝\n\n";

// ========================================
// مثال 1: ایجاد قفل برای یک دامنه
// ========================================
echo "📌 Example 1: Creating a domain lock\n";
echo str_repeat("-", 60) . "\n";

$domain = 'demo-site.com';
$packageHash = 'abc123-20251212';

echo "Domain: $domain\n";
echo "Package: $packageHash\n\n";

try {
    $lockFile = DomainLockValidator::createLock($domain, $packageHash);
    echo "✅ Lock created successfully!\n";
    echo "File: " . basename($lockFile) . "\n\n";
    
    // نمایش محتوای فایل
    $lockData = json_decode(file_get_contents($lockFile), true);
    echo "Lock Data:\n";
    echo "  - Domain Hash: " . substr($lockData['domain_hash'], 0, 32) . "...\n";
    echo "  - Created: " . $lockData['created_at'] . "\n";
    echo "  - Package: " . $lockData['package_hash'] . "\n\n";
    
    // پاکسازی
    unlink($lockFile);
    echo "✓ Demo lock file removed\n\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n\n";
}

// ========================================
// مثال 2: ایجاد قفل با تاریخ انقضا
// ========================================
echo "\n📌 Example 2: Creating a lock with expiration\n";
echo str_repeat("-", 60) . "\n";

$domain = 'trial-site.com';
$packageHash = 'xyz789-20251212';
$expiresAt = date('Y-m-d', strtotime('+30 days'));

echo "Domain: $domain\n";
echo "Package: $packageHash\n";
echo "Expires: $expiresAt\n\n";

try {
    $lockFile = DomainLockValidator::createLock($domain, $packageHash, $expiresAt);
    echo "✅ Lock with expiration created!\n";
    echo "File: " . basename($lockFile) . "\n\n";
    
    $lockData = json_decode(file_get_contents($lockFile), true);
    echo "Lock Data:\n";
    echo "  - Domain Hash: " . substr($lockData['domain_hash'], 0, 32) . "...\n";
    echo "  - Expires At: " . $lockData['expires_at'] . "\n\n";
    
    unlink($lockFile);
    echo "✓ Demo lock file removed\n\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n\n";
}

// ========================================
// مثال 3: نحوه استفاده در installer.php
// ========================================
echo "\n📌 Example 3: Usage in installer.php\n";
echo str_repeat("-", 60) . "\n";

$sampleCode = <<<'CODE'
<?php
// در ابتدای installer.php
require_once __DIR__ . '/DomainLockValidator.php';

// بررسی قفل دامنه
if (!DomainLockValidator::validate()) {
    // اگر دامنه مجاز نیست، صفحه خطا نمایش می‌دهد و متوقف می‌شود
    exit;
}

// ادامه نصب...
CODE;

echo "Sample Code:\n";
echo $sampleCode . "\n\n";

// ========================================
// مثال 4: نمایش تفاوت هش‌ها
// ========================================
echo "\n📌 Example 4: Domain hashing demonstration\n";
echo str_repeat("-", 60) . "\n";

$domains = [
    'example.com',
    'www.example.com',
    'test.com',
    'example.org'
];

echo "Domain hashing results:\n\n";
foreach ($domains as $domain) {
    // برای نمایش، از روش مشابه استفاده می‌کنیم
    $normalized = strtolower(str_replace('www.', '', $domain));
    $hash = hash('sha256', $normalized . DomainLockValidator::class);
    
    echo "  $domain\n";
    echo "    → Normalized: $normalized\n";
    echo "    → Hash: " . substr($hash, 0, 40) . "...\n\n";
}

// ========================================
// مثال 5: مقایسه هش‌ها
// ========================================
echo "\n📌 Example 5: Hash comparison\n";
echo str_repeat("-", 60) . "\n";

$domain1 = 'example.com';
$domain2 = 'www.example.com';

$hash1 = hash('sha256', strtolower(str_replace('www.', '', $domain1)));
$hash2 = hash('sha256', strtolower(str_replace('www.', '', $domain2)));

echo "Comparing:\n";
echo "  $domain1 → " . substr($hash1, 0, 20) . "...\n";
echo "  $domain2 → " . substr($hash2, 0, 20) . "...\n\n";

if ($hash1 === $hash2) {
    echo "✅ Hashes are IDENTICAL (www is ignored)\n\n";
} else {
    echo "❌ Hashes are DIFFERENT\n\n";
}

// ========================================
// نکات امنیتی
// ========================================
echo "\n📌 Security Notes\n";
echo str_repeat("=", 60) . "\n";
echo "1. دامنه به صورت SHA-256 هش می‌شود\n";
echo "2. کاربر نمی‌تواند دامنه اصلی را ببیند\n";
echo "3. تغییر هش بدون SALT امکان‌پذیر نیست\n";
echo "4. www به طور خودکار نادیده گرفته می‌شود\n";
echo "5. فایل قفل در ریشه ZIP قرار می‌گیرد\n";
echo "6. کد بررسی در installer.php تزریق می‌شود\n\n";

// ========================================
// نحوه کار سیستم
// ========================================
echo "\n📌 How it works\n";
echo str_repeat("=", 60) . "\n";
echo "
1️⃣  فایل ZIP بکاپ را باز می‌کنیم
2️⃣  installer.php را استخراج می‌کنیم
3️⃣  کد بررسی دامنه به installer.php اضافه می‌شود
4️⃣  فایل domain-lock.json با هش دامنه ایجاد می‌شود
5️⃣  DomainLockValidator.php به ZIP اضافه می‌شود
6️⃣  فایل‌های جدید در ZIP جایگزین می‌شوند
7️⃣  فایل -LOCKED.zip ذخیره می‌شود

نتیجه: بکاپ فقط روی دامنه تعیین‌شده قابل نصب است! 🔒
\n";

echo str_repeat("=", 60) . "\n";
echo "✅ Demo completed successfully!\n";
echo str_repeat("=", 60) . "\n";
