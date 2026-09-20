# راهنمای توسعه (Guidelines)

## ۱. اصول کلی

1. **کمترین تغییر ممکن** — فقط چیزی را تغییر بده که مربوط به task است
2. **هم‌راستا با کد موجود** — نام‌گذاری، ساختار پوشه، و الگوهای فعلی را دنبال کن
3. **Server-first** — پیش‌فرض Server Component؛ `"use client"` فقط برای interactivity
4. **Async همه I/O** — هرگز `.Result` یا `.Wait()` روی Task استفاده نکن
5. **Secret در `.env`** — هرگز token، password، API key در کد هاردکد نکن

---

## ۲. امنیت

### ۲.۱ احراز هویت و مجوز

| قانون | جزئیات |
|-------|--------|
| Admin فقط با `user_id` | هرگز با username چک نکن — قابل تغییر است |
| `requireAdmin()` | همه routeهای `/api/admin/*` باید admin check داشته باشند |
| Session + JWT | از `resolve-request-auth.ts` استفاده کن، نه logic جداگانه |
| OTP rate limit | حداکثر ۳ تلاش در ساعت (پیاده‌سازی شده در login OTP) |

```typescript
// الگوی صحیح در API admin
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}
```

### ۲.۲ ورودی و خروجی

- **Validation:** Zod برای همه body/query ورودی API
- **NoSQL Injection:** `mongo-sanitize` + `sanitizeMongoQuery()`
- **XSS:** `input-sanitization.ts` برای HTML کاربر
- **Upload:** `file-upload-security.ts` — magic number، نوع، حجم
- **خطا به کاربر:** پیام دوستانه؛ stack trace فقط در log

### ۲.۳ Secret و Environment

```
❌ appsettings.json / کد / Docker image
✅ .env.local (dev) / .env.production (prod) / Docker secrets در runtime
```

- `NEXTAUTH_SECRET` و `JWT_SECRET` حداقل ۳۲ کاراکتر تصادفی
- **هرگز** `.env.local` یا `.env.production` را commit نکن
- JWT fallback `'your-jwt-secret-key-here'` را در production حذف کن

### ۲.۴ Headers و Middleware

middleware فعلی این headerها را set می‌کند — حفظ شوند:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: origin-when-cross-origin`

### ۲.۵ Production — ممنوع

- `/api/debug/*`, `/api/test-*`, `/api/simple-test`
- `console.log` با داده حساس یا DEBUG در API
- `Access-Control-Allow-Origin: *` برای endpointهای حساس
- کپی `.env` داخل Docker build layer

### ۲.۶ Rate Limiting

- OTP: ۳/ساعت
- API عمومی: `RATE_LIMIT_ENABLED` + `RATE_LIMIT_MAX_REQUESTS` از env
- برای endpointهای حساس (login, register) همیشه rate limit

---

## ۳. انواع کامپوننت

### ۳.۱ Server Components (پیش‌فرض)

**کی استفاده کنیم:** fetch داده، SEO metadata، محتوای static

```
HeroSliderServer.tsx
page.server.tsx
ProductListServer.tsx
```

**قوانین:**
- بدون `"use client"`
- مستقیم از `lib/mongodb` یا service بخوان
- props ساده به Client Component پاس بده

### ۳.۲ Client Components

**کی استفاده کنیم:** state، event handler، browser API، animation

```
HeroSliderClient.tsx
ProductDetailClient.tsx
CartDrawer.tsx
```

**قوانین:**
- `"use client"` در خط اول
- logic سنگین را به `hooks/` منتقل کن
- fetch با React Query (`@tanstack/react-query`)

### ۳.۳ Server + Client Pair

الگوی استاندارد پروژه:

```
ComponentServer.tsx  → داده از DB
ComponentClient.tsx  → UI تعاملی
page.tsx             → Server را import، Client را با props صدا بزن
```

### ۳.۴ Admin Components

مسیر: `src/components/admin/`

- فرم‌های تنظیمات: controlled state + API call
- جدول‌ها: pagination اجباری برای لیست‌های بزرگ
- Rich editor: TipTap یا Slate (هر دو موجود — یکی را برای feature جدید انتخاب کن)

### ۳.۵ Layout Components

```
Navbar, MegaMenu, Footer, ConditionalNavFooter
CombinedProviders (wrap همه contextها)
```

### ۳.۶ Fallback Components

```
*Fallback.tsx — وقتی DB در دسترس نیست
MultipleDiscountSectionsFallback.tsx
```

فقط برای resilience موقت — نه جایگزین production path

---

## ۴. دستور عمل کدنویسی

### ۴.۱ ساخت API Route جدید

```
src/app/api/[domain]/[action]/route.ts
```

1. Zod schema برای input
2. Auth check (user/admin)
3. Business logic در `lib/` — نه مستقیم در route
4. `try/catch` + log با Winston
5. Response JSON یکسان: `{ success, data, error }`

### ۴.۲ ساخت صفحه Admin

```
src/app/admin/[feature]/page.tsx
```

1. Server Component برای layout
2. Client فقط برای فرم/جدول
3. API متناظر در `src/app/api/admin/[feature]/`

### ۴.۳ کار با MongoDB

```typescript
// ✅ درست — از singleton استفاده کن
import { getDatabase, getProductsCollection } from '@/lib/mongodb';

const col = await getProductsCollection();
const product = await col.findOne({ slug }, { projection: { name: 1, price: 1 } });

// ❌ غلط — new MongoClient در هر request
// ❌ غلط — SELECT * معادل: projection نگذاشتن
```

### ۴.۴ نام‌گذاری

| نوع | الگو | مثال |
|-----|------|------|
| Component | PascalCase | `ProductCard.tsx` |
| Hook | camelCase + use | `useCart.ts` |
| API route | kebab-case path | `/api/discount-codes` |
| lib service | kebab-case file | `input-sanitization.ts` |
| Type | PascalCase | `Product`, `OrderStatus` |
| Collection | snake_case در DB | `discount_codes` |

### ۴.۵ Import

```typescript
import { something } from '@/lib/something';  // ✅ path alias
import { something } from '../../../lib/something';  // ❌
```

### ۴.۶ TypeScript

- `any` ممنوع — `unknown` + narrow
- interface برای API response و model
- type برای union و utility

### ۴.۷ Error Handling

```typescript
try {
  // ...
} catch (error) {
  logger.error('Context description', { userId, error });
  return NextResponse.json(
    { success: false, error: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.' },
    { status: 500 }
  );
}
```

### ۴.۸ Cron Tasks

مسیر: `src/lib/cron/tasks/`

- idempotent باش (اجرای دوباره مشکلی نسازد)
- log شروع/پایان
- خطا را swallow نکن — به admin notify

### ۴.۹ فارسی و RTL

- UI فارسی، `dir="rtl"` در layout
- تاریخ: `moment-jalaali`
- موبایل ایران: validation ۰۹xxxxxxxxx
- قیمت: تومان/ریال — یکسان در کل پروژه

---

## ۵. Git و Commit

```
feat: add discount code validation
fix: correct subcategory URL in categories page
refactor: consolidate SMS service files
docs: update project-docs roadmap
chore: remove debug API routes
```

- هر commit یک concern
- قبل از commit: `npm run lint`
- secret commit نشود

---

## ۶. تست قبل از Deploy

```bash
cd store-app
npm run lint
npm run build
# تست دستی: login, checkout, admin CRUD, payment sandbox
curl http://localhost:3000/api/health
```

Checklist production:
- [ ] DEBUG routes غیرفعال
- [ ] JWT_SECRET و NEXTAUTH_SECRET قوی
- [ ] MAINTENANCE_MODE تست شده
- [ ] SSL فعال
- [ ] Backup MongoDB تنظیم شده
- [ ] Log level = `warn` یا `error`

---

## ۷. Anti-patterns (انجام نده)

| Anti-pattern | جایگزین |
|--------------|---------|
| Logic در Component | `lib/` service یا custom hook |
| فایل `page_new.tsx` کنار `page.tsx` | refactor یا حذف legacy |
| `console.log` در production API | Winston logger |
| Auth check فراموش در admin API | `requireAdmin()` |
| Hardcoded URL | `NEXT_PUBLIC_SITE_URL` |
| Duplicate service (`sms.ts`, `sms-new.ts`) | یک فایل canonical |
| Fallback storage در production | fix DB connection |
