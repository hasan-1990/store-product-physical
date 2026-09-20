# تصاویر پیش‌فرض قالب

فایل‌های استاتیک مشترک همه tenantهای `shop-starter-v1`.

در production از Express سرو می‌شوند:

```
GET /images/...
```

مسیر فیزیکی: `site-templates/shop-starter-v1/public/images/`

آپلودهای اختصاصی هر مشتری جداگانه در:

```
GET /uploads/...
→ provisioned-sites/{slug}/uploads/
```
