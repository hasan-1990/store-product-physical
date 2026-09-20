<?php
/**
 * تست سریع سیستم قفل‌گذاری
 * Quick Test Script
 */

echo "=== Duplicator Domain Lock Test ===\n\n";

// 1. بررسی ZipArchive
echo "1. Checking ZipArchive... ";
if (class_exists('ZipArchive')) {
    echo "✅ Available\n";
} else {
    echo "❌ Not Available - Install php-zip\n";
    exit(1);
}

// 2. بررسی فایل ZIP
$zipFile = __DIR__ . '/../w/20251211_d982d8a7d984d8a8d985db8cd986d9_3b846e17e709fd701948_20251211224939_archive.zip';
echo "\n2. Checking backup file... ";
if (file_exists($zipFile)) {
    echo "✅ Found\n";
    echo "   Size: " . round(filesize($zipFile) / 1024 / 1024, 2) . " MB\n";
} else {
    echo "❌ Not Found\n";
    echo "   Looking for: $zipFile\n";
    exit(1);
}

// 3. تست ایجاد قفل
echo "\n3. Testing domain lock creation... ";
require_once __DIR__ . '/DomainLockValidator.php';

try {
    $testDomain = 'test-example.com';
    $lockFile = DomainLockValidator::createLock($testDomain, 'test-hash-123');
    
    if (file_exists($lockFile)) {
        echo "✅ Lock created\n";
        echo "   Lock file: " . basename($lockFile) . "\n";
        
        // خواندن محتوا
        $lockData = json_decode(file_get_contents($lockFile), true);
        echo "   Domain hash: " . substr($lockData['domain_hash'], 0, 20) . "...\n";
        
        // پاکسازی
        unlink($lockFile);
        echo "   ✓ Test file cleaned up\n";
    } else {
        echo "❌ Failed\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

// 4. تست استخراج از ZIP
echo "\n4. Testing ZIP extraction... ";
try {
    $zip = new ZipArchive();
    if ($zip->open($zipFile) === true) {
        $installerContent = $zip->getFromName('installer.php');
        $zip->close();
        
        if ($installerContent) {
            echo "✅ Success\n";
            echo "   installer.php size: " . round(strlen($installerContent) / 1024, 2) . " KB\n";
        } else {
            echo "❌ installer.php not found in ZIP\n";
            exit(1);
        }
    } else {
        echo "❌ Cannot open ZIP\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

// 5. تست کامل قفل‌گذاری
echo "\n5. Testing full lock process... ";
echo "\n   (This may take a few moments...)\n";

try {
    require_once __DIR__ . '/lock-backup-tool.php';
    
    $testDomain = 'my-test-site.com';
    $locker = new DuplicatorBackupLocker($zipFile, $testDomain);
    
    ob_start();
    $lockedFile = $locker->lockBackup();
    $output = ob_get_clean();
    
    if (file_exists($lockedFile)) {
        echo "\n✅ ✅ ✅ LOCKED BACKUP CREATED! ✅ ✅ ✅\n\n";
        echo "   Locked file: " . basename($lockedFile) . "\n";
        echo "   Size: " . round(filesize($lockedFile) / 1024 / 1024, 2) . " MB\n";
        echo "   Domain: $testDomain\n";
        echo "\n📦 File is ready at:\n   $lockedFile\n";
    } else {
        echo "❌ Locked file not created\n";
        exit(1);
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nDebug info:\n";
    echo $e->getTraceAsString();
    exit(1);
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "✅ All tests passed!\n";
echo str_repeat("=", 50) . "\n";
