# PowerShell Quick Fix Script برای Windows
# اجرای سریع برای رفع مشکل کرش سایت

Write-Host "🔧 Starting Quick Fix for Site Crash Issue..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor Cyan
}

try {
    # گام 1: بررسی Docker
    Write-Info "Checking Docker..."
    docker --version
    docker-compose --version
    Write-Success "Docker is installed"
    
    # گام 2: Stop کردن سرویس‌ها
    Write-Info "Stopping services..."
    docker-compose down
    Write-Success "Services stopped"
    
    # گام 3: پاک کردن cache (اختیاری)
    Write-Warning "Do you want to clean old app cache? (Y/N)"
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        docker volume rm store-app_app_cache 2>$null
        Write-Success "Cache cleaned"
    }
    
    # گام 4: Build کردن مجدد
    Write-Info "Building application with new settings..."
    docker-compose build --no-cache app
    Write-Success "Application built"
    
    # گام 5: شروع سرویس‌ها
    Write-Info "Starting services..."
    docker-compose up -d
    Write-Success "Services started"
    
    # گام 6: صبر برای startup
    Write-Info "Waiting for services to start (60 seconds)..."
    Start-Sleep -Seconds 60
    
    # گام 7: بررسی health
    Write-Info "Checking health status..."
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get
        
        if ($healthResponse.status -eq "healthy") {
            Write-Success "Application is healthy!"
            $healthResponse | ConvertTo-Json -Depth 3
        }
        else {
            Write-Warning "Application is not healthy yet"
            $healthResponse | ConvertTo-Json -Depth 3
        }
    }
    catch {
        Write-Warning "Could not check health: $($_.Exception.Message)"
    }
    
    # گام 8: نمایش status containers
    Write-Info "Container Status:"
    docker-compose ps
    
    # گام 9: نمایش logs
    Write-Info "Recent Logs:"
    docker-compose logs --tail=20 app
    
    # گام 10: راهنمای monitoring
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Success "Quick Fix Completed!"
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Monitor logs:"
    Write-Host "   docker-compose logs -f app" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Check health status:"
    Write-Host "   Invoke-RestMethod http://localhost:3000/api/health | ConvertTo-Json" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Monitor container stats:"
    Write-Host "   docker stats store-app" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Start auto-monitoring (recommended):"
    Write-Host "   .\scripts\monitor-health.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Setup Uptime Kuma (port 3001):"
    Write-Host "   http://your-server-ip:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "6. View all running containers:"
    Write-Host "   docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Warning "Important:"
    Write-Host "- Monitor memory usage regularly"
    Write-Host "- Check MongoDB connections"
    Write-Host "- Setup alerts in Uptime Kuma"
    Write-Host ""
    
    # گام 11: ذخیره تنظیمات فعلی
    Write-Info "Saving current configuration..."
    docker-compose config > docker-compose.current.yml
    Write-Success "Configuration saved to docker-compose.current.yml"
    
    Write-Host ""
    Write-Host "🎉 All done! Your site should now be stable." -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace
    exit 1
}
