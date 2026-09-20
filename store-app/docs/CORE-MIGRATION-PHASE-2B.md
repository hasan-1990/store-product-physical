# فاز ۲b — UI سبک tenant + static uploads

> مسیر: `docs/CORE-MIGRATION-PHASE-2B.md`  
> پیش‌نیاز: [CORE-MIGRATION-PHASE-2.md](./CORE-MIGRATION-PHASE-2.md) ✅

## هدف

بازدیدکننده tenant با دامنه خودش **صفحه HTML** ببیند (نه JSON) و فایل‌های آپلود/تصاویر قالب از Express سرو شوند.

## چک‌لیست

### Static

| مسیر | منبع | وضعیت |
|------|------|--------|
| `/uploads/*` | `provisioned-sites/{slug}/uploads/` | ✅ |
| `/images/*` | `site-templates/shop-starter-v1/public/images/` | ✅ |
| `/template-assets/*` | `site-templates/.../public/assets/` | ✅ |

کد: `packages/core-server/src/middleware/tenant-static.ts` + `express/static.ts`

### UI HTML (shop-starter-v1)

| صفحه | Route | وضعیت |
|------|-------|--------|
| خانه | `GET /` | ✅ |
| لیست محصولات | `GET /products` | ✅ |
| جزئیات محصول | `GET /products/:slug` | ✅ |
| سبد | `GET /cart` | ✅ |
| ورود ادمین | `GET /admin/login` | ✅ |
| داشبورد ساده | `GET /admin` | ✅ |

کد: `site-templates/shop-starter-v1/express/ui/`

> UI فعلی **shell سبک** است (SSR HTML + fetch به API). UI کامل React/Next در dev قالب باقی می‌ماند تا فاز ۷.

## ساختار فایل

```
packages/core-server/src/middleware/tenant-static.ts
site-templates/shop-starter-v1/
  public/images/              # asset مشترک قالب
  express/
    static.ts
    ui/html.ts, pages.ts, routes.ts
```

## تست محلی

### ۱. رکورد tenant در hub DB

```javascript
// در MongoDB hub (store-app)
db.siteInstances.insertOne({
  slug: 'demo-shop',
  domain: 'demo-shop.local',
  templateSlug: 'shop-starter-v1',
  status: 'active',
  databaseName: 'shop_demo_shop',  // DB seed شده
  licenseKey: 'dev-key',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})
```

### ۲. seed دیتابیس tenant

```powershell
cd site-templates/shop-starter-v1
npm run seed   # با MONGODB_URI به DB tenant
```

### ۳. core-server

```powershell
cd D:\hasan\79\site\store-app
npm run core:dev
```

### ۴. درخواست با Host tenant

```powershell
curl -H "Host: demo-shop.local" http://localhost:4000/
curl -H "Host: demo-shop.local" http://localhost:4000/products
curl -H "Host: demo-shop.local" http://localhost:4000/api/products
```

## محدودیت‌های فعلی

- [ ] UI ادمین کامل (فقط shell + لینک API)
- [ ] checkout / account pages
- [ ] SSR کامل معادل Next (کامپوننت‌های React)
- [ ] build قالب به static bundle برای production

## گام بعدی (فاز ۳)

مهاجرت **APIهای هاب** (`store-app/src/app/api/*`) به Express.

---

**آخرین به‌روزرسانی:** فاز ۲b — تکمیل شد ✅
