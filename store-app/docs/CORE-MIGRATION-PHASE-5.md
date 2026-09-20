# فاز ۵ — provisioning جدید

> مسیر: `docs/CORE-MIGRATION-PHASE-5.md`  
> پیش‌نیاز: فاز ۲b (tenant static) + فاز ۳ (hub managed API)

## هدف

جایگزینی provisioning قدیمی (clone کامل Next + port جدا per مشتری) با مدل سبک:

1. رکورد `siteInstances` در hub DB
2. MongoDB جدا برای tenant + **seed قالب** + **ادمین پیش‌فرض**
3. فقط `provisioned-sites/{slug}/uploads/` روی دیسک
4. Nginx همه دامنه‌های active → **یک Express** (`CORE_SERVER_PORT`)
5. DNS verify فقط nginx را از maintenance به active تغییر می‌دهد + `clearTenantCache()`

## قبل vs بعد

| قدیمی | جدید |
|--------|------|
| `clone-template` → کپی کل قالب | فقط `uploads/` |
| `npm install` per instance | حذف |
| `PORT` اختصاصی + `proxy_pass :3001+` | همه → `:4000` (core-server) |
| `.env.local` per instance | حذف — tenant از hub `siteInstances` resolve می‌شود |
| seed فقط `site_settings` | seed کامل از `scripts/seed.ts` قالب |

## فایل‌های تغییر یافته

| فایل | نقش |
|------|-----|
| `src/lib/provisioning/run-provision.ts` | orchestration جدید |
| `src/lib/provisioning/create-database.ts` | index + seed |
| `src/lib/provisioning/seed-tenant.ts` | اجرای seed قالب با `MONGODB_URI` tenant |
| `src/lib/provisioning/ensure-uploads.ts` | ساخت `uploads/` |
| `src/lib/provisioning/nginx-config.ts` | proxy به `CORE_SERVER_PORT` |
| `src/lib/provisioning/tenant-admin.ts` | credentials پیش‌فرض |
| `src/lib/provisioning/config.ts` | `coreServerPort` |
| `src/types/site-provisioning.ts` | `tenantAdmin` |
| `src/app/user/my-sites/page.tsx` | نمایش credentials |

## env

```env
CORE_SERVER_PORT=4000
SERVER_PUBLIC_IP=1.2.3.4
PROVISIONING_ENABLED=true
MONGODB_URI=mongodb://...
TENANT_ADMIN_EMAIL=admin@muse.local
TENANT_ADMIN_PASSWORD=Admin@123
```

`PROVISION_PORT_START` **منسوخ** است.

## جریان provisioning

```
خرید managed-site
  → runProvision()
    → insert siteInstances (status: provisioning)
    → ensureInstanceUploads(slug)
    → createInstanceDatabase(slug, templateFolder)
         → indexes
         → seedTenantDatabase() via npx tsx scripts/seed.ts
    → writeNginxConfig(maintenance)
    → status: awaiting_dns
```

## جریان DNS

```
cron / کاربر «بررسی DNS»
  → checkAndUpdateInstanceDns(slug)
    → DNS OK → writeNginxConfig(active) + reload
    → status: active
    → clearTenantCache()
```

## تست دستی

```powershell
cd D:\hasan\79\site\store-app
npm run core:dev   # Express :4000

# provisioning از طریق checkout یا triggerProvisioningForOrder
# بررسی:
# - provisioned-sites/{slug}/uploads/ وجود دارد
# - MongoDB: دیتابیس {slug_with_underscores} با products + admin_users
# - nginx/sites/{slug}.conf → proxy_pass :4000
```

## فایل‌های legacy (بدون استفاده در flow جدید)

- `clone-template.ts`
- `generate-env.ts`

می‌توانند در فاز ۷ حذف شوند.

## بعدی

- **فاز ۶:** Nginx global + Docker compose با core-server
- **فاز ۷:** حذف Next از production
