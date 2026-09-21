# 🛒 Store-App & Multi-Tenant eCommerce Platform
### Modern E-Commerce, Digital Assets & Automated Site Provisioning

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

**🌐 Multi-Tenant & Custom Domain Engine:** Zero-config automated site provisioning for templates and physical goods.

</div>

---

<details name="lang">
<summary><h3>🇮🇷 مستندات جامع به زبان فارسی (برای مشاهده در همین صفحه کلیک کنید)</h3></summary>

# 🇮🇷 مستندات جامع فارسی

## 📑 فهرست مطالب
1. [معرفی کلی سیستم](#۱-معرفی-کلی-سیستم)
2. [معماری و ساختار فنی](#۲-معماری-و-ساختار-فنی)
3. [امکانات و بخش‌های کاربری (Storefront & Customer Portal)](#۳-امکانات-و-بخشهای-کاربری)
4. [امکانات کامل پنل مدیریت (Admin Dashboard)](#۴-امکانات-کامل-پنل-مدیریت)
5. [سیستم لایسنس، امنیت و قفل فایل‌های دیجیتال](#۵-سیستم-لایسنس-و-امنیت-فایلها)
6. [موتور چندمستاجری و ساخت خودکار سایت (Multi-Tenancy Provisioning)](#۶-موتور-چندمستاجری)
7. [سیستم شتاب‌دهنده Next-Rocket](#۷-سیستم-شتابدهنده-next-rocket)
8. [درگاه‌های پرداخت، پیامک و ایمیل](#۸-درگاههای-پرداخت-پیامک-و-ایمیل)
9. [راهنمای راه‌اندازی و اجرا (Installation & Run)](#۹-راهنمای-راه‌اندازی-و-اجرا)
10. [متغیرهای محیطی (.env)](#۱۰-متغیرهای-محیطی)

---

## ۱. معرفی کلی سیستم
**Store-App** یک پلتفرم فوق پیشرفته فروشگاهی (E-Commerce) است که به صورت تخصصی برای فروش **فایل‌ها و محصولات دیجیتال (قالب‌ها، افزونه‌ها، اسکریپت‌ها و فایل‌های دانلودی)** و همچنین **کالاهای فیزیکی** توسعه داده شده است. این پروژه فراتر از یک فروشگاه ساده است؛ این سامانه به یک **موتور خودکار راه‌اندازی وب‌سایت (Site Provisioning)** مجهز است که مشتری پس از خرید قالب می‌تواند با اتصال دامنه اختصاصی خود، یک سایت مستقل و فعال در عرض چند ثانیه تحویل بگیرد.

---

## ۲. معماری و ساختار فنی

سامانه از معماری هیبریدی دو هسته‌ای (Dual-Engine Architecture) بهره می‌برد:

```
[ کاربر / اینترنت ]
        │
        ▼
   [ Nginx Reverse Proxy (SSL / Port 80 & 443) ]
        │
   ┌────┴───────────────────────────┐
   │                                │
   ▼                                ▼
[ Next.js 15 (Port 3000) ]     [ Core-Server Express 5 (Port 4000) ]
- SSR / SSG / App Router       - Multi-Tenant Host Router
- React 19 Client UI            - Automated Vhost & Provisioning
- NextAuth Authentication       - Standalone API Gateway
- Image & Bundle Optimization   - Cron Workers & Queue
   │                                │
   └─────────────┬──────────────────┘
                 ▼
     [ MongoDB 7.0 & Redis 7 ]
```

* **Frontend Engine:** پیاده‌سازی‌شده با **Next.js 15.5**، معماری App Router، تایپ‌اسکریپت و Tailwind CSS.
* **Backend Core (Core-Server):** وب‌سرور چندمستاجری مبتنی بر **Express 5** برای هدایت ترافیک دامنه‌ها و ساخت هاست‌های مجازی.
* **Database & Cache:** دیتابیس **MongoDB 7.0** با درایور Native برای کوئری‌های سریع + **Redis 7** برای کش پرسرعت.
* **Containerization:** دارای Dockerfile های چندمرحله‌ای بهینه برای بیلد Standalone و ارکستراسیون با Docker Compose.

---

## ۳. امکانات و بخش‌های کاربری

### ۳.۱. ویترین فروشگاه و کاتالوگ محصولات (`/products`, `/categories`)
* **فیلترهای چندگانه و هوشمند:** فیلتر بر اساس دسته‌بندی‌های تو در تو، قیمت، تخفیف‌دار، پرفروش، محصولات ویژه و ویژگی‌های فنی.
* **صفحه جزئیات محصول (`/products/[slug]`):**
  * گالری تصاویر مدرن با قابلیت بزرگ‌نمایی و Modal Responsive.
  * برچسب‌های ضمانت اصالت، دانلود آنی، پیش‌نمایش زنده (Live Demo).
  * ثبت نظرات، امتیازدهی ستاره‌ای با امکان پاسخ‌دهی مدیر.
  * محصولات مرتبط و سیستم پیشنهاد هوشمند محصولات بر اساس تاریخچه بازدید.
* **سیستم وبلاگ و مقالات (`/blog`, `/blog/[slug]`):** ساختار سئو شده با سیستم مطالعه زمان‌بندی شده، مگامنو و برچسب‌ها.

### ۳.۲. سبد خرید و فرآیند تسویه‌حساب (`/cart`, `/checkout`)
* سبد خرید واکنش‌گرا و آنی با ذخیره‌سازی ابری و محلی (Hybrid Cart Sync).
* اعمال کدهای تخفیف درصدی، مبلغی با محدودیت سقف خرید و اعتبار زمانی.
* انتخاب استان و شهر با محاسبه خودکار هزینه ارسال (برای محصولات فیزیکی).
* تفکیک خودکار تسویه‌حساب برای محصولات دانلودی/دیجیتال بدون نیاز به آدرس پستی.

### ۳.۳. درگاه پرداخت و فاکتور (`/payment`, `/invoice/[orderId]`)
* اتصال به درگاه **زرین‌پال (Zarinpal)** و **زیبال (Zibal)** با قابلیت تست در محیط Sandbox.
* صفحات بازگشت شکیل و انیمیشنی برای حالت‌های: پرداخت موفق، ناموفق، انصراف و در حال پردازش.
* صدور فاکتور دیجیتال رسمی با قابلیت چاپ و ذخیره PDF اختصاصی.

### ۳.۴. پرتال و داشبورد کاربری (`/profile`, `/user`)
* **داشبورد مرکزی:** نمایش خلاصه سفارشات، تعداد محصولات دیجیتال، تیکت‌ها و لیست علاقه‌مندی‌ها.
* **بخش دانلودها (`/profile/downloads`):** دسترسی مادام‌العمر به لینک‌های دانلود امن و زمان‌دار فایل‌های خریداری‌شده.
* **مدیریت لایسنس‌ها و سایت‌های من (`/user/my-sites`):** نمایش وضعیت دامنه‌های ثبت‌شده، بررسی خودکار رکوردهای DNS (A Record / CNAME) و راه‌اندازی قالب خریداری‌شده.
* **مدیریت آدرس‌ها (`/profile/addresses`):** ثبت، ویرایش و انتخاب آدرس پیش‌فرض ارسال پستی.
* **سیستم تیکت‌های پشتیبانی (`/profile/tickets`):** ارسال تیکت جدید با اولویت‌بندی، ضمیمه فایل و تاریخچه مکالمات با پشتیبانی.
* **تنظیمات حساب کاربری:** تغییر مشخصات، ویرایش شماره موبایل و تغییر رمز عبور.
* **لیست علاقه‌مندی‌ها (`/wishlist`):** ذخیره و نشان‌کردن محصولات برای خریدهای آتی.

---

## ۴. امکانات کامل پنل مدیریت

پنل مدیریت در مسیر **`/admin`** شامل بیش از ۵۰ ماژول کنترلی جامع است:

| بخش مدیریت | امکانات و کارکرد |
| :--- | :--- |
| **داشبورد تحلیلی (`/admin`)** | نمودارهای فروش ماهانه و هفتگی، آمار درآمد کل، سفارش‌های جدید، کاربران فعال و وضعیت سلامت سرور. |
| **مدیریت محصولات (`/admin/products`)** | تعریف محصول فیزیکی و دانلودی، آپلود فایل دیجیتال، آپلود گالری عکس، تعیین ویژگی‌ها، قیمت و تخفیف زمان‌دار. |
| **مدیریت دسته‌بندی‌ها (`/admin/categories`)** | ایجاد دسته‌بندی‌های چندسطحی، تعیین اسلاگ سئو، آیکون، تصویر شاخص و کنترل اولویت نمایش. |
| **مدیریت سفارشات (`/admin/orders`)** | مشاهده جزئیات پرداخت، وضعیت سفارش (در حال پردازش، ارسال شده، تکمیل شده، لغو شده)، چاپ فاکتور و پیگیری تراکنش. |
| **مدیریت کاربران (`/admin/users`)** | کنترل دسترسی‌ها، تغییر نقش (کاربر عادی، مدیر، پشتیبان)، فعال/غیرفعال‌سازی اکانت و مشاهده خریدهای کاربر. |
| **کدهای تخفیف (`/admin/discount-codes`)** | تعریف کد تخفیف درصدی یا ثابت، محدودیت حداقل خرید، محدودیت تعداد دفعات استفاده و تاریخ انقضا. |
| **سیستم تیکت‌ها (`/admin/tickets`)** | کارتابل پاسخگویی به مشتریان، تغییر وضعیت تیکت (باز، پاسخ‌داده‌شده، بسته)، فیلتر بر اساس دپارتمان. |
| **مدیریت سئو پیشرفته (`/admin/seo`)** | ویرایش Title و Meta Description صفحات، پیکربندی OpenGraph، ریدایرکت‌های ۳۰۱ و ۳۰۲، تولید سایت‌مپ خودکار. |
| **نشانه‌گذاری اسکیما (`/admin/schemas`)** | تنظیم خودکار و دستی Structured Data اسکیماهای Product, Organization, FAQ, Article و Breadcrumb. |
| **قالب‌ها و نمونه‌ها (`/admin/site-templates`)** | تعریف بسته‌های قالب آماده برای فروش، تعیین پوشه سورس، قیمت پایه و اتصال به محصول دانلودی. |
| **سایت‌های ایجادشده (`/admin/site-instances`)** | مانیتورینگ سایت‌های مشتریان، وضعیت Nginx، دیتابیس اختصاصی هر دامنه و فعال/غیرفعال کردن سایت مشتری. |
| **چت‌بات هوش مصنوعی (`/admin/chatbot`)** | اتصال مستقیم به مدل‌های Gemini، تنظیم پرامپت رفتار هوش مصنوعی برای پاسخگویی ۲۴ ساعته به مشتریان. |
| **تنظیمات صفحه اصلی (`/admin/homepage-content`)** | ویرایش بصری اسلایدرها، بنرهای تبلیغاتی، ردیف‌های تب‌دار محصولات، نشان‌های اعتماد و بخش چرا ما. |
| **هدر، فوتر و مگامنو (`/admin/mega-menu-settings`)** | ساخت منوهای چندستونه با عکس و دسته‌بندی، تغییر شبکه‌های اجتماعی، نمادها و متون فوتر. |
| **کرون جابز (`/admin/cron-jobs`)** | مانیتورینگ تسک‌های پس‌زمینه: یادآوری سبد خرید رهاشده، پاک‌سازی کش‌های منقضی، پشتیبان‌گیری منظم دیتابیس. |
| **درگاه و تراکنش‌ها (`/admin/payment-gateway`)** | تنظیم مرچنت‌کد زرین‌پال و زیبال، سوئیچ به حالت تست (Sandbox) و بررسی لاگ تراکنش‌ها. |
| **پیامک و اعتبارسنجی (`/admin/sms`)** | تنظیم وب‌سرویس SMS.ir، پترن‌های پیامکی ارسال کد تایید (OTP)، پیامک ثبت سفارش و تغییر وضعیت. |
| **تنظیمات ایمیل (`/admin/email-settings`)** | پیکربندی SMTP محلی یا اکانت‌های Gmail/SendGrid با پیش‌نمایش قالب ایمیل‌ها. |
| **مدیریت فایل‌ها (`/admin/file-manager`)** | فایل‌منیجر پیشرفته با قابلیت ریسایز خودکار تصاویر به فرمت مدرن WebP و فشرده‌سازی خودکار. |
| **تست A/B (`/admin/ab-testing`)** | تعریف تست‌های چندمتغیره برای سنجش نرخ تبدیل در بنرها و صفحات محصول. |
| **تنظیمات فونت و ظاهر (`/admin/fonts`)** | انتخاب و فعال‌سازی انواع فونت‌های محبوب فارسی (ایران‌یکان، وزیرمتن، ساحل، شبنم و بیست فونت دیگر). |

---

## ۵. سیستم لایسنس و امنیت فایل‌ها
* **قفل‌گذاری دامنه (Domain Lock):** تزریق خودکار لایسنس و قفل دامنه به فایل‌های ZIP قبل از تحویل به مشتری؛ به طوری که اسکریپت یا قالب دانلودشده تنها روی دامنه‌ای که خریدار تعیین کرده کار می‌کند.
* **لینک‌های دانلود امن و امضاشده:** لینک‌های دانلود مستقیم در دسترس عموم نیستند؛ توکن‌های اعتبارسنجی شده بر اساس نشست کاربر با تاریخ انقضا تولید می‌شوند تا از اشتراک‌گذاری غیرمجاز جلوگیری شود.
* **محافظت در برابر XSS و NoSQL Injection:** فیلترسازی ورودی‌ها با پکیج‌های امنیتی، Sanitization کوئری‌ها و تنظیم کامل Security Headers.

---

## ۶. موتور چندمستاجری (Multi-Tenancy Provisioning)
این سیستم شامل یک زیرسیستم کامل با نام **Core-Server** است:
1. مشتری قالب مورد نظر خود را خریداری کرده و دامنه خود (مثلاً `myshop.ir`) را در پنل وارد می‌کند.
2. سیستم بررسی وضعیت DNS دامنه مشتری را چک می‌کند.
3. موتور Provisioning به طور خودکار:
   * پوشه آپلودهای مستقل برای دامنه می‌سازد.
   * یک دیتابیس اختصاصی در MongoDB ایجاد کرده و محتوای دمو (Seed Data) را در آن تزریق می‌کند.
   * فایل کانفیگ اختصاصی Nginx را به طور خودکار در مسیر `/etc/nginx/sites` می‌نویسد و Nginx را Reload می‌کند.
   * سایت مشتری به صورت اختصاصی با دامنه خودش و ادمین مجزا بالا می‌آید.

---

## ۷. سیستم شتاب‌دهنده Next-Rocket
ماژول اختصاصی تعبیه‌شده در پروژه جهت ارتقای استانداردهای Google PageSpeed:
* کش درون‌حافظه‌ای و Redis برای داده‌های سنگین.
* تبدیل خودکار تصاویر به WebP با ابعاد ریسپانسیو.
* بهینه‌سازی بارگذاری کدهای CSS بحرانی (Critical CSS) و پاک‌سازی کدهای بلااستفاده.
* پیش‌بارگذاری هوشمند لینک‌ها (Intelligent Preload) قبل از کلیک کاربر.

---

## ۸. درگاه‌های پرداخت، پیامک و ایمیل
* **پرداخت:** زرین‌پال (Zarinpal) با کدهای وضعیت خطا و پیام‌های راهنما + زیبال (Zibal).
* **سامانه پیامکی:** متصل به وب‌سرویس سریع **SMS.ir** با ارسال فوق‌العاده سریع از طریق پترن خط خدماتی (OTP بدون بلاک بلک‌لیست مخابرات).
* **ایمیل:** پشتیبانی از حالت Direct Local SMTP و اکانت‌های خارجی (Nodemailer و React-Email با تمپلیت‌های فارسی فوق‌العاده شکیل).

---

## ۹. راهنمای راه‌اندازی و اجرا

### پیش‌نیازها
* **Node.js**: نسخه ۲۰ یا بالاتر (پیشنهادی: Node 22)
* **MongoDB**: نسخه ۶ یا ۷ (محلی یا MongoDB Atlas)
* **Redis**: اختیاری (برای کشینگ و بهبود پرفورمنس)
* **Docker**: اختیاری (برای دیپلوی سریع و کانتینری)

### مراحل اجرا در محیط محلی (Local Development)

```bash
# ۱. کلون کردن ریپازیتوری
git clone <REPO_URL>
cd site/store-app

# ۲. نصب وابستگی‌ها
npm install

# ۳. آماده‌سازی فایل تنظیمات محیطی
cp .env.example .env.local
# (سپس آدرس دیتابیس و اطلاعات دلخواه را در .env.local ویرایش کنید)

# ۴. اجرای فرانت‌اند و فروشگاه
npm run dev
# سایت روی http://localhost:3000 بالا می‌آید

# ۵. (اختیاری) اجرای سرور هسته چندمستاجری Core-Server در یک ترمینال دیگر
npm run core:dev
# سرور اکسپرس روی http://localhost:4000 آماده به کار می‌شود
```

### ساخت ادمین در دیتابیس لوکال
اگر دیتابیس خالی است، با این دستور کاربر ادمین را بسازید:
```bash
node create-new-admin.js
```
* **ایمیل:** `admin@example.com`
* **رمز عبور:** `Admin@123456`
* **ورود:** `http://localhost:3000/admin/login`

### دیپلوی و بیلد پروداکشن
```bash
# بیلد بهینه Standalone
npm run build

# اجرای سرور پروداکشن
npm start
```

### اجرا با Docker Compose
```bash
# اجرای کل استک (MongoDB, Redis, Nginx, Core-Server)
docker compose up -d --build
```

---

## ۱۰. متغیرهای محیطی

| متغیر | توضیحات | نمونه مقدار |
| :--- | :--- | :--- |
| `MONGODB_URI` | رشته اتصال به پایگاه داده MongoDB | `mongodb://localhost:27017/store-app` |
| `NEXTAUTH_SECRET` | کلید هش و امضای نشست‌های لاگین (حداقل ۳۲ کاراکتر) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | آدرس مبدا سایت برای احراز هویت | `http://localhost:3000` |
| `JWT_SECRET` | کلید اختصاصی رمزنگاری توکن‌های امنیتی | یک رشته امن و رندوم |
| `REDIS_ENABLED` | فعال‌سازی کش ردیس | `true` یا `false` |
| `REDIS_URL` | آدرس اتصال به ردیس | `redis://localhost:6379` |
| `SMSIR_API_KEY` | کلید وب‌سرویس پیامکی SMS.ir | توکن احراز هویت پنل |
| `ZARINPAL_MERCHANT_ID` | مرچنت‌کد درگاه پرداخت زرین‌پال | شناسه درگاه بانکی |
| `CORE_API_URL` | آدرس سرور اکسپرس در حالت توسعه | `http://127.0.0.1:4000` |

</details>

<details name="lang" open>
<summary><h3>🇬🇧 English Documentation (Default - Click to collapse)</h3></summary>

## Table of Contents
1. [Overview](#1-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Storefront & Customer Features](#3-storefront--customer-features)
4. [Admin Management Panel](#4-admin-management-panel)
5. [License Engine & Security](#5-license-engine--security)
6. [Multi-Tenant Provisioning](#6-multi-tenant-provisioning)
7. [Next-Rocket Performance Accelerator](#7-next-rocket-performance-accelerator)
8. [Payment Gateways, SMS & Email](#8-payment-gateways-sms--email)
9. [Installation & Getting Started](#9-installation--getting-started)
10. [Environment Variables](#10-environment-variables)
11. [License](#11-license)

---

## 1. Overview
**Store-App** is an enterprise-grade, full-stack eCommerce platform specifically engineered for digital products (scripts, CMS templates, downloadable files) as well as physical goods. 

Beyond standard online store features, it includes a turnkey **Automated Site Provisioning & Multi-Tenant Engine**. When customers purchase a website template, they can link their custom domain to receive an isolated, live website with automated DNS verification and Nginx virtual host configurations in seconds.

---

## 2. Technical Architecture

Built on an optimized dual-engine hybrid architecture:

```
[ User / Internet ]
        │
        ▼
   [ Nginx Reverse Proxy (SSL / Port 80 & 443) ]
        │
   ┌────┴───────────────────────────┐
   │                                │
   ▼                                ▼
[ Next.js 15 (Port 3000) ]     [ Core-Server Express 5 (Port 4000) ]
- SSR / SSG / App Router       - Multi-Tenant Host Router
- React 19 Client UI            - Automated Vhost & Provisioning
- NextAuth Authentication       - Standalone API Gateway
- Image & Bundle Optimization   - Cron Workers & Queue
   │                                │
   └─────────────┬──────────────────┘
                 ▼
     [ MongoDB 7.0 & Redis 7 ]
```

* **Frontend Engine:** Powered by **Next.js 15.5** (App Router), **React 19**, **TypeScript 5**, and **Tailwind CSS 3.4**.
* **Core Server Backend:** **Express 5** server orchestrating multi-tenant host routing, tenant database creation, and dynamic Nginx reverse proxy management.
* **Storage & Caching:** **MongoDB 7.0** with native high-performance driver connections + **Redis 7** for fast memory caching and session persistence.
* **DevOps Ready:** Multi-stage standalone Docker builds, Nginx reverse proxy, automated Certbot SSL, and Uptime Kuma monitoring.

---

## 3. Storefront & Customer Features

### 3.1. Catalog & Advanced Filtering (`/products`, `/categories`)
* **Multi-Faceted Search:** Filter by nested categories, price range, discounts, bestselling items, featured items, and custom technical specifications.
* **Product Detail Page (`/products/[slug]`):**
  * Modern responsive image gallery with modal zoom.
  * Badges for authenticity guarantee, instant digital download, and live interactive demo links.
  * Customer reviews and 5-star ratings with admin response capabilities.
  * AI-driven related product recommendations based on browsing behavior.
* **Blog & Article Engine (`/blog`, `/blog/[slug]`):** SEO-optimized articles with reading time estimates, category tag clouds, and mega-menu integration.

### 3.2. Cart & Checkout (`/cart`, `/checkout`)
* Hybrid real-time cart synchronization (Local + Cloud storage).
* Support for fixed and percentage-based promo discount codes with expiration and minimum order rules.
* Province and city selector with automated shipping cost calculation for physical items.
* Automatic digital checkout bypass for instant downloads (no postal address required).

### 3.3. Payment & Digital Invoicing (`/payment`, `/invoice/[orderId]`)
* Official gateway integrations with **Zarinpal** and **Zibal** (including sandbox environment support).
* Clean payment outcome screens (success, failed, cancelled, and pending).
* Automated official digital invoices with printable PDF generation.

### 3.4. Customer Portal & Dashboard (`/profile`, `/user`)
* **Central Dashboard:** Overview of recent orders, active digital downloads, support tickets, and wishlist items.
* **Secure Download Repository (`/profile/downloads`):** Lifetime access to temporary, signed expiring download URLs.
* **My Sites & License Manager (`/user/my-sites`):** Manage registered domains, run automated DNS A-record/CNAME verifications, and launch purchased templates.
* **Address Book (`/profile/addresses`):** Save and manage default physical shipping destinations.
* **Support Ticket Desk (`/profile/tickets`):** Submit priority tickets with file attachments and threaded admin responses.
* **Profile Settings:** Update personal details, mobile numbers, and passwords.
* **Wishlist (`/wishlist`):** Bookmark items for future purchases.

---

## 4. Admin Management Panel

Accessible at **`/admin`**, providing 50+ enterprise control modules:

| Admin Module | Capabilities & Description |
| :--- | :--- |
| **Analytical Dashboard (`/admin`)** | Real-time revenue charts, order velocity, sales analytics, active users, and system health status. |
| **Catalog Manager (`/admin/products`)** | Physical & digital product creation, file uploads, automated WebP image transformation, attributes, and scheduled discounts. |
| **Category Hierarchy (`/admin/categories`)** | Multi-level category tree, SEO slug generator, custom icons, featured images, and display priority ordering. |
| **Order Processing (`/admin/orders`)** | Payment verification logs, status pipeline (processing, shipped, completed, cancelled), and invoice printing. |
| **User Management (`/admin/users`)** | Role-based access control (Admin, User, Support), account suspension/activation, and user purchase history. |
| **Discount Engine (`/admin/discount-codes`)** | Fixed/percentage coupon creation, minimum spend criteria, per-user usage limits, and expiration dates. |
| **Support Helpdesk (`/admin/tickets`)** | Customer inquiry management, ticket status triage (Open, Answered, Closed), and department filtering. |
| **Advanced SEO Suite (`/admin/seo`)** | Page title & meta description management, OpenGraph configs, 301/302 URL redirects, and automated sitemap generator. |
| **Structured Data & Schema (`/admin/schemas`)** | Visual management of Schema.org JSON-LD (Product, Organization, FAQ, Article, Breadcrumb). |
| **Site Templates (`/admin/site-templates`)** | Package reusable site templates, define source folders, set baseline pricing, and link to downloadable products. |
| **Managed Instances (`/admin/site-instances`)** | Monitor provisioned customer websites, Nginx virtual host status, isolated database mapping, and domain controls. |
| **AI Assistant (`/admin/chatbot`)** | Google Gemini AI integration with customizable system prompts for 24/7 autonomous customer support. |
| **Homepage Visual Editor (`/admin/homepage-content`)** | Drag-and-drop editing of hero carousels, promotion banners, product showcase tabs, and trust badges. |
| **Header & Mega-Menu (`/admin/mega-menu-settings`)** | Multi-column dropdown menus with category thumbnails, social media links, and custom footer widgets. |
| **Background Cron Tasks (`/admin/cron-jobs`)** | Background task monitor: abandoned cart reminders, expired cache purges, and automated database backups. |
| **Payment Gateways (`/admin/payment-gateway`)** | Configure merchant credentials for Zarinpal and Zibal, toggle Sandbox mode, and inspect transaction logs. |
| **SMS & OTP (`/admin/sms`)** | SMS.ir gateway configuration, fast-pattern OTP templates, and order status notifications. |
| **Email Transports (`/admin/email-settings`)** | SMTP / Gmail / SendGrid integration with live HTML email template previewer. |
| **Asset Manager (`/admin/file-manager`)** | Integrated media library with automated WebP image conversion and responsive compression. |
| **A/B Testing (`/admin/ab-testing`)** | Run multi-variant conversion tests on homepage banners and product landing pages. |
| **Typography & Theme (`/admin/fonts`)** | Font selector supporting modern web typography and Persian/Arabic typefaces. |

---

## 5. License Engine & Security
* **Domain Lock Protection:** Built-in licensing mechanism that binds downloaded scripts and templates to customer-authorized domains.
* **Signed Download Links:** Download links are protected behind temporary signed tokens, preventing link sharing or unauthorized hotlinking.
* **Security Hardening:** Enterprise rate limiting, CSRF mitigation, input sanitization against NoSQL injection, and strict Content Security Policies (CSP).

---

## 6. Multi-Tenant Provisioning
1. Customer purchases a site template and assigns their custom domain (e.g. `myshop.com`).
2. Automated DNS checker queries A-records and CNAME entries to verify proper DNS resolution.
3. The Provisioning engine automatically:
   * Allocates an isolated file upload directory.
   * Generates an isolated MongoDB database and seeds starter demo data.
   * Creates an Nginx server block in `/etc/nginx/sites` and gracefully reloads Nginx.
   * Deploys the customer's standalone store instance with unique admin credentials.

---

## 7. Next-Rocket Performance Accelerator
Custom performance module engineered for maximum Google PageSpeed scores:
* In-memory cache layer + Redis for heavy queries.
* Automated responsive image conversion to WebP format.
* Critical CSS inlining and unused code elimination.
* Intelligent route preloading before user interaction.

---

## 8. Payment Gateways, SMS & Email
* **Payments:** Official support for **Zarinpal** (with error mapping and sandbox mode) + **Zibal**.
* **SMS Gateway:** High-speed integration with **SMS.ir** utilizing service line OTP patterns to bypass telecom blacklists.
* **Email:** Direct local SMTP and external SMTP provider support with responsive HTML email templates.

---

## 9. Installation & Getting Started

### Prerequisites
* **Node.js**: v20 or higher (Node 22 recommended)
* **MongoDB**: v6.0 or v7.0 (Local instance or MongoDB Atlas)
* **Redis**: Optional (for performance caching)
* **Docker**: Optional (for containerized deployment)

### Local Development Setup

```bash
# 1. Clone the repository
git clone <REPO_URL>
cd site/store-app

# 2. Install dependencies
npm install

# 3. Setup environment configuration
cp .env.example .env.local
# (Edit your database connection and credentials in .env.local)

# 4. Start Next.js frontend
npm run dev
# Application will run at http://localhost:3000

# 5. (Optional) Start Express Core-Server in a separate terminal
npm run core:dev
# Core API will run at http://localhost:4000
```

### Create Initial Administrator
To create the first admin user in an empty database:
```bash
node create-new-admin.js
```
* **Email:** `admin@example.com`
* **Password:** `Admin@123456`
* **Login URL:** `http://localhost:3000/admin/login`

### Production Build & Deployment
```bash
# Standalone optimized build
npm run build

# Start production server
npm start
```

### Running with Docker Compose
```bash
# Launch entire stack (Next.js, Core-Server, MongoDB, Redis, Nginx)
docker compose up -d --build
```

---

## 10. Environment Variables

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/store-app` |
| `NEXTAUTH_SECRET` | NextAuth session signing key (32+ chars) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical app URL for authentication | `http://localhost:3000` |
| `JWT_SECRET` | Custom JWT secret token | Random secure string |
| `REDIS_ENABLED` | Enable Redis caching layer | `true` / `false` |
| `REDIS_URL` | Redis server address | `redis://localhost:6379` |
| `SMSIR_API_KEY` | SMS.ir API authentication token | Your SMS.ir API Key |
| `ZARINPAL_MERCHANT_ID` | Zarinpal merchant gateway ID | Merchant UUID |
| `CORE_API_URL` | Express Core-Server internal URL | `http://127.0.0.1:4000` |

---

## 11. License
This project is licensed under the MIT License.

</details>