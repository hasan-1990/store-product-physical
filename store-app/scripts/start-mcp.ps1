Param(
    [string]$LogDir = ".\.mcp-logs"
)

Set-StrictMode -Version Latest

$workdir = Get-Location
New-Item -Path $LogDir -ItemType Directory -Force | Out-Null

# Ensure a secure CLIENT_IP_ENCRYPTION_KEY is present for context7
if (-not $env:CLIENT_IP_ENCRYPTION_KEY) {
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] 32
    $rng.GetBytes($bytes)
    $key = [Convert]::ToBase64String($bytes)
    $env:CLIENT_IP_ENCRYPTION_KEY = $key
    $key | Out-File -FilePath (Join-Path $LogDir 'client_key.txt') -Encoding utf8
    Write-Host "Generated CLIENT_IP_ENCRYPTION_KEY and saved to $LogDir\client_key.txt"
} else {
    "Using existing CLIENT_IP_ENCRYPTION_KEY from environment." | Out-File -FilePath (Join-Path $LogDir 'client_key.txt') -Encoding utf8
    Write-Host "Using existing CLIENT_IP_ENCRYPTION_KEY from environment. (saved to $LogDir\client_key.txt)"
}

function Start-MCP($name, $args) {
    $out = Join-Path $LogDir "$name.log"
    $err = Join-Path $LogDir "$name.err"
    $pidfile = Join-Path $LogDir "$name.pid"

    $proc = Start-Process -FilePath "npx" -ArgumentList $args -RedirectStandardOutput $out -RedirectStandardError $err -WorkingDirectory $workdir -PassThru
    $proc.Id | Out-File -FilePath $pidfile -Encoding ascii
    Write-Host "Started $name (PID $($proc.Id)). Logs: $out, $err"
}

Write-Host "Starting MCP servers (logs in $LogDir)..."
Start-MCP "memory" "-y @modelcontextprotocol/server-memory"
Start-MCP "filesystem" "-y @modelcontextprotocol/server-filesystem \"$($workdir.Path)\""
Start-MCP "context7" "-y @upstash/context7-mcp@latest"

Write-Host "All MCP start commands issued. Use scripts/tail-mcp-logs.ps1 to follow logs."
