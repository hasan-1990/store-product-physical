# توسعه محلی — Express (API) + Next (UI)

## معماری

| سرویس | دستور | پورت | نقش |
|--------|--------|------|-----|
| **core-server** | `npm run core:dev` | **4000** | بک‌اند — API + managed-site |
| **Next.js** | `npm run dev` | **3000** | فرانت — React UI |

درخواست‌های `/api/*` و `/uploads/*` از Next به Express **پروکسی** می‌شوند (`next.config.ts`).

## env (`.env.local`)

```env
MONGODB_URI=mongodb://127.0.0.1:27017/store-app
CORE_SERVER_PORT=4000
CORE_API_URL=http://localhost:4000
HUB_DOMAINS=localhost,127.0.0.1
JWT_SECRET=dev-only-secret-do-not-use-in-production-min-32-chars

# فرانت Next
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# پروکسی API به Express (پیش‌فرض در dev: روشن)
NEXT_PROXY_API_TO_CORE=true
```

## اجرا (دو ترمینال)

**ترمینال ۱ — بک‌اند:**
```powershell
cd D:\hasan\79\site\store-app
npm run core:dev
```

**ترمینال ۲ — فرانت:**
```powershell
cd D:\hasan\79\site\store-app
npm run dev
```

سایت را باز کنید: **http://localhost:3000**

`http://localhost:4000/` فقط **متن وضعیت اتصال** نشان می‌دهد (بدون قالب).

تست API: **http://localhost:4000/api/health**

## نکات

- **`:4000`** فقط API و UI سبک Express است — برای کار روزمره از **`:3000`** استفاده کنید.
- اگر API جواب نداد، اول `core:dev` را چک کنید.
- غیرفعال کردن پروکسی: `NEXT_PROXY_API_TO_CORE=false` (Next دوباره API داخلی خودش را می‌زند).
