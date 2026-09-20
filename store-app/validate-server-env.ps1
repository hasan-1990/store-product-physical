# اعتبارسنجی تنظیمات SEO در فایل .env سرور
$SERVER = "91.107.175.150"
$USER = "root"
$REMOTE_PATH = "/root/store-app"

Write-Host "🔍 اعتبارسنجی تنظیمات SEO روی سرور..." -ForegroundColor Cyan
Write-Host ""

# بررسی متغیرهای کلیدی
$checks = @(
    @{
        Name = "NEXT_PUBLIC_SITE_URL"
        Pattern = "NEXT_PUBLIC_SITE_URL"
        Required = $true
        Description = "URL اصلی سایت (برای sitemap و canonical)"
    },
    @{
        Name = "NEXT_PUBLIC_API_URL"
        Pattern = "NEXT_PUBLIC_API_URL"
        Required = $true
        Description = "URL API (باید با SITE_URL یکسان باشد)"
    },
    @{
        Name = "NEXT_PUBLIC_GA4_ID"
        Pattern = "NEXT_PUBLIC_GA4_ID"
        Required = $false
        Description = "Google Analytics 4"
    },
    @{
        Name = "NEXT_PUBLIC_GTM_ID"
        Pattern = "NEXT_PUBLIC_GTM_ID"
        Required = $false
        Description = "Google Tag Manager"
    },
    @{
        Name = "NEXT_PUBLIC_GSC_VERIFICATION"
        Pattern = "NEXT_PUBLIC_GSC_VERIFICATION"
        Required = $false
        Description = "Google Search Console Verification"
    },
    @{
        Name = "NEXTAUTH_URL"
        Pattern = "NEXTAUTH_URL"
        Required = $true
        Description = "URL احراز هویت (باید با API_URL یکسان باشد)"
    },
    @{
        Name = "NEXTAUTH_SECRET"
        Pattern = "NEXTAUTH_SECRET"
        Required = $true
        Description = "کلید امنیتی NextAuth"
    },
    @{
        Name = "DATABASE_URL"
        Pattern = "DATABASE_URL"
        Required = $true
        Description = "اتصال به MongoDB"
    }
)

# دریافت محتوای فایل .env از سرور
$envContent = ssh "$USER@$SERVER" "cat $REMOTE_PATH/.env 2>/dev/null"

if (-not $envContent) {
    Write-Host "❌ فایل .env روی سرور یافت نشد!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 برای ایجاد فایل .env کامل اجرا کنید:" -ForegroundColor Yellow
    Write-Host "   .\update-server-env.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host "متغیرها:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$missingRequired = @()
$missingOptional = @()
$configured = @()

foreach ($check in $checks) {
    $pattern = $check.Pattern
    $line = $envContent | Select-String -Pattern "^$pattern=" | Select-Object -First 1
    
    if ($line) {
        $value = ($line -split "=", 2)[1].Trim('"')
        if ($value -and $value -ne "") {
            Write-Host "✅ $($check.Name)" -ForegroundColor Green
            Write-Host "   └─ $value" -ForegroundColor Gray
            $configured += $check
        } else {
            if ($check.Required) {
                Write-Host "⚠️  $($check.Name)" -ForegroundColor Yellow
                Write-Host "   └─ تعریف شده اما مقدار ندارد" -ForegroundColor Gray
                $missingRequired += $check
            } else {
                Write-Host "⚪ $($check.Name)" -ForegroundColor DarkGray
                Write-Host "   └─ خالی (اختیاری)" -ForegroundColor Gray
                $missingOptional += $check
            }
        }
    } else {
        if ($check.Required) {
            Write-Host "❌ $($check.Name)" -ForegroundColor Red
            Write-Host "   └─ وجود ندارد!" -ForegroundColor Gray
            $missingRequired += $check
        } else {
            Write-Host "⚪ $($check.Name)" -ForegroundColor DarkGray
            Write-Host "   └─ وجود ندارد (اختیاری)" -ForegroundColor Gray
            $missingOptional += $check
        }
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 خلاصه وضعیت:" -ForegroundColor Cyan
Write-Host "   ✅ تنظیم شده: $($configured.Count)" -ForegroundColor Green
Write-Host "   ❌ ضروری مفقود: $($missingRequired.Count)" -ForegroundColor Red
Write-Host "   ⚪ اختیاری مفقود: $($missingOptional.Count)" -ForegroundColor Gray

if ($missingRequired.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  متغیرهای ضروری که باید تنظیم شوند:" -ForegroundColor Yellow
    foreach ($missing in $missingRequired) {
        Write-Host "   • $($missing.Name): $($missing.Description)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "💡 برای تنظیم خودکار اجرا کنید:" -ForegroundColor Yellow
    Write-Host "   .\update-server-env.ps1" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✅ همه متغیرهای ضروری تنظیم شده‌اند" -ForegroundColor Green
}

if ($missingOptional.Count -gt 0) {
    Write-Host ""
    Write-Host "💡 متغیرهای اختیاری برای بهبود SEO:" -ForegroundColor Yellow
    foreach ($missing in $missingOptional) {
        Write-Host "   • $($missing.Name): $($missing.Description)" -ForegroundColor Gray
    }
}

Write-Host ""
