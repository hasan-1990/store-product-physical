# core-shared

کتابخانه مشترک بین `core-server` و قالب‌های managed site.

## ماژول‌ها

- `config` — port، MongoDB URI، مسیرها
- `host` — تشخیص hub vs tenant از روی Host header
- `mongodb` — اتصال hub DB و tenant DB
- `tenant-resolver` — resolve `siteInstances` با cache در حافظه

## استفاده

```ts
import { coreConfig, resolveSiteInstance, isHubHost } from '@core-shared';
```

مرجع: [docs/MANAGED-SITE-ARCHITECTURE.md](../../docs/MANAGED-SITE-ARCHITECTURE.md)
