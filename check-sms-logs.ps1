# PowerShell script to check SMS-related logs from submitRequest function

Write-Host "Checking Firebase Functions logs for submitRequest..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check recent logs and filter for SMS-related entries
$logs = firebase functions:log --only submitRequest -n 50 2>&1
$smsLogs = $logs | Select-String -Pattern "sms|SMS|debug mode|ADMIN_NUMBER|phone|notification" -CaseSensitive:$false

if ($smsLogs) {
    Write-Host "SMS-related logs found:" -ForegroundColor Green
    $smsLogs
} else {
    Write-Host "No SMS-related logs found in recent entries" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Showing all recent logs:" -ForegroundColor Yellow
    $logs | Select-Object -Last 20
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "For more detailed logs, run:" -ForegroundColor Yellow
Write-Host "  firebase functions:log --only submitRequest -n 100"
Write-Host ""
Write-Host "To open logs in browser:" -ForegroundColor Yellow
Write-Host "  firebase functions:log --open"
