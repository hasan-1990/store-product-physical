# راهنمای استفاده سریع - Quick Start Guide

## نصب و راه‌اندازی

### ۱. نیازمندی‌ها:
- PHP 7.4 یا بالاتر
- PHP ZipArchive Extension

### ۲. نصب:
```bash
# کپی پوشه duplicator-domain-lock به سرور
# یا کلون کردن از مخزن
```

### ۳. استفاده سریع:

#### **روش CLI (خط فرمان):**

**Windows:**
```cmd
cd duplicator-domain-lock
php lock-backup-tool.php -f "path\to\backup.zip" -d "mysite.com"
```

**Linux/Mac:**
```bash
cd duplicator-domain-lock
php lock-backup-tool.php -f "/path/to/backup.zip" -d "mysite.com"
```

با تاریخ انقضا:
```bash
php lock-backup-tool.php -f "backup.zip" -d "mysite.com" -e "2026-12-31"
```

#### **روش رابط وب:**

1. آپلود پوشه `duplicator-domain-lock` به سرور
2. باز کردن `index.html` در مرورگر:
   ```
   http://yoursite.com/duplicator-domain-lock/index.html
   ```
3. آپلود فایل ZIP بکاپ
4. وارد کردن دامنه (مثال: `mysite.com`)
5. کلیک روی "شروع قفل‌گذاری"
6. دانلود فایل `-LOCKED.zip`

---

## مثال‌های کاربردی

### **مثال ۱: قفل ساده**
```bash
php lock-backup-tool.php -f backup_20251211.zip -d customer-site.com
```

**خروجی:**
```
backup_20251211-LOCKED.zip
```

### **مثال ۲: قفل با انقضا**
```bash
php lock-backup-tool.php -f backup.zip -d demo-site.com -e 2025-06-30
```

این بکاپ فقط تا ۳۰ ژوئن ۲۰۲۵ قابل نصب است.

### **مثال ۳: قفل چندین فایل**
```bash
for file in *.zip; do
    php lock-backup-tool.php -f "$file" -d "client-domain.com"
done
```

---

## تست سریع

### روش اول: اسکریپت تست خودکار

**Windows:**
```cmd
run-test.bat
```

**Linux/Mac:**
```bash
chmod +x run-test.sh
./run-test.sh
```

### روش دوم: تست دستی

```bash
php test-system.php
```

---

## خروجی نمونه

```
🔧 شروع فرآیند قفل‌گذاری...

✅ فایل بکاپ یافت شد: backup_archive.zip
📦 حجم: 366.21 MB

📂 در حال استخراج installer.php...
✅ installer.php استخراج شد

📁 پوشه موقت ایجاد شد

🔐 در حال ایجاد سیستم قفل دامنه...
  ✓ DomainLockValidator.php ایجاد شد
  ✓ domain-lock.json ایجاد شد
  ✓ دامنه هش شد: a4f2b8c9e1d3f7a2...

✏️  در حال اضافه کردن کد قفل به installer.php...
📋 در حال کپی فایل بکاپ...
➕ در حال اضافه کردن فایل‌های قفل به آرشیو...
  ✓ installer.php جدید جایگزین شد
  ✓ DomainLockValidator.php اضافه شد
  ✓ domain-lock.json اضافه شد

✅ ✅ ✅ عملیات با موفقیت انجام شد! ✅ ✅ ✅

📦 فایل قفل‌شده: backup_archive-LOCKED.zip
🔒 دامنه مجاز: mysite.com
📊 حجم: 366.25 MB

🎉 حالا می‌توانید فایل را توزیع کنید!
```

---

## نکات مهم ⚠️

### ۱. **SALT را تغییر دهید!**

قبل از استفاده، SALT را در این فایل‌ها تغییر دهید:

**DomainLockValidator.php** (خط ~12):
```php
private const SALT = 'YOUR_RANDOM_STRONG_SALT_HERE_xyz123ABC!@#';
```

**lock-backup-tool.php** (خط ~155):
```php
$salt = 'YOUR_RANDOM_STRONG_SALT_HERE_xyz123ABC!@#';
```

### ۲. **دامنه بدون www**
```bash
✅ Correct: example.com
❌ Wrong:   www.example.com
```

### ۳. **فرمت تاریخ**
```bash
✅ Correct: 2026-12-31
❌ Wrong:   31/12/2026
```

---

## عیب‌یابی سریع

### خطا: "PHP not found"
```bash
# Windows: نصب PHP از php.net
# Linux: sudo apt install php php-zip
# Mac: brew install php
```

### خطا: "ZipArchive not found"
```bash
# Ubuntu/Debian
sudo apt install php-zip

# CentOS/RHEL
sudo yum install php-zip

# سپس restart PHP
sudo systemctl restart php-fpm
```

### خطا: "Permission denied"
```bash
chmod -R 755 duplicator-domain-lock/
chmod -R 777 duplicator-domain-lock/locked-backups/
```

---

## ساختار فایل قفل‌شده

```
backup-LOCKED.zip
├── installer.php (با کد قفل)
├── DomainLockValidator.php (کلاس بررسی)
├── domain-lock.json (هش دامنه)
├── dup-installer/
└── ... (سایر فایل‌های بکاپ)
```

---

## پشتیبانی

برای راهنمایی بیشتر: [README.md](README.md)

برای گزارش مشکل: ایجاد Issue در GitHub

---

**ساخته شده با ❤️ برای امنیت بیشتر فایل‌های بکاپ Duplicator**
