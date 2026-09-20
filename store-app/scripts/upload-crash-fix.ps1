# PowerShell Script برای آپلود فایل‌های بهینه‌شده به سرور
# این اسکریپت فایل‌های تغییر یافته را به سرور آپلود می‌کند

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$ServerPath,
    
    [string]$Username = "root",
    [string]$SSHKey = ""
)

Write-Host "🚀 Uploading optimized files to server..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# فایل‌های تغییر یافته
$files = @(
    @{
        Local = ".\src\lib\mongodb.ts"
        Remote = "$ServerPath/src/lib/mongodb.ts"
        Description = "MongoDB connection with pool settings"
    },
    @{
        Local = ".\src\lib\redis.ts"
        Remote = "$ServerPath/src/lib/redis.ts"
        Description = "Redis connection with timeout"
    },
    @{
        Local = ".\docker-compose.yml"
        Remote = "$ServerPath/docker-compose.yml"
        Description = "Docker Compose with auto-restart"
    },
    @{
        Local = ".\scripts\monitor-health.sh"
        Remote = "$ServerPath/scripts/monitor-health.sh"
        Description = "Health monitoring script (Linux)"
    },
    @{
        Local = ".\scripts\quick-fix.sh"
        Remote = "$ServerPath/scripts/quick-fix.sh"
        Description = "Quick fix script (Linux)"
    },
    @{
        Local = ".\SITE-CRASH-FIX.md"
        Remote = "$ServerPath/SITE-CRASH-FIX.md"
        Description = "Documentation (English)"
    },
    @{
        Local = ".\QUICK-FIX-GUIDE-FA.md"
        Remote = "$ServerPath/QUICK-FIX-GUIDE-FA.md"
        Description = "Documentation (Persian)"
    }
)

function Upload-File {
    param(
        [string]$LocalPath,
        [string]$RemotePath,
        [string]$Description
    )
    
    try {
        Write-Host "`n📤 Uploading: $Description" -ForegroundColor Yellow
        Write-Host "   Local:  $LocalPath" -ForegroundColor Gray
        Write-Host "   Remote: $RemotePath" -ForegroundColor Gray
        
        if (-not (Test-Path $LocalPath)) {
            Write-Host "   ❌ File not found!" -ForegroundColor Red
            return $false
        }
        
        # ساخت SSH command
        $sshCommand = if ($SSHKey) {
            "scp -i `"$SSHKey`" `"$LocalPath`" ${Username}@${ServerIP}:`"$RemotePath`""
        } else {
            "scp `"$LocalPath`" ${Username}@${ServerIP}:`"$RemotePath`""
        }
        
        # اجرای SCP
        Invoke-Expression $sshCommand
        
        Write-Host "   ✅ Uploaded successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "   ❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# بررسی دسترسی به سرور
Write-Host "`n🔐 Testing SSH connection..." -ForegroundColor Yellow
$testCommand = if ($SSHKey) {
    "ssh -i `"$SSHKey`" ${Username}@${ServerIP} 'echo Connected'"
} else {
    "ssh ${Username}@${ServerIP} 'echo Connected'"
}

try {
    $result = Invoke-Expression $testCommand 2>&1
    if ($result -match "Connected") {
        Write-Host "✅ SSH connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ SSH connection failed" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Cannot connect to server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# آپلود فایل‌ها
$successCount = 0
$failCount = 0

foreach ($file in $files) {
    $success = Upload-File -LocalPath $file.Local -RemotePath $file.Remote -Description $file.Description
    if ($success) {
        $successCount++
    } else {
        $failCount++
    }
}

# خلاصه
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "📊 Upload Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Success: $successCount files" -ForegroundColor Green
Write-Host "   ❌ Failed:  $failCount files" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })
Write-Host "================================================" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host "`n✅ All files uploaded successfully!" -ForegroundColor Green
    Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. SSH to server: ssh ${Username}@${ServerIP}" -ForegroundColor White
    Write-Host "2. Go to project: cd $ServerPath" -ForegroundColor White
    Write-Host "3. Run quick fix: chmod +x scripts/quick-fix.sh && ./scripts/quick-fix.sh" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "`n⚠️ Some files failed to upload. Please check the errors above." -ForegroundColor Yellow
    exit 1
}

# پیشنهاد اجرای Quick Fix
Write-Host "🤖 Do you want to run the Quick Fix script on the server now? (Y/N)" -ForegroundColor Cyan
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host "`n🚀 Running Quick Fix on server..." -ForegroundColor Yellow
    
    $quickFixCommand = if ($SSHKey) {
        "ssh -i `"$SSHKey`" ${Username}@${ServerIP} 'cd $ServerPath && chmod +x scripts/quick-fix.sh && ./scripts/quick-fix.sh'"
    } else {
        "ssh ${Username}@${ServerIP} 'cd $ServerPath && chmod +x scripts/quick-fix.sh && ./scripts/quick-fix.sh'"
    }
    
    try {
        Invoke-Expression $quickFixCommand
        Write-Host "`n✅ Quick Fix completed!" -ForegroundColor Green
    }
    catch {
        Write-Host "`n❌ Quick Fix failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please run it manually on the server." -ForegroundColor Yellow
    }
} else {
    Write-Host "`nℹ️ Remember to run the Quick Fix script manually on the server!" -ForegroundColor Cyan
}

Write-Host "`n🎉 Done!" -ForegroundColor Green
