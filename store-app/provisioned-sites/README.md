# Provisioned Sites

پوشه‌های سبک برای **فایل‌های اختصاصی هر مشتری** (مثلاً uploads).

مثال: `provisioned-sites/shop-example-com/uploads/`

## معماری جدید

- **وب‌سرور جدا per مشتری وجود ندارد** — همه دامنه‌ها از Express `core-server` سرو می‌شوند.
- **دیتابیس جدا** per مشتری در MongoDB (`shop_{slug}`).
- متادیتا (دامنه، قالب، وضعیت) در hub DB → collection `siteInstances`.

این پوشه را برای حذف/ویرایش دستی clone قدیمی استفاده نکنید.

مرجع: [docs/MANAGED-SITE-ARCHITECTURE.md](../docs/MANAGED-SITE-ARCHITECTURE.md)
