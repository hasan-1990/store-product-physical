# فاز ۳ — مهاجرت API هاب به Express (دسته ۱)

> مسیر: `docs/CORE-MIGRATION-PHASE-3.md`  
> پیش‌نیاز: فاز ۱–۲b ✅

## هدف

APIهای **managed site** و **عمومی** هاب روی `core-server` با `connectHubDb` — موازی با Next.js تا Nginx سوئیچ کند.

## احراز هویت Express

| روش | پشتیبانی |
|-----|----------|
| `Authorization: Bearer <JWT>` | ✅ |
| Cookie `token` | ✅ |
| NextAuth session cookie | ❌ (فعلاً — UI هاب هنوز Next) |

`JWT_SECRET` باید با هاب یکسان باشد.

## چک‌لیست APIهای منتقل‌شده (دسته ۱)

### عمومی

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/public-settings` | GET | ✅ |
| `/api/site-templates` | GET | ✅ |
| `/api/site-templates/:slug` | GET | ✅ |
| `/api/instances/verify` | POST | ✅ |
| `/api/health/hub` | GET | ✅ |

### کاربر (JWT)

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/user/my-sites` | GET | ✅ |
| `/api/user/my-sites/:slug/check-dns` | POST | ✅ |

### ادمین (JWT + role=admin)

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/admin/site-instances` | GET | ✅ |
| `/api/admin/site-instances/:slug` | GET, PATCH | ✅ |
| `/api/admin/site-templates` | GET, POST | ✅ |

## ساختار کد

```
packages/core-server/src/hub/
  register.ts
  auth.ts, middleware.ts
  services/public-settings.ts, site-instances.ts
  routes/managed-sites.ts
```

## تست

```powershell
npm run core:dev

curl http://localhost:4000/api/public-settings
curl http://localhost:4000/api/site-templates
curl http://localhost:4000/api/health/hub

curl -H "Authorization: Bearer YOUR_JWT" http://localhost:4000/api/user/my-sites
```

## هنوز روی Next (دسته‌های بعدی فاز ۳)

- [ ] `/api/auth/*` (ورود، ثبت‌نام، OTP)
- [ ] `/api/products`, `/api/cart`, `/api/orders` (فروشگاه هاب)
- [ ] `/api/payment/*`
- [ ] `/api/admin/*` (بقیه پنل ادمین)
- [ ] `/api/categories`, `/api/mega-menu`, ...

## یادداشت

- `check-dns` در Express فقط **DB** را به‌روز می‌کند (بدون nginx reload) — هم‌راستا با معماری نهایی `:4000`.
- پس از DNS verify، `clearTenantCache()` صدا زده می‌شود.

## گام بعدی

- **فاز ۳c** یا **فاز ۴** — [CORE-MIGRATION-INDEX.md](./CORE-MIGRATION-INDEX.md)

---

**آخرین به‌روزرسانی:** فاز ۳ دسته ۱ — تکمیل شد ✅ (۳b → سند جدا)
