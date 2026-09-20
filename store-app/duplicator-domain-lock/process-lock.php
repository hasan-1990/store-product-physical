<?php
/**
 * Backend processor for domain lock tool
 */

header('Content-Type: application/json');

// تنظیمات
ini_set('max_execution_time', 300);
ini_set('memory_limit', '512M');

// بررسی متد درخواست
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'متد نامعتبر']);
    exit;
}

// بررسی فایل آپلود شده
if (!isset($_FILES['zipFile']) || $_FILES['zipFile']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'فایل آپلود نشده است']);
    exit;
}

// دریافت پارامترها
$domain = isset($_POST['domain']) ? trim($_POST['domain']) : '';
$expires = isset($_POST['expires']) && !empty($_POST['expires']) ? $_POST['expires'] : null;

// اعتبارسنجی
if (empty($domain)) {
    echo json_encode(['success' => false, 'message' => 'دامنه وارد نشده است']);
    exit;
}

// حذف www و اعتبارسنجی دامنه
$domain = str_replace('www.', '', $domain);
if (!preg_match('/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i', $domain)) {
    echo json_encode(['success' => false, 'message' => 'فرمت دامنه نامعتبر است']);
    exit;
}

try {
    // مسیر فایل آپلود شده
    $uploadedFile = $_FILES['zipFile']['tmp_name'];
    $originalName = $_FILES['zipFile']['name'];
    
    // ایجاد پوشه موقت
    $tempDir = sys_get_temp_dir() . '/duplicator-lock-' . uniqid();
    mkdir($tempDir, 0777, true);
    
    // کپی فایل به پوشه موقت
    $zipPath = $tempDir . '/' . $originalName;
    move_uploaded_file($uploadedFile, $zipPath);
    
    // Include کلاس locker
    require_once __DIR__ . '/lock-backup-tool.php';
    
    // ایجاد instance و قفل‌گذاری
    $locker = new DuplicatorBackupLocker($zipPath, $domain, $expires);
    
    // Redirect خروجی به buffer
    ob_start();
    $lockedFile = $locker->lockBackup();
    $output = ob_get_clean();
    
    // انتقال فایل قفل‌شده به پوشه خروجی
    $outputDir = __DIR__ . '/locked-backups';
    if (!is_dir($outputDir)) {
        mkdir($outputDir, 0777, true);
    }
    
    $finalPath = $outputDir . '/' . basename($lockedFile);
    copy($lockedFile, $finalPath);
    
    // پاکسازی فایل‌های موقت
    array_map('unlink', glob("$tempDir/*"));
    rmdir($tempDir);
    
    // پاسخ موفقیت‌آمیز
    echo json_encode([
        'success' => true,
        'lockedFile' => basename($finalPath),
        'domain' => $domain,
        'expires' => $expires,
        'size' => formatBytes(filesize($finalPath)),
        'downloadUrl' => 'locked-backups/' . basename($finalPath)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}
