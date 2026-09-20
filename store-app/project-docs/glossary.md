# واژه‌نامه پروژه (Glossary)

اصطلاحات تخصصی استفاده‌شده در store-app / فروشگاه هاب.

| اصطلاح | توضیح |
|--------|--------|
| **store-app** | نام npm پروژه؛ اپلیکیشن اصلی Next.js |
| **فروشگاه هاب** | نام تجاری سایت (Hub Store) |
| **App Router** | سیستم routing در Next.js 13+ — پوشه `src/app/` |
| **Server Component** | کامپوننت React که روی سرور render می‌شود — بدون JS به کلاینت |
| **Client Component** | کامپوننت با `"use client"` — تعامل و state در مرورگر |
| **categoryPath** | مسیر سلسله‌مراتبی slug دسته‌ها، مثلاً `plugin/woocommerce` |
| **Leaf category** | دسته بدون زیردسته — باید به `/products/{path}` redirect شود |
| **Slug** | شناسه خوانا در URL، مثلاً `laptop-dell` |
| **Sequential ID** | شماره ترتیبی عددی محصول (مثلاً ۱۲۳) |
| **ObjectId** | شناسه MongoDB (۲۴ کاراکتر hex) |
| **Digital product** | محصول قابل دانلود — فایل، لایسنس، بدون ارسال فیزیکی |
| **License** | کلید فعال‌سازی برای قالب/افزونه وردپرس مشتری |
| **PHP License System** | کلاینت PHP در `php-license-system/` برای verify لایسنس |
| **Duplicator Domain Lock** | ابزار قفل دامنه روی بکاپ ZIP وردپرس |
| **NextAuth** | کتابخانه auth — session با cookie |
| **JWT** | JSON Web Token — برای API Bearer auth |
| **requireAdmin** | تابع بررسی نقش admin در API |
| **Zarinpal / Zibal** | درگاه‌های پرداخت ایرانی |
| **SMS.ir** | سرویس پیامک ایران (`smsir-js`) |
| **Fallback storage** | ذخیره موقت JSON/حافظه وقتی MongoDB در دسترس نیست |
| **Next Rocket** | ماژول بهینه‌سازی performance شبیه WP Rocket |
| **Module settings** | feature flags در MongoDB — فعال/غیرفعال کردن ماژول‌ها |
| **Cron job** | task زمان‌بندی‌شده — از MongoDB لود و با node-cron اجرا |
| **Mega Menu** | منوی چندستونه header |
| **JSON-LD** | structured data برای SEO (Schema.org) |
| **RTL** | Right-to-Left — چیدمان راست به چپ فارسی |
| **Jalali** | تقویم شمسی — `moment-jalaali` |
| **A/B Test** | تست دو نسخه UI برای conversion |
| **Wishlist** | لیست علاقه‌مندی‌های کاربر |
| **OTP** | One-Time Password — کد یکبار مصرف SMS |
| **Standalone output** | build Next.js برای Docker — `output: 'standalone'` |
| **patch-package** | اعمال patch روی node_modules بعد از npm install |
| **Uptime Kuma** | monitoring self-hosted در docker-compose |
| **NoSQL injection** | حمله از طریق query مخرب MongoDB — با sanitize جلوگیری |
| **Magic number** | بایت‌های ابتدایی فایل برای تشخیص نوع واقعی (نه فقط extension) |

## اختصارات مسیر URL

| مسیر | معنی |
|------|------|
| `/categories` | لیست دسته‌های اصلی |
| `/category/{slug}` | صفحه دسته والد + زیردسته‌ها |
| `/products` | همه محصولات |
| `/products/{...slug}` | محصول یا لیست محصولات دسته |
| `/admin/*` | پنل مدیریت |
| `/api/*` | REST API |

## نقش‌های کاربری

| نقش | دسترسی |
|-----|--------|
| `user` | فروشگاه، پروفایل، سفارش |
| `admin` | پنل مدیریت کامل |
| `superadmin` | (در صورت تعریف) دسترسی امنیت و تنظیمات حساس |
