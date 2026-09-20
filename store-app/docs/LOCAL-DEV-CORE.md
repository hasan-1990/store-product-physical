# راه‌اندازی محلی — Express + Next (پیشنهادی)

> راهنمای کامل: [LOCAL-DEV-SPLIT.md](./LOCAL-DEV-SPLIT.md)

## خلاصه

```powershell
# ترمینال ۱ — بک‌اند API
npm run core:dev

# ترمینال ۲ — فرانت React
npm run dev
```

- فرانت: **http://localhost:3000**
- API: **http://localhost:4000/api/health**

## env کلیدی

```env
CORE_SERVER_PORT=4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PROXY_API_TO_CORE=true
```

## فقط Express (بدون Next)

اگر فقط API می‌خواهید: `npm run core:dev` → http://localhost:4000
