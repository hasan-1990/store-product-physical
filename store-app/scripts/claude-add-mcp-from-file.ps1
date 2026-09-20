<#
Reads a .mcp.json file and runs `claude mcp add-json <name> <json>` safely using Start-Process.
Usage (from repo root):
  powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\claude-add-mcp-from-file.ps1 -File .\.mcp.json -Name store-app

This will create/update the project MCP config in the local Claude CLI.
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$File,
    [Parameter(Mandatory=$true)]
    [string]$Name
)

if (-not (Test-Path $File)) {
    Write-Error "File not found: $File"
    exit 1
}

$json = Get-Content -Raw -Path $File
# Use Start-Process to avoid quoting/encoding issues; pass JSON as a single argument.
$args = @('mcp','add-json',$Name,$json)
Write-Host "Running: claude mcp add-json $Name <contents of $File>"
$proc = Start-Process -FilePath 'claude' -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot 'claude_add_out.txt') -RedirectStandardError (Join-Path $PSScriptRoot 'claude_add_err.txt')

Write-Host "Exit code: $($proc.ExitCode)"
Write-Host "Stdout written to: $PSScriptRoot\claude_add_out.txt"
Write-Host "Stderr written to: $PSScriptRoot\claude_add_err.txt"

if ($proc.ExitCode -ne 0) {
    Write-Error "claude CLI reported non-zero exit. See stderr file for details."
    exit $proc.ExitCode
}

Write-Host "Added MCP config to Claude as '$Name'. You can now run: claude mcp list"
exit 0
