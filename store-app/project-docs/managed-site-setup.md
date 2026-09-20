# راه‌اندازی سیستم Managed Site

> معماری کامل: [docs/MANAGED-SITE-ARCHITECTURE.md](../docs/MANAGED-SITE-ARCHITECTURE.md)

## پنل ادمین

- `/admin/site-templates` — ثبت قالب‌ها (`npm run templates:sync`)
- `/admin/site-instances` — سایت‌های مشتریان
- محصول DIGITAL + نوع `managed-site` + انتخاب قالب

## env

```env
SERVER_PUBLIC_IP=IP سرور
PROVISIONING_ENABLED=true
MONGODB_URI=mongodb://...
REDIS_URL=redis://...

# core-server (فاز ۱+)
CORE_SERVER_PORT=4000
HUB_DOMAINS=fathemes.com,www.fathemes.com

# ادمین پیش‌فرض سایت مشتری (provisioning seed)
TENANT_ADMIN_EMAIL=admin@muse.local
TENANT_ADMIN_PASSWORD=Admin@123
```

> `PROVISION_PORT_START` در معماری جدید **منسوخ** است — همه دامنه‌ها به یک Express proxy می‌شوند.

## Cron

در `/admin/cron-jobs` یک job با نوع `بررسی DNS سایت‌های مشتری` بسازید (هر ۵ دقیقه).

## جریان مشتری

1. ثبت قالب در `site-templates/` و sync در ادمین
2. ایجاد محصول managed-site
3. خرید + وارد کردن **دامنه** در checkout
4. provisioning خودکار:
   - رکورد `siteInstances` در hub DB
   - MongoDB جدا برای مشتری + seed قالب + **ادمین پیش‌فرض**
   - پوشه سبک `provisioned-sites/{slug}/uploads`
   - Nginx vhost → Express `core-server`
5. مشتری **رکورد A** می‌زند: `@ → SERVER_PUBLIC_IP`
6. `/user/my-sites` — وضعیت DNS + اطلاعات ورود ادمین سایت
7. cron DNS را چک می‌کند → `active` → سایت روی دامنه بالا می‌آید

## DNS

| روش | وضعیت |
|-----|--------|
| رکورد A به IP سرور | **فعال** |
| دو nameserver اختصاصی (ns1/ns2) | فاز بعدی — هنوز نیست |

## قالب مرجع

`site-templates/shop-starter-v1/` — فول‌استک MongoDB؛ در production از **Express core-server** لود می‌شود (نه Next جدا per customer).

توسعه محلی قالب:

```bash
cd site-templates/shop-starter-v1
npm run setup
npm run dev
```

## استقرار production

```powershell
npm run deploy:check:prod
npm run deploy:up
```

سرویس اصلی: `core-server` (Express :4000) + `nginx`. Next.js فقط برای توسعه: `npm run dev` یا `npm run deploy:next-dev`.
