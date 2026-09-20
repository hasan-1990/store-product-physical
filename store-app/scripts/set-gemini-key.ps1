<#
Secure helper: prompts for an API key (hidden input) and sets it
as a current-user environment variable `GEMINI_API_KEY` using `setx`.

Usage (from project root):
  powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-gemini-key.ps1

This script does NOT send your key anywhere. Run it locally only.
#>

Write-Host "This will prompt you to paste the API key (input will be hidden)."
$secure = Read-Host "Paste your API key" -AsSecureString
if (-not $secure) {
    Write-Error "No key entered. Exiting."
    exit 1
}

# Convert SecureString to plaintext for setx (local operation)
$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
} finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

# Set for current user (no /M). To set machine-wide use setx ... /M as Admin.
setx GEMINI_API_KEY "$plain"

Write-Host "GEMINI_API_KEY set for current user."
Write-Host "Close and reopen any terminals (or sign out/in) for the variable to take effect in new shells."
Write-Host "Then run: claude mcp list"

exit 0
