# فاز ۳c — categories + mega-menu هاب

> مسیر: `docs/CORE-MIGRATION-PHASE-3C.md`  
> پیش‌نیاز: [CORE-MIGRATION-PHASE-3B.md](./CORE-MIGRATION-PHASE-3B.md) ✅

## هدف

APIهای **دسته‌بندی** و **مگامنو** هاب روی `core-server` — برای header فروشگاه و پنل ادمین.

## چک‌لیست APIهای منتقل‌شده

### عمومی

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/categories` | GET | ✅ |
| `/api/categories/:slug` | GET | ✅ |
| `/api/categories/by-id/:id` | GET | ✅ |
| `/api/homepage/categories` | GET | ✅ |
| `/api/mega-menu` | GET | ✅ |

### ادمین (JWT + role=admin)

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/categories` | POST | ✅ |
| `/api/categories/by-id/:id` | PUT, DELETE | ✅ |
| `/api/admin/categories` | GET | ✅ |
| `/api/admin/mega-menu-settings` | GET, PUT | ✅ |

## ساختار کد

```
packages/core-server/src/hub/
  routes/catalog.ts
  services/categories.ts, mega-menu.ts
```

## تست

```powershell
npm run core:dev

curl http://localhost:4000/api/categories?limit=5
curl http://localhost:4000/api/mega-menu
curl http://localhost:4000/api/homepage/categories

# ادمین
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/admin/categories

node --import tsx --test tests/hub-catalog.test.ts
```

## محدودیت‌ها

- Redis cache در Express غیرفعال — مستقیم MongoDB (مثل فاز ۳b)
- POST/PUT/DELETE categories در Express نیاز به JWT ادمین دارد (بهبود امنیتی نسبت به Next route خام)
- بقیه admin APIs (products CRUD, SEO, settings…) هنوز Next

## گام بعدی

- **فاز ۴:** UI هاب → Express
- یا **فاز ۳d:** admin products CRUD، public-settings تکمیلی، SEO

---

**آخرین به‌روزرسانی:** فاز ۳c — تکمیل شد ✅
