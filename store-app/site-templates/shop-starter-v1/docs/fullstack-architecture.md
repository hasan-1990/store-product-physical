# معماری فول‌استک قالب‌های Managed Site

> **این سند الزام اجرایی است.**  
> هر توسعه روی `shop-starter-v1` یا قالب جدید در `site-templates/` طبق این معماری انجام می‌شود.

> سند مرجع پلتفرم: [`../../docs/MANAGED-SITE-ARCHITECTURE.md`](../../docs/MANAGED-SITE-ARCHITECTURE.md)

---

## ۱. قبل از هر کار — حتماً بخوان

| اولویت | فایل | چرا |
|--------|------|-----|
| ۱ | `docs/fullstack-architecture.md` | همین سند |
| ۲ | `../../docs/MANAGED-SITE-ARCHITECTURE.md` | Express واحد + provisioning |
| ۳ | `README.md` | اجرا و env |
| ۴ | `template.config.json` | متادیتای قالب |
| ۵ | `.env.example` | متغیرهای محیطی |

---

## ۲. اصل طلایی

```
هر فیچر = UI + API + دیتابیس (+ seed)
```

| مجاز | غیرمجاز |
|------|---------|
| داده از `lib/db/*` یا API Express | آرایه ثابت runtime در `lib/*.ts` |
| seed در `scripts/seed.ts` | mock به‌عنوان منبع اصلی |
| import از داخل **همان قالب** | import از `store-app/src/...` |

---

## ۳. دو محیط: توسعه vs production

### توسعه (local)

```
shop-starter-v1/
  npm run dev    → Next.js برای UI سریع
  npm run seed   → MongoDB محلی
```

### production (سایت مشتری روی سرور)

```
دامنه مشتری → Nginx → Express core-server
                              ↓
                    host → tenant DB
                              ↓
                    template shop-starter-v1 (register.ts)
```

- **هیچ `next start` per مشتری نیست.**
- UI: React build استاتیک یا SSR روی Express (فاز ۲–۳ پلتفرم).
- API: routeهای ثبت‌شده در `register.ts` / `packages/tenant-routes`.

---

## ۴. لایه‌های معماری قالب

### ۴.۱ منطق مشترک (`lib/db/*`)

قابل انتقال به `store-app/packages/core-shared`:

| ماژول | collection |
|--------|------------|
| `products.ts` | products |
| `orders.ts` | orders, cartItems |
| `site-content.ts` | siteContent |
| `content.ts` | promoCodes, addresses, favorites, campaigns |
| `admin.ts` | admins |

### ۴.۲ API استاندارد tenant

| Method | Route | توضیح |
|--------|-------|--------|
| GET | `/api/health` | سلامت DB |
| GET | `/api/products` | لیست |
| GET | `/api/products/:slug` | جزئیات |
| GET/POST/DELETE | `/api/cart` | سبد |
| POST | `/api/orders` | ثبت سفارش |
| GET | `/api/site-content` | محتوای سایت |
| GET | `/api/promo` | اعتبارسنجی کد تخفیف |
| POST | `/api/auth/admin/login` | ورود ادمین سایت |

### ۴.۳ پاسخ JSON

```ts
{ success: true, data: T }
{ success: false, error: string }
```

---

## ۵. MongoDB (هر سایت مشتری — DB جدا)

### Collectionهای حداقلی

| Collection | کاربرد |
|------------|--------|
| `products` | کاتالوگ |
| `cartItems` | سبد (`sessionId`) |
| `orders` | سفارشات |
| `admins` | ورود پنل `/admin` |
| `siteContent` | hero، منو، فیلترها، ... |
| `promoCodes` | کدهای تخفیف |
| `addresses` | آدرس کاربر |
| `favorites` | علاقه‌مندی |
| `campaigns` | بازاریابی (ادمین) |
| `userProfiles` | پروفایل session |

### Index الزامی

- `products.slug` (unique)
- `cartItems.sessionId`
- `orders.sessionId`, `orders.createdAt`
- `promoCodes.code`
- `siteContent.key`

### ادمین پیش‌فرض

`ensureDefaultAdmin()` در seed/provisioning:

```env
ADMIN_EMAIL=admin@muse.local
ADMIN_PASSWORD=Admin@123
```

در production: رمز تصادفی + نمایش در `/user/my-sites` هاب.

---

## ۶. احراز هویت

| نقش | مکانیزم |
|-----|---------|
| ادمین سایت | JWT کوکی `admin_token` |
| مهمان (سبد) | کوکی `cart_session` (UUID) |

---

## ۷. provisioning — آنچه برای هر مشتری ساخته می‌شود

1. `siteInstances` در hub DB
2. MongoDB: `shop_{slug}`
3. `scripts/seed.ts` اجرا → محصولات + siteContent + admin
4. `provisioned-sites/{slug}/uploads/` (فایل اختصاصی)
5. Nginx → Express (نه port جدا)

DNS: رکورد **A** به `SERVER_PUBLIC_IP`.

---

## ۸. ساخت قالب جدید

1. `site-templates/{slug}/`
2. کپی `docs/fullstack-architecture.md`
3. `template.config.json` + `register.ts` + `scripts/seed.ts`
4. `lib/db/*` + API routes
5. `npm run templates:sync`

---

## ۹. env توسعه محلی

```env
MONGODB_URI=mongodb://127.0.0.1:27017/shop_template
JWT_SECRET=dev-secret
ADMIN_EMAIL=admin@muse.local
ADMIN_PASSWORD=Admin@123
```

`LICENSED_DOMAIN` در production توسط provisioning ست می‌شود.

---

## ۱۰. دستورات توسعه

```bash
npm run db:local    # MongoDB محلی
npm run setup       # db + seed
npm run dev         # Next.js dev (UI)
npm run build       # قبل از commit
```

---

## ۱۱. ساختار فعلی `shop-starter-v1`

| بخش | وضعیت |
|-----|--------|
| محصولات، سبد، سفارش | فول‌استک MongoDB |
| siteContent، promo، campaigns | فول‌استک |
| حساب (آدرس، علاقه‌مندی، پروفایل) | فول‌استک session |
| ادمین سایت | فول‌استک |
| production Express | **فاز پلتفرم** — کد آماده، wire به core-server در `store-app` |

---

## ۱۲. چک‌لیست فیچر جدید

- [ ] Schema + index MongoDB
- [ ] `lib/db/{feature}.ts`
- [ ] API route (در قالب؛ بعداً در `register.ts`)
- [ ] UI متصل به API/DB
- [ ] seed در `scripts/seed.ts`
- [ ] `npm run build` سبز
- [ ] بدون import از `store-app/src/`

---

## ۱۳. تعریف «تمام شد»

- داده در MongoDB tenant
- API کار می‌کند
- UI بدون mock runtime
- seed برای provisioning
- سازگار با Express core-server (یا آماده انتقال)

---

*آخرین به‌روزرسانی: هم‌راستا با managed-site-architecture — Express واحد، DB جدا per مشتری، مهاجرت تدریجی از Next.*
