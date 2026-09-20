# Start local MCP servers on Windows
# Usage: Run in PowerShell as Administrator or normal user: .\scripts\start-mcps.ps1

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

Write-Output "Starting MCP servers... Logs will be written to .\\mcp-logs\\"
New-Item -ItemType Directory -Force -Path .\mcp-logs | Out-Null

function Start-Server([string]$name, [string]$command, [string[]]$args) {
    $logPath = Join-Path .\mcp-logs ($name + ".log")
    Write-Output "Starting $name -> $command $($args -join ' ')"
    Start-Process -FilePath $command -ArgumentList $args -NoNewWindow -RedirectStandardOutput $logPath -RedirectStandardError $logPath -PassThru
}

# filesystem (uses npx)
Start-Server -name filesystem -command "cmd" -args "/c","npx","-y","@modelcontextprotocol/server-filesystem","$repoRoot"

# git
Start-Server -name git -command "cmd" -args "/c","npx","-y","@modelcontextprotocol/server-git","$repoRoot"

# task
Start-Server -name task -command "cmd" -args "/c","npx","-y","@modelcontextprotocol/server-task","$repoRoot"

# scope
Start-Server -name scope -command "cmd" -args "/c","npx","-y","@modelcontextprotocol/server-scope","$repoRoot"

# claude server (reference)
Start-Server -name claude -command "cmd" -args "/c","npx","-y","@modelcontextprotocol/server-claude","$repoRoot"

# memory (node)
$memoryPath = Join-Path $repoRoot ".mcp-servers\modelcontextprotocol-servers\src\memory\dist\index.js"
Start-Server -name memory -command "node" -args $memoryPath

# taskmaster-ai (local cmd from .mcp.json)
$taskmasterCmd = "D:\\npm-global\\task-master-ai.cmd"
if (Test-Path $taskmasterCmd) {
    Start-Server -name taskmaster-ai -command $taskmasterCmd -args @()
} else {
    Write-Warning "taskmaster-ai command not found at $taskmasterCmd. Please install or update .mcp.json to correct path."
}

Write-Output "Started processes. Tail logs in .\\mcp-logs or inspect individual logs."
Write-Output "To stop servers, kill the started processes or restart shell."