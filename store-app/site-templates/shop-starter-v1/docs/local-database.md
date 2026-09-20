# دیتابیس لوکال (بدون Atlas)

این قالب برای **دیتابیس روی خود سیستم** طراحی شده — **نیازی به MongoDB Atlas یا اینترنت نیست.**

```
mongodb://127.0.0.1:27017/shop_template
```

داده‌ها روی دیسک خودت ذخیره می‌شوند (پوشه `.data/mongodb/` داخل قالب).

---

## روش پیشنهادی — `npm run db:local`

MongoDB Community روی ویندوز نصب است؛ با این دستور **بدون ادمین و بدون Docker** اجرا می‌شود:

```powershell
cd D:\hasan\79\site\store-app\site-templates\shop-starter-v1

npm run db:local      # روشن کردن MongoDB آفلاین
npm run seed          # پر کردن محصولات و ادمین
npm run dev
```

یک‌جا:

```powershell
npm run setup         # db:local + seed
```

| دستور | کار |
|--------|-----|
| `npm run db:local` | اجرای mongod با داده در `.data/mongodb/` |
| `npm run db:local:stop` | خاموش کردن |
| `npm run db:local:status` | وضعیت پورت 27017 |
| `npm run seed` | seed دیتابیس |

---

## اگر `mongod` پیدا نشد

1. نصب **MongoDB Community Server** (رایگان، آفلاین):  
   https://www.mongodb.com/try/download/community

2. یا مسیر را در `.env.local` بگذار:

```env
MONGOD_PATH=C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe
```

---

## روش جایگزین — سرویس ویندوز

اگر MongoDB را به‌صورت Service نصب کردی (مثل `MongoDB Server`):

```powershell
# PowerShell با Run as Administrator
net start MongoDB
npm run seed
```

سرویس از مسیر پیش‌فرض نصب داده ذخیره می‌کند؛ با `db:local` تداخل نداشته باشد (هر دو پورت 27017 می‌خواهند — فقط یکی را روشن کن).

---

## روش جایگزین — Docker (اختیاری)

```powershell
# Docker Desktop باید روشن باشد
npm run db:up
npm run seed
```

---

## Atlas (ابری) — لازم نیست

برای توسعه این قالب **Atlas استفاده نکن** مگر خودت بخواهی روی سرور ابری deploy کنی.

`.env.local` پیش‌فرض:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/shop_template
```

---

## عیب‌یابی

| خطا | راه‌حل |
|-----|--------|
| `ECONNREFUSED 127.0.0.1:27017` | `npm run db:local` |
| `mongod.exe پیدا نشد` | MongoDB Community نصب کن یا `MONGOD_PATH` |
| `Access is denied` برای Service | از `npm run db:local` استفاده کن (بدون ادمین) |
| پورت اشغال است | `npm run db:local:stop` یا سرویس/Docker دیگر را خاموش کن |

لاگ MongoDB لوکال: `.data/mongod.log`
