# ============================================================
# اسکریپت آپلود فایل به سرور - بدون نیاز به پسورد
# استفاده:  .\upload-to-server.ps1
# فایل خاص: .\upload-to-server.ps1 -Files "src\components\Foo.tsx"
# ============================================================
param(
    [string[]]$Files = @()
)

$SSH_KEY    = "$env:USERPROFILE\.ssh\store-app-server"
$REMOTE     = "root@91.107.175.150"
$REMOTE_PATH = "/root/store-app"

Write-Host "🚀 آپلود به سرور..." -ForegroundColor Cyan

# --- ثبت کلید SSH در سرور (اولین بار فقط) ---
$testConn = ssh -i $SSH_KEY -o BatchMode=yes -o ConnectTimeout=5 $REMOTE "echo ok" 2>&1
if ($testConn -ne "ok") {
    Write-Host ""
    Write-Host "⚠️  اولین بار: کلید SSH روی سرور ثبت میشه (یه بار پسورد لازمه)..." -ForegroundColor Yellow
    $pubKey = (Get-Content "$SSH_KEY.pub" -Raw).Trim()
    ssh $REMOTE "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && echo 'کلید ثبت شد'"
    Write-Host "✅ از این به بعد پسورد نمی‌خواد" -ForegroundColor Green
    Write-Host ""
}

# --- فایل‌های پیش‌فرض (آخرین تغییرات) ---
if ($Files.Count -eq 0) {
    $Files = @(
        "src\styles\overflow-fix.css"
        "src\components\HomeClient.tsx"
    )
}

# --- آپلود ---
$ok  = 0
$err = 0

foreach ($f in $Files) {
    $local  = Join-Path $PSScriptRoot $f
    $remote = "${REMOTE}:${REMOTE_PATH}/$($f -replace '\\','/')"

    if (!(Test-Path $local)) {
        Write-Host "  ❌ فایل پیدا نشد: $f" -ForegroundColor Red
        $err++; continue
    }

    Write-Host "  📤 $f" -ForegroundColor Green
    scp -i $SSH_KEY $local $remote

    if ($LASTEXITCODE -eq 0) { Write-Host "     ✅ آپلود شد" -ForegroundColor Green; $ok++ }
    else                      { Write-Host "     ❌ خطا"      -ForegroundColor Red;   $err++ }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  موفق: $ok  |  خطا: $err" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
