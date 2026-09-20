Param(
    [string]$LogDir = ".\.mcp-logs",
    [int]$Lines = 50
)

if (-not (Test-Path $LogDir)) {
    Write-Error "Log directory not found: $LogDir"
    exit 1
}

$logs = Get-ChildItem -Path $LogDir -Filter *.log | ForEach-Object { $_.FullName }
if (-not $logs -or $logs.Count -eq 0) {
    Write-Error "No .log files found in $LogDir"
    exit 1
}

Write-Host "Tailing logs: $($logs -join ', ')" -ForegroundColor Green
Get-Content -Path $logs -Wait -Tail $Lines
