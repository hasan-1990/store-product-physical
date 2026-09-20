# shop-starter-v1 — میوز

قالب فروشگاه آنلاین لوازم آرایشی با طراحی **Luminous Editorial** (برند MUSE).

> **توسعه‌دهندگان / AI:** قبل از هر تغییر، [`docs/fullstack-architecture.md`](./docs/fullstack-architecture.md) را بخوانید.  
> هر فیچر باید **فول‌استک** (UI + API + MongoDB) باشد.

## اجرا

```bash
npm install
copy .env.example .env.local

# دیتابیس لوکال آفلاین (بدون Atlas)
npm run db:local
npm run seed

npm run dev
```

یا یک‌جا: `npm run setup`

> راهنمای کامل: [docs/local-database.md](./docs/local-database.md)

### اگر `npm run seed` خطای ECONNREFUSED داد

MongoDB روشن نیست. **Atlas لازم نیست** — فقط:

```powershell
npm run db:local
npm run seed
```

## متغیرهای محیطی

| متغیر | توضیح |
|-------|--------|
| `LICENSED_DOMAIN` | دامنه مجاز (در provisioning خودکار تنظیم می‌شود) |
| `MONGODB_URI` | اتصال دیتابیس اختصاصی مشتری |
| `JWT_SECRET` | کلید امضای توکن ادمین |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ادمین پیش‌فرض (seed) |
| `NEXT_PUBLIC_SITE_NAME` | نام فروشگاه |

ورود پنل: `/admin/login` — پیش‌فرض `admin@muse.local` / `Admin@123`

## مستندات

| فایل | محتوا |
|------|--------|
| [docs/fullstack-architecture.md](./docs/fullstack-architecture.md) | معماری فول‌استک — **الزام قبل از کدنویسی** |
| [template.config.json](./template.config.json) | متادیتای قالب |
| [.env.example](./.env.example) | نمونه env |

## ساختار صفحه اصلی

1. Header — لوگو، منو، آیکون‌ها
2. Hero — تصویر + «زیبایی بازتعریف شد»
3. Features — ارسال سریع، بدون تست حیوانی، ارگانیک
4. Category Grid — ۴ دسته
5. Best Sellers — ۴ محصول
6. Testimonials — ۳ نظر
7. Blog — ۲ مقاله
8. Footer — خبرنامه، لینک‌ها، شبکه‌های اجتماعی

## Build

```bash
npm run build
```

خروجی `standalone` برای deploy روی سرور provisioning.
