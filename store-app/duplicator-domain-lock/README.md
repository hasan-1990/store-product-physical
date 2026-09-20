# Duplicator Domain Lock System 🔒

سیستم قفل‌گذاری دامنه برای فایل‌های بکاپ Duplicator

## 📋 فایل‌های پروژه

```
duplicator-domain-lock/
├── DomainLockValidator.php    # کلاس اصلی اعتبارسنجی دامنه
├── lock-backup-tool.php       # ابزار CLI برای قفل‌گذاری
├── index.html                 # رابط کاربری وب
├── process-lock.php           # Backend پردازش درخواست‌ها
├── locked-backups/            # پوشه خروجی فایل‌های قفل‌شده
└── README.md                  # این فایل
```

## 🎯 ویژگی‌ها

- ✅ **هش‌سازی SHA-256**: دامنه به صورت ایمن هش می‌شود
- ✅ **عدم قابلیت تغییر**: کاربر نمی‌تواند دامنه را ببیند یا تغییر دهد
- ✅ **تاریخ انقضا**: امکان تعیین تاریخ انقضا برای بکاپ
- ✅ **رابط وب**: استفاده آسان با رابط گرافیکی
- ✅ **CLI Tool**: برای استفاده پیشرفته در خط فرمان

## 🚀 نحوه استفاده

### روش 1: استفاده از رابط وب (آسان)

1. فایل‌ها را روی سرور آپلود کنید
2. به `index.html` در مرورگر بروید
3. فایل ZIP بکاپ را انتخاب کنید
4. دامنه مجاز را وارد کنید (مثال: `mysite.com`)
5. روی "شروع قفل‌گذاری" کلیک کنید
6. فایل قفل‌شده را دانلود کنید

### روش 2: استفاده از CLI (پیشرفته)

```bash
php lock-backup-tool.php -f backup.zip -d example.com
```

با تاریخ انقضا:
```bash
php lock-backup-tool.php -f backup.zip -d example.com -e 2026-12-31
```

## 📦 خروجی

فایل خروجی با پسوند `-LOCKED.zip` ایجاد می‌شود:

```
backup_archive.zip  →  backup_archive-LOCKED.zip
```

## 🔐 نحوه کار

1. **استخراج**: فایل `installer.php` از ZIP استخراج می‌شود
2. **تزریق کد**: کد بررسی دامنه به `installer.php` اضافه می‌شود
3. **ایجاد قفل**: فایل `domain-lock.json` با هش دامنه ایجاد می‌شود
4. **بسته‌بندی**: فایل‌های جدید در ZIP جایگزین می‌شوند

## 🛡️ امنیت

- دامنه با **SHA-256** و **SALT** هش می‌شود
- هش در فایل `domain-lock.json` ذخیره می‌شود
- کاربر **هیچ راهی** برای مشاهده یا تغییر دامنه ندارد
- کد چک‌کننده در بدنه `installer.php` تزریق می‌شود

## ⚙️ تنظیمات

### تغییر SALT (مهم!)

در فایل `DomainLockValidator.php`:

```php
private const SALT = 'YOUR_RANDOM_SALT_HERE_CHANGE_THIS';
```

**توجه**: SALT باید در هر دو فایل یکسان باشد:
- `DomainLockValidator.php`
- `lock-backup-tool.php`

## 📝 مثال استفاده

```bash
# قفل‌گذاری بکاپ برای دامنه myshop.com
php lock-backup-tool.php \
    -f 20251211_backup_archive.zip \
    -d myshop.com

# با تاریخ انقضا
php lock-backup-tool.php \
    -f 20251211_backup_archive.zip \
    -d myshop.com \
    -e 2026-06-30
```

## 🧪 تست

برای تست سیستم:

1. یک بکاپ نمونه ایجاد کنید
2. آن را قفل کنید برای دامنه `test.local`
3. فایل ZIP را استخراج و `installer.php` را اجرا کنید
4. اگر روی دامنه دیگری اجرا شود، پیام خطا نمایش داده می‌شود

## 🎨 صفحه خطا

اگر کسی بخواهد بکاپ را روی دامنه دیگری نصب کند، صفحه زیبای خطا نمایش داده می‌شود:

- 🔒 آیکون قفل
- نمایش دامنه فعلی
- اطلاعات بسته
- تاریخ ایجاد و انقضا
- پیام راهنما برای کاربر

## 📄 الزامات

- PHP 7.4+
- PHP ZipArchive extension
- دسترسی نوشتن به فایل

## 🔧 عیب‌یابی

### خطا: "ZipArchive not found"
```bash
# نصب extension در Ubuntu/Debian
sudo apt-get install php-zip

# نصب در CentOS/RHEL
sudo yum install php-zip
```

### خطا: "Permission denied"
```bash
# اعطای دسترسی نوشتن
chmod 755 duplicator-domain-lock/
chmod 666 duplicator-domain-lock/locked-backups/
```

## 📞 پشتیبانی

برای گزارش باگ یا پیشنهادات، Issue ایجاد کنید.

## 📜 License

این سیستم برای محافظت از فایل‌های بکاپ Duplicator طراحی شده است.

---

**نکته مهم**: حتماً SALT را تغییر دهید تا امنیت بیشتری داشته باشید!
