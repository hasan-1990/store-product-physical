# PowerShell Health Monitoring Script for Windows
# این اسکریپت برای Windows Server است

param(
    [switch]$Once,
    [string]$HealthUrl = "http://localhost:3000/api/health",
    [int]$MaxMemoryPercent = 85,
    [int]$MaxResponseTime = 5000,
    [int]$CheckInterval = 300
)

$LogFile = ".\logs\monitor-health.log"
$ErrorActionPreference = "Continue"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-Health {
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 10
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds
        
        # بررسی status
        if ($response.status -ne "healthy") {
            Write-Log "❌ Unhealthy status: $($response.status)"
            return $false
        }
        
        # بررسی response time
        if ($responseTime -gt $MaxResponseTime) {
            Write-Log "⚠️ Slow response: ${responseTime}ms (max: ${MaxResponseTime}ms)"
            return $false
        }
        
        # بررسی memory
        $memoryPercent = $response.system.memory.percentage
        if ($memoryPercent -gt $MaxMemoryPercent) {
            Write-Log "⚠️ High memory usage: ${memoryPercent}% (max: ${MaxMemoryPercent}%)"
            return $false
        }
        
        Write-Log "✅ Health check passed (${responseTime}ms, ${memoryPercent}% memory)"
        return $true
    }
    catch {
        Write-Log "❌ Health check failed: $($_.Exception.Message)"
        return $false
    }
}

function Restart-Application {
    Write-Log "🔄 Restarting application..."
    
    try {
        # Restart Docker container
        docker-compose restart app
        Start-Sleep -Seconds 30
        
        if (Test-Health) {
            Write-Log "✅ Application restarted successfully"
            return $true
        }
        else {
            Write-Log "❌ Restart failed, trying full restart..."
            docker-compose down
            docker-compose up -d
            Start-Sleep -Seconds 60
            
            if (Test-Health) {
                Write-Log "✅ Full restart successful"
                return $true
            }
            else {
                Write-Log "❌ Full restart failed! Manual intervention required!"
                return $false
            }
        }
    }
    catch {
        Write-Log "❌ Restart error: $($_.Exception.Message)"
        return $false
    }
}

function Test-Containers {
    try {
        $unhealthy = docker ps --filter "health=unhealthy" --format "{{.Names}}"
        
        if ($unhealthy) {
            Write-Log "❌ Unhealthy containers detected: $unhealthy"
            return $false
        }
        
        return $true
    }
    catch {
        Write-Log "⚠️ Container check error: $($_.Exception.Message)"
        return $true
    }
}

function Test-MongoDBConnections {
    try {
        $connCount = docker exec store-mongodb mongosh --quiet `
            -u admin `
            -p $env:MONGO_ROOT_PASSWORD `
            --authenticationDatabase admin `
            --eval "db.serverStatus().connections.current" 2>$null
        
        if ($connCount -and [int]$connCount -gt 45) {
            Write-Log "⚠️ High MongoDB connections: $connCount (max pool: 50)"
            return $false
        }
        
        return $true
    }
    catch {
        return $true
    }
}

# Main monitoring loop
function Start-Monitoring {
    Write-Log "🚀 Starting health monitoring..."
    
    while ($true) {
        # بررسی health endpoint
        if (-not (Test-Health)) {
            Restart-Application
        }
        
        # بررسی Docker containers
        if (-not (Test-Containers)) {
            Write-Log "⚠️ Container health issues detected"
            Restart-Application
        }
        
        # بررسی MongoDB connections
        if (-not (Test-MongoDBConnections)) {
            Write-Log "⚠️ MongoDB connection pool issues detected"
        }
        
        # صبر برای next check
        Start-Sleep -Seconds $CheckInterval
    }
}

# ایجاد دایرکتوری logs اگر وجود ندارد
if (-not (Test-Path ".\logs")) {
    New-Item -ItemType Directory -Path ".\logs" | Out-Null
}

# اجرای اسکریپت
if ($Once) {
    $result = Test-Health
    exit $(if ($result) { 0 } else { 1 })
}
else {
    Start-Monitoring
}
