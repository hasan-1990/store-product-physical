# 📧 راهنمای سیستم مدیریت ایمیل

## 📋 مسیر دسترسی

**پنل ادمین → تنظیمات ایمیل**
```
/admin/email-settings
```

## ✨ ویژگی‌های موجود

### 1️⃣ **مدیریت کامل تنظیمات SMTP**
- پیکربندی سرور SMTP (Host, Port, Secure)
- اعتبارسنجی Username/Password
- Quick Setup برای Gmail و Local SMTP
- نمایش/مخفی کردن رمز عبور

### 2️⃣ **پشتیبانی از Resend API**
- استفاده از Resend به جای SMTP
- API Key Management
- مدیریت سریع‌تر و مطمئن‌تر

### 3️⃣ **تنظیمات عمومی ایمیل**
- نام و ایمیل فرستنده
- لوگوی ایمیل
- اطلاعات پشتیبانی (ایمیل و تلفن)

### 4️⃣ **تست ایمیل**
- ارسال ایمیل تست قبل از ذخیره
- تایید صحت تنظیمات
- نمایش خطاهای احتمالی

### 5️⃣ **ذخیره‌سازی در دیتابیس**
- تمام تنظیمات در MongoDB ذخیره می‌شود
- امکان تغییر تنظیمات بدون ویرایش فایل‌های `.env`
- رمزهای عبور به صورت امن نگهداری می‌شوند

## 🚀 راه‌اندازی اولیه

### گزینه 1: Gmail SMTP (توصیه می‌شود)

1. به [Google App Passwords](https://myaccount.google.com/apppasswords) بروید
2. یک App Password جدید ایجاد کنید
3. در پنل تنظیمات ایمیل:
   - روی **Gmail Quick Setup** کلیک کنید
   - Username: ایمیل Gmail خود
   - Password: رمز 16 رقمی ایجاد شده
4. تست کنید و ذخیره کنید!

### گزینه 2: Resend API

1. به [Resend.com](https://resend.com) بروید و ثبت نام کنید
2. از بخش API Keys یک کلید جدید بگیرید
3. در تب **Resend API**:
   - گزینه "استفاده از Resend API" را فعال کنید
   - API Key را وارد کنید
4. ذخیره کنید!

### گزینه 3: Local SMTP (برای تست)

1. سرور SMTP محلی را اجرا کنید:
   ```bash
   node local-smtp-server.js
   ```
2. در پنل:
   - روی **Local SMTP** کلیک کنید
   - ذخیره کنید
3. ایمیل‌ها در کنسول نمایش داده می‌شوند

## 📁 ساختار فایل‌ها

```
src/
├── app/
│   ├── admin/
│   │   └── email-settings/
│   │       └── page.tsx              # صفحه UI تنظیمات
│   └── api/
│       └── admin/
│           └── email-settings/
│               ├── route.ts          # API اصلی (GET/PUT)
│               └── test/
│                   └── route.ts      # API تست ایمیل
├── lib/
│   └── email.ts                      # سرویس اصلی ایمیل (بروزرسانی شده)
└── types/
    └── index.ts                      # انواع TypeScript
```

## 🔧 API Endpoints

### 1. دریافت تنظیمات
```http
GET /api/admin/email-settings
```

**پاسخ:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "useResend": false,
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "fromName": "فروشگاه آنلاین",
    "fromAddress": "noreply@store.com"
  }
}
```

### 2. بروزرسانی تنظیمات
```http
PUT /api/admin/email-settings
Content-Type: application/json

{
  "settings": {
    "enabled": true,
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    ...
  }
}
```

### 3. ارسال ایمیل تست
```http
POST /api/admin/email-settings/test
Content-Type: application/json

{
  "email": "test@example.com"
}
```

## 💾 ذخیره‌سازی در MongoDB

تنظیمات در collection `siteSettings` ذخیره می‌شوند:

```javascript
{
  "_id": ObjectId("..."),
  "key": "emailSettings",
  "value": {
    "enabled": true,
    "useResend": false,
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "user@gmail.com",
    "smtpPass": "encrypted_password",
    "smtpSecure": true,
    "fromName": "فروشگاه",
    "fromAddress": "noreply@store.com",
    "supportEmail": "support@store.com",
    "supportPhone": "021-12345678",
    "logoUrl": "https://store.com/logo.png"
  },
  "updatedAt": ISODate("2026-01-06T...")
}
```

## 🔐 امنیت

- ✅ رمزهای عبور در دیتابیس رمزنگاری نمی‌شوند اما از طریق API به صورت ستاره نمایش داده می‌شوند
- ✅ فقط ادمین‌ها می‌توانند تنظیمات را ببینند/تغییر دهند
- ✅ اعتبارسنجی ایمیل‌ها قبل از ارسال
- ✅ لاگ کامل برای دیباگ

## 📧 انواع ایمیل‌های پشتیبانی شده

سیستم ایمیل فعلاً از موارد زیر پشتیبانی می‌کند:

1. **تایید سفارش** - پس از ثبت سفارش
2. **ارسال محصولات دیجیتال** - لینک دانلود
3. **بازیابی رمز عبور** - لینک Reset Password
4. **پاسخ تیکت** - اطلاع‌رسانی به کاربران
5. **فاکتور** - ارسال فاکتور PDF

## 🎨 UI Features

- ✨ طراحی مدرن با Gradient Background
- 📱 Responsive برای موبایل
- 🔄 Loading States
- ✅ Success/Error Messages با Toast
- 👁️ نمایش/مخفی کردن رمزها
- ⚡ Quick Setup Buttons
- 📊 وضعیت فعال/غیرفعال با نشانگر زنده

## 🐛 رفع مشکلات رایج

### ایمیل ارسال نمی‌شود

1. وضعیت سیستم را چک کنید (باید سبز باشد)
2. از تب **تست ایمیل** استفاده کنید
3. لاگ‌های سرور را بررسی کنید
4. اعتبار SMTP را بررسی کنید (مخصوصاً برای Gmail)

### خطای Authentication

- برای Gmail حتماً از **App Password** استفاده کنید نه رمز اصلی
- Port و Secure را صحیح تنظیم کنید

### ایمیل در Spam می‌رود

- از یک دامنه معتبر استفاده کنید
- SPF و DKIM را تنظیم کنید
- از Resend API استفاده کنید

## 📝 TODO (آینده)

- [ ] افزودن تمپلیت‌های سفارشی
- [ ] پیش‌نمایش ایمیل قبل از ارسال
- [ ] لاگ ایمیل‌های ارسال شده
- [ ] آمار و گزارش‌گیری
- [ ] پشتیبانی از SendGrid و Mailgun
- [ ] Queue Management برای ایمیل‌های انبوه

## 🤝 تماس با پشتیبانی

در صورت بروز مشکل:
1. ابتدا ایمیل تست ارسال کنید
2. لاگ‌های خطا را بررسی کنید
3. با تیم پشتیبانی تماس بگیرید

---

**نسخه:** 1.0.0  
**تاریخ:** 6 ژانویه 2026  
**وضعیت:** ✅ Production Ready
