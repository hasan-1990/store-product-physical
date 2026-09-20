# معماری پروژه (Architecture)

## ۱. نمای کلی

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (RTL)                        │
│   Server Components  │  Client Components  │  Contexts      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Next.js 15 App Router                    │
│  middleware.ts  │  Pages (~120)  │  API Routes (~200)        │
│  admin/ (~95)   │  lib/ (66 svc) │  modules/next-rocket      │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   ┌─────────┐         ┌──────────┐        ┌───────────┐
   │ MongoDB │         │  Redis   │        │ JSON/data │
   │ 50+ col │         │ (optional)│       │ fallbacks │
   └─────────┘         └──────────┘        └───────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   Zarinpal/Zibal      SMS.ir / SMTP       Gemini/OpenAI
```

## ۲. Tech Stack

| لایه | تکنولوژی |
|------|----------|
| Framework | Next.js 15.5, React 19, TypeScript 5 |
| Styling | Tailwind CSS 3.4, Framer Motion |
| Database | MongoDB (native driver اصلی، Mongoose موجود) |
| Cache | ioredis + in-memory fallback |
| Auth | NextAuth 4 (Credentials) + JWT سفارشی |
| Validation | Zod 4 |
| State | TanStack React Query, React Context |
| Logging | Winston |
| Cron | node-cron + jobs در MongoDB |
| Deploy | Docker, Nginx, Certbot |

## ۳. ساختار پوشه‌ها

```
store-app/
├── src/
│   ├── app/              # App Router: pages + API
│   │   ├── admin/        # پنل مدیریت
│   │   ├── api/          # REST endpoints
│   │   ├── products/     # کاتالوگ
│   │   ├── cart/         # سبد و checkout
│   │   └── ...
│   ├── components/       # ~167 کامپوننت UI
│   ├── contexts/         # Cart, Wishlist, ABTest, SEO
│   ├── hooks/            # 14 custom hook
│   ├── lib/              # سرویس‌ها و utilities
│   ├── modules/          # next-rocket و ماژول‌های قابل فعال‌سازی
│   └── types/
├── data/                 # JSON fallback (site-settings, SEO, cities)
├── scripts/              # seed, backup, maintenance
├── public/uploads/       # فایل‌های آپلود شده
├── php-license-system/   # کلاینت PHP وردپرس
├── duplicator-domain-lock/
├── nginx/
└── project-docs/         # این مستندات
```

## ۴. لایه‌های معماری

### ۴.۱ Presentation Layer
- **Server Components:** داده از DB، SEO metadata، SSR
- **Client Components:** تعامل کاربر، فرم‌ها، انیمیشن
- **الگوی نام‌گذاری:** `*Server.tsx` + `*Client.tsx` برای جداسازی

### ۴.۲ API Layer (`src/app/api/`)
- Route handlers (Next.js App Router)
- احراز هویت: `resolve-request-auth.ts` (NextAuth session یا Bearer JWT)
- ادمین: `requireAdmin()` / `isAdminRole()`
- Validation: Zod schemas

### ۴.۳ Service Layer (`src/lib/`)
ماژول‌های کلیدی:

| ماژول | مسئولیت |
|-------|---------|
| `mongodb.ts` | Singleton connection، 50+ collection getter |
| `jwt.ts` | توکن JWT |
| `input-sanitization.ts` | XSS، NoSQL injection |
| `file-upload-security.ts` | اعتبارسنجی فایل (magic number) |
| `database-security.ts` | Indexهای امنیتی |
| `fallback-storage.ts` | ذخیره موقت وقتی DB در دسترس نیست |
| `cron/` | زمان‌بند و task handlers |
| `payment/` | Zarinpal, Zibal |
| `sms*.ts` | SMS.ir |
| `email*.ts` | SMTP, Resend |

### ۴.۴ Data Layer
- **MongoDB:** دیتابیس `store-app`، collections: users, products, orders, licenses, seo, analytics, cron_jobs, security_logs, ...
- **Redis:** کش session/query (اختیاری)
- **File:** `public/uploads` (Docker volume)
- **JSON fallback:** `data/*.json` برای تنظیمات و SEO

## ۵. جریان‌های اصلی

### ۵.۱ خرید محصول دیجیتال
```
محصول → سبد → checkout → درگاه پرداخت → verify → سفارش
  → تولید لایسنس → ایمیل/SMS → دانلود از پروفایل
```

### ۵.۲ احراز هویت
```
/login → NextAuth Credentials → JWT session (cookie)
/api/* → getToken() یا Authorization: Bearer <jwt>
```

### ۵.۳ URL Routing محصولات
```
/products/[...slug] → تشخیص محصول vs دسته
  → محصول: ProductDetailClient
  → دسته: ProductsClient با فیلتر
/category/[slug] → زیردسته‌ها + redirect اگر leaf
```

### ۵.۴ لایسنس وردپرس
```
خرید → license در MongoDB → PHP client در سایت مشتری
  → verify API → فعال/غیرفعال
```

## ۶. مراحل معماری که باید طی شوند

### فاز ۱ — پایه (✅ انجام شده)
- [x] Next.js App Router setup
- [x] MongoDB singleton + collections
- [x] NextAuth + JWT
- [x] ساختار admin/storefront
- [x] Docker compose

### فاز ۲ — هسته فروشگاه (✅ انجام شده)
- [x] CRUD محصول/دسته/سفارش
- [x] سبد و checkout
- [x] درگاه پرداخت
- [x] آپلود و دانلود
- [x] لایسنس دیجیتال

### فاز ۳ — محتوا و SEO (✅ تکمیل شده)
- [x] URL routing پیشرفته
- [x] SEO admin suite
- [x] رفع باگ لینک زیردسته در `/categories`
- [x] یکپارچه‌سازی fallback SEO با MongoDB
- [x] حذف فایل‌های `.backup` و `*_new`
- [x] SEO قالب `shop-starter-v1` (sitemap, robots, OG, JSON-LD)

> جزئیات فاز ۳: [`seo-phase3.md`](./seo-phase3.md)

### فاز ۴ — ارتباطات (✅ تکمیل شده)
- [x] SMS.ir integration
- [x] Email settings UI
- [x] Cron email queue → `emailService.send()`
- [x] Abandoned cart emails
- [x] یکپارچه‌سازی SMS (`sms-service.ts` facade روی `sms.ts`)

> جزئیات Q3: [`polish-phase-q3.md`](./polish-phase-q3.md)

### فاز ۵ — امنیت و Production Hardening (✅ تکمیل شده)
- [x] Security headers در middleware
- [x] Input sanitization
- [x] bcrypt, rate limit OTP
- [x] غیرفعال‌سازی `/api/debug/*` و `/api/test-*`
- [x] تکمیل maintenance mode در middleware
- [x] حذف JWT fallback secret
- [x] auth check در `/api/admin/wishlist`
- [x] حذف `.env` از Docker image layers
- [x] چک‌لیست deploy خودکار (`deploy:check`, `/api/health/deploy`)

> جزئیات فاز ۵: [`security-phase5.md`](./security-phase5.md)

### فاز ۶ — بهینه‌سازی (✅ Q3 تکمیل)
- [x] Redis cache
- [x] Bundle analyzer
- [x] Next Rocket v1 (startup init)
- [x] پاکسازی variantهای بلااستفاده MultipleDiscountSections
- [x] `npm run perf:audit` + `npm run test`
- [ ] `reactStrictMode: true` (فعلاً false)

> جزئیات: [`polish-phase-q3.md`](./polish-phase-q3.md)

### فاز ۷ — Scale (✅ Q4 تکمیل)

- [x] Redis اجباری در production
- [x] CDN helpers + Nginx edge cache uploads
- [x] Uptime Kuma + Sentry اختیاری
- [x] Backup JSON + cron روزانه
- [x] OpenAPI + `/api/health/scale`

> جزئیات: [`scale-phase-q4.md`](./scale-phase-q4.md)

## ۷. تصمیمات معماری (ADR خلاصه)

| تصمیم | دلیل | معایب |
|-------|------|-------|
| Monolithic Next.js | سرعت توسعه، SSR/SEO | scale افقی سخت‌تر |
| MongoDB | schema انعطاف‌پذیر برای محتوا/SEO | join محدود |
| Dual auth (NextAuth + JWT) | سازگاری API موبایل/legacy | پیچیدگی |
| JSON fallback | resilience وقتی DB down | inconsistency ریسک |
| Server+Client split | performance + interactivity | فایل‌های بیشتر |

## ۸. Deployment Architecture

```
Internet → Nginx (SSL) → Next.js container (:3000)
                              ├── MongoDB container
                              ├── Redis container (required in production)
                              └── uploads volume
         Certbot (SSL renew)
         Uptime Kuma (monitoring)
```

- **Build:** `output: 'standalone'` در next.config
- **Health:** `GET /api/health`, `/api/health/scale`
- **Path alias:** `@/*` → `./src/*`

## ۹. Managed Sites — معماری هدف (Express واحد)

> سند کامل: [docs/MANAGED-SITE-ARCHITECTURE.md](../docs/MANAGED-SITE-ARCHITECTURE.md)

### وضعیت فعلی vs هدف

| لایه | فعلی | هدف |
|------|------|-----|
| هاب `store-app` | Next.js :3000 | Express `core-server` (مهاجرت تدریجی) |
| سایت هر مشتری | clone + port جدا (ناقص) | **همان Express** — host-based routing |
| دیتابیس مشتری | DB جدا | بدون تغییر |
| DNS | رکورد A → IP سرور | بدون تغییر |

### جریان خلاصه

```
خرید قالب → provision (siteInstances + tenant DB + seed + admin)
→ مشتری رکورد A → cron active → Nginx → Express → DB مشتری
```

### ساختار در حال اضافه شدن

```
packages/core-server/   # Express
packages/core-shared/   # lib/db مشترک
site-templates/*/register.ts
```

### Deployment هدف

```
Internet → Nginx (SSL) → Express core-server (:4000)
                              ├── MongoDB (hub + tenant DBs)
                              ├── Redis (tenant cache)
                              └── provisioned-sites/{slug}/uploads
```

Next.js hub تا اتمام فاز مهاجرت موقتاً روی :3000 باقی می‌ماند.

