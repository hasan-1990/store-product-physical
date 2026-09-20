# بروزرسانی فایل .env روی سرور با تنظیمات SEO
$SERVER = "91.107.175.150"
$USER = "root"
$REMOTE_PATH = "/root/store-app"

Write-Host "🔧 بروزرسانی فایل .env روی سرور..." -ForegroundColor Cyan
Write-Host "Server: $SERVER" -ForegroundColor Yellow
Write-Host ""

# ایجاد فایل .env جدید با تنظیمات کامل
$envContent = @"
# ==============================================
# MongoDB Database Configuration
# ==============================================
DATABASE_URL="mongodb://admin:StoreApp2025Secure!MongoDB@Pass#VPS@mongodb:27017/store-app?authSource=admin"
MONGODB_URI="mongodb://admin:StoreApp2025Secure!MongoDB@Pass#VPS@mongodb:27017/store-app?authSource=admin"
MONGO_ROOT_USER="admin"
MONGO_ROOT_PASSWORD="StoreApp2025Secure!MongoDB@Pass#VPS"
MONGO_DB_NAME="store-app"

# ==============================================
# Redis Configuration
# ==============================================
REDIS_ENABLED=true
REDIS_URL="redis://localhost:6379"

# ==============================================
# NextAuth.js Configuration
# ==============================================
NEXTAUTH_SECRET="C9kGQmxHQkgZ/ost5+3Bvha/TpkNuoVOrdGdtebpZok="
NEXTAUTH_URL="http://91.107.175.150:3001"

# ==============================================
# JWT Configuration
# ==============================================
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# ==============================================
# Application Settings
# ==============================================
APP_URL="http://91.107.175.150:3001"
APP_NAME="فروشگاه آنلاین"
NEXT_PUBLIC_API_URL="http://91.107.175.150:3001"
NEXT_PUBLIC_SITE_URL="http://91.107.175.150:3001"

# ==============================================
# File Upload Settings
# ==============================================
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880

# ==============================================
# Google Analytics & SEO Configuration
# ==============================================
# Google Analytics 4 (GA4)
NEXT_PUBLIC_GA4_ID=

# Google Tag Manager (GTM)
NEXT_PUBLIC_GTM_ID=

# Google Search Console Verification
NEXT_PUBLIC_GSC_VERIFICATION=

# Facebook Pixel (اختیاری)
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=

# ==============================================
# Email Configuration
# ==============================================
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@example.com
EMAIL_ENABLED=true
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_FROM_NAME=فاتمز
EMAIL_LOGO_URL=http://91.107.175.150:3001/logo.png
EMAIL_SUPPORT_EMAIL=hasanmansouri1990@gmail.com
EMAIL_SUPPORT_PHONE=021-12345678

# ==============================================
# SMS Configuration
# ==============================================
SMSIR_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS5zbXMuaXIvdjEvYXV0aC9nZXQtdG9rZW4iLCJpYXQiOjE3MzIyMDM1MDIsImV4cCI6MTczODg5NTUwMiwibmJmIjoxNzMyMjAzNTAyLCJqdGkiOiJzMzJ6QTZqaWJxV3R5a0g1Iiwic3ViIjoiMTAyOTM2IiwicHJ2IjoiODdlMGFmMWVmOWZkMTU4MTJmZGVjOTcxNTNhMTRlMGIwNDc1NDZhYSIsInVzZXJfaWQiOjEwMjkzNiwibGluZV9udW1iZXJfaWQiOjU0NTkwfQ.z_rMRQCfm0SHFIDmrQLnSXMdOu0KNvFEq8yb9eqLTso
SMSIR_LINE_NUMBER=09223456789
SMS_IR_VERIFICATION_TEMPLATE_ID=123456
SMS_IR_ORDER_CONFIRMATION_TEMPLATE_ID=123457
SMS_IR_PASSWORD_RESET_TEMPLATE_ID=123458
SMS_IR_ACCOUNT_ACTIVATION_TEMPLATE_ID=123459

# ==============================================
# Payment Gateway (Optional)
# ==============================================
PAYMENT_GATEWAY_API_KEY=
PAYMENT_GATEWAY_SECRET=

# ==============================================
# Security
# ==============================================
CLIENT_IP_ENCRYPTION_KEY="e3f4a1c9b7d6e8f0123456789abcdef0123456789abcdefabcdef1234567890ab"

# ==============================================
# Development Settings
# ==============================================
SKIP_CRON=true
"@

# ذخیره فایل به صورت موقت
$tempFile = "$env:TEMP\.env.server"
$envContent | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline

Write-Host "📤 آپلود فایل .env جدید به سرور..." -ForegroundColor Green
scp $tempFile "${USER}@${SERVER}:${REMOTE_PATH}/.env"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ فایل .env با موفقیت بروزرسانی شد" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📋 مراحل بعدی:" -ForegroundColor Yellow
    Write-Host "1. ssh root@$SERVER" -ForegroundColor Cyan
    Write-Host "2. cd $REMOTE_PATH" -ForegroundColor Cyan
    Write-Host "3. docker-compose down" -ForegroundColor Cyan
    Write-Host "4. docker-compose up -d" -ForegroundColor Cyan
    Write-Host "5. docker-compose logs -f --tail=50" -ForegroundColor Cyan
} else {
    Write-Host "❌ خطا در آپلود فایل" -ForegroundColor Red
}

# حذف فایل موقت
Remove-Item $tempFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "💡 نکات مهم:" -ForegroundColor Yellow
Write-Host "  • همه URL ها به IP سرور (91.107.175.150:3001) تنظیم شدند" -ForegroundColor Gray
Write-Host "  • برای استفاده از دامنه، URL ها را تغییر دهید" -ForegroundColor Gray
Write-Host "  • Google Analytics و GTM فعلاً خالی هستند" -ForegroundColor Gray
Write-Host "  • پس از تنظیم، کانتینر را restart کنید" -ForegroundColor Gray
