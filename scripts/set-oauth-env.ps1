# scripts/set-oauth-env.ps1
# PowerShell script to set OAuth environment variables for testing

param(
    [string]$ClientId,
    [string]$ClientSecret,
    [string]$RefreshToken,
    [string]$RedirectUri = "http://localhost:5556/oauth2callback"
)

Write-Host "Setting OAuth environment variables..." -ForegroundColor Cyan

if ($ClientId) {
    [Environment]::SetEnvironmentVariable("SHEETS_CLIENT_ID", $ClientId, "User")
    [Environment]::SetEnvironmentVariable("GOOGLE_CLIENT_ID", $ClientId, "User")
    Write-Host "✓ Set SHEETS_CLIENT_ID and GOOGLE_CLIENT_ID" -ForegroundColor Green
} else {
    Write-Host "⚠ ClientId not provided, skipping..." -ForegroundColor Yellow
}

if ($ClientSecret) {
    [Environment]::SetEnvironmentVariable("SHEETS_CLIENT_SECRET", $ClientSecret, "User")
    [Environment]::SetEnvironmentVariable("GOOGLE_CLIENT_SECRET", $ClientSecret, "User")
    Write-Host "✓ Set SHEETS_CLIENT_SECRET and GOOGLE_CLIENT_SECRET" -ForegroundColor Green
} else {
    Write-Host "⚠ ClientSecret not provided, skipping..." -ForegroundColor Yellow
}

if ($RefreshToken) {
    [Environment]::SetEnvironmentVariable("DRIVE_REFRESH_TOKEN", $RefreshToken, "User")
    Write-Host "✓ Set DRIVE_REFRESH_TOKEN" -ForegroundColor Green
} else {
    Write-Host "⚠ RefreshToken not provided, skipping..." -ForegroundColor Yellow
}

if ($RedirectUri) {
    [Environment]::SetEnvironmentVariable("OAUTH_REDIRECT_URI", $RedirectUri, "User")
    Write-Host "✓ Set OAUTH_REDIRECT_URI" -ForegroundColor Green
}

Write-Host "`nEnvironment variables set for current user." -ForegroundColor Cyan
Write-Host "Note: You may need to restart your terminal or IDE for changes to take effect." -ForegroundColor Yellow
Write-Host "`nTo verify, run:" -ForegroundColor Cyan
Write-Host "  echo `$env:SHEETS_CLIENT_ID" -ForegroundColor Gray
Write-Host "  echo `$env:DRIVE_REFRESH_TOKEN" -ForegroundColor Gray
