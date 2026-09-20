# ============================================
# MongoDB Backup Script
# ============================================

Write-Host "🔵 MongoDB Backup Tool" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# تنظیمات
$DB_URI = "mongodb://localhost:27017"
$DB_NAME = "store-app"
$BACKUP_DIR = ".\database-backup"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_PATH = "$BACKUP_DIR\backup-$TIMESTAMP"

# ساخت پوشه backup
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "✅ پوشه backup ساخته شد" -ForegroundColor Green
}

Write-Host "🔍 در حال بررسی MongoDB Tools..." -ForegroundColor Yellow
Write-Host ""

# بررسی نصب mongodump
$mongodumpExists = Get-Command mongodump -ErrorAction SilentlyContinue

if (-not $mongodumpExists) {
    Write-Host "❌ MongoDB Tools نصب نیست!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 لطفاً MongoDB Database Tools را از لینک زیر دانلود و نصب کنید:" -ForegroundColor Yellow
    Write-Host "https://www.mongodb.com/try/download/database-tools" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "یا با Chocolatey نصب کنید:" -ForegroundColor Yellow
    Write-Host "choco install mongodb-database-tools" -ForegroundColor White
    Write-Host ""
    
    # استفاده از روش جایگزین با Node.js
    Write-Host "🔄 استفاده از روش جایگزین با Node.js..." -ForegroundColor Yellow
    Write-Host ""
    
    $useNodeBackup = Read-Host "آیا می‌خواهید با Node.js backup بگیرید؟ (y/n)"
    
    if ($useNodeBackup -eq "y" -or $useNodeBackup -eq "Y") {
        Write-Host "📦 در حال اجرای backup با Node.js..." -ForegroundColor Cyan
        node ".\scripts\backup-mongodb.js"
    }
    
    exit 1
}

Write-Host "✅ MongoDB Tools نصب است" -ForegroundColor Green
Write-Host ""

# شروع backup
Write-Host "📦 در حال گرفتن backup از دیتابیس..." -ForegroundColor Cyan
Write-Host "Database: $DB_NAME" -ForegroundColor White
Write-Host "Path: $BACKUP_PATH" -ForegroundColor White
Write-Host ""

try {
    # اجرای mongodump
    mongodump --uri="$DB_URI" --db="$DB_NAME" --out="$BACKUP_PATH"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Backup با موفقیت گرفته شد!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📁 مسیر فایل backup:" -ForegroundColor Cyan
        Write-Host "$BACKUP_PATH" -ForegroundColor White
        Write-Host ""
        
        # نمایش اطلاعات فایل‌ها
        $backupSize = (Get-ChildItem -Path $BACKUP_PATH -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "💾 حجم backup: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Cyan
        
        # لیست collections
        Write-Host ""
        Write-Host "📋 Collections پشتیبان شده:" -ForegroundColor Yellow
        Get-ChildItem -Path "$BACKUP_PATH\$DB_NAME" -Filter "*.bson" | ForEach-Object {
            $collectionName = $_.Name -replace '\.bson$', ''
            $collectionSize = [math]::Round($_.Length / 1KB, 2)
            Write-Host "  ✓ $collectionName ($collectionSize KB)" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "📤 حالا می‌توانید این backup را به Atlas منتقل کنید:" -ForegroundColor Green
        Write-Host ""
        Write-Host "1️⃣  به MongoDB Atlas بروید: https://cloud.mongodb.com" -ForegroundColor White
        Write-Host "2️⃣  یک cluster بسازید (Free tier کافیه)" -ForegroundColor White
        Write-Host "3️⃣  Connection String را کپی کنید" -ForegroundColor White
        Write-Host "4️⃣  دستور زیر را اجرا کنید:" -ForegroundColor White
        Write-Host ""
        Write-Host "mongorestore --uri='YOUR_ATLAS_CONNECTION_STRING' '$BACKUP_PATH\$DB_NAME'" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        
    } else {
        throw "خطا در گرفتن backup"
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ خطا در گرفتن backup!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
